import json
from typing import Optional
from openai import OpenAI

from config import OPENAI_API_KEY
from modules.lead_manager import search_properties, save_lead

# Inicializar cliente OpenAI
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# System prompt del agente inmobiliario
SYSTEM_PROMPT = """Eres InmoBot, un asistente inmobiliario experto y amigable. Tu trabajo es ayudar a los clientes a encontrar la propiedad ideal en Lima, Perú.

**Tus responsabilidades:**

1. Cualificar leads de forma conversacional (NO uses formularios, haz preguntas naturales)
2. Extraer información clave del cliente:
   - Presupuesto mínimo y máximo (en dólares)
   - Zona o zonas de interés (San Isidro, Miraflores, Surco, San Borja, La Molina)
   - Tipo de propiedad (casa o departamento)
   - Número de habitaciones necesarias
   - Nivel de urgencia (inmediato, 1-3 meses, 3-6 meses, solo explorando)
   - Datos de contacto (nombre, teléfono, email)

3. Recomendar propiedades relevantes cuando tengas suficiente información
4. Siempre ofrecer agendar una visita o hablar con un asesor

**Estilo de comunicación:**
- Amigable y profesional
- Hacer UNA pregunta a la vez
- No presionar ni ser insistente
- Usar emojis moderadamente cuando sea apropiado
- Respuestas concisas pero informativas

**Propiedades disponibles:**
Tenemos departamentos y casas en San Isidro, Miraflores, Santiago de Surco, San Borja y La Molina, con precios entre $180,000 y $450,000.

Cuando el usuario proporcione información relevante (nombre, teléfono, email, presupuesto, zona, tipo de propiedad, habitaciones, urgencia), usa la función save_lead_info para guardarla.

Cuando tengas criterios de búsqueda (zona, tipo, presupuesto o habitaciones), usa la función search_properties para buscar propiedades y mostrárselas al usuario de forma atractiva."""

# Definición de herramientas (function calling)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_properties",
            "description": "Busca propiedades según los criterios del cliente",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone": {
                        "type": "string",
                        "description": "Zona de Lima (ej: San Isidro, Miraflores, Surco)"
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
            "description": "Guarda información del cliente potencial cuando la proporciona",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nombre completo del cliente"
                    },
                    "phone": {
                        "type": "string",
                        "description": "Número de teléfono"
                    },
                    "email": {
                        "type": "string",
                        "description": "Correo electrónico"
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
                        "description": "Tipo de propiedad buscada"
                    },
                    "bedrooms": {
                        "type": "integer",
                        "description": "Número de habitaciones"
                    },
                    "urgency": {
                        "type": "string",
                        "enum": ["inmediato", "1-3 meses", "3-6 meses", "explorando"],
                        "description": "Nivel de urgencia"
                    },
                    "interested_property": {
                        "type": "string",
                        "description": "ID de propiedad que le interesa"
                    },
                    "wants_visit": {
                        "type": "boolean",
                        "description": "Si quiere agendar visita"
                    }
                }
            }
        }
    }
]


def format_property_for_display(prop: dict, use_emoji: bool = True) -> str:
    """Formatea una propiedad para mostrar al usuario."""
    if use_emoji:
        return f"""
📍 **{prop['title']}**
💰 ${prop['price']:,}
🛏️ {prop['bedrooms']} habitaciones | 🚿 {prop['bathrooms']} baños | 📐 {prop['area']}m²
✨ {prop['description'][:100]}...
🏢 Incluye: {', '.join(prop['features'][:4])}
"""
    else:
        return f"""
**{prop['title']}**
Precio: ${prop['price']:,}
{prop['bedrooms']} habitaciones | {prop['bathrooms']} baños | {prop['area']}m²
{prop['description'][:100]}...
Incluye: {', '.join(prop['features'][:4])}
"""


def process_tool_calls(tool_calls: list, channel: str, session_id: str, 
                       telegram_username: Optional[str], conversation_history: list) -> tuple[str, dict]:
    """Procesa las llamadas a herramientas del modelo."""
    tool_results = []
    lead_data = {}
    
    for tool_call in tool_calls:
        function_name = tool_call.function.name
        arguments = json.loads(tool_call.function.arguments)
        
        if function_name == "search_properties":
            # Buscar propiedades
            properties = search_properties(
                zone=arguments.get("zone"),
                property_type=arguments.get("property_type"),
                max_price=arguments.get("max_price"),
                min_bedrooms=arguments.get("min_bedrooms")
            )
            
            if properties:
                result = f"Encontré {len(properties)} propiedad(es):\n"
                for prop in properties[:3]:  # Máximo 3 resultados
                    result += format_property_for_display(prop, use_emoji=(channel == "telegram"))
            else:
                result = "No encontré propiedades que coincidan con esos criterios."
            
            tool_results.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "content": result
            })
            
        elif function_name == "save_lead_info":
            # Guardar información del lead
            lead_data.update(arguments)
            
            # Guardar en base de datos
            save_lead(
                channel=channel,
                lead_data=lead_data,
                conversation_history=conversation_history,
                telegram_username=telegram_username,
                session_id=session_id
            )
            
            tool_results.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "content": f"Información guardada: {json.dumps(arguments, ensure_ascii=False)}"
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
    Procesa un mensaje del usuario y genera una respuesta.
    
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
        # Llamar a OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=1000,
            temperature=0.7
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
            
            # Segunda llamada para obtener respuesta final
            messages = [{"role": "system", "content": SYSTEM_PROMPT}] + conversation_history
            
            final_response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=1000,
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
        error_message = f"Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo."
        print(f"Error en process_message: {str(e)}")
        return error_message, conversation_history, {}
