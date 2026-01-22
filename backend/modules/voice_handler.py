"""
Módulo de manejo de voz para InmoBot
Soporta Deepgram (económico) y OpenAI como fallback
Deepgram: $200 créditos gratis, $0.0077/min STT, $0.015/1000 chars TTS
OpenAI: $0.006/min Whisper, ~$0.015/1000 chars TTS
"""
import os
import uuid
import tempfile
import httpx
from openai import OpenAI
from config import OPENAI_API_KEY, DEEPGRAM_API_KEY, VOICE_PROVIDER

# Inicializar cliente OpenAI
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Configuración de voz - OPTIMIZADO PARA VELOCIDAD Y LATENCIA
VOICE_CONFIG = {
    "openai": {
        "model": "tts-1",  # Más rápido (tts-1-hd es lento)
        "voice": "nova",  # Mejor voz en español
        "speed": 1.0  # Velocidad normal para audio natural (reducido de 1.15)
    },
    "deepgram": {
        "stt_model": "nova-2",  # Modelo STT más rápido de Deepgram
        "tts_model": "aura-asteria-es",  # Voz femenina en ESPAÑOL
        "encoding": "mp3",
        "sample_rate": 24000  # Balance entre calidad y velocidad
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
            "punctuate": "true"
        }
        
        async with httpx.AsyncClient() as client:
            with open(temp_path, "rb") as audio:
                response = await client.post(
                    DEEPGRAM_STT_URL,
                    headers=headers,
                    params=params,
                    content=audio.read(),
                    timeout=30.0
                )
        
        if response.status_code == 200:
            result = response.json()
            transcript = result.get("results", {}).get("channels", [{}])[0]
            alternatives = transcript.get("alternatives", [{}])
            return alternatives[0].get("transcript", "")
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
        
        return transcript.text
        
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
    """
    if not DEEPGRAM_API_KEY:
        raise ValueError("DEEPGRAM_API_KEY no configurada")
    
    # Usar mejor modelo TTS
    model = voice or VOICE_CONFIG["deepgram"]["tts_model"]
    
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Deepgram TTS endpoint con mejor modelo
    url = f"{DEEPGRAM_TTS_URL}?model={model}"
    
    with httpx.Client() as client:
        response = client.post(
            url,
            headers=headers,
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
    """
    response = openai_client.audio.speech.create(
        model=VOICE_CONFIG["openai"]["model"],
        voice=voice or VOICE_CONFIG["openai"]["voice"],
        input=text,
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
    Adapta el texto para voz natural.
    Convierte símbolos y formatos a texto hablado.
    LIMITA A 500 CARACTERES para respuesta rápida.
    """
    if channel != "voice":
        return text
    
    import re
    
    # Quitar emojis y caracteres especiales
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001f926-\U0001f937"
        u"\U00010000-\U0010ffff"
        "]+", flags=re.UNICODE)
    text = emoji_pattern.sub('', text)
    
    # Quitar markdown
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # **bold**
    text = re.sub(r'━+', '', text)  # líneas
    text = re.sub(r'\n+', ' ', text)  # saltos de línea
    
    replacements = {
        "€": " euros",
        "$": " dólares",
        "m²": " metros cuadrados",
        "m2": " metros cuadrados",
        "hab.": " habitaciones",
        "dorm.": " dormitorios",
        "baño.": " baños",
        "%": " por ciento",
        "&": " y ",
        "@": " arroba ",
        "1.": "primero,",
        "2.": "segundo,",
        "3.": "tercero,",
        "4.": "cuarto,",
        "5.": "quinto,",
    }
    
    result = text
    for symbol, replacement in replacements.items():
        result = result.replace(symbol, replacement)
    
    # LIMITAR A 500 CARACTERES para respuesta rápida
    if len(result) > 500:
        result = result[:500] + "... Para más detalles, pregúntame."
    
    return result.strip()


# Voces disponibles para cada proveedor
AVAILABLE_VOICES = {
    "deepgram": {
        "aura-asteria-es": "Asteria (Español, Femenina)",
        "aura-luna-es": "Luna (Español, Femenina)",
        "aura-orion-es": "Orion (Español, Masculina)",
        "aura-stella-en": "Stella (Inglés, Femenina)",
        "aura-zeus-en": "Zeus (Inglés, Masculina)"
    },
    "openai": {
        "alloy": "Alloy (Neutral)",
        "echo": "Echo (Masculina)",
        "fable": "Fable (Británica)",
        "onyx": "Onyx (Masculina profunda)",
        "nova": "Nova (Femenina cálida)",
        "shimmer": "Shimmer (Femenina suave)"
    }
}


def get_available_voices() -> dict:
    """Retorna las voces disponibles del proveedor actual."""
    return AVAILABLE_VOICES.get(VOICE_PROVIDER.lower(), AVAILABLE_VOICES["openai"])
