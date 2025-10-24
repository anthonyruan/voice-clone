# Fish Audio API Documentation

## Overview

Fish Audio is a comprehensive text-to-speech (TTS) and speech-to-text (STT) platform with advanced audio generation capabilities. It provides voice cloning, emotion control, and fine-grained speech generation control.

## Getting Started

### Authentication
- Generate API key at: https://fish.audio/go-api/
- Use Bearer token authentication: `Authorization: Bearer YOUR_API_KEY`
- API Base URL: https://api.fish.audio

### Installation

#### Python SDK
```bash
pip install fish-audio-sdk
```

#### Additional Dependencies (for examples)
```bash
pip install websockets ormsgpack openai
```

#### MPV Player (for real-time audio playback)
- Linux: `apt-get install mpv`
- macOS: `brew install mpv`

## Core Features

### 1. Text-to-Speech (TTS)

#### Basic TTS Request (Python SDK)
```python
from fish_audio_sdk import Session, TTSRequest

session = Session("your_api_key")

# Using a reference_id (pre-uploaded model)
with open("output.mp3", "wb") as f:
    for chunk in session.tts(TTSRequest(
        reference_id="MODEL_ID",
        text="Hello, world!"
    )):
        f.write(chunk)
```

#### Raw API Request (MessagePack)
```python
import httpx
import ormsgpack
from pydantic import BaseModel
from typing import Literal

class ServeReferenceAudio(BaseModel):
    audio: bytes
    text: str

class ServeTTSRequest(BaseModel):
    text: str
    chunk_length: int = 200  # 100-300
    format: Literal["wav", "pcm", "mp3"] = "mp3"
    mp3_bitrate: Literal[64, 128, 192] = 128
    references: list[ServeReferenceAudio] = []
    reference_id: str | None = None
    normalize: bool = True
    latency: Literal["normal", "balanced"] = "normal"

request = ServeTTSRequest(
    text="Hello, world!",
    references=[
        ServeReferenceAudio(
            audio=open("reference.wav", "rb").read(),
            text="Reference text"
        )
    ]
)

with httpx.Client() as client, open("output.mp3", "wb") as f:
    with client.stream(
        "POST",
        "https://api.fish.audio/v1/tts",
        content=ormsgpack.packb(request, option=ormsgpack.OPT_SERIALIZE_PYDANTIC),
        headers={
            "authorization": "Bearer YOUR_API_KEY",
            "content-type": "application/msgpack",
            "model": "speech-1.6",  # Options: speech-1.5, speech-1.6, s1, s1-mini
        },
        timeout=None
    ) as response:
        for chunk in response.iter_bytes():
            f.write(chunk)
```

### 2. Real-time TTS with WebSocket

```python
from fish_audio_sdk import WebSocketSession, TTSRequest, ReferenceAudio

sync_websocket = WebSocketSession("your_api_key")

def stream():
    text = "Your streaming text here..."
    for line in text.split():
        yield line + " "

tts_request = TTSRequest(
    text="",
    reference_id="MODEL_ID",
    temperature=0.7,  # Controls randomness
    top_p=0.7  # Controls diversity
)

with open("output.mp3", "wb") as f:
    for chunk in sync_websocket.tts(
        tts_request,
        stream(),
        backend="speech-1.6"
    ):
        f.write(chunk)
```

#### WebSocket Protocol
- URL: `wss://api.fish.audio/v1/tts/live`
- Authentication: `Authorization: Bearer YOUR_API_KEY`
- Message Format: MessagePack

#### WebSocket Events
```json
// Start session
{
  "event": "start",
  "request": {
    "text": "",
    "latency": "normal",  // or "balanced"
    "format": "opus",  // or "mp3", "wav"
    "temperature": 0.7,
    "top_p": 0.7,
    "prosody": {
      "speed": 1.0,  // 0.5-2.0
      "volume": 0    // dB adjustment
    },
    "reference_id": "MODEL_ID"
  }
}

// Send text
{
  "event": "text",
  "text": "Hello world "  // Include trailing space
}

// Flush buffer
{
  "event": "flush"
}

// Stop session
{
  "event": "stop"
}
```

