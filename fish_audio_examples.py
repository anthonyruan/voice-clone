"""
Fish Audio API Examples
Complete examples for all major Fish Audio API functionalities
"""

import asyncio
import httpx
import ormsgpack
import requests
import subprocess
import shutil
import websockets
from typing import Literal, List, Optional, AsyncGenerator
from pydantic import BaseModel
from fish_audio_sdk import Session, WebSocketSession, TTSRequest, ASRRequest, ReferenceAudio
from openai import AsyncOpenAI


# ============================================================================
# 1. BASIC TEXT-TO-SPEECH
# ============================================================================

def basic_tts_with_sdk():
    """Basic TTS using Fish Audio SDK"""
    session = Session("your_api_key")
    
    # Option 1: Using a reference_id
    with open("output1.mp3", "wb") as f:
        for chunk in session.tts(TTSRequest(
            reference_id="MODEL_ID_FROM_PLAYGROUND",
            text="Hello, this is a test of Fish Audio TTS!"
        )):
            f.write(chunk)
    
    # Option 2: Using reference audio
    with open("output2.mp3", "wb") as f:
        for chunk in session.tts(TTSRequest(
            text="Hello world!",
            references=[
                ReferenceAudio(
                    audio=open("reference.wav", "rb").read(),
                    text="Reference text for voice cloning"
                )
            ]
        )):
            f.write(chunk)


# ============================================================================
# 2. RAW API TTS WITH MSGPACK
# ============================================================================

class ServeReferenceAudio(BaseModel):
    audio: bytes
    text: str

class ServeTTSRequest(BaseModel):
    text: str
    chunk_length: int = 200  # 100-300
    format: Literal["wav", "pcm", "mp3"] = "mp3"
    mp3_bitrate: Literal[64, 128, 192] = 128
    references: List[ServeReferenceAudio] = []
    reference_id: Optional[str] = None
    normalize: bool = True
    latency: Literal["normal", "balanced"] = "normal"

def raw_api_tts():
    """TTS using raw API with MessagePack"""
    request = ServeTTSRequest(
        text="Hello from the raw API!",
        format="mp3",
        mp3_bitrate=128,
        references=[
            ServeReferenceAudio(
                audio=open("reference.wav", "rb").read(),
                text="Reference audio text"
            )
        ],
        latency="balanced"  # Lower latency mode
    )
    
    with httpx.Client() as client, open("raw_output.mp3", "wb") as f:
        with client.stream(
            "POST",
            "https://api.fish.audio/v1/tts",
            content=ormsgpack.packb(request, option=ormsgpack.OPT_SERIALIZE_PYDANTIC),
            headers={
                "authorization": "Bearer YOUR_API_KEY",
                "content-type": "application/msgpack",
                "model": "speech-1.6",  # Latest model
            },
            timeout=None
        ) as response:
            for chunk in response.iter_bytes():
                f.write(chunk)


# ============================================================================
# 3. REAL-TIME STREAMING TTS
# ============================================================================

def streaming_tts():
    """Real-time streaming TTS with WebSocket"""
    sync_websocket = WebSocketSession("your_api_key")
    
    def text_generator():
        """Generate text in chunks"""
        text = "This is a longer text that will be streamed word by word. " \
               "The Fish Audio API will generate speech in real-time as the text arrives."
        for word in text.split():
            yield word + " "  # Important: include space
    
    tts_request = TTSRequest(
        text="",  # Start with empty text
        reference_id="MODEL_ID",
        temperature=0.7,  # Control randomness (0.0-1.0)
        top_p=0.7,  # Control diversity
    )
    
    with open("streaming_output.mp3", "wb") as f:
        for chunk in sync_websocket.tts(
            tts_request,
            text_generator(),
            backend="speech-1.6"
        ):
            f.write(chunk)


# ============================================================================
# 4. ADVANCED WEBSOCKET TTS WITH LIVE PLAYBACK
# ============================================================================

def is_mpv_installed():
    """Check if MPV player is installed"""
    return shutil.which("mpv") is not None

