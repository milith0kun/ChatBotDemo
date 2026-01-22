# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copiar solo package files primero para cache de dependencias
COPY frontend/package.json frontend/package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar solo archivos necesarios del frontend
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/index.html ./
COPY frontend/vite.config.js ./

# Argumento para la URL del API
ARG VITE_API_URL=https://api-chat-demo.ecosdelseo.com
ENV VITE_API_URL=$VITE_API_URL

# Build
RUN echo "Building with VITE_API_URL=$VITE_API_URL" && npm run build

# Production stage
FROM nginx:alpine

# Copiar build a nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de nginx para SPA
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
