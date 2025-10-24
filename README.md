# Voice Clone App 🎙️

A web application for voice cloning and text-to-speech generation using Fish Audio API. Built with Next.js 15, TypeScript, and SQLite.

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🎤 **Voice Model Creation** - Upload audio samples to create custom voice models
- 🗣️ **Text-to-Speech** - Generate natural-sounding speech from any text
- 💾 **SQLite Storage** - Local database for model management
- 🔒 **Security** - Rate limiting, input sanitization, CORS protection
- 🎨 **Modern UI** - Drag-and-drop uploads, custom audio player
- ⚡ **Fast** - Built with Next.js 15 App Router

## Quick Start

### Prerequisites

- Node.js 20 or later
- Fish Audio API key ([Get one here](https://fish.audio/go-api/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anthonyruan/voice-clone.git
   cd voice-clone/voice-clone-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your Fish Audio API key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## Environment Variables

Create a `.env.local` file in the `voice-clone-app/` directory:

```env
# Required
FISH_AUDIO_API_KEY=your_api_key_here

# Optional
CORS_ALLOWED_ORIGINS=http://localhost:3000
MAX_FILE_SIZE_MB=10
NODE_ENV=development
```

## Deployment

### Deploy to Render.com

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick deploy:**
1. Push to GitHub
2. Connect to Render.com
3. Add `FISH_AUDIO_API_KEY` environment variable
4. Deploy!

**Live URL:** `https://voice-clone-app.onrender.com`

### Other Platforms

This app can be deployed to:
- Vercel
- Railway
- Fly.io
- Any Node.js hosting platform

## Tech Stack

- **Framework:** Next.js 15.4.6 with App Router
- **Language:** TypeScript 5
- **Database:** SQLite (better-sqlite3)
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI
- **API:** Fish Audio API
- **Validation:** Zod

## Project Structure

```
voice-clone/
├── voice-clone-app/           # Main Next.js application
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   └── page.tsx          # Main page
│   ├── components/           # React components
│   ├── lib/                  # Utilities and API wrappers
│   ├── data/                 # SQLite database
│   └── public/               # Static files
├── DEPLOYMENT.md             # Deployment guide
└── README.md                 # This file
```

## Usage

### 1. Create a Voice Model

1. Go to the "Create Voice Model" tab
2. Upload audio files (MP3, WAV, OGG, FLAC, M4A)
3. Enter a name and description
4. Click "Create Model"

### 2. Generate Speech

1. Go to the "Generate Speech" tab
2. Select a voice model
3. Enter text to convert
4. Adjust speed and format
5. Click "Generate"

## Security Features

- ✅ Rate limiting (IP-based)
- ✅ Input sanitization (XSS prevention)
- ✅ File validation (magic numbers)
- ✅ CORS protection
- ✅ Security headers
- ✅ API key protection

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## API Routes

- `POST /api/create-model` - Create voice model from audio
- `POST /api/tts` - Generate speech from text
- `GET /api/models` - List all models

## Known Limitations

- **In-memory rate limiting** - Resets on server restart
- **Local file storage** - Generated audio stored locally
- **No authentication** - Designed for single-user deployment
- **SQLite database** - Use PostgreSQL for distributed deployment

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

- **Documentation:** [Fish Audio Docs](https://fish.audio/docs)
- **Issues:** [GitHub Issues](https://github.com/anthonyruan/voice-clone/issues)
- **API:** [Fish Audio API](https://fish.audio/go-api/)

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Fish Audio API](https://fish.audio/)
- UI components from [Radix UI](https://www.radix-ui.com/)

---

Made with ❤️ by [Anthony](https://github.com/anthonyruan)
