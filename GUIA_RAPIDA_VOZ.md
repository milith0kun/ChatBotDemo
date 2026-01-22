# 🎤 GUÍA RÁPIDA: OPTIMIZACIÓN DE VOZ

## ⚙️ CONFIGURACIÓN ÓPTIMA

### 1. Variables de Entorno (.env)

```bash
# OPCIÓN 1: Máxima Calidad (OpenAI)
VOICE_PROVIDER=openai
OPENAI_API_KEY=sk-...

# OPCIÓN 2: Económica (Deepgram - $200 gratis)
VOICE_PROVIDER=deepgram
DEEPGRAM_API_KEY=...

# OPCIÓN 3: Ambas (fallback automático)
VOICE_PROVIDER=openai
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
```

### 2. Voces Recomendadas

#### OpenAI (Mejor Calidad) ⭐
```python
# En voice_handler.py, línea 20
"voice": "nova",  # ⭐ RECOMENDADA - Cálida, natural, excelente español

# Alternativas:
# "shimmer"  - Femenina suave, profesional
# "alloy"    - Neutral, versátil
# "echo"     - Masculina, clara
```

#### Deepgram (Económica) ⭐
```python
# En voice_handler.py, línea 26
"tts_model": "aura-asteria-es",  # ⭐ RECOMENDADA - Más expresiva

# Alternativas:
# "aura-luna-es"    - Profesional, formal
# "aura-orion-es"   - Masculina, segura
```

### 3. Velocidad de Voz

```python
# En voice_handler.py, línea 21
"speed": 1.05,  # ⭐ RECOMENDADA - Conversación fluida

# Ajustes:
# 0.85  - Muy lenta (para información técnica)
# 1.0   - Normal (estándar)
# 1.05  - Ligeramente rápida (natural, recomendada)
# 1.15  - Rápida (dinámica, para usuarios expertos)
# 1.25  - Muy rápida (no recomendada)
```

---

## 🔧 AJUSTES FINOS

### Límite de Caracteres (Longitud de Respuestas)

```python
# En voice_handler.py, línea 283
if len(result) > 800:  # ← AJUSTA AQUÍ

# Valores recomendados:
# 500  - Respuestas cortas (preguntas simples)
# 800  - Equilibrado (⭐ RECOMENDADO)
# 1200 - Respuestas largas (descripciones detalladas)
```

### Umbral de Silencio (Detección de Final de Habla)

```python
# En frontend/src/components/VoiceCall/VoiceCall.jsx, línea 91
const SILENCE_THRESHOLD = 0.03;   // ← Sensibilidad
const SILENCE_DURATION = 800;     // ← Tiempo en ms

# Ajustes:
# SILENCE_THRESHOLD:
#   0.01 - Muy sensible (corta rápido, puede cortar palabras)
#   0.03 - Equilibrado (⭐ RECOMENDADO)
#   0.05 - Poco sensible (espera más, puede sonar lento)

# SILENCE_DURATION:
#   500  - Muy rápido (puede cortar al usuario)
#   800  - Equilibrado (⭐ RECOMENDADO)
#   1200 - Lento (espera mucho, puede parecer no responder)
```

---

## 📝 PERSONALIZACIÓN DE TEXTO

### Añadir Nuevas Conversiones

Edita `backend/modules/voice_handler.py`, línea 267:

```python
replacements = {
    "€": " euros",
    "m²": " metros cuadrados",
    # AÑADE TUS CONVERSIONES AQUÍ:
    "Ud.": "usted",
    "Sr.": "señor",
    "Sra.": "señora",
    "Dr.": "doctor",
    "ej.": "ejemplo",
    "aprox.": "aproximadamente",
    # Abreviaturas inmobiliarias:
    "dorm.": "dormitorios",
    "baños": "baños",
    "m2": "metros cuadrados",
    "a/c": "aire acondicionado",
    # Números:
    "1º": "primero",
    "2º": "segundo",
    "3º": "tercero",
}
```

### Mejorar Pronunciación de Números

```python
# Añadir después de línea 254 en voice_handler.py:

# Convertir números grandes a palabras
def number_to_words(n):
    # Ejemplo: 200000 → "doscientos mil"
    thousands = n // 1000
    if thousands > 0:
        return f"{thousands} mil"
    return str(n)

# Aplicar a precios
text = re.sub(r'(\d{3,})€', lambda m: f"{number_to_words(int(m.group(1)))} euros", text)
```

---

## 🎯 CASOS DE USO

### Caso 1: Chat Rápido (Preguntas Simples)
```python
# Configuración:
"speed": 1.15,          # Más rápido
límite: 500 caracteres  # Respuestas cortas
SILENCE_DURATION: 600   # Detecta rápido
```

### Caso 2: Presentación de Propiedades (Detallada) ⭐
```python
# Configuración: (ACTUAL - RECOMENDADA)
"speed": 1.05,          # Natural
límite: 800 caracteres  # Respuestas completas
SILENCE_DURATION: 800   # Equilibrado
```

