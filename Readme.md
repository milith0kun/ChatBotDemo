# ESPECIFICACIÓN COMPLETA - DEMO AGENTE INMOBILIARIO CON IA
## SISTEMA OMNICANAL: TELEGRAM + WEB CHAT + INTERACCIÓN POR VOZ

## CONTEXTO DEL PROYECTO

Estamos construyendo una DEMO FUNCIONAL para demostrar capacidad técnica en desarrollo de agentes conversacionales con IA para el sector inmobiliario. Esta demo debe ser profesional, funcional y escalable, orientada al mercado español e internacional, con énfasis especial en la capacidad de interacción por voz que permite una experiencia más natural y accesible para los usuarios.

## OBJETIVO DE LA DEMO

Crear un sistema omnicanal funcional donde un cliente potencial pueda:

1. Chatear con un agente de IA inmobiliario por TELEGRAM, WEB o VOZ
2. El agente cualifica al cliente de forma natural (no formularios)
3. El agente recomienda propiedades según las necesidades
4. El sistema captura y clasifica automáticamente los leads
5. Un dashboard muestra todos los leads capturados de TODOS los canales
6. La interacción por voz permite una experiencia conversacional fluida y natural

## VALOR AGREGADO DE LA INTERACCIÓN POR VOZ

La funcionalidad de voz representa un diferenciador clave que:

- **Aumenta la accesibilidad**: Permite a usuarios que prefieren hablar en lugar de escribir
- **Mejora la experiencia**: Conversación más natural y humana
- **Captura leads en movimiento**: Usuarios pueden interactuar mientras conducen o caminan
- **Reduce fricción**: No requiere escribir en móvil, especialmente útil para personas mayores
- **Demuestra innovación**: Tecnología de punta con OpenAI Whisper y TTS
- **Aumenta tasas de conversión**: La voz genera más confianza y engagement

---

## ALCANCE DE LA DEMO

### LO QUE SÍ INCLUYE:
- Bot de Telegram funcional
- Chat web funcional con interfaz profesional en React
- **Interfaz de voz completa con transcripción en tiempo real y síntesis de audio**
- **Sistema bidireccional de voz: usuario habla → bot responde en audio**
- Backend único que procesa todos los canales
- Agente de IA conversacional que cualifica leads
- Base de conocimiento de 10 propiedades inmobiliarias en España
- Sistema de clasificación automática de leads (frío, tibio, caliente)
- Dashboard web para visualizar leads de todos los canales
- **Indicadores visuales de estado de grabación y reproducción de audio**
- Deploy en producción accesible por URL, link de Telegram y función de voz

### LO QUE NO INCLUYE (queda para MVP completo):
- WhatsApp (solo Telegram, Web y Voz por ahora)
- Sistema de llamadas telefónicas entrantes/salientes tradicionales
- Base de datos compleja (MongoDB/Redis)
- Sistema de agendado automático con calendarios
- Múltiples idiomas (solo español en la demo)
- Reconocimiento de voz offline

---

## ARQUITECTURA TÉCNICA

### STACK TECNOLÓGICO

**Canales de entrada:**
- Bot de Telegram (usando Telegram Bot API)
- Chat Web (React con Vite)
- **Interfaz de Voz Web (MediaRecorder API + OpenAI Whisper + TTS)**

**Backend unificado:**
- Framework: FastAPI (Python 3.11)
- IA Conversacional: OpenAI GPT-4 Turbo
- **Transcripción de voz: OpenAI Whisper API**
- **Síntesis de voz: OpenAI TTS API (voces naturales en español)**
- Almacenamiento: Archivos JSON (simple para demo)
- CORS: Configurado para permitir comunicación frontend-backend
- **Manejo de archivos de audio: python-multipart**

**Frontend:**
- Framework: React 18 con Vite
- Estilos: Tailwind CSS
- HTTP Client: Axios
- **Grabación de Audio: MediaRecorder API (nativa del navegador)**
- **Reproducción de Audio: HTMLAudioElement**
- Routing: React Router DOM
- **Gestión de permisos de micrófono**

**Deployment:**
- Backend: Railway o Render (maneja Telegram webhook + API REST + procesamiento de audio)
- Frontend: Vercel, Netlify o Railway
- Bot de Telegram: Configurado con webhook apuntando al backend

---

## MÓDULO DE INTERACCIÓN POR VOZ - ESPECIFICACIÓN DETALLADA

### Arquitectura del Sistema de Voz

**Flujo completo de interacción por voz:**

```
Usuario habla → Micrófono captura → MediaRecorder graba → 
→ Audio enviado a backend → Whisper transcribe → GPT-4 procesa → 
→ Respuesta generada → TTS sintetiza → Audio enviado a frontend → 
→ Usuario escucha respuesta
```

### Componente Frontend de Grabación de Voz

**VoiceRecorder Component (React):**

**Estados del componente:**
- `isRecording`: boolean - indica si está grabando activamente
- `isProcessing`: boolean - indica si está procesando el audio
- `isPlaying`: boolean - indica si está reproduciendo respuesta
- `audioBlob`: Blob | null - almacena el audio grabado
- `mediaRecorder`: MediaRecorder | null - instancia del grabador
- `audioChunks`: array - fragmentos de audio durante grabación
- `permissionGranted`: boolean - permiso de micrófono concedido
- `recordingTime`: number - tiempo de grabación en segundos
- `audioUrl`: string | null - URL del audio de respuesta

**Funcionalidades clave:**

1. **Solicitar permiso de micrófono:**
```javascript
const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setPermissionGranted(true);
    return stream;
  } catch (error) {
    // Mostrar mensaje al usuario explicando cómo habilitar micrófono
    alert("Necesitamos acceso al micrófono para la función de voz");
  }
}
```

2. **Iniciar grabación:**
```javascript
const startRecording = async () => {
  const stream = await requestMicrophonePermission();
  const recorder = new MediaRecorder(stream);
  
  recorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  recorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    await sendAudioToBackend(audioBlob);
  };
  
  recorder.start();
  setIsRecording(true);
  startTimer(); // Contador visual de tiempo
}
```

3. **Detener grabación:**
```javascript
const stopRecording = () => {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    setIsRecording(false);
    stopTimer();
    // Detener todos los tracks de audio
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}
```

4. **Enviar audio al backend:**
```javascript
const sendAudioToBackend = async (audioBlob) => {
  setIsProcessing(true);
  
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('session_id', sessionId);
  
  try {
    const response = await axios.post('/api/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Agregar mensaje transcrito al chat
    addMessage({
      role: 'user',
      content: response.data.transcribed_text,
      timestamp: new Date()
    });
    
    // Agregar respuesta del bot al chat
    addMessage({
      role: 'assistant',
      content: response.data.bot_response,
      timestamp: new Date()
    });
    
    // Obtener y reproducir audio de respuesta
    await getAndPlayAudioResponse(response.data.bot_response);
    
  } catch (error) {
    console.error('Error procesando audio:', error);
    alert('Error al procesar el audio. Por favor intenta de nuevo.');
  } finally {
    setIsProcessing(false);
  }
}
```

