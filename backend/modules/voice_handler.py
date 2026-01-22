"""
Módulo de manejo de voz para InmoBot
Soporta Deepgram (económico) y OpenAI como fallback
Deepgram: $200 créditos gratis, $0.0077/min STT, $0.015/1000 chars TTS
OpenAI: $0.006/min Whisper, ~$0.015/1000 chars TTS
"""
import os
import uuid
import tempfile
import re
import httpx
from openai import OpenAI
from config import OPENAI_API_KEY, DEEPGRAM_API_KEY, VOICE_PROVIDER

# Inicializar cliente OpenAI
openai_client = OpenAI(api_key=OPENAI_API_KEY)


def clean_transcript(text: str) -> str:
    """
    Limpia la transcripción eliminando silencios y puntos suspensivos excesivos.
    """
    if not text:
        return ""
    
    # Eliminar múltiples puntos suspensivos
    text = re.sub(r'\.{2,}', '', text)
    
    # Eliminar espacios múltiples
    text = re.sub(r'\s+', ' ', text)
    
    # Eliminar puntos suspensivos al inicio y final
    text = text.strip('. ')
    
    return text

# Configuración de voz - OPTIMIZADA PARA PRONUNCIACIÓN PERFECTA
VOICE_CONFIG = {
    "openai": {
        "model": "tts-1-hd",  # tts-1-hd mejor calidad y articulación
        "voice": "shimmer",  # Shimmer tiene mejor pronunciación en español que nova
        "speed": 0.95  # MÁS LENTA para mejor articulación y claridad
    },
    "deepgram": {
        "stt_model": "nova",  # Modelo base (nova-2 requiere permisos especiales)
        "tts_model": "aura-asteria-es",  # Voz femenina en español
        "encoding": "mp3",
        "sample_rate": 24000,
        "container": "mp3",
        "bitrate": 192000  # Aumentado de 128000 a 192000 para mejor calidad y claridad
    }
}

# Directorio temporal
TEMP_DIR = tempfile.gettempdir()

# Deepgram API URLs
DEEPGRAM_STT_URL = "https://api.deepgram.com/v1/listen"
DEEPGRAM_TTS_URL = "https://api.deepgram.com/v1/speak"


async def transcribe_audio_deepgram(audio_file) -> str:
    """
    Transcribe audio usando Deepgram API (más económico).
    
    Deepgram pricing: $0.0077/minuto con modelo Nova-3
    $200 en créditos gratis = ~45,000 minutos
    """
    if not DEEPGRAM_API_KEY:
        raise ValueError("DEEPGRAM_API_KEY no está configurada")
    
    temp_filename = f"voice_{uuid.uuid4()}.webm"
    temp_path = os.path.join(TEMP_DIR, temp_filename)
    
    try:
        # Guardar archivo temporal
        content = await audio_file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Enviar a Deepgram
        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "audio/webm"
        }
        
        params = {
            "model": VOICE_CONFIG["deepgram"]["stt_model"],
            "language": "es",
            "smart_format": "true",
            "punctuate": "true",
            "diarize": "false",
            "utterances": "false",
            "vad_events": "false",  # Desactiva eventos de detección de voz/silencio
            "tier": "enhanced"  # Usar tier enhanced para mejor precisión y velocidad
        }
        
        async with httpx.AsyncClient() as client:
            with open(temp_path, "rb") as audio:
                response = await client.post(
                    DEEPGRAM_STT_URL,
                    headers=headers,
                    params=params,
                    content=audio.read(),
                    timeout=15.0  # Reducido de 30 a 15 segundos
                )
        
        if response.status_code == 200:
            result = response.json()
            transcript = result.get("results", {}).get("channels", [{}])[0]
            alternatives = transcript.get("alternatives", [{}])
            raw_transcript = alternatives[0].get("transcript", "")
            return clean_transcript(raw_transcript)
        else:
            print(f"Deepgram error: {response.status_code} - {response.text}")
            return ""
            
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


async def transcribe_audio_openai(audio_file) -> str:
    """
    Transcribe audio usando OpenAI Whisper (fallback).
    
    OpenAI pricing: $0.006/minuto
    """
    temp_filename = f"voice_{uuid.uuid4()}.webm"
    temp_path = os.path.join(TEMP_DIR, temp_filename)
    
    try:
        content = await audio_file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        
        with open(temp_path, "rb") as audio:
            transcript = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio,
                language="es"
            )
        
        return clean_transcript(transcript.text)
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


