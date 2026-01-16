# ESPECIFICACIÓN COMPLETA - DEMO AGENTE INMOBILIARIO CON IA
## SISTEMA OMNICANAL: TELEGRAM + WEB CHAT

## CONTEXTO DEL PROYECTO

Estamos construyendo una DEMO FUNCIONAL para demostrar capacidad técnica en desarrollo de agentes conversacionales con IA para el sector inmobiliario. Esta demo debe ser profesional, funcional y es


## OBJETIVO DE LA DEMO

Crear un sistema omnicanal funcional donde un cliente potencial pueda:

1. Chatear con un agente de IA inmobiliario por TELEGRAM o por WEB
2. El agente cualifica al cliente de forma natural (no formularios)
3. El agente recomienda propiedades según las necesidades
4. El sistema captura y clasifica automáticamente los leads
5. Un dashboard muestra todos los leads capturados de AMBOS canales

---

## ALCANCE DE LA DEMO

### LO QUE SÍ INCLUYE:
- Bot de Telegram funcional
- Chat web funcional con interfaz profesional en React
- Backend único que procesa ambos canales
- Agente de IA conversacional que cualifica leads
- Base de conocimiento de 5 propiedades inmobiliarias
- Sistema de clasificación automática de leads (frío, tibio, caliente)
- Dashboard web para visualizar leads de ambos canales
- Deploy en producción accesible por URL y link de Telegram

### LO QUE NO INCLUYE (queda para MVP completo):
- WhatsApp (solo Telegram y Web por ahora)
- Sistema de llamadas con Voice AI
- Base de datos compleja (MongoDB/Redis)
- Sistema de agendado automático
- Múltiples idiomas

---

## ARQUITECTURA TÉCNICA

### STACK TECNOLÓGICO

**Canales de entrada:**
- Bot de Telegram (usando Telegram Bot API)
- Chat Web (React con Vite)

**Backend unificado:**
- Framework: FastAPI (Python 3.11)
- IA: OpenAI GPT-4 Turbo
- Almacenamiento: Archivos JSON (simple para demo)
- CORS: Configurado para permitir comunicación frontend-backend

**Frontend:**
- Framework: React 18 con Vite
- Estilos: Tailwind CSS
- HTTP Client: Axios
- Routing: React Router DOM

**Deployment:**
- Backend: Railway o Render (maneja Telegram webhook + API REST)
- Frontend: Vercel, Netlify o Railway
- Bot de Telegram: Configurado con webhook apuntando al backend

---

## ESTRUCTURA DEL PROYECTO

El proyecto debe organizarse como monorepo con dos carpetas principales:

### Carpeta backend/
Contiene toda la lógica del servidor FastAPI:
- Archivo principal de la aplicación FastAPI
- Archivo de dependencias Python
- Archivo de variables de entorno
- Archivo de configuración para deploy (Procfile, runtime.txt)
- Carpeta data/ con archivos JSON para propiedades y leads
- Módulo de integración con Telegram Bot API
- Módulo de integración con OpenAI
- Lógica compartida de procesamiento de IA

### Carpeta frontend/
Contiene la aplicación React:
- Configuración de Vite y React
- Configuración de Tailwind CSS
- Archivo de dependencias npm
- Carpeta src/ con componentes React
- Carpeta de servicios para llamadas API
- Estilos CSS

---

## FUNCIONALIDADES DEL BACKEND

### Endpoints de la API:

**1. Endpoint raíz (GET /)**
Retorna estado de la API, confirma que está funcionando

**2. Endpoint de chat web (POST /api/chat)**
Recibe:
- Mensaje del usuario desde web
- ID de sesión (para mantener contexto)

Procesa:
- Envía mensaje a OpenAI GPT-4
- Usa function calling para extraer información del lead
- Busca propiedades relevantes en base de datos
- Guarda información del lead si se captura con channel="web"