5. **Solicitar y reproducir audio de respuesta:**
```javascript
const getAndPlayAudioResponse = async (text) => {
  try {
    const response = await axios.post('/api/voice/synthesize', 
      { text },
      { responseType: 'blob' }
    );
    
    const audioUrl = URL.createObjectURL(response.data);
    const audio = new Audio(audioUrl);
    
    setIsPlaying(true);
    
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audioUrl); // Liberar memoria
    };
    
    audio.play();
    
  } catch (error) {
    console.error('Error reproduciendo audio:', error);
  }
}
```

**Interfaz visual del componente:**

```jsx
<div className="voice-recorder">
  {!permissionGranted && (
    <button onClick={requestMicrophonePermission}>
      🎤 Activar Micrófono
    </button>
  )}
  
  {permissionGranted && !isRecording && !isProcessing && (
    <button 
      onClick={startRecording}
      className="mic-button inactive"
    >
      🎤 Mantén presionado para hablar
    </button>
  )}
  
  {isRecording && (
    <div className="recording-indicator">
      <button 
        onClick={stopRecording}
        className="mic-button recording"
      >
        ⏺️ Grabando... {recordingTime}s
      </button>
      <div className="pulse-animation"></div>
    </div>
  )}
  
  {isProcessing && (
    <div className="processing-indicator">
      <div className="spinner"></div>
      <p>Procesando tu mensaje...</p>
    </div>
  )}
  
  {isPlaying && (
    <div className="playing-indicator">
      🔊 Reproduciendo respuesta...
    </div>
  )}
</div>
```

### Backend - Endpoints de Voz

**1. Endpoint de Transcripción (POST /api/voice/transcribe):**

**Recibe:**
- Archivo de audio (FormData)
  - Campo 'audio': archivo en formato webm, mp3 o wav
  - Campo 'session_id': identificador de sesión
- Headers: multipart/form-data

**Procesa:**
```python
@app.post("/api/voice/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    session_id: str = Form(...)
):
    # 1. Guardar archivo temporal
    temp_audio_path = f"temp_{session_id}.webm"
    with open(temp_audio_path, "wb") as f:
        f.write(await audio.read())
    
    # 2. Transcribir con Whisper
    with open(temp_audio_path, "rb") as audio_file:
        transcript = openai.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="es"  # Especificar español
        )
    
    transcribed_text = transcript.text
    
    # 3. Procesar con la misma lógica del chat
    bot_response = await process_message_with_ai(
        message=transcribed_text,
        session_id=session_id,
        channel="voice"
    )
    
    # 4. Extraer información del lead si aplica
    lead_info = extract_lead_information(bot_response)
    if lead_info:
        save_lead(lead_info, channel="voice")
    
    # 5. Limpiar archivo temporal
    os.remove(temp_audio_path)
    
    # 6. Retornar respuesta
    return {
        "transcribed_text": transcribed_text,
        "bot_response": bot_response.content,
        "lead_captured": bool(lead_info),
        "properties": bot_response.properties if hasattr(bot_response, 'properties') else []
    }
```

**Retorna:**
```json
{
  "transcribed_text": "Hola, estoy buscando un apartamento en Valencia",
  "bot_response": "¡Hola! Encantado de ayudarte. Valencia es una ciudad excelente. ¿Cuál es tu presupuesto aproximado para el apartamento?",
  "lead_captured": false,
  "properties": []
}
```

**2. Endpoint de Síntesis de Voz (POST /api/voice/synthesize):**

**Recibe:**
```json
{
  "text": "¡Hola! Encantado de ayudarte. Valencia es una ciudad excelente.",
  "voice": "nova",  // Opcional: alloy, echo, fable, onyx, nova, shimmer
  "speed": 1.0      // Opcional: 0.25 a 4.0
}
```

**Procesa:**
```python
@app.post("/api/voice/synthesize")
async def synthesize_speech(request: VoiceSynthesisRequest):
    # 1. Llamar a OpenAI TTS API
    response = openai.audio.speech.create(
        model="tts-1",  # o "tts-1-hd" para mayor calidad
        voice=request.voice or "nova",  # Voz femenina cálida
        input=request.text,
        speed=request.speed or 1.0
    )
    
    # 2. Guardar audio temporal
    temp_audio_path = f"temp_response_{uuid.uuid4()}.mp3"
    response.stream_to_file(temp_audio_path)
    
    # 3. Leer archivo y preparar para envío
    with open(temp_audio_path, "rb") as audio_file:
        audio_content = audio_file.read()
    
    # 4. Limpiar archivo temporal
    os.remove(temp_audio_path)
    
    # 5. Retornar audio como stream
    return Response(
        content=audio_content,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "attachment; filename=response.mp3"
        }
    )
```

**Retorna:**
- Archivo de audio MP3 con la respuesta sintetizada
- Content-Type: audio/mpeg

### Optimizaciones de la Experiencia de Voz

**1. Adaptación del lenguaje para audio:**

El system prompt debe incluir instrucciones específicas para respuestas por voz:

```
Cuando respondas a mensajes que vengan del canal "voice", adapta tu lenguaje:
- Usa frases más naturales y conversacionales
- Evita usar símbolos, números o abreviaciones complejas
- Los precios deben decirse completos: "doscientos mil euros" en lugar de "200.000€"
- Las direcciones deben ser claras: "en la zona de Valencia capital"
- No uses listas con viñetas, describe en prosa natural
- Sé más conciso, la gente escucha diferente a como lee
```

**2. Manejo de silencios y errores:**

```javascript
// Detectar si el audio está vacío o muy corto
const validateAudioDuration = (audioBlob) => {
  if (audioBlob.size < 1000) { // Menos de 1KB
    alert("La grabación es muy corta. Por favor intenta de nuevo.");
    return false;
  }
  return true;
}

// Timeout para grabaciones muy largas
const MAX_RECORDING_TIME = 60; // 60 segundos
let recordingInterval;

const startTimer = () => {
  let seconds = 0;
  recordingInterval = setInterval(() => {
    seconds++;
    setRecordingTime(seconds);
    
    if (seconds >= MAX_RECORDING_TIME) {
      stopRecording();
      alert("Grabación máxima alcanzada (60 segundos)");
    }
  }, 1000);
}
```

**3. Feedback visual durante procesamiento:**

```jsx
{isProcessing && (
  <div className="processing-steps">
    <div className="step active">
      <div className="spinner"></div>
      <p>Transcribiendo audio...</p>
    </div>
    <div className="step">
      <p>Procesando respuesta...</p>
    </div>
    <div className="step">
      <p>Generando audio...</p>
    </div>
  </div>
)}
```

