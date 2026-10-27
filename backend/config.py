import os
from dotenv import load_dotenv

# Cargar variables de entorno (busca en backend/ y en la raíz del proyecto)
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.dirname(_backend_dir)
for _env_file in [
    os.path.join(_backend_dir, ".env"),
    os.path.join(_backend_dir, ".env.local"),
    os.path.join(_root_dir, ".env.local"),
    os.path.join(_root_dir, ".env")
]:
    if os.path.exists(_env_file):
        load_dotenv(_env_file)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Deepgram Configuration (API más económica para voz)
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")

# Seleccionar proveedor de voz (deepgram es más barato)
VOICE_PROVIDER = os.getenv("VOICE_PROVIDER", "deepgram")  # "deepgram" o "openai"

# Telegram Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

# Evolution API (WhatsApp) Configuration
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "https://cgbacademyti-evolutionapi-b4df35-72-60-114-137.sslip.io").rstrip("/")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "738D584F644E-4B09-97EF-F25CDC95596E")
EVOLUTION_INSTANCE_NAME = os.getenv("EVOLUTION_INSTANCE_NAME", "Edmil Jampier Saire Bustamante")

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Server Configuration
PORT = int(os.getenv("PORT", 8000))

# File paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PROPERTIES_FILE = os.path.join(DATA_DIR, "properties.json")
LEADS_FILE = os.path.join(DATA_DIR, "leads.json")