Retorna:
- Respuesta del agente
- Información del lead extraída (si hay)
- Lista de propiedades recomendadas (si aplica)

**3. Endpoint webhook de Telegram (POST /webhook/telegram)**
Recibe:
- Mensaje del usuario desde Telegram Bot API
- Información del chat de Telegram (chat_id, username)

Procesa:
- Extrae mensaje del objeto de Telegram
- Usa LA MISMA función de procesamiento de IA que el chat web
- Guarda información del lead si se captura con channel="telegram"
- Envía respuesta de vuelta a Telegram usando sendMessage API

**4. Endpoint de leads (GET /api/leads)**
Retorna lista completa de todos los leads capturados de ambos canales (Telegram y Web) con su información y clasificación

**5. Endpoint de propiedades (GET /api/properties)**
Retorna lista de todas las propiedades disponibles en la base de datos

**6. Endpoint de salud (GET /api/health)**
Confirma que el servidor está funcionando correctamente

### Integración con Telegram Bot API:

**Setup del bot:**
- Crear bot con @BotFather en Telegram
- Obtener token del bot
- Configurar webhook apuntando a: https://tu-backend.com/webhook/telegram

**Recepción de mensajes:**
- Telegram envía POST a /webhook/telegram cuando usuario escribe
- Payload incluye: message text, chat_id, username, first_name

**Envío de respuestas:**
- Backend llama a Telegram Bot API: sendMessage
- URL: https://api.telegram.org/bot{TOKEN}/sendMessage
- Parámetros: chat_id, text, parse_mode (para formato)

**Formato de mensajes:**
- Telegram soporta Markdown para formato
- Usar emojis y formato para mostrar propiedades de forma atractiva

### Configuración CORS:
Debe permitir peticiones desde:
- localhost:5173 (desarrollo frontend)
- localhost:3000 (alternativa)
- Dominio de producción del frontend

---

## LÓGICA DEL AGENTE DE IA (COMPARTIDA PARA AMBOS CANALES)

### System Prompt del agente:

El agente se llama "InmoBot" y actúa como un asesor inmobiliario profesional.

Eres un asistente inmobiliario experto. Tu trabajo es ayudar a los clientes a encontrar la propiedad ideal mediante conversación natural.

**Tus responsabilidades:**

1. Cualificar leads de forma conversacional (no usar formularios)
2. Extraer información clave del cliente:
   - Presupuesto mínimo y máximo
   - Zona o zonas de interés
   - Tipo de propiedad (casa, departamento, terreno)
   - Número de habitaciones necesarias
   - Nivel de urgencia (inmediato, 1-3 meses, 3-6 meses, solo explorando)
   - Datos de contacto (nombre, teléfono, email)

3. Recomendar propiedades relevantes según necesidades
4. Clasificar al cliente por temperatura:
   - FRÍO: Solo está explorando, sin urgencia ni compromiso
   - TIBIO: Interesado pero sin urgencia inmediata
   - CALIENTE: Listo para ver propiedades o comprar pronto

**Estilo de comunicación:**
- Amigable y profesional
- Hacer UNA pregunta a la vez
- No presionar ni ser insistente
- Responder preguntas sobre propiedades específicas
- Siempre ofrecer agendar visita o hablar con asesor al final

**Adaptación por canal:**
- En Telegram: Puedes usar emojis y ser más casual
- En Web: Mantener tono profesional pero amigable

### Function Calling (herramientas del agente):

**Herramienta 1: Buscar propiedades**
Permite al agente buscar en la base de datos según criterios:
- Zona
- Tipo de propiedad
- Presupuesto máximo
- Número de habitaciones

**Herramienta 2: Guardar información del lead**
Permite guardar automáticamente cuando se captura:
- Nombre
- Teléfono
- Email
- Presupuesto mínimo y máximo
- Zona de interés
- Tipo de propiedad
- Habitaciones
- Urgencia
- Temperatura (frío/tibio/caliente)
- Canal de origen (telegram o web)