**4. Control de reproducción:**

```jsx
<div className="audio-controls">
  {isPlaying && (
    <>
      <button onClick={pauseAudio}>⏸️ Pausar</button>
      <button onClick={stopAudio}>⏹️ Detener</button>
      <div className="volume-control">
        🔊 <input 
          type="range" 
          min="0" 
          max="100" 
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
        />
      </div>
    </>
  )}
</div>
```

### Configuración de Voces en Español

**Voces disponibles de OpenAI TTS:**

1. **alloy** (neutral, versátil)
2. **echo** (masculina, clara)
3. **fable** (británica, expresiva)
4. **onyx** (masculina, profunda)
5. **nova** (femenina, cálida) ⭐ **RECOMENDADA PARA ESPAÑOL**
6. **shimmer** (femenina, suave)

**Configuración recomendada para el agente inmobiliario:**
```python
VOICE_CONFIG = {
    "model": "tts-1",  # Rápido y eficiente para demo
    "voice": "nova",    # Voz femenina cálida, profesional
    "speed": 1.0        # Velocidad normal
}

# Para producción se puede usar:
VOICE_CONFIG_HD = {
    "model": "tts-1-hd",  # Mayor calidad de audio
    "voice": "nova",
    "speed": 1.0
}
```

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
- Módulo de integración con OpenAI (Chat, Whisper, TTS)
- **Módulo de procesamiento de audio (voice_handler.py)**
- **Utilidades para conversión de formatos de audio**
- Lógica compartida de procesamiento de IA

### Carpeta frontend/
Contiene la aplicación React:
- Configuración de Vite y React
- Configuración de Tailwind CSS
- Archivo de dependencias npm
- Carpeta src/ con componentes React
  - **Componente VoiceRecorder**
  - **Hook personalizado useVoiceRecorder**
  - Componente ChatInterface
  - Componente Message
- Carpeta de servicios para llamadas API
  - **Servicio voiceService.js**
- **Carpeta de utilidades de audio**
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

**3. Endpoint de voz - transcripción (POST /api/voice/transcribe)**
Recibe:
- Archivo de audio en formato webm, mp3 o wav
- ID de sesión

Procesa:
- Transcribe audio usando OpenAI Whisper API
- Procesa el texto transcrito con la misma lógica de chat
- Guarda información del lead si se captura con channel="voice"

Retorna:
- Texto transcrito
- Respuesta del agente en texto
- Información del lead extraída (si hay)
- Lista de propiedades recomendadas (si aplica)

**4. Endpoint de voz - síntesis (POST /api/voice/synthesize)**
Recibe:
- Texto de la respuesta del agente
- Configuración de voz (opcional)

Procesa:
- Convierte texto a audio usando OpenAI TTS API
- Utiliza voz natural en español (nova recomendada)

Retorna:
- Archivo de audio mp3 con la respuesta hablada

**5. Endpoint webhook de Telegram (POST /webhook/telegram)**
Recibe:
- Mensaje del usuario desde Telegram Bot API
- Información del chat de Telegram (chat_id, username)

Procesa:
- Extrae mensaje del objeto de Telegram
- Usa LA MISMA función de procesamiento de IA que los otros canales
- Guarda información del lead si se captura con channel="telegram"
- Envía respuesta de vuelta a Telegram usando sendMessage API

**6. Endpoint de leads (GET /api/leads)**
Retorna lista completa de todos los leads capturados de todos los canales (Telegram, Web y Voz) con su información y clasificación

**7. Endpoint de propiedades (GET /api/properties)**
Retorna lista de todas las propiedades disponibles en la base de datos

**8. Endpoint de salud (GET /api/health)**
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

### Integración con OpenAI para Voz:

**Whisper API (Transcripción):**
- Endpoint: https://api.openai.com/v1/audio/transcriptions
- Modelo: whisper-1
- Formato de entrada: audio file (webm, mp3, wav, m4a, flac)
- Idioma: español (especificado en la petición)
- Formato de salida: texto transcrito en español
- Precisión: Alta, incluso con acentos

**TTS API (Síntesis de Voz):**
- Endpoint: https://api.openai.com/v1/audio/speech
- Modelo: tts-1 (rápido, ideal para demo) o tts-1-hd (alta calidad)
- Voz: nova (femenina cálida, profesional) - **RECOMENDADA**
- Formato de salida: mp3 (compatible con todos los navegadores)
- Velocidad: 1.0 (normal, ajustable entre 0.25 y 4.0)
- Calidad: Natural, indistinguible de voz humana

### Configuración CORS:
Debe permitir peticiones desde:
- localhost:5173 (desarrollo frontend)
- localhost:3000 (alternativa)
- Dominio de producción del frontend

---

## LÓGICA DEL AGENTE DE IA (COMPARTIDA PARA TODOS LOS CANALES)

### System Prompt del agente:

El agente se llama "InmoBot" y actúa como un asesor inmobiliario profesional especializado en el mercado español.

Eres un asistente inmobiliario experto especializado en propiedades en España. Tu trabajo es ayudar a los clientes a encontrar la propiedad ideal mediante conversación natural.

**Tus responsabilidades:**

1. Cualificar leads de forma conversacional (no usar formularios)
2. Extraer información clave del cliente:
   - Presupuesto mínimo y máximo (en euros)
   - Zona o zonas de interés (ciudades, provincias o regiones de España)
   - Tipo de propiedad (apartamento, villa, casa, chalet, terreno)
   - Objetivo (compra, alquiler o inversión)
   - Número de habitaciones necesarias
   - Nivel de urgencia (inmediato, 1-3 meses, 3-6 meses, solo explorando)
   - Datos de contacto (nombre, teléfono, email)

3. Recomendar propiedades relevantes según necesidades
4. Clasificar al cliente por temperatura:
   - FRÍO: Solo está explorando, sin urgencia ni compromiso
   - TIBIO: Interesado pero sin urgencia inmediata
   - CALIENTE: Listo para ver propiedades o comprar/alquilar pronto

**Estilo de comunicación:**
- Amigable y profesional
- Hacer UNA pregunta a la vez
- No presionar ni ser insistente
- Responder preguntas sobre propiedades específicas
- Usar terminología del mercado español (apartamento, villa, zona, urbanización)
- Siempre ofrecer agendar visita o hablar con asesor al final

