from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid

from config import FRONTEND_URL, PORT
from modules.ai_agent import process_message
from modules.lead_manager import get_all_leads, load_properties, get_lead_by_id, create_or_update_lead
from modules.telegram_bot import send_telegram_message, extract_message_data, set_webhook, get_webhook_info
from modules.voice_handler import transcribe_audio, synthesize_speech, adapt_text_for_voice

# Inicializar FastAPI
app = FastAPI(
    title="InmoBot API",
    description="API para el agente inmobiliario con IA - Sistema Omnicanal",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Almacén de sesiones en memoria (para demo)
sessions = {}

# Almacén de conversaciones de Telegram
telegram_conversations = {}

# Almacén de conversaciones de voz
voice_sessions = {}


# ==================== UTILIDADES ====================

async def save_lead_async(session_id: str, lead_data: dict, conversation_history: list):
    """Guarda el lead de forma asíncrona sin bloquear la respuesta"""
    try:
        create_or_update_lead(
            channel="voice",
            session_id=session_id,
            lead_data=lead_data or {},
            conversation_history=conversation_history
        )
    except Exception as lead_error:
        print(f"Error guardando lead (no crítico): {lead_error}")


# ==================== MODELOS ====================

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    lead_data: Optional[dict] = None


class WebhookSetupRequest(BaseModel):
    webhook_url: str


class VoiceSynthesisRequest(BaseModel):
    text: str
    voice: Optional[str] = "nova"
    speed: Optional[float] = 1.0


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Estado de la API."""
    return {
        "status": "online",
        "service": "InmoBot API",
        "version": "1.0.0",
        "channels": ["web", "telegram", "voice"]
    }


@app.get("/api/health")
async def health_check():
    """Health check del servidor."""
    return {"status": "healthy", "message": "El servidor está funcionando correctamente"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat_web(request: ChatRequest):
    """
    Endpoint para el chat web.
    Procesa mensajes del usuario y retorna respuesta del agente de IA.
    """
    # Generar o usar session_id existente
    session_id = request.session_id or str(uuid.uuid4())
    
    # Obtener o crear historial de conversación
    if session_id not in sessions:
        sessions[session_id] = []
    
    conversation_history = sessions[session_id]
    
    # Procesar mensaje con IA
    response, updated_history, lead_data = await process_message(
        message=request.message,
        conversation_history=conversation_history,
        channel="web",
        session_id=session_id
    )
    
    # Actualizar historial en sesión
    sessions[session_id] = updated_history
    
    # Crear o actualizar lead automáticamente en cada interacción
    create_or_update_lead(
        channel="web",
        session_id=session_id,
        lead_data=lead_data or {},
        conversation_history=updated_history
    )
    
    return ChatResponse(
        response=response,
        session_id=session_id,
        lead_data=lead_data if lead_data else None
    )


@app.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    """
    Webhook para recibir mensajes de Telegram.
    Telegram envía updates a este endpoint.
    """
    try:
        update = await request.json()
        
        # Extraer datos del mensaje
        message_data = extract_message_data(update)
        
        if not message_data:
            # No es un mensaje de texto, ignorar
            return {"ok": True}
        
        chat_id = message_data["chat_id"]
        text = message_data["text"]
        username = message_data.get("username")
        first_name = message_data.get("first_name")
        
        # Crear identificador único para esta conversación de Telegram
        telegram_session = f"telegram_{chat_id}"
        
        # Obtener o crear historial de conversación
        if telegram_session not in telegram_conversations:
            telegram_conversations[telegram_session] = []
        
        conversation_history = telegram_conversations[telegram_session]
        
        # Procesar mensaje con IA
        response, updated_history, lead_data = await process_message(
            message=text,
            conversation_history=conversation_history,
            channel="telegram",
            session_id=telegram_session,
            telegram_username=username
        )
        
        # Actualizar historial
        telegram_conversations[telegram_session] = updated_history
        
        # Crear o actualizar lead automáticamente en cada interacción
        # Incluir nombre de Telegram si está disponible
        combined_lead_data = lead_data or {}
        if first_name and not combined_lead_data.get("name"):
            combined_lead_data["name"] = first_name
        
        create_or_update_lead(
            channel="telegram",
            session_id=telegram_session,
            telegram_username=username,
            telegram_chat_id=str(chat_id),
            lead_data=combined_lead_data,
            conversation_history=updated_history
        )
        
        # Enviar respuesta a Telegram
        await send_telegram_message(chat_id, response)
        
        return {"ok": True}
        
    except Exception as e:
        print(f"Error en telegram_webhook: {str(e)}")
        return {"ok": False, "error": str(e)}


@app.get("/api/leads")
async def get_leads():
    """Retorna todos los leads capturados."""
    leads = get_all_leads()
    return {
        "total": len(leads),
        "leads": leads
    }


@app.get("/api/leads/{lead_id}")
async def get_lead(lead_id: str):
    """Retorna un lead específico por su ID."""
    lead = get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead


@app.get("/api/properties")
async def get_properties():
    """Retorna todas las propiedades disponibles."""
    properties = load_properties()
    return {
        "total": len(properties),
        "properties": properties
    }


@app.post("/api/telegram/setup-webhook")
async def setup_telegram_webhook(request: WebhookSetupRequest):
    """Configura el webhook de Telegram."""
    result = await set_webhook(request.webhook_url)
    return result


@app.get("/api/telegram/webhook-info")
async def get_telegram_webhook_info():
    """Obtiene información del webhook de Telegram."""
    result = await get_webhook_info()
    return result


# ==================== ENDPOINTS DE VOZ ====================

@app.post("/api/voice/transcribe")
async def voice_transcribe(
    audio: UploadFile = File(...),
    session_id: str = Form(None)
):
    """
    Transcribe audio a texto y procesa con IA.
    Recibe archivo de audio, transcribe con Whisper, procesa con GPT.
    OPTIMIZADO PARA VELOCIDAD.
    """
    import time
    start_time = time.time()

    try:
        # Generar o usar session_id existente
        received_session_id = session_id
        session_id = session_id or str(uuid.uuid4())
        
        # DEBUG: Ver si recibimos session_id
        print(f"[SESSION] Recibido: {received_session_id} | Usando: {session_id}")

        # Transcribir audio
        stt_start = time.time()
        transcribed_text = await transcribe_audio(audio)
        stt_time = time.time() - stt_start
        print(f"[STT] Tiempo: {stt_time:.2f}s")

        if not transcribed_text or not transcribed_text.strip():
            return {
                "error": "No se pudo transcribir el audio. Intenta de nuevo.",
                "transcribed_text": "",
                "bot_response": "",
                "session_id": session_id
            }

        # FILTRO DE RUIDO: Ignorar texto que parece ser ruido ambiental
        noise_patterns = [
            "gracias por ver",
            "suscríbete",
            "subtítulos",
            "amara.org",
            "like",
            "subscribe",
            "channel",
            "video",
            "comunidad",
            "realizado por",
            "transcripción",
        ]
        
        text_lower = transcribed_text.lower()
        is_noise = any(pattern in text_lower for pattern in noise_patterns)
        
        if is_noise:
            print(f"[FILTRO] Ruido detectado, ignorando: '{transcribed_text}'")
            return {
                "transcribed_text": transcribed_text,
                "bot_response": "",
                "session_id": session_id,
                "filtered": True
            }

        # Obtener o crear historial de conversación de voz
        if session_id not in voice_sessions:
            # Agregar saludo inicial al historial para que GPT sepa que ya saludó
            voice_sessions[session_id] = [
                {
                    "role": "assistant",
                    "content": "Hola, soy InmoBot. ¿En qué puedo ayudarte?"
                }
            ]
            print(f"[SESSION] Nueva sesión creada con saludo inicial: {session_id}")
        else:
            print(f"[SESSION] Sesión existente con {len(voice_sessions[session_id])} mensajes")

        conversation_history = voice_sessions[session_id]

        # Procesar mensaje con IA
        gpt_start = time.time()
        response, updated_history, lead_data = await process_message(
            message=transcribed_text,
            conversation_history=conversation_history,
            channel="voice",
            session_id=session_id
        )
        gpt_time = time.time() - gpt_start
        print(f"[GPT] Tiempo: {gpt_time:.2f}s")

        # Actualizar historial
        voice_sessions[session_id] = updated_history

        # Crear o actualizar lead EN BACKGROUND (sin esperar)
        import asyncio
        asyncio.create_task(save_lead_async(session_id, lead_data, updated_history))

        total_time = time.time() - start_time
        print(f"[TOTAL] Tiempo: {total_time:.2f}s | Transcrito: '{transcribed_text}' | Respuesta: '{response[:50]}...'")

        return {
            "transcribed_text": transcribed_text,
            "bot_response": response,
            "session_id": session_id,
            "lead_data": lead_data
        }

    except Exception as e:
        print(f"[ERROR] Error en voice_transcribe: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": f"Error al procesar audio: {str(e)}",
            "transcribed_text": "",
            "bot_response": "",
            "session_id": session_id
        }


@app.post("/api/voice/synthesize")
async def voice_synthesize(request: VoiceSynthesisRequest):
    """
    Convierte texto a audio usando TTS.
    Retorna archivo MP3. OPTIMIZADO PARA VELOCIDAD.
    """
    import time
    start_time = time.time()

    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

        # Adaptar texto para voz (convertir símbolos a palabras)
        adapted_text = adapt_text_for_voice(request.text, "voice")

        # Sintetizar audio
        audio_content = synthesize_speech(
            text=adapted_text,
            voice=request.voice,
            speed=request.speed or 1.0  # Velocidad normal para audio natural
        )

        tts_time = time.time() - start_time
        print(f"[TTS] Tiempo: {tts_time:.2f}s | Texto: '{request.text[:50]}...'")

        return Response(
            content=audio_content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=response.mp3",
                "Cache-Control": "no-cache"
            }
        )

    except Exception as e:
        print(f"[ERROR] Error en voice_synthesize: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al sintetizar audio: {str(e)}")


# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
