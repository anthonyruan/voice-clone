# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voice Clone App - A web application for voice cloning and text-to-speech generation using Fish Audio API. Built with Next.js 14, TypeScript, and SQLite for local deployment.

## Common Commands

```bash
# Development
npm run dev           # Start development server on http://localhost:3000

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Database
# SQLite database auto-initializes at data/voice-clone.db on first run
```

## Essential Setup

Before running the application, you must:
1. Copy `.env.example` to `.env.local`
2. Set `FISH_AUDIO_API_KEY` from https://fish.audio/go-api/

## Architecture

### API Communication Flow
```
Client → Next.js API Routes → Fish Audio API
         (protects API key)
```

All Fish Audio API calls are proxied through Next.js API routes to protect the API key from client exposure.

### Database Architecture
- **SQLite** via `better-sqlite3` (no ORM)
- Database location: `data/voice-clone.db`
- Single table `models` stores voice model metadata
- Fish Audio stores actual audio data; we only store references

### API Routes Structure

1. **POST /api/create-model**
   - Accepts multipart form data with audio files
   - Uses `formidable` for file parsing
   - Validates files with magic number checking
   - Calls Fish Audio API to create model
   - Stores model reference in SQLite

2. **POST /api/tts**
   - Accepts JSON with model ID and text
   - Retrieves model from database
   - Calls Fish Audio API for generation
   - Returns audio stream or saves to `public/audio/`

3. **GET /api/models**
   - Returns all models from SQLite database

### Security Layer (`lib/security.ts`)
- **Rate limiting**: In-memory IP-based limiting
- **File validation**: Magic number checking for audio files
- **Input sanitization**: XSS prevention, path traversal protection
- **Error sanitization**: Removes sensitive paths/tokens from errors

### Configuration (`lib/config.ts`)
Uses Zod for runtime validation of environment variables:
- `FISH_AUDIO_API_KEY` (required)
- `CORS_ALLOWED_ORIGINS` (optional, comma-separated)
- `MAX_FILE_SIZE_MB` (optional, default: 10)
- `NODE_ENV` (development/production)

### Fish Audio Integration (`lib/fish-audio.ts`)
Primary wrapper for Fish Audio API:
- `createVoiceModel()` - Creates voice model from audio files
- `textToSpeech()` - Generates speech using msgpack-js
- Handles authentication and error responses
- Supports WAV, MP3, OGG, FLAC, M4A formats

### Frontend Architecture
- **Tab-based UI**: Switch between "Create Voice Model" and "Generate Speech"
- **Components**:
  - `VoiceCloneForm`: File upload with drag-and-drop
  - `TTSForm`: Model selection and text input
  - `AudioPlayer`: Custom audio player with download
- **State Management**: React hooks (useState, useEffect)
- **API Communication**: Native fetch with proper error handling

## Critical Implementation Details

### MessagePack Usage
Fish Audio API requires msgpack for certain endpoints:
```typescript
import msgpack from 'msgpack-js';
const packed = msgpack.encode(data);
```

### File Upload Limits
- Max file size: 10MB (configurable via `MAX_FILE_SIZE_MB`)
- Supported formats: MP3, WAV, OGG, FLAC, M4A
- Files validated by magic numbers, not just MIME types

### CORS Configuration
- Development: Allows localhost origins
- Production: Restricted to `CORS_ALLOWED_ORIGINS` environment variable
- Configured in `lib/cors.ts` and applied to all API routes

### Security Headers
Applied via `middleware.ts`:
- CSP, X-Frame-Options, X-Content-Type-Options
- Different policies for API routes vs pages

### Rate Limiting
Basic in-memory implementation:
- Create model: 5 req/min per IP
- TTS: 10 req/min per IP
- Resets on server restart

## Known Limitations

1. **In-memory rate limiting** - Resets on restart, not suitable for distributed deployment
2. **Local file storage** - Generated audio stored in `public/audio/`, needs cleanup strategy
3. **No user authentication** - Designed for single-user local deployment
4. **Synchronous database operations** - Uses better-sqlite3 synchronous API

## Testing Approach

When making changes:
1. Test file upload with various formats and sizes
2. Verify rate limiting by rapid requests
3. Check CORS by testing from different origins
4. Validate error handling with missing API key
5. Test audio playback across browsers