import os
from dotenv import load_dotenv

load_dotenv()

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Telegram Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Server Configuration
PORT = int(os.getenv("PORT", 8000))

# File paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PROPERTIES_FILE = os.path.join(DATA_DIR, "properties.json")
LEADS_FILE = os.path.join(DATA_DIR, "leads.json")