async def transcribe_audio(audio_file) -> str:
    """
    Transcribe audio usando el proveedor configurado.
    Deepgram es el default (más económico).
    """
    provider = VOICE_PROVIDER.lower()
    
    # Reset del archivo para poder leerlo
    await audio_file.seek(0)
    
    try:
        if provider == "deepgram" and DEEPGRAM_API_KEY:
            return await transcribe_audio_deepgram(audio_file)
        elif OPENAI_API_KEY:
            return await transcribe_audio_openai(audio_file)
        else:
            raise ValueError("No hay API key configurada para transcripción")
    except Exception as e:
        print(f"Error con {provider}: {e}")
        # Fallback al otro proveedor
        await audio_file.seek(0)
        if provider == "deepgram" and OPENAI_API_KEY:
            print("Fallback a OpenAI Whisper...")
            return await transcribe_audio_openai(audio_file)
        elif provider == "openai" and DEEPGRAM_API_KEY:
            print("Fallback a Deepgram...")
            return await transcribe_audio_deepgram(audio_file)
        raise


def synthesize_speech_deepgram(text: str, voice: str = None) -> bytes:
    """
    Sintetiza voz usando Deepgram Aura-2 (mejor calidad).
    
    Deepgram TTS Aura-2: $0.030/1000 caracteres (mejor calidad)
    Con $200 créditos = ~6.6 millones de caracteres
    MEJORADO: Limpia el texto antes de enviar para evitar errores.
    """
    if not DEEPGRAM_API_KEY:
        raise ValueError("DEEPGRAM_API_KEY no configurada")
    
    # Limpiar el texto antes de enviar al TTS
    clean_text = text.strip()
    
    # Asegurar que no está vacío
    if not clean_text:
        clean_text = "Sin respuesta disponible."
    
    # Usar mejor modelo TTS
    model = voice or VOICE_CONFIG["deepgram"]["tts_model"]
    
    # DEBUG: Imprimir texto exacto enviado a Deepgram
    print(f"[DEEPGRAM TTS] Texto enviado: '{text}'")
    print(f"[DEEPGRAM TTS] Longitud: {len(text)} caracteres")
    
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Deepgram TTS endpoint con mejor modelo y configuración
    params = {
        "model": model,
        "encoding": VOICE_CONFIG["deepgram"]["encoding"],
        "sample_rate": VOICE_CONFIG["deepgram"]["sample_rate"],
        "bitrate": VOICE_CONFIG["deepgram"].get("bitrate", 128000)
    }
    
    url = DEEPGRAM_TTS_URL
    
    with httpx.Client() as client:
        response = client.post(
            url,
            headers=headers,
            params=params,
            json={"text": text},
            timeout=30.0
        )
    
    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"Deepgram TTS error: {response.status_code} - {response.text}")


def synthesize_speech_openai(text: str, voice: str = None, speed: float = None) -> bytes:
    """
    Sintetiza voz usando OpenAI TTS (fallback).
    MEJORADO: Limpia el texto antes de enviar para evitar errores.
    """
    # Limpiar el texto antes de enviar al TTS
    # Eliminar caracteres que pueden causar problemas
    clean_text = text.strip()
    
    # Asegurar que no está vacío
    if not clean_text:
        clean_text = "Sin respuesta disponible."
    
    # Limitar longitud máxima de OpenAI (4096 caracteres)
    if len(clean_text) > 4000:
        clean_text = clean_text[:3997] + "..."
    
    response = openai_client.audio.speech.create(
        model=VOICE_CONFIG["openai"]["model"],
        voice=voice or VOICE_CONFIG["openai"]["voice"],
        input=clean_text,
        speed=speed or VOICE_CONFIG["openai"]["speed"]
    )
    return response.content


