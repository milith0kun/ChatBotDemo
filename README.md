# 🏠 InmoBot AI - Asistente Inmobiliario Inteligente Omnicanal

Sistema integral y comercial de inteligencia artificial para agencias inmobiliarias y promotoras de lujo, con atención omnicanal en tiempo real a través de **WhatsApp (Evolution API v2)**, **Llamadas de Voz en Vivo (OpenAI Realtime WebRTC)**, **Chat Web Interactivo**, **Telegram** y un **Panel CRM de Leads**.

![Estado](https://img.shields.io/badge/estado-producción-emerald)
![Python](https://img.shields.io/badge/python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-2.0-teal)
![React](https://img.shields.io/badge/react-18-61DAFB)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Evolution_API_v2-25D366)
![WebRTC](https://img.shields.io/badge/WebRTC-OpenAI_Realtime-8b5cf6)

---

## 🌟 Características Principales

- **WhatsApp Inteligente (Evolution API v2):** Vinculación directa por código QR o Pairing Code de la instancia oficial. Recepción y respuesta automática de consultas mediante webhook, calificando al cliente y agendando visitas.
- **Llamadas por Voz en Tiempo Real (OpenAI Realtime WebRTC):** Conversaciones fluidas con latencia ultra baja, detección de voz del usuario (Server VAD), respuesta por voz humana e interrupción natural.
- **Chat Web Interactivo:** Exploración del catálogo de propiedades (villas, áticos, apartamentos de lujo), filtros de presupuesto y captura conversacional de datos.
- **Bot de Telegram:** Atención automatizada e inmediata a prospectos que prefieran este canal.
- **Dashboard CRM Omnicanal:** Métricas de volumen por canal, filtrado por temperatura comercial (Caliente, Tibio, Frío), historial completo de mensajes y **exportación a CSV** con un solo clic.

---

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.11 | Entorno de ejecución |
| FastAPI | 0.109 | Framework web y API REST |
| OpenAI GPT-4o / Realtime | GA Schema | Agente conversacional y WebRTC de voz |
| Evolution API v2 | 2.3.7 | Integración oficial con WhatsApp |
| Uvicorn | 0.27 | Servidor ASGI de alto rendimiento |
| httpx | 0.26 | Cliente HTTP asíncrono para webhooks y APIs |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.2 | Biblioteca de interfaz de usuario |
| Vite | 5.0 | Empaquetador y entorno de desarrollo ultra rápido |
| WebRTC API | Estándar W3C | Streaming de audio bidireccional |
| Axios | 1.6 | Conexión con endpoints de la API |
| React Router DOM | 6.21 | Navegación entre Chat, Voz y Dashboard |

---

## 📁 Estructura del Proyecto

```
ChatBotDemo/
├── backend/
│   ├── config.py                 # Variables de entorno y rutas base
│   ├── main.py                   # API FastAPI y enrutamiento omnicanal
│   ├── requirements.txt          # Dependencias Python
│   ├── data/
│   │   ├── properties.json       # Catálogo de inmuebles en España
│   │   └── leads.json            # Base de datos de prospectos capturados
│   └── modules/
│       ├── ai_agent.py           # Agente IA inmobiliario y llamadas a funciones
│       ├── lead_manager.py       # Puntuación, temperatura y CRM de leads
│       ├── whatsapp_bot.py       # Conexión con Evolution API (QR, mensajes, webhook)
│       ├── telegram_bot.py       # Manejador del bot de Telegram
│       └── voice_handler.py      # Transcripción y síntesis de voz tradicional
├── frontend/
│   ├── index.html                # Entrada HTML con metadatos y tipografías
│   ├── package.json              # Dependencias del cliente React
│   └── src/
│       ├── components/
│       │   ├── Header/           # Barra superior con estado de WhatsApp
│       │   ├── ChatInterface/    # Chat de texto web inmobiliario
│       │   ├── VoiceCall/        # Llamada en vivo WebRTC con Realtime API
│       │   ├── Dashboard/        # Panel de métricas y CRM omnicanal
│       │   └── WhatsAppModal/    # Modal para escaneo de QR y prueba de WhatsApp
│       ├── services/
│       │   └── api.js            # Cliente HTTP para backend y WhatsApp
│       └── hooks/
│           └── useWebRTC.js      # Hook para conexión WebRTC con OpenAI
```

---

## ⚙️ Variables de Entorno

### Backend (`backend/.env`)
```ini
OPENAI_API_KEY=sk-proj-...
EVOLUTION_API_URL=https://cgbacademyti-evolutionapi-b4df35-72-60-114-137.sslip.io
EVOLUTION_API_KEY=738D584F644E-4B09-97EF-F25CDC95596E
EVOLUTION_INSTANCE_NAME=Edmil Jampier Saire Bustamante
TELEGRAM_BOT_TOKEN=...
FRONTEND_URL=https://chat-demo-web.ecosdelseo.com
PORT=8001
```

### Frontend (`frontend/.env.production` / Dokploy)
```ini
VITE_API_URL=https://api-chat-demo.ecosdelseo.com
```

---

## 🚀 Puesta en Marcha Local

### 1. Iniciar Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # En Windows
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

### 2. Iniciar Frontend
```bash
cd frontend
npm install
npm run dev
```

El panel estará disponible en `http://localhost:5173`.

---

## 📲 Flujo de Conexión de WhatsApp (Evolution API)

1. En el Header o en el Dashboard, haz clic en **WhatsApp** / **Conectar WhatsApp**.
2. Se abrirá el modal de vinculación mostrando el código QR en tiempo real generado por Evolution API.
3. Abre WhatsApp en tu dispositivo móvil > **Dispositivos vinculados** > **Vincular dispositivo**.
4. Escanea el código QR. El sistema detectará la sesión automáticamente y cambiará el estado a **WhatsApp Conectado**.
5. Desde el modal puedes enviar un mensaje de prueba o configurar el webhook hacia la URL de producción.

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Desarrollado para demostraciones comerciales inmobiliarias de alto impacto.