### 3. Speech-to-Text (STT)

```python
from fish_audio_sdk import Session, ASRRequest

session = Session("your_api_key")

with open("audio.mp3", "rb") as f:
    audio_data = f.read()

# Auto-detect language
response = session.asr(ASRRequest(audio=audio_data))

# Specify language
response = session.asr(ASRRequest(audio=audio_data, language="en"))

# With timestamps
response = session.asr(ASRRequest(audio=audio_data, ignore_timestamps=False))

print(f"Text: {response.text}")
print(f"Duration: {response.duration}s")

for segment in response.segments:
    print(f"{segment.start}-{segment.end}: {segment.text}")
```

### 4. Voice Model Creation

```python
from fish_audio_sdk import Session

session = Session("your_api_key")

model = session.create_model(
    title="My Voice Model",
    description="Description",
    voices=[voice1.read(), voice2.read()],  # Binary audio data
    cover_image=image.read()  # Optional
)
```

#### Using Raw API
```python
import requests

response = requests.post(
    "https://api.fish.audio/model",
    files=[
        ("voices", open("voice1.mp3", "rb")),
        ("voices", open("voice2.wav", "rb"))
    ],
    data=[
        ("visibility", "private"),
        ("type", "tts"),
        ("title", "Model Name"),
        ("train_mode", "fast"),  # or "full"
        ("enhance_audio_quality", "true"),
        ("texts", "text for voice1"),
        ("texts", "text for voice2")
    ],
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)
```

## API Endpoints

### Wallet Endpoints
- `GET /wallet/{user_id}/api-credit` - Get API credit balance
- `GET /wallet/{user_id}/package` - Get user premium info

### Model Endpoints
- `GET /model` - List models
- `POST /model` - Create model
- `GET /model/{id}` - Get model details
- `DELETE /model/{id}` - Delete model
- `PATCH /model/{id}` - Update model

### OpenAPI v1 Endpoints
- `POST /v1/tts` - Text to Speech
- `POST /v1/asr` - Speech to Text

## Fine-grained Control

### Phoneme Control
```text
English: "I am an <|phoneme_start|>EH N JH AH N IH R<|phoneme_end|>."
Mandarin (pinyin): "<|phoneme_start|>gong1<|phoneme_end|><|phoneme_start|>cheng2<|phoneme_end|><|phoneme_start|>shi1<|phoneme_end|>."
```

### Paralanguage Effects
```text
"I am, um, an (break) engineer."
```

Available effects:
- `(break)` - Short pause
- `(long-break)` - Extended pause
- `(breath)` - Breathing sound
- `(laugh)` - Laughter
- `(cough)` - Coughing
- `(lip-smacking)` - Lip smacking
- `(sigh)` - Sighing

**Note**: Disable normalization (`normalize: false`) when using fine-grained control.

## Audio Formats

### WAV/PCM
- Sample Rates: 8kHz, 16kHz, 24kHz, 32kHz, 44.1kHz (default)
- Bit Depth: 16-bit
- Channels: Mono

### MP3
- Sample Rates: 32kHz, 44.1kHz (default)
- Bitrates: 64kbps, 128kbps (default), 192kbps
- Channels: Mono

### Opus
- Sample Rate: 48kHz
- Bitrates: -1000 (auto), 24kbps, 32kbps (default), 48kbps, 64kbps
- Channels: Mono

## TTS Models
- `speech-1.5` (default)
- `speech-1.6`
- `s1`
- `s1-mini`

## Developer Program
Include `developer-id` header in requests for commission tracking:
```http
POST /v1/tts
Host: api.fish.audio
developer-id: your_developer_id
```

## Resources
- Playground: https://fish.audio
- API Key Generation: https://fish.audio/go-api/
- Support: support@fish.audio
- GitHub: [Fish Audio SDK](https://github.com/fishaudio/fish-audio-python)