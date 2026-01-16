import json
from typing import Optional
from openai import OpenAI

from config import OPENAI_API_KEY
from modules.lead_manager import search_properties, save_lead, load_properties

# Inicializar cliente OpenAI
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Modelo a usar (gpt-4o-mini es más inteligente y económico)
MODEL = "gpt-4o-mini"

# System prompt mejorado para conversaciones naturales
SYSTEM_PROMPT = """Eres InmoBot, un asesor inmobiliario virtual experto y amigable de una inmobiliaria en Lima, Perú.

## TU PERSONALIDAD
- Eres cálido, profesional y genuinamente interesado en ayudar
- Hablas de forma natural, como un amigo que sabe de bienes raíces
- Usas un tono conversacional, no robótico
- Eres paciente y nunca presionas al cliente

## CATÁLOGO DE PROPIEDADES DISPONIBLES
Tienes 5 propiedades en tu inventario:

1. **Departamento Moderno en San Isidro** - $250,000
   - 3 hab, 2 baños, 120m² | Incluye: gym, piscina, seguridad 24/7

2. **Casa Familiar en Miraflores** - $450,000
   - 4 hab, 3 baños, 200m² | Incluye: jardín, terraza, cerca al malecón

3. **Departamento Compacto en Surco** - $180,000
   - 2 hab, 2 baños, 85m² | Ideal para parejas o profesionales

4. **Penthouse de Lujo en San Borja** - $380,000
   - 3 hab, 3 baños, 150m² | Terraza privada, jacuzzi, 2 estacionamientos

5. **Departamento Familiar en La Molina** - $220,000
   - 3 hab, 2 baños, 110m² | Zona tranquila, cerca a colegios

## FLUJO DE CONVERSACIÓN NATURAL

### Saludo inicial
Cuando alguien te saluda, responde cálidamente y pregunta qué tipo de propiedad busca (casa o departamento), sin pedir más datos de inmediato.

### Si piden ver el catálogo o propiedades
- Usa la función `show_catalog` para mostrar todas las opciones
- Después pregunta cuál le interesa más o qué características busca

### Proceso de cualificación (hazlo naturalmente, NO como formulario)
Obtén gradualmente durante la conversación:
1. Tipo de propiedad (casa/depto)
2. Zona preferida
3. Presupuesto aproximado
4. Número de habitaciones
5. Datos de contacto (solo si muestran interés real)

### Recomendaciones
- Cuando tengas criterios, usa `search_properties` para buscar
- Presenta las opciones de forma atractiva y entusiasta
- Destaca características que coincidan con lo que buscan

### Cierre
- Si muestran interés real, solicita datos para coordinar visita
- Usa `save_lead_info` para guardar la información
- Siempre ofrece seguir ayudando

## REGLAS IMPORTANTES
1. NUNCA inventes propiedades que no están en el catálogo
2. NUNCA des precios incorrectos
3. Si no hay propiedades que coincidan, dilo honestamente y sugiere alternativas
4. Haz UNA pregunta a la vez, no bombardees con muchas preguntas
5. Si el usuario solo quiere ver opciones sin dar datos, está bien, muéstrale el catálogo
6. Recuerda lo que el usuario ya te dijo en la conversación

## ESTILO DE RESPUESTAS
- Respuestas de 2-4 oraciones máximo (a menos que muestres propiedades)
- Usa emojis con moderación (1-2 por mensaje)
- Sé específico, no genérico
- Evita frases como "¡Claro!" o "¡Por supuesto!" repetidamente
"""

