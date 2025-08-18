# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a voice cloning project with the main Next.js application located in the `voice-clone-app/` subdirectory. The root directory contains project-wide documentation and configuration.

```
voice-clone/
├── voice-clone-app/           # Main Next.js application
│   ├── app/                   # Next.js App Router
│   ├── components/            # React components  
│   ├── lib/                   # Utilities and API wrappers
│   ├── data/                  # SQLite database
│   └── package.json           # App dependencies
├── todo.md                    # Project task tracking
├── fish_audio_documentation.md # API documentation
└── fish_audio_examples.py     # Python examples
```

## Common Commands

All development commands should be run from the `voice-clone-app/` directory:

```bash
cd voice-clone-app

# Development
npm run dev          # Start development server on http://localhost:3000

# Build & Production  
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Task Management

- Use `todo.md` in the root directory to track development tasks
- Add new tasks before starting development
- Mark tasks as completed when finished to track progress
- Use Task tool to create multiple sub-agents for parallel development of independent tasks

## Development Workflow

1. Check `todo.md` for current tasks and priorities
2. Work from the `voice-clone-app/` directory for all app development
3. Use TodoWrite tool to plan and track development progress
4. Create multiple Task agents for parallel development when appropriate

## Key Files

- `voice-clone-app/CLAUDE.md` - Detailed technical architecture and implementation guidance
- `todo.md` - Task tracking and project status
- `fish_audio_documentation.md` - API documentation
- `voice-clone-app/lib/fish-audio.ts` - Main API integration