---

## SISTEMA DE CLASIFICACIÓN DE LEADS

### Score automático (0-100 puntos):

El sistema asigna puntos según información capturada:
- Dio nombre completo: +30 puntos
- Dio teléfono: +30 puntos
- Dio email: +10 puntos
- Definió presupuesto: +15 puntos
- Definió zona: +10 puntos
- Definió tipo y habitaciones: +10 puntos
- Preguntó por propiedad específica: +10 puntos
- Quiere agendar visita: +20 puntos

### Temperatura según score:
- FRÍO: 0-40 puntos
- TIBIO: 41-70 puntos
- CALIENTE: 71-100 puntos

---

## ESTRUCTURA DE DATOS

### Formato de Lead:
Cada lead capturado debe almacenarse con:
- ID único generado automáticamente
- Timestamp de cuando se capturó
- Canal de origen: "telegram" o "web"
- Username de Telegram (si vino de Telegram)
- Nombre completo
- Teléfono
- Email
- Presupuesto mínimo
- Presupuesto máximo
- Zona o zonas de interés
- Tipo de propiedad buscada
- Número de habitaciones
- Nivel de urgencia
- Estado (nuevo, calificado, contactado)
- Temperatura (frío, tibio, caliente)
- Score numérico (0-100)
- Historial completo de conversación (mensajes del usuario y bot)

### Formato de Propiedad:
Cada propiedad tiene:
- ID único
- Título descriptivo
- Tipo (casa, departamento, oficina, terreno)
- Zona o distrito
- Precio en dólares
- Número de habitaciones
- Número de baños
- Área en metros cuadrados
- Descripción detallada
- Lista de características especiales (estacionamiento, gimnasio, etc)

---

## BASE DE DATOS DE PROPIEDADES

Crear 5 propiedades de ejemplo variadas:

**Propiedad 1:**
- Departamento moderno en San Isidro
- 3 habitaciones, 2 baños
- 120 m²
- Precio: $250,000
- Características: estacionamiento, gimnasio, piscina, seguridad 24/7
- Para clase media-alta

**Propiedad 2:**
- Casa en Miraflores
- 4 habitaciones, 3 baños
- 200 m²
- Precio: $450,000
- Características: jardín, terraza, estacionamiento doble, cerca al malecón
- Para familias con presupuesto alto

**Propiedad 3:**
- Departamento compacto en Santiago de Surco
- 2 habitaciones, 2 baños
- 85 m²
- Precio: $180,000
- Características: estacionamiento, área de lavandería
- Para jóvenes profesionales o parejas

**Propiedad 4:**
- Penthouse en San Borja
- 3 habitaciones, 3 baños
- 150 m²
- Precio: $380,000
- Características: terraza privada, jacuzzi, 2 estacionamientos, gimnasio
- Lujo, último piso

**Propiedad 5:**
- Departamento familiar en La Molina
- 3 habitaciones, 2 baños
- 110 m²
- Precio: $220,000
- Características: estacionamiento, área de niños, seguridad
- Zona residencial tranquila

---

## CANAL TELEGRAM - BOT

### Configuración del Bot:

**Creación:**
1. Abrir Telegram y buscar @BotFather
2. Enviar comando /newbot
3. Elegir nombre del bot (ejemplo: InmoBot Demo)
4. Elegir username del bot (ejemplo: @inmobot_demo_bot)
5. BotFather da el token del bot

**Webhook:**
1. Configurar webhook con comando cURL o desde código backend
2. URL del webhook: https://tu-backend.railway.app/webhook/telegram
3. Telegram enviará todos los mensajes a este endpoint

### Flujo de mensajes en Telegram:

**Usuario escribe mensaje:**
1. Usuario abre t.me/inmobot_demo_bot
2. Envía mensaje: "Hola"
3. Telegram hace POST a /webhook/telegram

