# Dockerfile para Backend de InmoBot
# Este archivo está en la raíz para compatibilidad con Dokploy

FROM python:3.11-slim

WORKDIR /app

# Copiar requirements primero para aprovechar cache de Docker
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY backend/ .

# Crear directorio de datos
RUN mkdir -p data

# Exponer puerto
EXPOSE 8000

# Variables de entorno por defecto
ENV PORT=8000

# Comando para iniciar la aplicación
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