def synthesize_speech(text: str, voice: str = None, speed: float = None) -> bytes:
    """
    Sintetiza texto a audio usando el proveedor configurado.
    """
    provider = VOICE_PROVIDER.lower()
    
    try:
        if provider == "deepgram" and DEEPGRAM_API_KEY:
            return synthesize_speech_deepgram(text, voice)
        elif OPENAI_API_KEY:
            return synthesize_speech_openai(text, voice, speed)
        else:
            raise ValueError("No hay API key para TTS")
    except Exception as e:
        print(f"Error con {provider} TTS: {e}")
        # Fallback
        if provider == "deepgram" and OPENAI_API_KEY:
            print("Fallback TTS a OpenAI...")
            return synthesize_speech_openai(text, voice, speed)
        elif provider == "openai" and DEEPGRAM_API_KEY:
            print("Fallback TTS a Deepgram...")
            return synthesize_speech_deepgram(text, voice)
        raise


def adapt_text_for_voice(text: str, channel: str = "voice") -> str:
    """
    Adapta el texto para voz natural - SIMPLIFICADO para evitar errores de pronunciación.
    """
    if channel != "voice":
        return text
    
    import re
    
    # PASO 1: Convertir SOLO precios grandes a formato simple (sin conversión compleja)
    # Deepgram maneja mejor números en formato simple que conversiones complejas
    
    # Convertir 320.000 → 320 mil
    text = re.sub(r'(\d+)\.000\b', r'\1 mil', text)
    
    # Convertir 1.500.000 → 1 millón 500 mil (si existe)
    text = re.sub(r'(\d+)\.(\d+)\.000\b', r'\1 millón \2 mil', text)
    
    # PASO 2: Conversiones MÍNIMAS de símbolos (solo lo esencial)
    replacements = {
        "¿": "",  # Eliminar signo de interrogación de apertura
        "?": ".",  # Convertir interrogación a punto
        "€": " euros",
        "m²": " metros cuadrados",
        "m2": " metros cuadrados",
        "%": " por ciento",
        "&": " y ",
    }
    
    result = text
    for symbol, replacement in replacements.items():
        result = result.replace(symbol, replacement)
    
    # DEBUG: Imprimir texto después de reemplazos
    print(f"[ADAPT TEXT] Texto después de replacements: '{result}'")
    
    # PASO 3: Limpiar emojis (pero NO eliminar acentos ni caracteres españoles)
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        u"\U0001F1E0-\U0001F1FF"
        "]+", flags=re.UNICODE)
    result = emoji_pattern.sub(' ', result)
    
    # PASO 4: Limpiar markdown MÍNIMO
    result = re.sub(r'\*\*(.*?)\*\*', r'\1', result)
    result = re.sub(r'\*(.*?)\*', r'\1', result)
    result = re.sub(r'[#`~_]', '', result)
    
    # PASO 5: Normalizar espacios
    result = re.sub(r'\s+', ' ', result)  # Un solo espacio
    result = result.strip()
    
    # PASO 6: Asegurar puntuación final
    if result and not result[-1] in '.?!':
        result = result + '.'
    
    # Verificar que no quedó vacío
    if not result or result.strip() == '':
        result = "Lo siento.  No pude procesar esa información."
    
    # DEBUG: Imprimir resultado final
    print(f"[ADAPT TEXT] Texto final adaptado: '{result}'")
    print(f"[ADAPT TEXT] Longitud final: {len(result)} caracteres")
    
    return result


# Voces disponibles para cada proveedor (ordenadas por calidad)
AVAILABLE_VOICES = {
    "deepgram": {
        "aura-asteria-es": "Asteria (Español, Femenina, Natural y Expresiva) ⭐ RECOMENDADA",
        "aura-luna-es": "Luna (Español, Femenina, Profesional)",
        "aura-orion-es": "Orion (Español, Masculina, Formal)",
        "aura-stella-en": "Stella (Inglés, Femenina, Amigable)",
        "aura-zeus-en": "Zeus (Inglés, Masculina, Profunda)"
    },
    "openai": {
        "nova": "Nova (Femenina cálida y natural) ⭐ RECOMENDADA",
        "alloy": "Alloy (Neutral, versátil)",
        "shimmer": "Shimmer (Femenina suave)",
        "echo": "Echo (Masculina, clara)",
        "fable": "Fable (Británica, distinguida)",
        "onyx": "Onyx (Masculina profunda y segura)"
    }
}


def get_available_voices() -> dict:
    """Retorna las voces disponibles del proveedor actual."""
    return AVAILABLE_VOICES.get(VOICE_PROVIDER.lower(), AVAILABLE_VOICES["openai"])