**Backend procesa:**
1. Extrae texto del mensaje y chat_id
2. Procesa con MISMA lógica de IA que web
3. Genera respuesta
4. Llama a sendMessage de Telegram API
5. Usuario recibe respuesta en Telegram

**Formato de propiedades en Telegram:**
Usar emojis y Markdown para formato atractivo:
```
📍 Departamento Moderno en San Isidro
💰 $250,000
🛏️ 3 habitaciones | 🚿 2 baños | 📐 120m²
✨ Acabados de lujo, vista al parque
🏢 Incluye: estacionamiento, gimnasio, piscina
```

---

## CANAL WEB - INTERFAZ REACT

### Página principal de Chat:

**Estructura visual:**
- Header fijo en la parte superior con:
  - Logo o nombre "InmoBot"
  - Subtítulo "Asistente Inmobiliario Inteligente"
  - Link al dashboard (esquina superior derecha)
  - Badge indicando "También disponible en Telegram"

- Área de mensajes (centro, scrolleable):
  - Fondo claro, profesional
  - Mensajes del usuario alineados a la derecha con fondo azul
  - Mensajes del bot alineados a la izquierda con fondo gris claro
  - Cada mensaje muestra hora
  - Scroll automático al último mensaje
  - Cuando el bot está escribiendo, mostrar indicador animado

- Footer fijo en la parte inferior con:
  - Input de texto para escribir mensaje
  - Botón de enviar (icono o texto)
  - Funciona con Enter o clic en botón

**Componentes React necesarios:**

Componente ChatInterface (principal):
- Maneja estado de mensajes
- Maneja estado del input
- Maneja estado de "está escribiendo"
- Hace llamadas a POST /api/chat del backend
- Renderiza lista de mensajes
- Auto-scroll cuando llegan nuevos mensajes

Componente Message:
- Recibe props: contenido, rol (user/bot), timestamp
- Renderiza mensaje con estilo según rol
- Si el mensaje del bot incluye propiedades, las muestra formateadas
- Formato especial para mostrar datos de propiedades (precio, habitaciones, etc)

**Responsividad:**
- Funciona perfecto en desktop (pantalla completa)
- Funciona perfecto en móvil (adaptado al ancho)
- No se rompe en tablets

**Estilo visual:**
- Moderno, limpio, profesional
- Colores corporativos: azul para usuario, gris para bot
- Bordes redondeados en mensajes
- Sombras sutiles
- Animaciones suaves al aparecer mensajes
- Tipografía clara y legible

---

## DASHBOARD WEB (OMNICANAL)

### Página de Dashboard:

**Estructura visual:**
- Header con:
  - Título "Dashboard de Leads Omnicanal"
  - Link para volver al chat
  - Fecha y hora actual

- Sección de estadísticas (cards en fila):
  - Card 1: Total de leads capturados
  - Card 2: Leads por Telegram (número y porcentaje)
  - Card 3: Leads por Web (número y porcentaje)
  - Card 4: Leads calientes total (número y porcentaje)

- Filtros (barra horizontal):
  - Filtro por canal (dropdown: Todos, Telegram, Web)
  - Filtro por temperatura (dropdown: Todos, Frío, Tibio, Caliente)
  - Búsqueda por nombre (input de texto)

- Tabla de leads:
  - Columnas: Canal, Nombre, Contacto, Presupuesto, Zona, Tipo, Habitaciones, Estado, Score, Temperatura, Fecha
  - Badge de canal:
    - Telegram: icono de Telegram azul
    - Web: icono de navegador verde
  - Badges de colores para temperatura:
    - Frío: badge gris
    - Tibio: badge amarillo/naranja
    - Caliente: badge rojo
  - Score mostrado como número con barra de progreso
  - Cada fila clickeable para ver detalle completo
  - Responsive: en móvil mostrar solo columnas esenciales