**Adaptación por canal:**
- En Telegram: Puedes usar emojis y ser más casual
- En Web (texto): Mantener tono profesional pero amigable
- **En Voz: IMPORTANTE - Adapta completamente tu lenguaje:**
  - Usa frases más naturales y conversacionales
  - Evita símbolos, números complejos o abreviaciones
  - Di los precios completos: "doscientos mil euros" NO "200.000€"
  - Di las medidas naturalmente: "ochenta y cinco metros cuadrados" NO "85m²"
  - No uses listas con viñetas, describe en prosa fluida
  - Sé más conciso, las personas escuchan diferente a como leen
  - Usa conectores naturales: "además", "por otro lado", "también cuenta con"
  - Evita tecnicismos excesivos, explica de forma simple

### Function Calling (herramientas del agente):

**Herramienta 1: Buscar propiedades**
Permite al agente buscar en la base de datos según criterios:
- Zona
- Tipo de propiedad
- Objetivo (venta/alquiler)
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
- Objetivo (compra/alquiler)
- Habitaciones
- Urgencia
- Temperatura (frío/tibio/caliente)
- Canal de origen (telegram, web o voice)

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
- Definió objetivo (compra/alquiler): +5 puntos
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
- Canal de origen: "telegram", "web" o "voice"
- Username de Telegram (si vino de Telegram)
- **Indicador de interacción por voz: booleano**
- Nombre completo
- Teléfono
- Email
- Presupuesto mínimo
- Presupuesto máximo
- Zona o zonas de interés
- Tipo de propiedad buscada
- Objetivo (compra/alquiler/inversión)
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
- Tipo (apartamento, villa, casa, chalet, terreno)
- Zona (ciudad y provincia)
- Objetivo (venta/alquiler)
- Precio en euros
- Número de habitaciones
- Número de baños
- Área en metros cuadrados
- Descripción detallada
- Lista de características especiales (piscina, jardín, garaje, terraza, vistas al mar, etc)

---

## BASE DE DATOS DE PROPIEDADES

Crear 10 propiedades de ejemplo variadas en diferentes zonas de España:

**Propiedad 1:**
- Villa Paraíso, Bávaro (Costa del Sol, Málaga)
- Apartamento de 2 dormitorios
- 85 m²
- Precio: 200.000€
- Objetivo: Venta
- Características: terraza, piscina comunitaria, cerca de la playa, parking
- Para parejas o inversores

**Propiedad 2:**
- Villa María, La Romana (Alicante)
- Villa de 3 dormitorios
- 180 m²
- Precio: 450.000€
- Objetivo: Venta
- Características: jardín privado, piscina propia, garaje doble, vistas panorámicas
- Para familias con presupuesto alto

**Propiedad 3:**
- San Jacobo, Punta Cana (Costa Blanca, Alicante)
- Apartamento de 1 dormitorio
- 55 m²
- Precio: 150.000€
- Objetivo: Alquiler
- Características: completamente amueblado, terraza, urbanización con seguridad
- Para alquiler vacacional o permanente

**Propiedad 4:**
- Chalet Mediterráneo, Marbella
- Villa de 4 dormitorios
- 250 m²
- Precio: 890.000€
- Objetivo: Venta
- Características: piscina infinity, jardín tropical, jacuzzi, gimnasio privado, vistas al mar
- Lujo, zona premium

**Propiedad 5:**
- Apartamento Centro, Valencia
- Apartamento de 2 dormitorios
- 95 m²
- Precio: 280.000€
- Objetivo: Venta
- Características: reformado completamente, balcón, ascensor, zona céntrica
- Para profesionales o familias pequeñas

**Propiedad 6:**
- Casa Rural, Segovia
- Casa tradicional de 3 dormitorios
- 150 m²
- Precio: 195.000€
- Objetivo: Venta
- Características: chimenea, jardín amplio, bodega, zona tranquila
- Para escapada o vida rural

**Propiedad 7:**
- Penthouse Barcelona, Eixample
- Ático de 3 dormitorios
- 140 m²
- Precio: 650.000€
- Objetivo: Venta
- Características: terraza de 80m², vistas panorámicas, parking, trastero, zona exclusiva
- Lujo urbano

**Propiedad 8:**
- Apartamento Playa, Benidorm
- Apartamento de 2 dormitorios
- 70 m²
- Precio: 1.200€/mes
- Objetivo: Alquiler
- Características: primera línea de playa, piscina, aire acondicionado, amueblado
- Alquiler de larga temporada

**Propiedad 9:**
- Villa Golf, Murcia
- Villa de 3 dormitorios
- 200 m²
- Precio: 385.000€
- Objetivo: Venta
- Características: vistas al campo de golf, piscina, jardín, terraza cubierta, garaje
- Para amantes del golf

**Propiedad 10:**
- Loft Moderno, Madrid
- Loft de 1 dormitorio
- 65 m²
- Precio: 320.000€
- Objetivo: Venta
- Características: diseño contemporáneo, techos altos, zona Malasaña, completamente reformado
- Para jóvenes profesionales o inversión

---

## CANAL TELEGRAM - BOT

### Configuración del Bot:

**Creación:**
1. Abrir Telegram y buscar @BotFather
2. Enviar comando /newbot
3. Elegir nombre del bot (ejemplo: InmoBot España)
4. Elegir username del bot (ejemplo: @inmobot_es_bot)
5. BotFather da el token del bot

**Webhook:**
1. Configurar webhook con comando cURL o desde código backend
2. URL del webhook: https://tu-backend.railway.app/webhook/telegram
3. Telegram enviará todos los mensajes a este endpoint

### Flujo de mensajes en Telegram:

**Usuario escribe mensaje:**
1. Usuario abre t.me/inmobot_es_bot
2. Envía mensaje: "Hola"
3. Telegram hace POST a /webhook/telegram

**Backend procesa:**
1. Extrae texto del mensaje y chat_id
2. Procesa con MISMA lógica de IA que otros canales
3. Genera respuesta
4. Llama a sendMessage de Telegram API
5. Usuario recibe respuesta en Telegram

**Formato de propiedades en Telegram:**
Usar emojis y Markdown para formato atractivo:
```
📍 Villa Paraíso, Málaga
💰 200.000€
🛏️ 2 dormitorios | 🚿 2 baños | 📐 85m²
✨ Perfecto para parejas o inversión
🏢 Incluye: terraza, piscina comunitaria, parking, cerca playa
```

---

## CANAL WEB - INTERFAZ REACT

### Página principal de Chat:

**Estructura visual:**
- Header fijo en la parte superior con:
  - Logo o nombre "InmoBot España"
  - Subtítulo "Asistente Inmobiliario Inteligente"
  - Link al dashboard (esquina superior derecha)
  - Badge indicando "También disponible en Telegram" y "🎤 Interacción por Voz"

- Área de mensajes (centro, scrolleable):
  - Fondo claro, profesional
  - Mensajes del usuario alineados a la derecha con fondo azul
  - Mensajes del bot alineados a la izquierda con fondo gris claro
  - **Indicador especial para mensajes originados por voz (icono de micrófono)**
  - Cada mensaje muestra hora
  - Scroll automático al último mensaje
  - Cuando el bot está escribiendo, mostrar indicador animado
  - **Cuando está transcribiendo, mostrar "Transcribiendo audio..."**
  - **Cuando está generando audio, mostrar "Generando respuesta en audio..."**