### Caso 3: Atención a Mayores (Pausado)
```python
# Configuración:
"speed": 0.90,          # Más lento
límite: 500 caracteres  # Frases cortas
SILENCE_DURATION: 1500  # Más tiempo para hablar
```

---

## 🧪 TESTING RÁPIDO

### 1. Probar Síntesis de Voz

```bash
# Windows PowerShell
cd backend
python -c "from modules.voice_handler import synthesize_speech; import open; audio = synthesize_speech('Hola, soy InmoBot. Villa de doscientos mil euros, dos habitaciones, ochenta y cinco metros cuadrados.'); open('test.mp3', 'wb').write(audio)"

# Reproducir
start test.mp3
```

### 2. Probar Adaptación de Texto

```bash
python -c "from modules.voice_handler import adapt_text_for_voice; print(adapt_text_for_voice('Villa Paraíso 🏠 - 200.000€, 2 hab, 85m²', 'voice'))"

# Salida esperada:
# "Villa Paraíso - doscientos mil euros, 2 habitaciones, 85 metros cuadrados"
```

### 3. Probar Llamada Completa

1. Iniciar backend: `python backend/main.py`
2. Iniciar frontend: `cd frontend && npm run dev`
3. Abrir navegador: `http://localhost:5173`
4. Hacer clic en el botón de llamada 📞
5. Hablar y escuchar respuesta

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: Audio muy robótico
**Solución:**
```python
# Cambiar en voice_handler.py línea 19-21:
"model": "tts-1-hd",  # NO usar "tts-1"
"voice": "nova",       # NO usar "alloy"
"speed": 1.05          # NO usar 1.0
```

### Problema: Respuestas cortadas
**Solución:**
```python
# Aumentar límite en voice_handler.py línea 283:
if len(result) > 1200:  # Era 800
```

### Problema: Pronuncia mal los precios
**Solución:**
```python
# Añadir conversión personalizada:
text = text.replace("200.000€", "doscientos mil euros")
text = text.replace("€", " euros")
```

### Problema: No reproduce el audio
**Verificar:**
1. ¿El backend está corriendo? → `curl http://localhost:8000/api/health`
2. ¿Hay API key configurada? → Revisar `.env`
3. ¿El navegador bloquea audio? → Verificar consola del navegador
4. ¿El micrófono funciona? → Verificar permisos del navegador

### Problema: Latencia alta (tarda mucho)
**Solución:**
```python
# Opción 1: Cambiar a Deepgram (más rápido)
VOICE_PROVIDER=deepgram

# Opción 2: Reducir límite de caracteres
if len(result) > 500:  # Era 800

# Opción 3: Usar tts-1 (menos calidad pero más rápido)
"model": "tts-1",
```

---

## 📊 COMPARACIÓN DE PROVEEDORES

| Característica | OpenAI | Deepgram |
|----------------|--------|----------|
| **Calidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Velocidad** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Precio** | $15/1M chars | $30/1M chars |
| **Créditos gratis** | $5 | $200 |
| **Español** | Excelente | Muy bueno |
| **Expresividad** | Máxima | Alta |
| **Recomendado para** | Producción | Desarrollo/Costos |

---

## ✅ CHECKLIST DE CONFIGURACIÓN ÓPTIMA

- [x] ✅ Modelo TTS en HD (`tts-1-hd`)
- [x] ✅ Voz cálida (`nova` o `aura-asteria-es`)
- [x] ✅ Velocidad optimizada (`1.05`)
- [x] ✅ Límite de 800 caracteres
- [x] ✅ Conversiones de símbolos configuradas
- [x] ✅ Bitrate alto para Deepgram (`128000`)
- [x] ✅ Prompt de voz optimizado (3-5 oraciones)
- [x] ✅ Detección de silencio calibrada (800ms)

---

## 🎓 MEJORES PRÁCTICAS

1. **Siempre prueba con usuarios reales** - Lo que suena bien para ti puede no sonar bien para otros
2. **Monitorea latencia** - La calidad no sirve si tarda 10 segundos
3. **Ajusta según feedback** - Velocidad, voz y tono son subjetivos
4. **Cache respuestas frecuentes** - Saludo, despedida, preguntas comunes
5. **Fallback configurado** - Si OpenAI falla, usa Deepgram automáticamente
6. **Límites razonables** - No intentes sintetizar 2000 caracteres de una vez

---

## 📞 CONTACTO Y SOPORTE

**Documentación completa:** Ver `ANALISIS_AUDIO.md`

**Archivos modificados:**
- `backend/modules/voice_handler.py` - Configuración TTS
- `backend/modules/ai_agent.py` - Prompt de voz
- `frontend/src/components/VoiceCall/VoiceCall.jsx` - Reproducción

**Testing:**
```bash
# Backend
pytest tests/test_voice_handler.py

# Frontend
npm run test
```

---

**¡Audio optimizado para máxima naturalidad! 🎤✨**
