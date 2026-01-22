#!/bin/bash

# Script de Despliegue para ChatBotDemo
# Uso: ./deploy.sh

echo "🚀 Iniciando despliegue de ChatBotDemo..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

# 1. Pull de los últimos cambios
echo -e "${YELLOW}📥 Obteniendo últimos cambios de GitHub...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al hacer pull de GitHub${NC}"
    exit 1
fi

# 2. Backend
echo -e "${YELLOW}🐍 Desplegando Backend...${NC}"
cd backend

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: Falta archivo backend/.env${NC}"
    echo "Crea el archivo con:"
    echo "  OPENAI_API_KEY=tu_api_key"
    echo "  DEEPGRAM_API_KEY=tu_api_key"
    echo "  TELEGRAM_BOT_TOKEN=tu_token"
    echo "  FRONTEND_URL=https://chat-demo-web.ecosdelseo.com"
    echo "  PORT=8000"
    exit 1
fi

# Instalar dependencias
pip install -r requirements.txt

# Reiniciar servicio backend (ajusta según tu configuración)
if command -v systemctl &> /dev/null; then
    sudo systemctl restart chatbot-backend
    echo -e "${GREEN}✅ Backend reiniciado con systemctl${NC}"
elif command -v pm2 &> /dev/null; then
    pm2 restart chatbot-backend
    echo -e "${GREEN}✅ Backend reiniciado con PM2${NC}"
else
    echo -e "${YELLOW}⚠️  Reinicia el backend manualmente${NC}"
fi

cd ..

# 3. Frontend
echo -e "${YELLOW}🎨 Desplegando Frontend...${NC}"
cd frontend

# Verificar archivo .env.production
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: Falta archivo frontend/.env.production${NC}"
    echo "Crea el archivo con:"
    echo "  VITE_API_URL=https://api-chat-demo.ecosdelseo.com"
    exit 1
fi

# Instalar dependencias
npm install

# Build
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al hacer build del frontend${NC}"
    exit 1
fi

# Copiar archivos al servidor web
if [ -d "/var/www/chatbot" ]; then
    echo -e "${YELLOW}📦 Copiando archivos a /var/www/chatbot...${NC}"
    sudo rm -rf /var/www/chatbot/*
    sudo cp -r dist/* /var/www/chatbot/
    sudo chown -R www-data:www-data /var/www/chatbot
    echo -e "${GREEN}✅ Frontend desplegado en /var/www/chatbot${NC}"
elif [ -d "/usr/share/nginx/html" ]; then
    echo -e "${YELLOW}📦 Copiando archivos a /usr/share/nginx/html...${NC}"
    sudo rm -rf /usr/share/nginx/html/*
    sudo cp -r dist/* /usr/share/nginx/html/
    echo -e "${GREEN}✅ Frontend desplegado en nginx${NC}"
else
    echo -e "${YELLOW}⚠️  Directorio de web server no encontrado${NC}"
    echo "Copia manualmente la carpeta dist/ a tu servidor web"
fi

# Reiniciar nginx si está disponible
if command -v systemctl &> /dev/null; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx recargado${NC}"
fi

cd ..

# 4. Verificar servicios
echo -e "${YELLOW}🔍 Verificando servicios...${NC}"

# Verificar backend
if curl -s https://api-chat-demo.ecosdelseo.com/api/properties > /dev/null; then
    echo -e "${GREEN}✅ Backend responde correctamente${NC}"
else
    echo -e "${RED}⚠️  Backend no responde${NC}"
fi

# Verificar frontend
if curl -s https://chat-demo-web.ecosdelseo.com > /dev/null; then
    echo -e "${GREEN}✅ Frontend responde correctamente${NC}"
else
    echo -e "${RED}⚠️  Frontend no responde${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Despliegue completado!${NC}"
echo ""
echo "URLs:"
echo "  Frontend: https://chat-demo-web.ecosdelseo.com"
echo "  Backend:  https://api-chat-demo.ecosdelseo.com"
echo ""
echo "Para ver logs:"
echo "  Backend:  journalctl -u chatbot-backend -f"
echo "  Frontend: tail -f /var/log/nginx/access.log"
