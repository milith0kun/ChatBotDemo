# 🏠 InmoBot AI - Agente Inmobiliario con IA

Sistema omnicanal de chatbot inmobiliario potenciado por IA, con soporte para chat web, Telegram y voz.

![Status](https://img.shields.io/badge/status-production-green)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18-61DAFB)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Descripción

InmoBot AI es un asistente inmobiliario inteligente que permite a clientes potenciales:

- 💬 Chatear con un agente de IA por **Web**, **Telegram** o **Voz**
- 🎯 Ser cualificados de forma natural (sin formularios)
- 🏡 Recibir recomendaciones de propiedades según sus necesidades
- 📊 Captura automática de leads con clasificación inteligente

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Python | 3.11 | Runtime |
| FastAPI | 0.109 | Framework web/API |
| OpenAI GPT-4o | Latest | IA Conversacional |
| OpenAI Whisper | Latest | Transcripción de voz (STT) |
| OpenAI TTS | tts-1-hd | Síntesis de voz |
| Deepgram | 3.5 | Alternativa STT/TTS |
| httpx | 0.26 | Cliente HTTP async |
| Pydantic | 2.5 | Validación de datos |

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.2 | Framework UI |
| Vite | 5.0 | Build tool |
| Axios | 1.6 | Cliente HTTP |
| React Router DOM | 6.21 | Enrutamiento |
| react-markdown | 10.1 | Renderizado markdown |

## 📁 Estructura del Proyecto

```
ChatBotDemo/
├── backend/
│   ├── main.py              # Aplicación FastAPI
│   ├── config.py            # Configuración y variables
│   ├── requirements.txt     # Dependencias Python
│   ├── modules/
│   │   ├── ai_agent.py      # Lógica del agente IA
│   │   ├── lead_manager.py  # Gestión de leads
│   │   ├── voice_handler.py # Procesamiento de voz
│   │   └── telegram_bot.py  # Integración Telegram
│   └── data/
│       ├── properties.json  # Catálogo de propiedades
│       └── leads.json       # Leads capturados
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router principal
│   │   ├── components/
│   │   │   ├── ChatInterface/   # Chat web
│   │   │   ├── VoiceCall/       # Llamada por voz
│   │   │   ├── Dashboard/       # Panel de leads
│   │   │   └── Header/          # Navegación
│   │   └── services/
│   │       └── api.js       # Llamadas API
│   └── package.json
│
└── README.md
```

## 🚀 Instalación y Uso

### Requisitos Previos
- Python 3.11+
- Node.js 18+
- API Key de OpenAI
- (Opcional) API Key de Deepgram
- (Opcional) Token de Bot de Telegram

### 1. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o: venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys
```

**Variables de entorno requeridas (.env):**
```bash
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...        # Opcional
TELEGRAM_BOT_TOKEN=...      # Opcional
VOICE_PROVIDER=openai       # o "deepgram"
FRONTEND_URL=http://localhost:5173
PORT=8000
```

### 2. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar URL del backend
echo "VITE_API_URL=http://localhost:8000" > .env
```

### 3. Ejecutar en Desarrollo

```bash
# Terminal 1 - Backend
cd backend
python main.py
# Servidor en http://localhost:8000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Aplicación en http://localhost:5173
```

## 📡 API Endpoints

### Chat y Voz
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/chat` | Procesar mensaje de chat web |
| POST | `/api/voice/transcribe` | Transcribir audio y responder |
| POST | `/api/voice/synthesize` | Convertir texto a audio |
| POST | `/api/realtime/session` | Crear sesión WebRTC (OpenAI Realtime) |

### Datos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/leads` | Listar todos los leads |
| GET | `/api/leads/{id}` | Obtener lead específico |
| GET | `/api/properties` | Listar propiedades |

### Telegram
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/webhook/telegram` | Webhook de Telegram |
| POST | `/api/telegram/setup-webhook` | Configurar webhook |
| GET | `/api/telegram/webhook-info` | Info del webhook |

### Sistema
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Estado de la API |
| GET | `/api/health` | Health check |

## 🧪 Guía de Pruebas

### Escenario 1: Ver Catálogo
```
Usuario: "Hola, quiero ver qué propiedades tienen"
Bot: [Muestra catálogo completo con precios]
```

### Escenario 2: Búsqueda Específica
```
Usuario: "Busco departamento en San Isidro, tengo 260 mil dólares"
Bot: [Recomienda propiedades que encajen]
```

### Escenario 3: Captura de Lead
```
Usuario: "Me interesa, soy Juan Pérez, mi teléfono es 999888777"
Bot: [Confirma y guarda datos]
→ Verificar en Dashboard: Lead aparece como "🔥 Caliente"
```

## 📊 Sistema de Clasificación de Leads

| Score | Temperatura | Criterio |
|-------|-------------|----------|
| 0-30 | ❄️ Frío | Solo exploración |
| 31-60 | 🌤️ Tibio | Interés sin urgencia |
| 61-100 | 🔥 Caliente | Listo para comprar |

**Puntuación automática:**
- Nombre: +25 pts
- Teléfono: +30 pts
- Email: +15 pts
- Presupuesto: +10 pts
- Quiere visita: +20 pts

## 🚀 Despliegue en Producción

### Docker

```bash
# Frontend
cd frontend
docker build --build-arg VITE_API_URL=https://tu-api.com -t inmobot-frontend .
docker run -p 80:80 inmobot-frontend

# Backend
cd backend
docker build -t inmobot-backend .
docker run -p 8000:8000 --env-file .env inmobot-backend
```

### Variables de Producción

**Frontend (.env.production):**
```bash
VITE_API_URL=https://tu-api.com
```

**Backend (.env):**
```bash
OPENAI_API_KEY=sk-...
FRONTEND_URL=https://tu-frontend.com
```

## 🔗 URLs de Demo

- **Chat Web:** https://chat-demo-web.ecosdelseo.com
- **Dashboard:** https://chat-demo-web.ecosdelseo.com/dashboard
- **Bot Telegram:** https://t.me/EdmilSairebot

## 📝 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Desarrollado con ❤️ usando IA**