- Detalle de lead (modal o sección expandible):
  - Información completa del lead
  - Canal de origen destacado
  - Username de Telegram si aplica
  - Historial de conversación completo
  - Propiedades que le interesaron
  - Opción para marcar como contactado

**Componente React Dashboard:**
- Carga leads desde GET /api/leads al montar
- Maneja estado de filtros
- Filtra leads según selección (canal, temperatura, búsqueda)
- Renderiza estadísticas calculadas
- Renderiza tabla con datos filtrados
- Calcula métricas por canal

**Responsividad:**
- Desktop: tabla completa con todas las columnas
- Tablet: tabla con columnas principales
- Móvil: cards en lugar de tabla, mostrando info esencial

---

## FLUJO DE CONVERSACIÓN TÍPICO (IGUAL EN AMBOS CANALES)

### Ejemplo de interacción exitosa completa:

**Inicio:**
Usuario: "Hola"
Bot: "¡Hola! Soy InmoBot, tu asistente inmobiliario. Estoy aquí para ayudarte a encontrar la propiedad ideal. ¿Estás buscando casa o departamento?"

**Cualificación paso 1:**
Usuario: "Busco un departamento"
Bot: "Excelente elección. ¿En qué zona de Lima te gustaría vivir?"

**Cualificación paso 2:**
Usuario: "En San Isidro o Miraflores"
Bot: "Perfecto, ambas son zonas muy demandadas. ¿Cuál es tu presupuesto aproximado?"

**Cualificación paso 3:**
Usuario: "Entre 200 y 300 mil dólares"
Bot: "Entendido. ¿Cuántas habitaciones necesitas?"

**Cualificación paso 4:**
Usuario: "3 habitaciones"
Bot: "Genial. Déjame buscar las mejores opciones para ti..."

**Recomendación (formato según canal):**

En Telegram:
```
Bot: "Encontré esta propiedad perfecta para ti:

📍 Departamento Moderno en San Isidro
💰 $250,000
🛏️ 3 habitaciones | 🚿 2 baños | 📐 120m²
✨ Acabados de lujo, vista al parque
🏢 Incluye: estacionamiento, gimnasio, piscina, seguridad 24/7

¿Te gustaría conocer más detalles?"
```

En Web:
```
Bot: "Encontré esta propiedad que podría interesarte:

Departamento Moderno en San Isidro
Precio: $250,000
3 habitaciones | 2 baños | 120m²
Acabados de lujo, vista al parque
Incluye: estacionamiento, gimnasio, piscina, seguridad 24/7

¿Te gustaría conocer más detalles de esta propiedad?"
```

**Interés:**
Usuario: "Sí, me interesa. Quiero más información"
Bot: "¡Excelente! Este departamento está en una zona premium de San Isidro. Cuenta con acabados de primera calidad y todas las comodidades modernas. ¿Cuándo te gustaría agendar una visita?"

**Captura de datos:**
Usuario: "Esta semana estaría bien"
Bot: "Perfecto. Para coordinar la visita con nuestro asesor, necesito que me compartas tu nombre completo y número de teléfono."

**Cierre:**
Usuario: "Juan Pérez, mi teléfono es 987654321"
Bot: "Gracias Juan. He registrado tu interés en el departamento de San Isidro. Un asesor se contactará contigo en las próximas horas para coordinar la visita. ¿Hay algo más en lo que pueda ayudarte?"

**Sistema automático:**
- Guarda lead con channel="telegram" o channel="web"
- Clasifica como CALIENTE (score: 90)
- Aparece inmediatamente en dashboard

---

## CONFIGURACIÓN DE DEPLOYMENT

### Backend (Railway o Render):

**Variables de entorno necesarias:**
- OPENAI_API_KEY: API key de OpenAI
- TELEGRAM_BOT_TOKEN: Token del bot de Telegram
- FRONTEND_URL: URL del frontend en producción (para CORS)
- PORT: Puerto del servidor (auto-asignado por plataforma)