- Footer fijo en la parte inferior con:
  - Input de texto para escribir mensaje
  - Botón de enviar (icono o texto)
  - **Botón de micrófono destacado para grabar audio**
  - **Indicador visual de estado de grabación (inactivo/grabando/procesando)**
  - Funciona con Enter o clic en botón

**Componentes React necesarios:**

Componente ChatInterface (principal):
- Maneja estado de mensajes
- Maneja estado del input
- Maneja estado de "está escribiendo"
- **Maneja estado de grabación de audio**
- **Maneja estado de procesamiento de audio**
- **Maneja estado de reproducción de respuesta**
- Hace llamadas a POST /api/chat del backend
- **Hace llamadas a POST /api/voice/transcribe para audio**
- Renderiza lista de mensajes
- Auto-scroll cuando llegan nuevos mensajes

Componente Message:
- Recibe props: contenido, rol (user/bot), timestamp, **isVoiceMessage**
- Renderiza mensaje con estilo según rol
- **Muestra icono de micrófono si es mensaje de voz**
- Si el mensaje del bot incluye propiedades, las muestra formateadas
- Formato especial para mostrar datos de propiedades (precio, habitaciones, etc)

**Componente VoiceRecorder (NUEVO):**
- **Botón de micrófono para iniciar/detener grabación**
- **Indicador visual de grabación activa (animación pulsante)**
- **Contador de tiempo de grabación**
- **Envía audio grabado a /api/voice/transcribe**
- **Recibe respuesta transcrita y respuesta del bot**
- **Solicita audio de respuesta a /api/voice/synthesize**
- **Reproduce audio de respuesta automáticamente**
- **Controles de reproducción (pausar, detener, volumen)**
- **Manejo de permisos de micrófono**
- **Mensajes de error amigables**

**Responsividad:**
- Funciona perfecto en desktop (pantalla completa)
- Funciona perfecto en móvil (adaptado al ancho)
- **Botón de micrófono accesible en móvil**
- No se rompe en tablets

**Estilo visual:**
- Moderno, limpio, profesional
- Colores corporativos: azul para usuario, gris para bot
- **Color especial (morado) para indicadores de voz**
- Bordes redondeados en mensajes
- Sombras sutiles
- **Animaciones suaves de pulsación durante grabación**
- Animaciones suaves al aparecer mensajes
- Tipografía clara y legible

---

## CANAL DE VOZ - ESPECIFICACIÓN COMPLETA

### Experiencia de Usuario en Voz

**Inicio de interacción:**
1. Usuario ve botón de micrófono prominente en la interfaz
2. Al hacer clic, se solicita permiso de micrófono (primera vez)
3. Una vez concedido, botón cambia a estado "listo para grabar"

**Durante la grabación:**
1. Usuario mantiene presionado o hace clic para iniciar
2. Botón cambia a color rojo con animación pulsante
3. Aparece contador de tiempo (00:00 - 00:60 máximo)
4. Usuario habla normalmente su consulta
5. Usuario suelta o hace clic nuevamente para detener

**Procesamiento:**
1. Aparece indicador "Transcribiendo tu mensaje..."
2. Audio se envía al backend
3. Whisper transcribe el audio
4. Texto transcrito aparece como mensaje del usuario
5. Indicador cambia a "El agente está procesando..."
6. GPT-4 genera respuesta
7. Respuesta aparece como mensaje del bot
8. Indicador cambia a "Generando audio de respuesta..."
9. TTS sintetiza la respuesta
10. Audio se reproduce automáticamente

**Durante la reproducción:**
1. Icono de altavoz animado indica reproducción activa
2. Usuario puede pausar, detener o ajustar volumen
3. Texto de la respuesta sigue visible en el chat
4. Al finalizar, sistema queda listo para nueva grabación

### Flujo Técnico Completo

```
FRONTEND:
1. Usuario hace clic en 🎤
2. MediaRecorder inicia captura de audio
3. Grabación se guarda en Blob (webm)
4. Usuario detiene grabación
5. Blob se convierte en FormData
6. POST a /api/voice/transcribe con audio

BACKEND:
7. Recibe archivo de audio
8. Guarda temporalmente
9. Llama a Whisper API
10. Obtiene transcripción en texto
11. Procesa con GPT-4 (función compartida)
12. Genera respuesta del agente
13. Extrae info de lead si aplica
14. Retorna JSON con transcripción y respuesta

FRONTEND:
15. Recibe respuesta JSON
16. Muestra transcripción como mensaje usuario
17. Muestra respuesta como mensaje bot
18. POST a /api/voice/synthesize con texto

BACKEND:
19. Recibe texto de respuesta
20. Llama a TTS API
21. Genera archivo MP3
22. Retorna audio como stream

FRONTEND:
23. Recibe audio MP3
24. Crea objeto Audio
25. Reproduce automáticamente
26. Usuario escucha respuesta
27. Sistema listo para nuevo ciclo
```

### Consideraciones de Experiencia

**Accesibilidad:**
- Textos alternativos claros en todos los controles
- Feedback visual para personas con discapacidad auditiva
- Opción de leer texto en lugar de solo escuchar
- Contraste adecuado en indicadores visuales

**Performance:**
- Compresión de audio antes de enviar (reducir tamaño)
- Streaming de respuesta de audio cuando sea posible
- Precarga de la siguiente interacción
- Manejo de conexiones lentas con timeouts apropiados

**Manejo de Errores:**
- "No pudimos acceder a tu micrófono. Verifica los permisos."
- "La grabación fue muy corta. Por favor intenta de nuevo."
- "Hubo un problema al transcribir. ¿Puedes repetir?"
- "No pudimos generar el audio. Aquí está la respuesta en texto."

**Privacidad:**
- No almacenar archivos de audio del usuario
- Eliminar archivos temporales inmediatamente
- Informar al usuario que el audio se procesa pero no se guarda
- Solo guardar transcripciones en historial de chat

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
  - **Card 4: Leads por Voz (número y porcentaje)**
  - Card 5: Leads calientes total (número y porcentaje)

- Filtros (barra horizontal):
  - Filtro por canal (dropdown: Todos, Telegram, Web, **Voz**)
  - Filtro por temperatura (dropdown: Todos, Frío, Tibio, Caliente)
  - Filtro por objetivo (dropdown: Todos, Venta, Alquiler)
  - Búsqueda por nombre (input de texto)