async def stream_audio(audio_stream: AsyncGenerator):
    """Stream audio data using mpv player"""
    if not is_mpv_installed():
        raise ValueError("MPV not found. Install with: brew install mpv (macOS) or apt-get install mpv (Linux)")
    
    mpv_process = subprocess.Popen(
        ["mpv", "--no-cache", "--no-terminal", "--", "fd://0"],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    
    async for chunk in audio_stream:
        if chunk:
            mpv_process.stdin.write(chunk)
            mpv_process.stdin.flush()
    
    if mpv_process.stdin:
        mpv_process.stdin.close()
    mpv_process.wait()

async def websocket_tts_with_playback(text_iterator):
    """Advanced WebSocket TTS with real-time playback"""
    uri = "wss://api.fish.audio/v1/tts/live"
    
    async with websockets.connect(
        uri, 
        extra_headers={"Authorization": "Bearer YOUR_API_KEY"}
    ) as websocket:
        
        # Send initial configuration
        await websocket.send(ormsgpack.packb({
            "event": "start",
            "request": {
                "text": "",
                "latency": "balanced",
                "format": "opus",
                "temperature": 0.7,
                "top_p": 0.7,
                "prosody": {
                    "speed": 1.0,  # 0.5-2.0
                    "volume": 0    # dB adjustment
                },
                "reference_id": "MODEL_ID"
            },
            "debug": True
        }))
        
        # Handle incoming audio
        async def listen():
            while True:
                try:
                    message = await websocket.recv()
                    data = ormsgpack.unpackb(message)
                    if data["event"] == "audio":
                        yield data["audio"]
                    elif data["event"] == "log":
                        print(f"Server log: {data['message']}")
                    elif data["event"] == "finish":
                        print(f"Session finished: {data['reason']}")
                        break
                except websockets.exceptions.ConnectionClosed:
                    break
        
        # Start audio streaming
        listen_task = asyncio.create_task(stream_audio(listen()))
        
        # Stream text chunks
        async for text in text_iterator:
            if text:
                await websocket.send(ormsgpack.packb({
                    "event": "text", 
                    "text": text
                }))
        
        # Flush any remaining text
        await websocket.send(ormsgpack.packb({"event": "flush"}))
        
        # End session
        await websocket.send(ormsgpack.packb({"event": "stop"}))
        await listen_task


# ============================================================================
# 5. SPEECH-TO-TEXT (ASR)
# ============================================================================

def speech_to_text_sdk():
    """Speech-to-Text using SDK"""
    session = Session("your_api_key")
    
    with open("audio_to_transcribe.mp3", "rb") as f:
        audio_data = f.read()
    
    # Auto-detect language
    response = session.asr(ASRRequest(audio=audio_data))
    print(f"Transcribed: {response.text}")
    print(f"Duration: {response.duration} seconds")
    
    # Specify language
    response = session.asr(ASRRequest(
        audio=audio_data, 
        language="en"
    ))
    
    # Get timestamps for segments
    response = session.asr(ASRRequest(
        audio=audio_data,
        ignore_timestamps=False
    ))
    
    for segment in response.segments:
        print(f"[{segment.start:.2f}s - {segment.end:.2f}s]: {segment.text}")

def speech_to_text_raw_api():
    """Speech-to-Text using raw API"""
    with open("audio.mp3", "rb") as f:
        audio_data = f.read()
    
    request_data = {
        "audio": audio_data,
        "language": "en",
        "ignore_timestamps": False
    }
    
    with httpx.Client() as client:
        response = client.post(
            "https://api.fish.audio/v1/asr",
            headers={
                "Authorization": "Bearer YOUR_API_KEY",
                "Content-Type": "application/msgpack",
            },
            content=ormsgpack.packb(request_data),
        )
    
    result = response.json()
    print(f"Text: {result['text']}")
    print(f"Duration: {result['duration']}s")
    
    for segment in result['segments']:
        print(f"[{segment['start']}-{segment['end']}]: {segment['text']}")


# ============================================================================
# 6. VOICE MODEL CREATION
# ============================================================================

def create_voice_model_sdk():
    """Create a voice model using SDK"""
    session = Session("your_api_key")
    
    with open("voice1.mp3", "rb") as v1, \
         open("voice2.wav", "rb") as v2, \
         open("cover.jpg", "rb") as img:
        
        model = session.create_model(
            title="My Custom Voice",
            description="A custom voice model for TTS",
            voices=[v1.read(), v2.read()],
            cover_image=img.read()
        )
    
    print(f"Created model: {model}")
    return model

def create_voice_model_raw_api():
    """Create a voice model using raw API"""
    response = requests.post(
        "https://api.fish.audio/model",
        files=[
            ("voices", open("voice1.mp3", "rb")),
            ("voices", open("voice2.wav", "rb")),
        ],
        data=[
            ("visibility", "private"),
            ("type", "tts"),
            ("title", "My Voice Model"),
            ("train_mode", "fast"),  # or "full" for better quality
            ("enhance_audio_quality", "true"),
            ("texts", "Text for voice 1"),
            ("texts", "Text for voice 2"),
        ],
        headers={
            "Authorization": "Bearer YOUR_API_KEY",
        },
    )
    
    model = response.json()
    print(f"Created model ID: {model['_id']}")
    return model


# ============================================================================
# 7. FINE-GRAINED CONTROL
# ============================================================================

def tts_with_fine_control():
    """TTS with phoneme and paralanguage control"""
    session = Session("your_api_key")
    
    # English with phoneme control
    text_phoneme = "I am an <|phoneme_start|>EH N JH AH N IH R<|phoneme_end|>."
    
    # Chinese with pinyin
    text_chinese = "我是一个<|phoneme_start|>gong1<|phoneme_end|><|phoneme_start|>cheng2<|phoneme_end|>师。"
    
    # Paralanguage effects
    text_effects = "I am, um, an (break) engineer who (laugh) loves coding."
    
    # Disable normalization for fine control
    request = TTSRequest(
        text=text_effects,
        reference_id="MODEL_ID",
        normalize=False  # Important for control tags
    )
    
    with open("controlled_output.mp3", "wb") as f:
        for chunk in session.tts(request):
            f.write(chunk)


# ============================================================================
# 8. OPENAI INTEGRATION EXAMPLE
# ============================================================================

async def chat_with_tts():
    """Integrate OpenAI chat with Fish Audio TTS"""
    aclient = AsyncOpenAI()
    
    # Get response from OpenAI
    response = await aclient.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Tell me a short joke"}],
        stream=True,
    )
    
    async def text_iterator():
        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    # Stream to TTS with playback
    await websocket_tts_with_playback(text_iterator())


