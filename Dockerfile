# Dockerfile para Backend de InmoBot
# Este archivo está en la raíz para compatibilidad con Dokploy

FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema (ffmpeg es util para audio)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero para aprovechar cache de Docker
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY backend/ .

# Crear directorio de datos y ajustar permisos
RUN mkdir -p data && chmod 777 data

# Exponer puerto
EXPOSE 8000

# Variables de entorno por defecto
ENV PORT=8000

# Comando para iniciar la aplicación usando shell para expandir variable PORT
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
