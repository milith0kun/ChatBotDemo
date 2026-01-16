from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid

from config import FRONTEND_URL, PORT
from modules.ai_agent import process_message
from modules.lead_manager import get_all_leads, load_properties, get_lead_by_id
from modules.telegram_bot import send_telegram_message, extract_message_data, set_webhook, get_webhook_info

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


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Estado de la API."""
    return {
        "status": "online",
        "service": "InmoBot API",
        "version": "1.0.0",
        "channels": ["web", "telegram"]
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


# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
