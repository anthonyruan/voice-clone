# Voice Clone Website Development Tasks

## Project Overview
- Voice cloning and text-to-speech website based on Fish Audio API
- Local deployment, personal use
- Tech Stack: Next.js 14 + TypeScript + Tailwind CSS v3 + SQLite

## Todo List

### Group 1: Dependencies Installation ✅ COMPLETED
- [x] 1. Create Next.js project (TypeScript + Tailwind CSS + App Router)
- [x] 2. Install core dependencies (better-sqlite3, msgpack-js, formidable)
- [x] 3. Install type definitions (@types/better-sqlite3, @types/formidable)
- [x] 4. Create .env.local file and set FISH_AUDIO_API_KEY

### Group 2: Backend Development ✅ COMPLETED
- [x] 5. Create SQLite database wrapper (lib/db.ts)
- [x] 6. Initialize database table structure (models table)
- [x] 7. Create Fish Audio API wrapper (lib/fish-audio.ts)
- [x] 8. Implement create voice model API (/api/create-model)
- [x] 9. Implement text-to-speech API (/api/tts)
- [x] 10. Implement get models list API (/api/models)
- [x] 11. Create file upload handler
- [x] 12. Test API endpoints

### Group 3: Frontend Development ✅ COMPLETED
- [x] 13. Create main page layout (app/page.tsx)
- [x] 14. Implement voice cloning form component
- [x] 15. Implement text-to-speech form component
- [x] 16. Implement file upload functionality
- [x] 17. Implement model selection dropdown
- [x] 18. Implement audio player
- [x] 19. Add basic styles (Tailwind CSS)
- [x] 20. Test complete workflow

## 🎉 PROJECT COMPLETED!

All 20 tasks have been successfully completed. The voice clone website is fully functional and ready to use.

## Task Details

### Backend API Design

#### POST /api/create-model
- Input: audio file + reference text + model name
- Process: Call Fish Audio API to create voice model
- Return: model ID and status

#### POST /api/tts
- Input: model ID + text to convert
- Process: Call Fish Audio TTS API
- Return: generated audio stream

#### GET /api/models
- Input: none
- Process: Query database
- Return: models list

### Database Design

```sql
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  fish_model_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Page Layout Design
- Single page application
- Two sections: Voice Cloning (left) + Text-to-Speech (right)
- Or use tabs to switch
- Minimal design, focus on functionality

## Development Order
1. Complete all dependencies installation (tasks 1-4)
2. Develop and test backend features (tasks 5-12)
3. Finally develop frontend pages (tasks 13-20)

## Notes
- API Key must be saved in environment variables, no hardcoding
- All Fish Audio API calls go through backend proxy to protect API Key
- File upload limit: single file max 10MB
- Supported audio formats: MP3, WAV
- Generated audio saved in public/audio directory