# Instrucciones de Despliegue - ChatBotDemo

## Problema Común: Página Rota en Producción

### Causas Principales:
1. Variable `VITE_API_URL` no configurada
2. Rutas de assets incorrectas
3. Configuración de CORS en el backend

## Solución

### 1. Configurar Variables de Entorno

Edita `frontend/.env.production` con la URL real de tu servidor:

```bash
VITE_API_URL=http://tu-servidor-ip:8000
# O si usas dominio:
# VITE_API_URL=https://api.tu-dominio.com
```

### 2. Rebuild con las Variables Correctas

#### Opción A: Docker Compose
```yaml
services:
  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: http://tu-servidor:8000
    ports:
      - "80:80"
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
```

#### Opción B: Docker Build Manual
```bash
# Frontend
cd frontend
docker build --build-arg VITE_API_URL=http://tu-servidor:8000 -t chatbot-frontend .
docker run -p 80:80 chatbot-frontend

# Backend
cd backend
docker build -t chatbot-backend .
docker run -p 8000:8000 chatbot-backend
```

#### Opción C: Sin Docker
```bash
# Frontend
cd frontend
npm install
npm run build
# Los archivos estarán en dist/

# Backend
cd backend
pip install -r requirements.txt
python main.py
```

### 3. Verificar CORS en Backend

Asegúrate que `backend/main.py` tenga configurado el origen correcto:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción: ["http://tu-dominio.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Pruebas

#### Verificar que el frontend carga:
```bash
curl http://tu-servidor
```

#### Verificar que el backend responde:
```bash
curl http://tu-servidor:8000/api/properties
```

#### Ver logs del contenedor:
```bash
docker logs <container-id>
```

## Variables de Entorno Necesarias

### Frontend (.env.production):
- `VITE_API_URL` - URL del backend

### Backend (.env):
- `OPENAI_API_KEY` - Tu API key de OpenAI
- `DEEPGRAM_API_KEY` - Tu API key de Deepgram
- `TELEGRAM_BOT_TOKEN` - Token de tu bot de Telegram (opcional)

## Checklist de Despliegue

- [ ] Configurar `VITE_API_URL` con la IP/dominio real del servidor
- [ ] Rebuild del frontend con `npm run build`
- [ ] Configurar CORS en el backend
- [ ] Verificar que puertos 80 (frontend) y 8000 (backend) estén abiertos
- [ ] Verificar que las variables de entorno del backend estén configuradas
- [ ] Probar la conexión desde el navegador

## Troubleshooting

### Error: "Network Error" o "Failed to fetch"
- Verificar que `VITE_API_URL` esté correcta
- Verificar que el backend esté corriendo
- Verificar configuración de CORS

### CSS/JS no cargan
- Verificar que `base: './'` esté en `vite.config.js`
- Rebuild con `npm run build`

### Página en blanco
- Verificar consola del navegador (F12)
- Verificar que nginx esté sirviendo desde `/usr/share/nginx/html`