- Tabla de leads:
  - Columnas: Canal, Nombre, Contacto, Presupuesto, Zona, Tipo, Objetivo, Habitaciones, Estado, Score, Temperatura, Fecha
  - Badge de canal:
    - Telegram: icono de Telegram azul
    - Web: icono de navegador verde
    - **Voz: icono de micrófono morado 🎤**
  - Badges de colores para temperatura:
    - Frío: badge gris
    - Tibio: badge amarillo/naranja
    - Caliente: badge rojo
  - Badge para objetivo:
    - Venta: badge verde
    - Alquiler: badge azul
  - Score mostrado como número con barra de progreso
  - Cada fila clickeable para ver detalle completo
  - Responsive: en móvil mostrar solo columnas esenciales

- Detalle de lead (modal o sección expandible):
  - Información completa del lead
  - Canal de origen destacado
  - Username de Telegram si aplica
  - **Indicador destacado si fue interacción por voz**
  - **Transcripciones completas si fue por voz**
  - Historial de conversación completo
  - Propiedades que le interesaron
  - Opción para marcar como contactado

**Componente React Dashboard:**
- Carga leads desde GET /api/leads al montar
- Maneja estado de filtros
- Filtra leads según selección (canal, temperatura, objetivo, búsqueda)
- Renderiza estadísticas calculadas
- Renderiza tabla con datos filtrados
- Calcula métricas por canal **incluyendo Voz**

**Responsividad:**
- Desktop: tabla completa con todas las columnas
- Tablet: tabla con columnas principales
- Móvil: cards en lugar de tabla, mostrando info esencial

---

## FLUJO DE CONVERSACIÓN TÍPICO (TODOS LOS CANALES)

### Ejemplo de interacción exitosa completa POR VOZ:

**Inicio:**
Usuario: [Habla] "Hola"
Bot: [Transcribe] "Hola"
Bot: [Texto] "¡Hola! Soy InmoBot, tu asistente inmobiliario especializado en España. Estoy aquí para ayudarte a encontrar la propiedad ideal. ¿Estás buscando comprar o alquilar?"
Bot: [Audio] "Hola, soy InmoBot, tu asistente inmobiliario especializado en España. Estoy aquí para ayudarte a encontrar la propiedad ideal. ¿Estás buscando comprar o alquilar?"

**Cualificación paso 1:**
Usuario: [Habla] "Quiero comprar un apartamento"
Bot: [Transcribe] "Quiero comprar un apartamento"
Bot: [Texto] "Excelente elección. ¿En qué zona de España te gustaría vivir?"
Bot: [Audio] "Excelente elección. ¿En qué zona de España te gustaría vivir?"

**Cualificación paso 2:**
Usuario: [Habla] "En Valencia"
Bot: [Transcribe] "En Valencia"
Bot: [Texto] "Valencia es una ciudad excelente con mucha calidad de vida. ¿Cuál es tu presupuesto aproximado?"
Bot: [Audio] "Valencia es una ciudad excelente con mucha calidad de vida. ¿Cuál es tu presupuesto aproximado?"

**Cualificación paso 3:**
Usuario: [Habla] "Tengo entre doscientos cincuenta mil y trescientos cincuenta mil euros"
Bot: [Transcribe] "Tengo entre 250.000€ y 350.000€"
Bot: [Texto] "Perfecto, ese es un rango que te da muy buenas opciones en Valencia. ¿Cuántas habitaciones necesitas?"
Bot: [Audio] "Perfecto, ese es un rango que te da muy buenas opciones en Valencia. ¿Cuántas habitaciones necesitas?"

**Cualificación paso 4:**
Usuario: [Habla] "Dos o tres habitaciones"
Bot: [Transcribe] "2 o 3 habitaciones"
Bot: [Texto] "Genial. Déjame buscar las mejores opciones para ti..."
Bot: [Audio] "Genial. Déjame buscar las mejores opciones para ti."

**Recomendación (formato para voz):**
Bot: [Texto y Audio adaptado para escuchar]:
"He encontrado una propiedad que podría interesarte. Se trata de un apartamento en el centro de Valencia, con dos dormitorios y dos baños, en un total de noventa y cinco metros cuadrados. El precio es de doscientos ochenta mil euros. Está completamente reformado, cuenta con balcón y ascensor, y se encuentra en una zona muy céntrica, perfecta para profesionales o familias pequeñas. ¿Te gustaría conocer más detalles de esta propiedad?"

**Interés:**
Usuario: [Habla] "Sí, me interesa mucho"
Bot: [Transcribe] "Sí, me interesa mucho"
Bot: [Texto y Audio]:
"Excelente. Este apartamento está ubicado en pleno centro de Valencia, en una zona con todos los servicios a mano. La reforma es reciente e incluye materiales de calidad. El balcón da a una calle tranquila, y el edificio tiene ascensor, lo cual es muy valorado en el centro. ¿Cuándo te gustaría agendar una visita?"

**Captura de datos:**
Usuario: [Habla] "Esta semana estaría bien"
Bot: [Transcribe] "Esta semana estaría bien"
Bot: [Texto y Audio]:
"Perfecto. Para coordinar la visita con nuestro asesor en Valencia, necesito que me compartas tu nombre completo y número de teléfono."

**Cierre:**
Usuario: [Habla] "Carlos González, mi número es seis cinco cuatro, tres dos uno, nueve ocho siete"
Bot: [Transcribe] "Carlos González, 654321987"
Bot: [Texto y Audio]:
"Gracias Carlos. He registrado tu interés en el apartamento del centro de Valencia. Un asesor se contactará contigo en las próximas horas para coordinar la visita. ¿Hay algo más en lo que pueda ayudarte?"

**Sistema automático:**
- Guarda lead con channel="voice"
- Marca como "interacción por voz: true"
- Clasifica como CALIENTE (score: 90)
- Aparece inmediatamente en dashboard con badge de Voz 🎤

---

## CONFIGURACIÓN DE DEPLOYMENT

### Backend (Railway o Render):

**Variables de entorno necesarias:**
- OPENAI_API_KEY: API key de OpenAI
- TELEGRAM_BOT_TOKEN: Token del bot de Telegram
- FRONTEND_URL: URL del frontend en producción (para CORS)
- PORT: Puerto del servidor (auto-asignado por plataforma)
- **MAX_AUDIO_SIZE: Tamaño máximo de archivo de audio (ejemplo: 5MB)**
- **TEMP_AUDIO_DIR: Directorio para archivos temporales de audio**

**Archivos necesarios para deploy:**
- Procfile: especifica comando para iniciar servidor
- runtime.txt: especifica versión de Python (3.11.7)
- requirements.txt: lista todas las dependencias Python incluyendo:
  - fastapi
  - uvicorn
  - openai
  - requests (para Telegram API)
  - **python-multipart (CRÍTICO para subida de archivos de audio)**
  - pydantic
  - **aiofiles (para manejo asíncrono de archivos)**

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

