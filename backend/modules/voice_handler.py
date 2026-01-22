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
    Adapta el texto para voz natural y completa.
    MEJORADO: Convierte números a palabras para perfecta pronunciación.
    """
    if channel != "voice":
        return text
    
    import re
    
    # PASO 1: Convertir números a palabras ANTES de cualquier otra cosa
    # Esto es CRUCIAL para buena pronunciación
    
    def numero_a_palabras(match):
        """Convierte números a palabras en español"""
        num = int(match.group(0).replace('.', '').replace(',', ''))
        
        if num == 0:
            return "cero"
        
        unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"]
        decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]
        especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"]
        centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"]
        
        if num < 10:
            return unidades[num]
        elif num < 20:
            return especiales[num - 10]
        elif num < 100:
            d = num // 10
            u = num % 10
            if u == 0:
                return decenas[d]
            elif d == 2:
                return "veinti" + unidades[u]
            else:
                return decenas[d] + (" y " + unidades[u] if u > 0 else "")
        elif num < 1000:
            c = num // 100
            resto = num % 100
            if num == 100:
                return "cien"
            result = centenas[c]
            if resto > 0:
                result += " " + numero_a_palabras(type('obj', (), {'group': lambda self, x: str(resto)})())
            return result
        elif num < 1000000:
            miles = num // 1000
            resto = num % 1000
            if miles == 1:
                result = "mil"
            else:
                result = numero_a_palabras(type('obj', (), {'group': lambda self, x: str(miles)})()) + " mil"
            if resto > 0:
                result += " " + numero_a_palabras(type('obj', (), {'group': lambda self, x: str(resto)})())
            return result
        else:
            return str(num)
    
    # Convertir precios comunes (ej: 200.000, 450.000, etc.)
    text = re.sub(r'(\d{1,3})\.(\d{3})', lambda m: numero_a_palabras(m), text)
    
    # Convertir números sueltos
    text = re.sub(r'\b(\d+)\b', lambda m: numero_a_palabras(m), text)
    
    # PASO 2: Conversiones de símbolos y unidades a palabras
    replacements = {
        "€": " euros",
        "$": " dólares",
        "m²": " metros cuadrados",
        "m2": " metros cuadrados",
        "%": " por ciento",
        "&": " y ",
        "@": " arroba ",
        "hab.": " habitaciones",
        "hab": " habitaciones",
        "nº": " número",
        "Nº": " número",
        "°": " grados",
        "+": " más",
        "km": " kilómetros",
        "cm": " centímetros",
    }
    
    result = text
    for symbol, replacement in replacements.items():
        result = result.replace(symbol, replacement)
    
    # PASO 3: Quitar emojis
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        u"\U0001F1E0-\U0001F1FF"
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001f926-\U0001f937"
        u"\U00010000-\U0010ffff"
        "]+", flags=re.UNICODE)
    result = emoji_pattern.sub(' ', result)
    
    # PASO 4: Limpiar markdown
    result = re.sub(r'\*\*(.*?)\*\*', r'\1', result)
    result = re.sub(r'\*(.*?)\*', r'\1', result)
    result = re.sub(r'__(.*?)__', r'\1', result)
    result = re.sub(r'~~(.*?)~~', r'\1', result)
    result = re.sub(r'[━─═]+', '. ', result)
    result = re.sub(r'-{3,}', '. ', result)
    result = re.sub(r'https?://\S+', ' el sitio web ', result)
    result = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', result)
    result = re.sub(r'[#`~_]', '', result)
    
    # PASO 5: AÑADIR PAUSAS para mejor pronunciación
    # Reemplazar comas con pausas más largas
    result = re.sub(r',', ', ', result)  # Doble espacio después de coma
    
    # PASO 6: Mejorar puntuación
    result = re.sub(r'\n+', '.  ', result)  # Doble espacio para pausas
    result = re.sub(r'\r', '', result)
    result = re.sub(r'\s*\.\s*', '.  ', result)  # Doble espacio después de punto
    result = re.sub(r'\s*;\s*', ';  ', result)
    result = re.sub(r'\s*:\s*', ':  ', result)
    result = re.sub(r'\s*\?\s*', '?  ', result)
    result = re.sub(r'\s*!\s*', '!  ', result)
    
    # Eliminar múltiples signos
    result = re.sub(r'\.{2,}', '.', result)
    result = re.sub(r'\?{2,}', '?', result)
    result = re.sub(r'!{2,}', '!', result)
    
    # Eliminar caracteres problemáticos
    result = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]', '', result)
    
    # PASO 7: Normalizar espacios pero MANTENER dobles espacios para pausas
    result = re.sub(r' {3,}', '  ', result)  # Máximo 2 espacios
    
    # PASO 8: Corte inteligente - MÁS CORTO para respuestas rápidas
    if len(result) > 500:
        cut_point = result[:450].rfind('.')
        if cut_point > 250:
            result = result[:cut_point + 1]
        elif len(result) > 600:
            cut_point = result[:450].rfind(' ')
            if cut_point > 250:
                result = result[:cut_point] + "."
    
    # Limpiar y asegurar puntuación final
    result = result.strip()
    if result and not result[-1] in '.?!:':
        result = result + '.'
    
    # Verificar que no quedó vacío
    if not result or result.strip() == '':
        result = "Lo siento.  No pude procesar esa información."
    
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