# ============================================================================
# 9. MODEL MANAGEMENT
# ============================================================================

def list_models():
    """List available models"""
    response = requests.get(
        "https://api.fish.audio/model",
        params={
            "page_size": 10,
            "page_number": 1,
            "self": True  # Only your models
        },
        headers={"Authorization": "Bearer YOUR_API_KEY"}
    )
    
    data = response.json()
    for model in data["items"]:
        print(f"Model: {model['title']} (ID: {model['_id']})")
        print(f"  State: {model['state']}")
        print(f"  Created: {model['created_at']}")

def get_model_details(model_id: str):
    """Get details of a specific model"""
    response = requests.get(
        f"https://api.fish.audio/model/{model_id}",
        headers={"Authorization": "Bearer YOUR_API_KEY"}
    )
    return response.json()

def delete_model(model_id: str):
    """Delete a model"""
    response = requests.delete(
        f"https://api.fish.audio/model/{model_id}",
        headers={"Authorization": "Bearer YOUR_API_KEY"}
    )
    return response.status_code == 200


# ============================================================================
# 10. WALLET/CREDITS
# ============================================================================

def check_api_credits():
    """Check API credit balance"""
    response = requests.get(
        "https://api.fish.audio/wallet/self/api-credit",
        headers={"Authorization": "Bearer YOUR_API_KEY"}
    )
    
    data = response.json()
    print(f"Credit balance: {data['credit']}")
    print(f"Has free credit: {data.get('has_free_credit', False)}")
    return data


# ============================================================================
# MAIN EXAMPLES RUNNER
# ============================================================================

if __name__ == "__main__":
    # Note: Replace YOUR_API_KEY with actual API key
    # Get your key at: https://fish.audio/go-api/
    
    print("Fish Audio API Examples")
    print("=======================")
    
    # Example 1: Basic TTS
    # basic_tts_with_sdk()
    
    # Example 2: Raw API TTS
    # raw_api_tts()
    
    # Example 3: Streaming TTS
    # streaming_tts()
    
    # Example 4: Speech-to-Text
    # speech_to_text_sdk()
    
    # Example 5: Create Voice Model
    # create_voice_model_sdk()
    
    # Example 6: Fine-grained Control
    # tts_with_fine_control()
    
    # Example 7: Check Credits
    # check_api_credits()
    
    # Example 8: List Models
    # list_models()
    
    # Example 9: Async TTS with OpenAI
    # asyncio.run(chat_with_tts())
    
    print("Examples ready to run!")
    print("Uncomment the examples you want to test.")