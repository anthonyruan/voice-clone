# Fish Audio API Integration

This directory contains the Fish Audio API wrapper for voice cloning and text-to-speech functionality.

## Files

- `fish-audio.ts` - Main API wrapper with TypeScript types and client class
- `fish-audio-examples.ts` - Example usage patterns and helper functions
- `../types/msgpack-js.d.ts` - TypeScript declarations for msgpack-js

## Setup

1. Install dependencies (already included in package.json):
   ```bash
   npm install msgpack-js
   ```

2. Set up your Fish Audio API key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your Fish Audio API key
   ```

3. Get your API key from: https://fish.audio/go-api/

## Usage

### Basic Import
```typescript
import { FishAudioClient, createVoiceModel, textToSpeech } from '@/lib/fish-audio';
```

### Create a Voice Model
```typescript
const model = await createVoiceModel({
  title: "My Voice Clone",
  voices: [audioFile1, audioFile2], // File objects
  texts: ["Text for audio 1", "Text for audio 2"],
  visibility: 'private',
  train_mode: 'fast'
});
```

### Generate Speech
```typescript
// Using a trained model
const audioData = await textToSpeechWithModel(
  "Hello, this is generated speech!",
  modelId
);

// Using reference audio
const audioData = await textToSpeechWithReference(
  "Hello, this is generated speech!",
  referenceAudioData,
  "Reference text"
);

// Basic TTS
const audioData = await textToSpeech({
  text: "Hello, world!",
  format: 'mp3'
});
```

### Play or Download Audio
```typescript
// Play in browser
const audio = new Audio(FishAudioClient.createAudioUrl(audioData));
audio.play();

// Download as file
const blob = FishAudioClient.createAudioBlob(audioData, 'audio/mp3');
// Use blob for download or further processing
```

## API Features

- **Voice Model Creation**: Upload audio files to create custom voice models
- **Text-to-Speech**: Generate speech using trained models or reference audio
- **Multiple Formats**: Support for MP3, WAV, and PCM audio formats
- **Advanced Controls**: Temperature, top_p, prosody (speed/volume) controls
- **File Management**: Helper functions for file conversion and audio playback

## Error Handling

All API calls include proper error handling. Errors include:
- Authentication errors (invalid API key)
- Validation errors (invalid parameters)
- Rate limiting errors
- Network errors

## Types

The wrapper includes comprehensive TypeScript types for:
- `TTSRequest` - Text-to-speech request parameters
- `CreateVoiceModelRequest` - Voice model creation parameters
- `VoiceModel` - Voice model response data
- `ReferenceAudio` - Reference audio data structure

## Rate Limits

Please refer to Fish Audio's documentation for current rate limits and pricing information.