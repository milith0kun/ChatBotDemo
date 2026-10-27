import urllib.parse
from typing import Optional
import httpx
from config import EVOLUTION_API_KEY, EVOLUTION_API_URL, EVOLUTION_INSTANCE_NAME

# Headers globales para peticiones a Evolution API
CABECERAS_EVOLUTION = {
    "apikey": EVOLUTION_API_KEY,
    "Content-Type": "application/json"
}


def _obtener_url_instancia_codificada() -> str:
    """Devuelve el nombre de la instancia codificado para URLs."""
    return urllib.parse.quote(EVOLUTION_INSTANCE_NAME)


async def obtener_estado_whatsapp() -> dict:
    """
    Consulta el estado de conexión de la instancia de WhatsApp en Evolution API.
    Retorna información normalizada en español.
    """
    instancia_codificada = _obtener_url_instancia_codificada()
    url_estado = f"{EVOLUTION_API_URL}/instance/connectionState/{instancia_codificada}"
    url_info = f"{EVOLUTION_API_URL}/instance/fetchInstances"

    try:
        async with httpx.AsyncClient(timeout=10.0) as cliente:
            # 1. Obtener estado de la conexión
            respuesta_estado = await cliente.get(url_estado, headers=CABECERAS_EVOLUTION)
            estado_conexion = "desconocido"
            
            if respuesta_estado.status_code == 200:
                datos_estado = respuesta_estado.json()
                # Puede venir en 'instance.state' o 'state'
                estado_raw = (
                    datos_estado.get("instance", {}).get("state")
                    or datos_estado.get("state")
                    or "desconocido"
                )
                estado_conexion = estado_raw.lower()

            # 2. Obtener detalles del perfil (número, foto, etc.)
            telefono_conectado = None
            nombre_perfil = None
            foto_perfil = None

            try:
                respuesta_info = await cliente.get(url_info, headers=CABECERAS_EVOLUTION)
                if respuesta_info.status_code == 200:
                    instancias = respuesta_info.json()
                    for item in instancias:
                        if item.get("name") == EVOLUTION_INSTANCE_NAME:
                            owner_jid = item.get("ownerJid")
                            if owner_jid:
                                telefono_conectado = owner_jid.split("@")[0]
                            nombre_perfil = item.get("profileName")
                            foto_perfil = item.get("profilePicUrl")
                            # Si connectionStatus indica open, asegurar estado
                            status_item = (item.get("connectionStatus") or "").lower()
                            if status_item:
                                estado_conexion = status_item
                            break
            except Exception as error_info:
                print(f"[WHATSAPP] Error al obtener detalles de instancia: {error_info}")

            esta_conectado = estado_conexion == "open"

            return {
                "ok": True,
                "instancia": EVOLUTION_INSTANCE_NAME,
                "estado": estado_conexion,
                "esta_conectado": esta_conectado,
                "telefono": telefono_conectado,
                "nombre_perfil": nombre_perfil,
                "foto_perfil": foto_perfil
            }

    except Exception as error:
        print(f"[WHATSAPP] Error al consultar estado: {error}")
        return {
            "ok": False,
            "instancia": EVOLUTION_INSTANCE_NAME,
            "estado": "error",
            "esta_conectado": False,
            "detalle_error": str(error)
        }


async def obtener_qr_whatsapp() -> dict:
    """
    Obtiene el código QR en base64 y código de emparejamiento para conectar WhatsApp.
    """
    instancia_codificada = _obtener_url_instancia_codificada()
    url_conectar = f"{EVOLUTION_API_URL}/instance/connect/{instancia_codificada}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as cliente:
            respuesta = await cliente.get(url_conectar, headers=CABECERAS_EVOLUTION)
            
            if respuesta.status_code == 200:
                datos = respuesta.json()
                base64_qr = datos.get("base64") or ""
                # Si viene con prefijo o no, asegurar formato data:image/png;base64,
                if base64_qr and not base64_qr.startswith("data:"):
                    base64_qr = f"data:image/png;base64,{base64_qr}"

                codigo_emparejamiento = datos.get("pairingCode")
                conteo_intentos = datos.get("count", 0)

                return {
                    "ok": True,
                    "instancia": EVOLUTION_INSTANCE_NAME,
                    "codigo_qr_base64": base64_qr,
                    "codigo_emparejamiento": codigo_emparejamiento,
                    "conteo": conteo_intentos,
                    "estado": "esperando_escaneo" if base64_qr else "conectado_o_procesando"
                }
            else:
                return {
                    "ok": False,
                    "instancia": EVOLUTION_INSTANCE_NAME,
                    "error": f"Error {respuesta.status_code}: {respuesta.text}"
                }

    except Exception as error:
        print(f"[WHATSAPP] Error al solicitar QR: {error}")
        return {
            "ok": False,
            "instancia": EVOLUTION_INSTANCE_NAME,
            "error": str(error)
        }


