# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package files para cache
COPY frontend/package.json frontend/package-lock.json ./

# Instalar dependencias
RUN npm ci --only=production=false

# Copiar todo el código fuente del frontend
COPY frontend/ ./

# Argumento para la URL del API
ARG VITE_API_URL=https://api-chat-demo.ecosdelseo.com
ENV VITE_API_URL=$VITE_API_URL

# Build con información
RUN echo "=== Building Frontend ===" && \
    echo "VITE_API_URL: $VITE_API_URL" && \
    npm run build && \
    echo "=== Build Complete ===" && \
    ls -la dist/

# Production stage
FROM nginx:alpine

# Copiar build a nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de nginx para SPA
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Verificar archivos copiados
RUN ls -la /usr/share/nginx/html/ && \
    ls -la /usr/share/nginx/html/assets/ || echo "No assets folder"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
