# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Argumento para la URL del API (se puede pasar desde Dokploy)
ARG VITE_API_URL=https://api-chat-demo.ecosdelseo.com
ENV VITE_API_URL=$VITE_API_URL

# Build - mostrar la URL que se está usando
RUN echo "Building with VITE_API_URL=$VITE_API_URL" && npm run build

# Production stage
FROM nginx:alpine

# Copiar build a nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de nginx para SPA
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