# Definición de herramientas mejoradas
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "show_catalog",
            "description": "Muestra el catálogo completo de propiedades disponibles. Usar cuando el usuario quiere ver todas las opciones, el catálogo, o dice 'quiero ver propiedades'.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_properties",
            "description": "Busca propiedades específicas según criterios del cliente. Usar cuando el usuario ya mencionó preferencias concretas.",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone": {
                        "type": "string",
                        "description": "Zona de Lima (San Isidro, Miraflores, Surco, San Borja, La Molina)"
                    },
                    "property_type": {
                        "type": "string",
                        "enum": ["casa", "departamento"],
                        "description": "Tipo de propiedad"
                    },
                    "max_price": {
                        "type": "integer",
                        "description": "Precio máximo en dólares"
                    },
                    "min_bedrooms": {
                        "type": "integer",
                        "description": "Número mínimo de habitaciones"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_lead_info",
            "description": "Guarda información del cliente cuando la proporciona voluntariamente. Solo usar cuando el cliente da sus datos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nombre del cliente"
                    },
                    "phone": {
                        "type": "string",
                        "description": "Teléfono"
                    },
                    "email": {
                        "type": "string",
                        "description": "Email"
                    },
                    "budget_min": {
                        "type": "integer",
                        "description": "Presupuesto mínimo en dólares"
                    },
                    "budget_max": {
                        "type": "integer",
                        "description": "Presupuesto máximo en dólares"
                    },
                    "zone": {
                        "type": "string",
                        "description": "Zona de interés"
                    },
                    "property_type": {
                        "type": "string",
                        "description": "Tipo: casa o departamento"
                    },
                    "bedrooms": {
                        "type": "integer",
                        "description": "Habitaciones deseadas"
                    },
                    "urgency": {
                        "type": "string",
                        "enum": ["inmediato", "1-3 meses", "3-6 meses", "explorando"],
                        "description": "Urgencia de compra"
                    },
                    "interested_property": {
                        "type": "string",
                        "description": "Propiedad de interés"
                    },
                    "wants_visit": {
                        "type": "boolean",
                        "description": "Quiere agendar visita"
                    }
                }
            }
        }
    }
]


def format_property_card(prop: dict, index: int = None, use_emoji: bool = True) -> str:
    """Formatea una propiedad de forma atractiva."""
    prefix = f"{index}. " if index else ""
    
    if use_emoji:
        return f"""
{prefix}🏠 **{prop['title']}**
💵 ${prop['price']:,} USD
📐 {prop['area']}m² | 🛏️ {prop['bedrooms']} hab | 🚿 {prop['bathrooms']} baños
✨ {prop['description'][:80]}...
🎯 Incluye: {', '.join(prop['features'][:3])}
"""
    else:
        return f"""
{prefix}**{prop['title']}**
${prop['price']:,} USD
{prop['area']}m² | {prop['bedrooms']} habitaciones | {prop['bathrooms']} baños
{prop['description'][:80]}...
Incluye: {', '.join(prop['features'][:3])}
"""


def get_full_catalog(use_emoji: bool = True) -> str:
    """Genera el catálogo completo de propiedades."""
    properties = load_properties()
    
    if not properties:
        return "No hay propiedades disponibles en este momento."
    
    result = "📋 **CATÁLOGO DE PROPIEDADES DISPONIBLES**\n" if use_emoji else "CATÁLOGO DE PROPIEDADES DISPONIBLES\n"
    result += "─" * 35 + "\n"
    
    for i, prop in enumerate(properties, 1):
        result += format_property_card(prop, index=i, use_emoji=use_emoji)
        result += "\n"
    
    result += "─" * 35 + "\n"
    result += "💡 ¿Alguna te llama la atención? Puedo darte más detalles." if use_emoji else "¿Alguna te interesa? Puedo darte más información."
    
    return result