async def enviar_mensaje_whatsapp(numero: str, texto: str) -> dict:
    """
    Envía un mensaje de texto por WhatsApp a través de Evolution API.
    `numero` puede ser '51999999999' o '51999999999@s.whatsapp.net'.
    """
    instancia_codificada = _obtener_url_instancia_codificada()
    url_envio = f"{EVOLUTION_API_URL}/message/sendText/{instancia_codificada}"

    # Limpiar formato de número
    numero_limpio = numero.replace("@s.whatsapp.net", "").replace("+", "").replace(" ", "").replace("-", "")

    cuerpo = {
        "number": numero_limpio,
        "text": texto,
        "delay": 1000,
        "linkPreview": True
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as cliente:
            respuesta = await cliente.post(url_envio, headers=CABECERAS_EVOLUTION, json=cuerpo)
            
            if respuesta.status_code in (200, 201):
                return {
                    "ok": True,
                    "mensaje": "Mensaje enviado exitosamente por WhatsApp",
                    "datos": respuesta.json()
                }
            else:
                print(f"[WHATSAPP] Error al enviar mensaje ({respuesta.status_code}): {respuesta.text}")
                return {
                    "ok": False,
                    "error": f"Error {respuesta.status_code}: {respuesta.text}"
                }

    except Exception as error:
        print(f"[WHATSAPP] Excepción al enviar mensaje: {error}")
        return {
            "ok": False,
            "error": str(error)
        }


async def configurar_webhook_whatsapp(url_webhook: str) -> dict:
    """
    Configura el webhook en Evolution API para recibir mensajes entrantes y actualizaciones.
    """
    instancia_codificada = _obtener_url_instancia_codificada()
    url_configuracion = f"{EVOLUTION_API_URL}/webhook/set/{instancia_codificada}"

    cuerpo = {
        "webhook": {
            "enabled": True,
            "url": url_webhook,
            "byEvents": False,
            "base64": False,
            "events": [
                "CONNECTION_UPDATE",
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE"
            ]
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as cliente:
            respuesta = await cliente.post(url_configuracion, headers=CABECERAS_EVOLUTION, json=cuerpo)
            if respuesta.status_code in (200, 201):
                return {
                    "ok": True,
                    "mensaje": "Webhook de WhatsApp configurado correctamente",
                    "url": url_webhook,
                    "resultado": respuesta.json()
                }
            else:
                return {
                    "ok": False,
                    "error": f"Error {respuesta.status_code}: {respuesta.text}"
                }
    except Exception as error:
        return {
            "ok": False,
            "error": str(error)
        }


async def obtener_info_webhook_whatsapp() -> dict:
    """Consulta la configuración actual del webhook en Evolution API."""
    instancia_codificada = _obtener_url_instancia_codificada()
    url_info = f"{EVOLUTION_API_URL}/webhook/find/{instancia_codificada}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as cliente:
            respuesta = await cliente.get(url_info, headers=CABECERAS_EVOLUTION)
            if respuesta.status_code == 200:
                return {"ok": True, "webhook": respuesta.json()}
            else:
                return {"ok": False, "error": f"Error {respuesta.status_code}: {respuesta.text}"}
    except Exception as error:
        return {"ok": False, "error": str(error)}


def extraer_datos_mensaje_whatsapp(datos_webhook: dict) -> Optional[dict]:
    """
    Analiza y extrae la información relevante de un payload entrante de Evolution API v2.
    Retorna None si no es un mensaje procesable (mensajes propios, avisos del sistema, grupos, etc.)
    """
    if not isinstance(datos_webhook, dict):
        return None

    # Evolution API suele enviar el evento en 'event'
    tipo_evento = (datos_webhook.get("event") or "").lower()
    
    # Manejar caso de mensajes
    datos_mensaje = datos_webhook.get("data") or {}
    
    # Si viene en formato anidado directo
    clave = datos_mensaje.get("key") or {}
    remitente_jid = clave.get("remoteJid") or ""
    es_propio = clave.get("fromMe", False)

    # Ignorar mensajes enviados por el bot o broadcasts
    if es_propio:
        return None
    if not remitente_jid or "status@broadcast" in remitente_jid:
        return None

    # Detectar si es grupo
    es_grupo = remitente_jid.endswith("@g.us")
    if es_grupo:
        # En una demo inmobiliaria atendemos clientes directos
        return None

    # Extraer texto del mensaje
    mensaje_obj = datos_mensaje.get("message") or {}
    texto = (
        mensaje_obj.get("conversation")
        or mensaje_obj.get("extendedTextMessage", {}).get("text")
        or mensaje_obj.get("imageMessage", {}).get("caption")
        or mensaje_obj.get("videoMessage", {}).get("caption")
        or ""
    ).strip()

    if not texto:
        return None

    nombre_contacto = datos_mensaje.get("pushName") or "Cliente WhatsApp"
    telefono = remitente_jid.split("@")[0]

    return {
        "remitente_jid": remitente_jid,
        "telefono": telefono,
        "nombre": nombre_contacto,
        "texto": texto,
        "id_mensaje": clave.get("id"),
        "evento": tipo_evento
    }
