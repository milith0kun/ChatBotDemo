"""
Módulo de manejo de voz para InmoBot
Usa OpenAI Whisper para transcripción y TTS para síntesis
"""
import os
import uuid
import tempfile
from openai import OpenAI
from config import OPENAI_API_KEY

# Inicializar cliente OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)

# Configuración de voz
VOICE_CONFIG = {
    "model": "tts-1",      # Modelo económico (no HD)
    "voice": "nova",        # Voz femenina cálida, profesional
    "speed": 1.0            # Velocidad normal
}

# Directorio temporal para archivos de audio
TEMP_DIR = tempfile.gettempdir()


async def transcribe_audio(audio_file) -> str:
    """
    Transcribe un archivo de audio a texto usando Whisper.
    
    Args:
        audio_file: Archivo de audio (UploadFile de FastAPI)
    
    Returns:
        str: Texto transcrito
    """
    temp_filename = f"voice_{uuid.uuid4()}.webm"
    temp_path = os.path.join(TEMP_DIR, temp_filename)
    
    try:
        # Guardar archivo temporal
        content = await audio_file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Transcribir con Whisper
        with open(temp_path, "rb") as audio:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio,
                language="es"  # Español
            )
        
        return transcript.text
        
    finally:
        # Limpiar archivo temporal
        if os.path.exists(temp_path):
            os.remove(temp_path)


def synthesize_speech(text: str, voice: str = None, speed: float = None) -> bytes:
    """
    Sintetiza texto a audio usando OpenAI TTS.
    
    Args:
        text: Texto a convertir en audio
        voice: Voz a usar (opcional, default: nova)
        speed: Velocidad del audio (opcional, default: 1.0)
    
    Returns:
        bytes: Audio MP3 en bytes
    """
    response = client.audio.speech.create(
        model=VOICE_CONFIG["model"],
        voice=voice or VOICE_CONFIG["voice"],
        input=text,
        speed=speed or VOICE_CONFIG["speed"]
    )
    
    # Obtener el audio como bytes
    audio_content = response.content
    
    return audio_content


def adapt_text_for_voice(text: str, channel: str = "voice") -> str:
    """
    Adapta el texto para que suene más natural cuando se lea en voz alta.
    Convierte símbolos, números y formatos a texto hablado.
    
    Args:
        text: Texto original
        channel: Canal de origen
    
    Returns:
        str: Texto adaptado para voz
    """
    if channel != "voice":
        return text
    
    # Reemplazos básicos para mejor pronunciación
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
    }
    
    result = text
    for symbol, replacement in replacements.items():
        result = result.replace(symbol, replacement)
    
    return result
