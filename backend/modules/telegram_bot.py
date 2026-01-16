import httpx
from typing import Optional

from config import TELEGRAM_API_URL, TELEGRAM_BOT_TOKEN


async def send_telegram_message(chat_id: int, text: str, parse_mode: str = "Markdown") -> bool:
    """
    Envía un mensaje a un chat de Telegram.
    
    Args:
        chat_id: ID del chat de Telegram
        text: Texto del mensaje
        parse_mode: Modo de parseo (Markdown o HTML)
    
    Returns:
        bool: True si se envió correctamente
    """
    if not TELEGRAM_BOT_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN no configurado")
        return False
    
    url = f"{TELEGRAM_API_URL}/sendMessage"
    
    # Limpiar el texto para evitar errores de Markdown
    # Escapar caracteres especiales que pueden causar problemas
    safe_text = text.replace("_", "\\_").replace("*", "\\*") if parse_mode == "Markdown" else text
    
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            
            if response.status_code == 200:
                return True
            else:
                print(f"Error enviando mensaje a Telegram: {response.status_code} - {response.text}")
                # Intentar sin parse_mode si falla
                payload.pop("parse_mode")
                retry_response = await client.post(url, json=payload)
                return retry_response.status_code == 200
                
    except Exception as e:
        print(f"Error en send_telegram_message: {str(e)}")
        return False


async def set_webhook(webhook_url: str) -> dict:
    """
    Configura el webhook de Telegram.
    
    Args:
        webhook_url: URL del webhook (debe ser HTTPS)
    
    Returns:
        dict: Respuesta de la API de Telegram
    """
    if not TELEGRAM_BOT_TOKEN:
        return {"ok": False, "error": "TELEGRAM_BOT_TOKEN no configurado"}
    
    url = f"{TELEGRAM_API_URL}/setWebhook"
    
    payload = {
        "url": webhook_url,
        "allowed_updates": ["message"]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            return response.json()
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def get_webhook_info() -> dict:
    """Obtiene información del webhook actual."""
    if not TELEGRAM_BOT_TOKEN:
        return {"ok": False, "error": "TELEGRAM_BOT_TOKEN no configurado"}
    
    url = f"{TELEGRAM_API_URL}/getWebhookInfo"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            return response.json()
    except Exception as e:
        return {"ok": False, "error": str(e)}


def extract_message_data(update: dict) -> Optional[dict]:
    """
    Extrae los datos relevantes de un update de Telegram.
    
    Args:
        update: Objeto update de Telegram
    
    Returns:
        dict con chat_id, text, username, first_name o None si no es mensaje de texto
    """
    message = update.get("message")
    
    if not message or not message.get("text"):
        return None
    
    chat = message.get("chat", {})
    user = message.get("from", {})
    
    return {
        "chat_id": chat.get("id"),
        "text": message.get("text"),
        "username": user.get("username"),
        "first_name": user.get("first_name"),
        "message_id": message.get("message_id")
    }