**Test 2: Conversación completa por Web (texto)**
- Usuario abre chat web
- Misma conversación que Telegram
- Lead se guarda con channel="web"
- Aparece en dashboard con badge de Web

**Test 3: Conversación completa por VOZ ⭐**
- Usuario abre chat web y hace clic en micrófono
- Sistema solicita permiso de micrófono
- Usuario concede permiso
- Usuario habla su consulta
- Sistema transcribe correctamente
- Bot responde por texto y audio
- Audio se reproduce automáticamente con voz natural
- Usuario puede pausar/detener reproducción
- Conversación continúa por voz fluidamente
- Lead se captura con channel="voice"
- Aparece en dashboard con badge de Voz 🎤
- **Historial muestra transcripciones completas**

**Test 4: Interacción mixta texto + voz**
- Usuario inicia conversación por texto
- Cambia a voz a mitad de conversación
- Vuelve a texto
- Sistema mantiene contexto completo
- Historial muestra ambos tipos de interacción

**Test 5: Dashboard omnicanal**
- Muestra leads de todos los canales (Telegram, Web, Voz)
- Filtro por canal funciona correctamente
- Filtro por objetivo funciona (Venta, Alquiler)
- Estadísticas muestran totales por canal
- Se puede ver detalle de cada lead
- **Leads por voz muestran indicador especial**

**Test 6: Manejo de errores en voz**
- Grabación muy corta: muestra mensaje apropiado
- Permiso denegado: guía al usuario para habilitar
- Error de transcripción: ofrece reintentar
- Error de síntesis: muestra texto sin audio

**Test 7: Performance de voz**
- Transcripción completa en menos de 3 segundos
- Generación de audio en menos de 2 segundos
- Reproducción sin cortes ni lag
- Interfaz responsive durante procesamiento

---

## PRESENTACIÓN AL CLIENTE - ENFOQUE EN VOZ

### Qué mostrar en la demo:

**1. Introducción (1 minuto):**
- Explicar que es un sistema omnicanal completo
- **Destacar la funcionalidad de voz como diferenciador clave**
- Mencionar que todo funciona en producción

**2. Bot de Telegram (2 minutos):**
- Compartir link del bot: t.me/nombre_del_bot
- Hacer conversación breve
- Mostrar recomendación de propiedades
- Capturar un lead

**3. Chat Web - Texto (1 minuto):**
- Abrir la URL del chat web
- Hacer conversación breve por texto
- Mostrar interfaz profesional

**4. ⭐ INTERACCIÓN POR VOZ - DEMO PRINCIPAL (5 minutos):**

**4a. Introducción a la funcionalidad:**
"Ahora viene lo más innovador. Pueden ver este botón de micrófono. Voy a demostrarles cómo pueden interactuar completamente por voz."

**4b. Primera interacción:**
[Haces clic en micrófono]
"Observen que se activa el indicador de grabación..."
[Hablas]: "Hola InmoBot, estoy buscando un apartamento en Valencia para comprar, entre doscientos cincuenta mil y trescientos cincuenta mil euros"
[Sueltas botón]
"El sistema está transcribiendo..."
[Aparece transcripción]
"Aquí pueden ver el texto transcrito automáticamente..."
[Aparece respuesta del bot]
"Y ahora escuchen la respuesta..."
[Se reproduce audio con voz natural]

**4c. Continuar conversación:**
[Grabas nuevo audio]: "Necesito dos habitaciones"
[Sistema procesa y responde en audio]
"Como ven, la conversación fluye de forma completamente natural."

**4d. Destacar características:**
- "La voz es indistinguible de una persona real"
- "El sistema mantiene el contexto de toda la conversación"
- "Pueden ver el texto mientras escuchan"
- "Funciona perfectamente en móvil para usuarios en movimiento"
- "Ideal para personas mayores o que prefieren hablar"

**5. Dashboard Omnicanal (3 minutos):**
[Abres dashboard]
"Aquí está la potencia del sistema. Todos los leads, de todos los canales, centralizados."

[Señalas los badges de canal]
"Ven estos indicadores: Telegram, Web, y este morado es Voz. Este lead que acabamos de capturar por voz aparece automáticamente clasificado."

[Abres detalle de lead por voz]
"En el detalle pueden ver toda la conversación transcrita, aunque fue por voz. El sistema capturó: presupuesto, zona, número de habitaciones, todo automáticamente."

[Muestras filtros]
"Pueden filtrar solo leads que llegaron por voz, o por cualquier otro canal. También por temperatura y por objetivo de compra o alquiler."

**6. Arquitectura y Valor (2 minutos):**
"Todo esto funciona con UN SOLO backend. La misma inteligencia artificial procesa los tres canales.

La funcionalidad de voz es especialmente valiosa porque:
- Aumenta la accesibilidad para todo tipo de usuarios
- Genera más confianza que un chat tradicional
- Permite capturar leads mientras las personas están en movimiento
- Es tecnología de punta con OpenAI Whisper y TTS
- Diferencia su servicio de la competencia

Y lo más importante: es 100% código propio. No hay dependencia de plataformas cerradas. Todo es de su propiedad."

### Script de presentación completo:

"Buenos días. Les preparé una demo que va más allá de lo que discutimos inicialmente. No solo construí un chat web, sino un sistema omnicanal completo con una funcionalidad especial: **interacción por voz**.

**[Abres Telegram]**
Empezamos con Telegram. Como ven, el bot conversa naturalmente, cualifica al cliente sin formularios, y recomienda propiedades.

**[Haces conversación rápida en Telegram]**

**[Abres chat web]**
Aquí está la misma inteligencia en web. Interfaz profesional, responsive.

**[Haces conversación breve por texto]**

**[Preparas la demo de voz]**
Pero ahora viene lo realmente diferenciador. Ven este botón de micrófono.

**[Haces clic y hablas]**
*"Hola InmoBot, estoy buscando un apartamento en Valencia para comprar, entre doscientos cincuenta mil y trescientos mil euros, necesito dos habitaciones"*

**[Muestras proceso]**
Observen: el sistema transcribe el audio automáticamente usando Whisper de OpenAI, el agente procesa la solicitud, y ahora...

**[Reproduce respuesta en audio]**
...responde con una voz completamente natural. No es una grabación pre-hecha, es síntesis de voz en tiempo real.

**[Continúas conversación por voz brevemente]**

Este nivel de interacción por voz les da ventajas enormes:
- Pueden capturar leads de personas que están conduciendo o caminando
- Es mucho más accesible para personas mayores
- Genera más confianza que un simple chat de texto
- Se diferencia completamente de la competencia
- Es tecnología de OpenAI, la más avanzada del mundo

**[Abres dashboard]**
Y todo se centraliza aquí. Ven los tres canales funcionando: Telegram, Web texto, y Voz. Este lead morado que acabamos de capturar por voz, ya está clasificado automáticamente como CALIENTE porque dio toda la información.

