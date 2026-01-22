# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InmoBot AI is an omnichannel real estate chatbot system powered by GPT-4o-mini. It features a web interface, Telegram integration, voice call capabilities, and an admin dashboard for lead management. The system automatically profiles customers, recommends properties, and captures leads with intelligent scoring.

## Architecture

### Backend (FastAPI + Python)

The backend is a FastAPI application serving three channels: web chat, Telegram bot, and voice calls.

**Core Modules:**
- `main.py` - FastAPI app with endpoints for chat, voice, Telegram webhook, and dashboard API
- `modules/ai_agent.py` - GPT-4o-mini integration with function calling (show_catalog, search_properties, save_lead_info)
- `modules/lead_manager.py` - Lead CRUD, scoring system (0-100), temperature classification (frío/tibio/caliente)
- `modules/voice_handler.py` - Audio transcription (STT) and synthesis (TTS) with Deepgram/OpenAI fallback
- `modules/telegram_bot.py` - Telegram Bot API integration for webhook handling
- `config.py` - Environment configuration (API keys, URLs, file paths)

**Session Management:**
- Web sessions: In-memory dict `sessions` keyed by `session_id`
- Telegram sessions: In-memory dict `telegram_conversations` keyed by `telegram_{chat_id}`
- Voice sessions: In-memory dict `voice_sessions` keyed by `session_id`
- All maintain conversation history for context across messages

**Lead Scoring System:**
The system auto-scores leads based on data captured:
- Name: +25 points
- Phone: +30 points
- Email: +15 points
- Budget: +10 points
- Zone/type/bedrooms: +5 points each
- Interested property: +10 points
- Wants visit: +20 points
- Active conversation (3+ messages): +10 points
- Temperature: 0-30 = frío, 31-60 = tibio, 61+ = caliente

**Voice Provider Configuration:**
Configurable via `VOICE_PROVIDER` env var (deepgram or openai). Deepgram is default for cost efficiency. Both STT and TTS have automatic fallback to the other provider on failure.

### Frontend (React + Vite)

Single-page application with routing for three main views:

**Routes:**
- `/` - Main chat interface (ChatInterface.jsx)
- `/dashboard` - Lead management dashboard (Dashboard.jsx)
- `/call` - Voice call interface (VoiceCall.jsx)

**Key Components:**
- `App.jsx` - Router setup with react-router-dom
- `components/ChatInterface/` - Text chat UI with markdown support
- `components/VoiceCall/` - Voice chat UI with audio recording/playback
- `components/VoiceRecorder/` - Shared audio recording component
- `components/Dashboard/` - Admin panel showing leads with filters and stats
- `components/Header/` - Navigation between chat and dashboard
- `components/Message/` - Message display with markdown rendering

**State Management:**
- Session persistence via localStorage for session_id
- No global state library (uses useState/useEffect)
- API calls handled through `services/api.js`

## Development Commands

### Backend

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run development server
python main.py
# Server starts at http://localhost:8000

# Run with uvicorn (auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev
# Dev server at http://localhost:5173

# Build for production
npm run build

# Preview production build
npm preview