**Archivos necesarios para deploy:**
- Procfile: especifica comando para iniciar servidor
- runtime.txt: especifica versión de Python (3.11.7)
- requirements.txt: lista todas las dependencias Python incluyendo requests para Telegram API

**Proceso de deploy:**
1. Conectar repositorio de GitHub
2. Seleccionar carpeta backend/
3. Configurar variables de entorno
4. Deploy automático
5. Copiar URL del backend
6. Configurar webhook de Telegram apuntando a esa URL

**Configuración del webhook de Telegram:**
Después del deploy, ejecutar comando para configurar webhook:
```
curl -F "url=https://tu-backend.railway.app/webhook/telegram" https://api.telegram.org/bot{TOKEN}/setWebhook
```

### Frontend (Vercel o Netlify):

**Variables de entorno necesarias:**
- VITE_API_URL: URL del backend en producción

**Configuración de build:**
- Comando de build: npm run build
- Directorio de output: dist
- Directorio raíz: frontend/

**Proceso de deploy:**
1. Conectar repositorio de GitHub
2. Seleccionar carpeta frontend/
3. Configurar variables de entorno
4. Deploy automático

---

## TESTING DE LA DEMO

### Casos de prueba que deben funcionar:

**Test 1: Conversación completa por Telegram**
- Usuario abre bot en Telegram
- Bot responde y pregunta qué busca
- Usuario define necesidades paso a paso
- Bot recomienda propiedad con formato Telegram
- Usuario da datos de contacto
- Lead se guarda con channel="telegram"
- Aparece en dashboard con badge de Telegram

**Test 2: Conversación completa por Web**
- Usuario abre chat web
- Misma conversación que Telegram
- Lead se guarda con channel="web"
- Aparece en dashboard con badge de Web

**Test 3: Dashboard omnicanal**
- Muestra leads de ambos canales
- Filtro por canal funciona (Todos, Telegram, Web)
- Estadísticas muestran totales por canal
- Se puede ver detalle de cada lead

**Test 4: Usuario explorando (lead frío)**
- Usuario hace preguntas generales en cualquier canal
- No da datos de contacto
- Bot responde profesionalmente
- Si se guarda, se clasifica como FRÍO

**Test 5: Búsqueda de propiedad específica**
- Usuario pregunta por zona específica en cualquier canal
- Bot busca y muestra propiedades de esa zona
- Información mostrada correctamente en ambos formatos

---

## PRESENTACIÓN AL CLIENTE

### Qué mostrar en la demo:

**1. Bot de Telegram (3 minutos):**
- Compartir link del bot: t.me/nombre_del_bot
- Hacer conversación completa desde cero en Telegram
- Demostrar cualificación natural
- Mostrar recomendación de propiedades con formato
- Capturar lead completo

**2. Chat Web (3 minutos):**
- Abrir la URL del chat web
- Hacer otra conversación (puede ser más breve)
- Mostrar que la interfaz es profesional
- Capturar otro lead

**3. Dashboard Omnicanal (4 minutos):**
- Mostrar ambos leads capturados
- Destacar que vienen de diferentes canales
- Explicar clasificación automática
- Mostrar filtros funcionando (por canal, por temperatura)
- Ver detalle de un lead con historial completo

**4. Arquitectura (2 minutos):**
- Explicar brevemente que es UN SOLO backend procesando ambos
- Mencionar que es 100% código propio
- Explicar escalabilidad hacia MVP completo con WhatsApp

### Script de presentación:

"Les preparé una demo que va más allá de lo solicitado. No solo hice un chat web, construí un sistema omnicanal desde el inicio.

**[Abres Telegram en tu celular]**
Aquí está el bot funcionando en Telegram. Como ven, el agente conversa de forma completamente natural, no usa formularios.