def process_tool_calls(tool_calls: list, channel: str, session_id: str, 
                       telegram_username: Optional[str], conversation_history: list) -> tuple[list, dict]:
    """Procesa las llamadas a herramientas del modelo."""
    tool_results = []
    lead_data = {}
    use_emoji = channel == "telegram"
    
    for tool_call in tool_calls:
        function_name = tool_call.function.name
        arguments = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}
        
        if function_name == "show_catalog":
            # Mostrar catálogo completo
            result = get_full_catalog(use_emoji=use_emoji)
            tool_results.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "content": result
            })
            
        elif function_name == "search_properties":
            # Buscar propiedades con criterios
            properties = search_properties(
                zone=arguments.get("zone"),
                property_type=arguments.get("property_type"),
                max_price=arguments.get("max_price"),
                min_bedrooms=arguments.get("min_bedrooms")
            )
            
            if properties:
                result = f"🔍 Encontré {len(properties)} propiedad(es) que coinciden:\n\n" if use_emoji else f"Encontré {len(properties)} propiedad(es):\n\n"
                for prop in properties[:3]:
                    result += format_property_card(prop, use_emoji=use_emoji)
            else:
                # Sugerir alternativas
                all_props = load_properties()
                result = "No encontré propiedades con esos criterios exactos. "
                if arguments.get("max_price"):
                    cheaper = [p for p in all_props if p["price"] <= arguments.get("max_price", 500000) * 1.2]
                    if cheaper:
                        result += f"Pero tengo opciones similares que podrían interesarte. ¿Quieres que te las muestre?"
                    else:
                        result += "¿Te gustaría ver el catálogo completo para explorar opciones?"
                else:
                    result += "¿Quieres ver el catálogo completo?"
            
            tool_results.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "content": result
            })
            
        elif function_name == "save_lead_info":
            # Guardar información del lead
            lead_data.update(arguments)
            
            saved_lead = save_lead(
                channel=channel,
                lead_data=lead_data,
                conversation_history=conversation_history,
                telegram_username=telegram_username,
                session_id=session_id
            )
            
            # Mensaje de confirmación interno
            saved_fields = [k for k, v in arguments.items() if v]
            result = f"Información guardada: {', '.join(saved_fields)}"
            
            tool_results.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "content": result
            })
    
    return tool_results, lead_data


async def process_message(
    message: str,
    conversation_history: list,
    channel: str = "web",
    session_id: Optional[str] = None,
    telegram_username: Optional[str] = None
) -> tuple[str, list, dict]:
    """
    Procesa un mensaje del usuario y genera una respuesta natural.
    
    Args:
        message: Mensaje del usuario
        conversation_history: Historial de la conversación
        channel: Canal de origen ("web" o "telegram")
        session_id: ID de sesión para web
        telegram_username: Username de Telegram si aplica
    
    Returns:
        tuple: (respuesta, historial actualizado, datos del lead)
    """
    if not client:
        return "Lo siento, el servicio no está disponible en este momento. Por favor intenta más tarde.", conversation_history, {}
    
    # Agregar mensaje del usuario al historial
    conversation_history.append({
        "role": "user",
        "content": message
    })
    
    # Preparar mensajes para la API
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + conversation_history
    
    try:
        # Llamar a OpenAI con gpt-4o-mini
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=800,
            temperature=0.8  # Un poco más creativo para respuestas naturales
        )
        
        assistant_message = response.choices[0].message
        lead_data = {}
        
        # Verificar si hay llamadas a herramientas
        if assistant_message.tool_calls:
            # Agregar mensaje del asistente con tool_calls al historial
            conversation_history.append({
                "role": "assistant",
                "content": assistant_message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in assistant_message.tool_calls
                ]
            })
            
            # Procesar herramientas
            tool_results, lead_data = process_tool_calls(
                assistant_message.tool_calls,
                channel,
                session_id,
                telegram_username,
                conversation_history
            )
            
            # Agregar resultados de herramientas
            for result in tool_results:
                conversation_history.append(result)
            
            # Segunda llamada para obtener respuesta final contextualizada
            messages = [{"role": "system", "content": SYSTEM_PROMPT}] + conversation_history
            
            final_response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                max_tokens=600,
                temperature=0.7
            )
            
            bot_response = final_response.choices[0].message.content
        else:
            bot_response = assistant_message.content
        
        # Agregar respuesta al historial
        conversation_history.append({
            "role": "assistant",
            "content": bot_response
        })
        
        return bot_response, conversation_history, lead_data
        
    except Exception as e:
        error_message = "Disculpa, tuve un pequeño problema técnico. ¿Podrías repetir lo que me decías?"
        print(f"Error en process_message: {str(e)}")
        return error_message, conversation_history, {}