# Lint
npm run lint
```

## Environment Configuration

Create `.env` files in the backend directory:

```bash
# backend/.env
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...  # Optional, for voice features
TELEGRAM_BOT_TOKEN=...  # Optional, for Telegram channel
VOICE_PROVIDER=deepgram  # or "openai"
FRONTEND_URL=http://localhost:5173
PORT=8000
```

Frontend uses environment variables for API URL:
```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```

## Data Storage

The system uses JSON files for data persistence (demo-level, not production):

- `backend/data/properties.json` - Property inventory catalog
- `backend/data/leads.json` - Captured leads with conversation history

These files are created automatically if they don't exist. In production, replace with a proper database.

## AI Agent System Prompt

The AI agent in `ai_agent.py` has a detailed system prompt that defines:
- Personality: Friendly Spanish real estate assistant (uses Spain Spanish: "vale", "tenéis")
- Function calling: When to use `show_catalog` vs `search_properties` vs `save_lead_info`
- Response style: Concise (3-4 sentences), minimal emojis (1-2 max)
- Catalog awareness: Knows all 10 properties (€150k - €890k range)

**Key behavior:** Shows full catalog immediately when user asks to see properties, without requiring budget first.

## API Endpoints

### Chat
- `POST /api/chat` - Process web chat message
- `POST /api/voice/transcribe` - Transcribe audio + process with AI
- `POST /api/voice/synthesize` - Convert text to speech
- `POST /webhook/telegram` - Telegram webhook receiver

### Data
- `GET /api/leads` - Get all leads with scores/temperatures
- `GET /api/leads/{lead_id}` - Get specific lead
- `GET /api/properties` - Get property catalog

### Admin
- `POST /api/telegram/setup-webhook` - Configure Telegram webhook
- `GET /api/telegram/webhook-info` - Check webhook status
- `GET /api/health` - Health check
- `GET /` - API status

## Testing the System

Refer to `MANUAL_CLIENTE.md` for detailed test scenarios. Quick test flow:

1. Start backend: `cd backend && python main.py`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Test chat: "Quiero ver propiedades" → Should show full catalog
5. Test search: "Busco en Marbella hasta 300 mil" → Should filter properties
6. Test lead capture: Provide name/phone → Check Dashboard for lead appearance

## Telegram Integration

To enable Telegram channel:
1. Create bot via @BotFather
2. Set `TELEGRAM_BOT_TOKEN` in backend/.env
3. Deploy backend to HTTPS endpoint
4. Call `POST /api/telegram/setup-webhook` with your webhook URL

## Voice Integration Notes

Voice features are HEAVILY OPTIMIZED for low latency conversation:

**Configuration:**
- **STT (Speech-to-Text):** Deepgram Nova-2 (preferred, faster) or OpenAI Whisper (fallback)
- **TTS (Text-to-Speech):** Deepgram Aura-ES or OpenAI TTS at 1.15x speed
- **Audio format:** WebM input (16kHz sample rate), MP3 output
- **Adaptive text preprocessing:** Converts symbols (€, m²) to spoken words before synthesis

**Voice-specific AI Optimization:**
- Dedicated `VOICE_SYSTEM_PROMPT` for phone-style conversation (concise, no emojis)
- Reduced token limits: 120 max (first call), 80 max (second call) - vs 800/600 for web
- Lower temperature: 0.5 for faster, more predictable responses
- Target response time: 5-12 seconds total (STT + GPT + TTS)

**Frontend Optimizations (VoiceCall.jsx):**
- Silence detection: 800ms threshold (optimized for quick response)
- `setInterval` instead of `requestAnimationFrame` for better control
- Race condition prevention with `isProcessingRef` flag
- 20-second timeout on backend calls
- Automatic retry on errors with 500ms delay
- sampleRate: 16kHz (lower = faster processing)

**Performance Monitoring:**
Backend logs timing for each step:
```
⏱️ STT tiempo: 2.3s
⏱️ GPT tiempo: 3.5s
⏱️ TTS tiempo: 1.8s
⏱️ TOTAL tiempo: 7.6s
```

## Common Patterns

**Adding a new AI function:**
1. Add function definition to `TOOLS` array in `ai_agent.py`
2. Handle function call in `process_tool_calls()` function
3. Update system prompt with usage instructions

**Adding a new endpoint:**
1. Define Pydantic models if needed (BaseModel)
2. Add route handler with appropriate HTTP method decorator
3. Update CORS origins if needed in `main.py`

**Modifying lead scoring:**
Edit `calculate_lead_score()` in `lead_manager.py` to adjust point values or temperature thresholds.

## Deployment

The repository includes Dockerfiles for both frontend and backend:
- `backend/Dockerfile` + `backend/Procfile` for Heroku/Railway
- `frontend/Dockerfile` + `frontend/nginx.conf` for static serving
- `frontend/.env.example` shows required environment variables

## File Structure Notes

- Backend: Python modules under `backend/modules/`, data in `backend/data/`
- Frontend: React components in `frontend/src/components/`, each with co-located CSS
- No TypeScript - uses plain JavaScript with JSX
- Styling: CSS modules per component (no Tailwind/styled-components)