**[Haces una conversación rápida]**
Mientras hablamos, el sistema está extrayendo automáticamente toda la información: presupuesto, zona, tipo de propiedad. El agente busca en la base de datos y recomienda propiedades relevantes.

**[Abres el chat web]**
Y aquí está la misma inteligencia funcionando en web. Interfaz profesional, responsive, moderna.

**[Haces otra conversación breve]**

**[Abres dashboard]**
Ahora lo importante: todo se centraliza aquí. Ven estos dos leads, uno vino de Telegram y otro de Web. El sistema los procesa igual, los clasifica automáticamente por temperatura, y los presenta unificados.

Pueden filtrar por canal, ver el historial completo de cada conversación, revisar qué propiedades le interesaron.

**[Destacas lo técnico]**
Esto demuestra arquitectura omnicanal real desde la demo. Es UN SOLO backend procesando ambos canales. La lógica de IA es exactamente la misma.

Para el MVP completo de 2 semanas, esto se convierte en:
- WhatsApp integrado (solo otro adaptador más)
- Base de datos MongoDB real
- Sistema de sesiones con Redis
- Deploy en AWS con arquitectura escalable
- Todo documentado y 100% de su propiedad

¿Tienen alguna pregunta sobre la demo?"

---

## CRITERIOS DE ÉXITO

La demo será exitosa si demuestra:

✅ Bot de Telegram funcional y profesional
✅ Chat web con interfaz moderna en React
✅ Conversación natural y fluida con IA en ambos canales
✅ Extracción correcta de información del lead
✅ Búsqueda y recomendación inteligente de propiedades
✅ Clasificación automática precisa (frío/tibio/caliente)
✅ Dashboard omnicanal mostrando leads de ambos canales
✅ Filtros por canal funcionando correctamente
✅ Interfaz responsive
✅ Deploy en producción funcionando
✅ Todo el sistema es propiedad del cliente (sin lock-in)
✅ Arquitectura omnicanal demostrada

---

## TIEMPO ESTIMADO DE DESARROLLO

**Backend común (FastAPI + OpenAI):** 3-4 horas
- Setup proyecto y configuración
- Lógica de procesamiento de IA compartida
- Sistema de guardado de leads
- Endpoints de API

**Adaptador Telegram:** 1-2 horas
- Configuración del bot
- Webhook endpoint
- Integración con Telegram API
- Formato de mensajes

**Frontend React:** 4-5 horas
- Setup React + Vite + Tailwind
- Componente de chat
- Integración con API backend
- Estilos y responsive

**Dashboard omnicanal:** 2-3 horas
- Componente dashboard
- Filtros por canal
- Estadísticas por canal
- Detalle de leads

**Deploy y testing:** 2-3 horas
- Configuración Railway/Render backend
- Configuración Vercel/Netlify frontend
- Configuración webhook Telegram
- Testing completo ambos canales
- Ajustes finales

**Total:** 12-17 horas de trabajo efectivo
**Con asistencia de IA:** 6-9 horas

---

## PRÓXIMOS PASOS DESPUÉS DE LA DEMO

Si el cliente aprueba la demo:

**Respuesta sugerida:**
"Perfecto, me alegra que les haya gustado la demo omnicanal. Como vieron, ya está la arquitectura base funcionando con dos canales diferentes.

Para el MVP completo de 2 semanas incluiría:

1. Todo lo que vieron funcionando aquí
2. WhatsApp integrado (Evolution API que ya manejo) - solo otro adaptador como Telegram
3. Base de datos MongoDB para escalabilidad real
4. Sistema de cache con Redis para mejor performance
5. Arquitectura omnicanal completa (Telegram + WhatsApp + Web sincronizados)
6. Dashboard más robusto con analytics
7. Deploy profesional en AWS EC2 con Docker
8. Documentación completa del código
9. Capacitación de uso del sistema
10. Código 100% de su propiedad sin dependencias propietarias

¿Les parece que arranquemos con el MVP completo por los $100 que cotizamos?"