**[Muestras detalle]**
Aunque fue una conversación hablada, el sistema capturó: presupuesto exacto, zona, número de habitaciones, objetivo de compra. Todo automático.

**[Destacas la arquitectura]**
Lo importante: esto es UN SOLO backend procesando todo. La misma IA, la misma lógica, solo diferentes adaptadores para cada canal.

Para el MVP completo de 2 semanas, agregaríamos:
- WhatsApp integrado (solo otro adaptador más)
- Catálogo completo de propiedades reales
- Base de datos MongoDB profesional
- Panel de administración para gestionar propiedades
- Analytics avanzados
- Deploy en AWS con arquitectura escalable

Y todo el código es 100% de su propiedad. Sin lock-in, sin dependencias propietarias.

¿Tienen preguntas sobre lo que vieron?"

---

## CRITERIOS DE ÉXITO

La demo será exitosa si demuestra:

✅ Bot de Telegram funcional y profesional
✅ Chat web con interfaz moderna en React
✅ **Interfaz de voz completamente funcional**
✅ **Transcripción precisa de voz a texto**
✅ **Síntesis de voz natural e indistinguible de humano**
✅ **Reproducción automática de respuestas en audio**
✅ **Controles de audio (pausar, detener, volumen)**
✅ Conversación natural y fluida con IA en todos los canales
✅ Extracción correcta de información del lead
✅ Búsqueda y recomendación inteligente de propiedades
✅ Clasificación automática precisa (frío/tibio/caliente)
✅ Dashboard omnicanal mostrando leads de todos los canales
✅ **Filtros por canal funcionando (incluyendo Voz)**
✅ Interfaz responsive
✅ Deploy en producción funcionando
✅ **Experiencia de voz fluida sin lag perceptible**
✅ Todo el sistema es propiedad del cliente (sin lock-in)
✅ Arquitectura omnicanal demostrada

---

## TIEMPO ESTIMADO DE DESARROLLO

**Backend común (FastAPI + OpenAI):** 4-5 horas
- Setup proyecto y configuración
- Lógica de procesamiento de IA compartida
- Sistema de guardado de leads
- Endpoints de API base

**Módulo de Voz (Backend):** 3-4 horas ⭐
- Endpoint de transcripción con Whisper
- Endpoint de síntesis con TTS
- Manejo de archivos de audio
- Optimización de calidad de voz
- Configuración de voces en español
- Manejo de errores específicos de audio

**Adaptador Telegram:** 1-2 horas
- Configuración del bot
- Webhook endpoint
- Integración con Telegram API
- Formato de mensajes

**Frontend React (Texto):** 4-5 horas
- Setup React + Vite + Tailwind
- Componente de chat
- Integración con API backend
- Estilos y responsive

**Frontend - Componente de Voz:** 4-5 horas ⭐
- Componente VoiceRecorder
- Integración con MediaRecorder API
- Manejo de permisos de micrófono
- UI de grabación con animaciones
- Integración con endpoints de voz
- Reproducción de audio
- Controles de audio
- Manejo de errores de voz

**Dashboard omnicanal:** 2-3 horas
- Componente dashboard
- Filtros por canal (incluyendo Voz)
- Estadísticas por canal
- Detalle de leads con indicador de voz

**Deploy y testing:** 3-4 horas
- Configuración Railway/Render backend
- Configuración Vercel/Netlify frontend
- Configuración webhook Telegram
- **Testing específico de funcionalidad de voz**
- Testing completo todos los canales
- Ajustes finales

**Total:** 21-28 horas de trabajo efectivo
**Con asistencia de IA:** 12-16 horas

---

## PRÓXIMOS PASOS DESPUÉS DE LA DEMO

Si el cliente aprueba la demo:

**Respuesta sugerida:**

"Perfecto, me alegra que les haya impresionado la funcionalidad de voz. Como pudieron experimentar, la tecnología ya está funcionando y la arquitectura está preparada para escalar.

Para el MVP completo de 2 semanas incluiría:

**Core del sistema:**
1. Todo lo que vieron funcionando aquí
2. WhatsApp integrado (Evolution API) - solo otro adaptador como Telegram
3. Base de datos MongoDB con catálogo extenso de propiedades reales
4. Sistema de cache con Redis para mejor performance

**Funcionalidades avanzadas de voz:**
5. Sistema de llamadas telefónicas con Voice AI
6. IVR (menú de voz interactivo) para clasificación inicial
7. Llamadas salientes automáticas para seguimiento de leads calientes
8. Voicemail inteligente que también se transcribe y procesa

**Dashboard y administración:**
9. Panel de administración completo para gestionar propiedades
10. Analytics avanzados con métricas por canal
11. Sistema de asignación automática de leads a asesores
12. Notificaciones en tiempo real de leads calientes

**Infraestructura:**
13. Deploy profesional en AWS EC2 con Docker
14. Sistema de backups automáticos
15. Monitoreo y alertas
16. Documentación técnica completa

**Capacitación y soporte:**
17. Capacitación completa de uso del sistema
18. Manuales de usuario y administrador
19. 1 mes de soporte post-lanzamiento incluido

Todo el código es 100% de su propiedad, sin dependencias propietarias ni lock-in.

La inversión para el MVP completo sería de [monto acordado]. ¿Les parece que arranquemos?"

---

## NOTAS FINALES SOBRE LA FUNCIONALIDAD DE VOZ

### Por qué la voz es un diferenciador crítico:

1. **Aumenta tasas de conversión**: Usuarios que interactúan por voz tienden a compartir más información
2. **Reduce fricción**: Especialmente en móvil, hablar es más rápido que escribir
3. **Accesibilidad**: Abre el servicio a personas con dificultades para escribir
4. **Modernidad**: Demuestra innovación tecnológica
5. **Ventaja competitiva**: Pocos competidores tienen esta funcionalidad
6. **Captura en movimiento**: Usuarios pueden interactuar mientras conducen o caminan

### Métricas esperadas con voz:

- **+40% en tiempo de interacción** (usuarios hablan más que escriben)
- **+25% en captura de datos de contacto** (menor fricción para compartir)
- **+35% en satisfacción del usuario** (experiencia más natural)
- **+50% en uso móvil** (mucho más cómodo que escribir en pantalla pequeña)

### Casos de uso específicos donde voz brilla:

1. **Usuario en coche**: Puede buscar propiedades mientras conduce
2. **Usuario mayor**: Más cómodo que escribir para generación 60+
3. **Consultas complejas**: Más fácil explicar necesidades hablando
4. **Horarios fuera de oficina**: Pueden dejar mensaje de voz detallado
5. **Multitasking**: Usuario puede cocinar/limpiar mientras busca propiedad

Esta funcionalidad posiciona al cliente como **líder tecnológico** en su sector.