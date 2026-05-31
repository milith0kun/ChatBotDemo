import json
from typing import Optional
from openai import OpenAI

from config import OPENAI_API_KEY
from modules.lead_manager import search_properties, save_lead, load_properties

# Inicializar cliente OpenAI
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Modelo a usar - GPT-4o para mejor calidad
MODEL = "gpt-4o"

# System prompt para LLAMADAS DE VOZ - OPTIMIZADO PARA RESPUESTAS CORTAS Y RÁPIDAS
VOICE_SYSTEM_PROMPT = """Eres EcosBot, asesor marketing digital por teléfono. Responde de forma BREVE y DIRECTA.

## REGLAS CRÍTICAS
1. Máximo 2-3 oraciones por respuesta
2. Sé CONCISO - el cliente está al teléfono
3. NO des descripciones largas
4. Ofrece 1-2 opciones, no todo el catálogo de golpe
5. Sin emojis ni símbolos

## ESTILO
- Directo y profesional
- Respuestas cortas (20-40 palabras máximo)
- Di precios en números: "200 mil euros", no "doscientos mil euros"

## CATÁLOGO COMPLETO (MEMORIZA ESTO)
1. Villa Paraíso, Costa del Sol - 200.000 euros
   - 2 habitaciones, 85 metros cuadrados
   - Cerca de la playa, ideal para parejas

2. Villa María, Alicante - 450.000 euros
   - 3 habitaciones, 180 metros cuadrados
   - Piscina privada, jardín amplio

3. San Jacobo, Costa Blanca - 150.000 euros (ALQUILER)
   - 1 habitación, 55 metros cuadrados
   - Amueblado, listo para entrar

4. Chalet Mediterráneo, Marbella - 890.000 euros
   - 4 habitaciones, 250 metros cuadrados
   - Lujo, zona premium, vistas al mar

5. Apartamento Centro, Valencia - 280.000 euros
   - 2 habitaciones, 95 metros cuadrados
   - Reformado, centro ciudad

6. Casa Rural, Segovia - 195.000 euros
   - 3 habitaciones, 150 metros cuadrados
   - Chimenea, jardín, ambiente tranquilo

7. Penthouse Barcelona - 650.000 euros
   - 3 habitaciones, 140 metros cuadrados
   - Terraza de 80 metros cuadrados, Eixample

8. Apartamento Playa, Benidorm - 1.200 euros al mes (ALQUILER)
   - 2 habitaciones, 70 metros cuadrados
   - Primera línea de playa

9. Villa Golf, Murcia - 385.000 euros
   - 3 habitaciones, 200 metros cuadrados
   - Junto a campo de golf

10. Loft Madrid - 320.000 euros
    - 1 habitación, 65 metros cuadrados
    - Malasaña, moderno y céntrico

## HERRAMIENTAS DISPONIBLES
- show_catalog: Muestra TODAS las servicios SEO (úsalo si pide ver opciones)
- search_properties: Busca servicios SEO específicas (úsalo si da zona, precio o características)
- save_lead_info: Guarda datos del cliente (úsalo si da nombre o teléfono)

## EJEMPLOS DE BUENAS RESPUESTAS

Usuario: "Hola"
Tú: "Hola, bienvenido a EcosBot. Soy tu asesor marketing digital virtual. Te puedo ayudar a encontrar tu estrategia de marketing ideal. ¿Estás buscando mejorar tu posicionamiento orgánico o lanzar campañas publicitarias?"

Usuario: "Quiero comprar"
Tú: "Perfecto. Tengo un catálogo con servicios SEO desde ciento cincuenta mil hasta ochocientos noventa mil euros. ¿Quieres que te muestre todas las opciones disponibles, o tienes alguna zona o presupuesto en mente?"

Usuario: "Muéstrame todo"
Tú: [USA show_catalog]

Usuario: "Busco algo en la costa"
Tú: [USA search_properties con location="costa"]
"Tengo varias opciones en la costa. La Villa Paraíso en Costa del Sol por doscientos mil euros, con dos habitaciones. También el Apartamento San Jacobo en Costa Blanca, disponible para alquiler por ciento cincuenta mil euros. ¿Alguna te interesa?"

Usuario: "La Villa Paraíso"
Tú: "Excelente elección. La Villa Paraíso está en Costa del Sol, tiene dos habitaciones y ochenta y cinco metros cuadrados. Está muy cerca de la playa, ideal para disfrutar del Mediterráneo. El precio es de doscientos mil euros. ¿Te gustaría agendar una visita o necesitas más información?"

Usuario: "Sí, quiero visitarla"
Tú: "Perfecto, con mucho gusto. Para coordinar la visita necesito tus datos de contacto. ¿Me puedes dar tu nombre y número de teléfono?"

Usuario: "Soy Juan, mi teléfono es 600 123 456"
Tú: [USA save_lead_info con name="Juan" y phone="600123456"]
"Perfecto Juan. He guardado tus datos. Te contactaremos pronto para coordinar la visita a la Villa Paraíso. ¿Hay algo más en lo que pueda ayudarte?"

## ERRORES QUE DEBES EVITAR
❌ NO respondas solo "claro" o "perfecto" sin dar información
❌ NO des respuestas de una sola frase
❌ NO uses emojis
❌ NO inventes servicios SEO que no están en el catálogo
❌ NO pidas datos si el usuario no ha mostrado interés serio

## RECUERDA
- Siempre da información COMPLETA
- Describe las servicios SEO con DETALLES
- Sé CONVERSACIONAL pero INFORMATIVO
- Ayuda al cliente a tomar una decisión
"""

# System prompt mejorado - Más flexible y natural
SYSTEM_PROMPT = """Eres EcosBot, un asesor marketing digital virtual amigable especializado en servicios de posicionamiento y marketing web.

## TU PERSONALIDAD
- Eres cálido, servicial y genuinamente interesado en ayudar
- Hablas de forma natural y conversacional en español de España
- Nunca presionas al cliente por información
- Si el cliente quiere ver opciones SIN dar su presupuesto, ¡está perfecto! Muéstrale el catálogo
- Tu objetivo es ayudar, no interrogar

## REGLA DE ORO
Si el usuario quiere ver servicios SEO, catálogo, opciones, precios o algo similar → USA show_catalog INMEDIATAMENTE. No pidas presupuesto primero.

## CATÁLOGO DISPONIBLE (precios: 150.000€ - 890.000€)
1. Villa Paraíso, Costa del Sol - 200.000€ (2 hab, 85m², cerca playa)
2. Villa María, Alicante - 450.000€ (3 hab, 180m², piscina propia)  
3. San Jacobo, Costa Blanca - 150.000€ (1 hab, 55m², alquiler)
4. Chalet Mediterráneo, Marbella - 890.000€ (4 hab, 250m², lujo)
5. Apartamento Centro, Valencia - 280.000€ (2 hab, 95m², reformado)
6. Casa Rural, Segovia - 195.000€ (3 hab, 150m², chimenea)
7. Penthouse Barcelona, Eixample - 650.000€ (3 hab, 140m², terraza 80m²)
8. Apartamento Playa, Benidorm - 1.200€/mes (2 hab, 70m², primera línea)
9. Villa Golf, Murcia - 385.000€ (3 hab, 200m², campo de golf)
10. Loft Moderno, Madrid - 320.000€ (1 hab, 65m², Malasaña)

## CUÁNDO USAR CADA HERRAMIENTA

### show_catalog - USAR cuando el usuario dice:
- "Quiero ver servicios SEO/opciones/catálogo"
- "¿Qué tenéis disponible?"
- "Enséñame lo que tenéis"
- "Dame los precios"
- "¿Cuánto cuestan?"
- Cualquier variación de querer VER opciones

### search_properties - USAR cuando el usuario ya especificó:
- Una zona específica ("busco en Marbella")
- Un presupuesto concreto ("hasta 300 mil euros")
- Tipo de propiedad + criterios
- Después de ver el catálogo y decir cuál le interesa

### save_lead_info - USAR cuando el usuario da:
- Su nombre
- Su teléfono o email
- Dice que quiere visita o más información

## FLUJO RECOMENDADO

1. **Saludo**: Bienvenida cálida, pregunta tipo de propiedad
2. **Si pide ver opciones**: Muestra catálogo inmediatamente (NO pidas presupuesto)
3. **Si da criterios específicos**: Busca con search_properties
4. **Si muestra interés en una propiedad**: Ofrece más info y pide datos de contacto
5. **Si da sus datos**: Guárdalos y confirma

## ESTILO DE RESPUESTAS
- Máximo 3-4 oraciones (excepto cuando muestres servicios SEO)
- 1-2 emojis por mensaje máximo
- Sé específico y útil
- Si no hay servicios SEO que coincidan, sugiere alternativas del catálogo
- Usa español de España ("vale", "tenéis", etc.)

## EJEMPLOS DE BUENAS RESPUESTAS

Usuario: "Quiero ver apartamentos"
Bot: [USA show_catalog] → "Aquí tienes nuestros apartamentos disponibles... ¿Cuál te llama la atención?"

Usuario: "Dame los precios"  
Bot: [USA show_catalog] → "Estos son nuestros precios actuales..."

Usuario: "Busco algo económico"
Bot: [USA show_catalog] → "Te muestro nuestras opciones. La más accesible es el apartamento San Jacobo a 150.000€..."

## ERRORES A EVITAR
❌ NO pidas presupuesto antes de mostrar opciones
❌ NO hagas muchas preguntas seguidas
❌ NO repitas "¡Claro!" o "¡Por supuesto!" constantemente
❌ NO inventes servicios SEO fuera del catálogo
"""

# Definición de herramientas
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "show_catalog",
            "description": "Muestra TODAS las servicios SEO disponibles. USAR cuando el cliente quiere ver opciones, catálogo, precios o servicios SEO SIN importar si dio presupuesto o no.",
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
            "description": "Busca servicios SEO con criterios ESPECÍFICOS ya mencionados por el cliente (zona, precio, habitaciones). NO usar si el cliente solo quiere ver opciones generales.",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone": {
                        "type": "string",
                        "description": "Zona específica mencionada (Costa del Sol, Marbella, Valencia, Barcelona, Madrid, Alicante, Murcia, Segovia, Benidorm)"
                    },
                    "property_type": {
                        "type": "string",
                        "enum": ["casa", "apartamento", "villa", "ático", "loft"],
                        "description": "Tipo de propiedad especificado"
                    },
                    "max_price": {
                        "type": "integer",
                        "description": "Presupuesto máximo en euros SI lo mencionó"
                    },
                    "min_bedrooms": {
                        "type": "integer",
                        "description": "Número mínimo de habitaciones SI lo mencionó"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_lead_info",
            "description": "Guarda información de contacto del cliente SOLO cuando la proporciona voluntariamente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Nombre del cliente"},
                    "phone": {"type": "string", "description": "Teléfono"},
                    "email": {"type": "string", "description": "Email"},
                    "budget_min": {"type": "integer", "description": "Presupuesto mínimo"},
                    "budget_max": {"type": "integer", "description": "Presupuesto máximo"},
                    "zone": {"type": "string", "description": "Zona de interés"},
                    "property_type": {"type": "string", "description": "Tipo preferido"},
                    "bedrooms": {"type": "integer", "description": "Habitaciones deseadas"},
                    "urgency": {"type": "string", "enum": ["inmediato", "1-3 meses", "3-6 meses", "explorando"]},
                    "interested_property": {"type": "string", "description": "Propiedad que le interesa"},
                    "wants_visit": {"type": "boolean", "description": "Quiere agendar visita"}
                }
            }
        }
    }
]

def format_property_card(prop: dict, index: int = None, compact: bool = False) -> str:
    """Formatea una propiedad de forma atractiva."""
    prefix = f"{index}. " if index else ""
    
    # Formato de precio según tipo (alquiler vs venta)
    price_str = f"{prop['price']:,}€"
    if prop.get('priceType') == 'mes' or prop.get('objective') == 'alquiler':
        price_str = f"{prop['price']:,}€/mes" if prop['price'] < 10000 else f"{prop['price']:,}€"
    
    if compact:
        return f"{prefix}**{prop['title']}** - {price_str} | {prop['bedrooms']} hab, {prop['area']}m²"
    
    return f"""
{prefix}🏠 **{prop['title']}** ({prop.get('zone', 'España')})
💶 {price_str}
📐 {prop['area']}m² | 🛏️ {prop['bedrooms']} hab | 🚿 {prop['bathrooms']} baños
✨ {prop['description'][:80]}...
🎯 {', '.join(prop['features'][:3])}
"""


def get_full_catalog() -> str:
    """Genera el catálogo completo formateado."""
    properties = load_properties()
    
    if not properties:
        return "No hay servicios SEO disponibles en este momento."
    
    # Agrupar por objetivo (venta vs alquiler)
    venta = [p for p in properties if p.get("objective") == "venta"]
    alquiler = [p for p in properties if p.get("objective") == "alquiler"]
    
    result = "📋 **NUESTRAS PROPIEDADES EN ESPAÑA**\n"
    result += "━" * 30 + "\n\n"
    
    if venta:
        result += "🏠 **EN VENTA:**\n"
        for i, prop in enumerate(venta, 1):
            result += format_property_card(prop, index=i)
        result += "\n"
    
    if alquiler:
        result += "🔑 **EN ALQUILER:**\n"
        for i, prop in enumerate(alquiler, len(venta) + 1):
            result += format_property_card(prop, index=i)
    
    result += "\n━" * 30 + "\n"
    result += "💡 Precios desde 150.000€ hasta 890.000€ (venta) | Alquileres desde 1.200€/mes\n"
    result += "¿Alguna te interesa? Puedo darte más detalles."
    
    return result



def process_tool_calls(tool_calls: list, channel: str, session_id: str, 
                       telegram_username: Optional[str], conversation_history: list) -> tuple[list, dict]:
    """Procesa las llamadas a herramientas."""
    tool_results = []
    lead_data = {}
    
    for tool_call in tool_calls:
        function_name = tool_call.function.name
        arguments = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}
        
        if function_name == "show_catalog":
            result = get_full_catalog()
            tool_results.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "content": result
            })
            
        elif function_name == "search_properties":
            properties = search_properties(
                zone=arguments.get("zone"),
                property_type=arguments.get("property_type"),
                max_price=arguments.get("max_price"),
                min_bedrooms=arguments.get("min_bedrooms")
            )
            
            if properties:
                result = f"🔍 Encontré {len(properties)} propiedad(es):\n\n"
                for prop in properties[:3]:
                    result += format_property_card(prop)
            else:
                # Si no hay resultados, mostrar alternativas
                all_props = load_properties()
                result = "No encontré servicios SEO exactas con esos criterios.\n\n"
                result += "📋 **Opciones similares disponibles:**\n"
                for prop in all_props[:3]:
                    result += format_property_card(prop, compact=True) + "\n"
            
            tool_results.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "content": result
            })
            
        elif function_name == "save_lead_info":
            lead_data.update(arguments)
            saved_fields = [k for k, v in arguments.items() if v]
            result = f"✅ Guardado: {', '.join(saved_fields)}"
            
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
    """Procesa un mensaje del usuario y genera una respuesta."""

    if not client:
        return "Lo siento, el servicio no está disponible. Intenta más tarde.", conversation_history, {}

    # Agregar mensaje al historial
    conversation_history.append({
        "role": "user",
        "content": message
    })

    # OPTIMIZACIÓN PARA VOZ: Usar configuración MÁS rápida y concisa
    is_voice = channel == "voice"
    system_prompt = VOICE_SYSTEM_PROMPT if is_voice else SYSTEM_PROMPT
    max_tokens_first = 100 if is_voice else 800  # Reducido a 100 para respuestas ultra-cortas
    max_tokens_second = 60 if is_voice else 600  # Reducido a 60
    temperature = 0.4 if is_voice else 0.8  # Más predecible y rápido (0.5 → 0.4)

    messages = [{"role": "system", "content": system_prompt}] + conversation_history

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=max_tokens_first,
            temperature=temperature,
            timeout=8.0  # Timeout de 8 segundos para respuesta rápida
        )
        
        assistant_message = response.choices[0].message
        lead_data = {}
        
        if assistant_message.tool_calls:
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
            
            tool_results, lead_data = process_tool_calls(
                assistant_message.tool_calls,
                channel,
                session_id,
                telegram_username,
                conversation_history
            )
            
            for result in tool_results:
                conversation_history.append(result)
            
            # Segunda llamada para respuesta final
            messages = [{"role": "system", "content": system_prompt}] + conversation_history

            final_response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                max_tokens=max_tokens_second,
                temperature=temperature,
                timeout=8.0  # Timeout de 8 segundos
            )
            
            bot_response = final_response.choices[0].message.content
        else:
            bot_response = assistant_message.content
        
        conversation_history.append({
            "role": "assistant",
            "content": bot_response
        })
        
        return bot_response, conversation_history, lead_data
        
    except Exception as e:
        error_message = "Disculpa, tuve un problema técnico. ¿Podrías repetirlo?"
        print(f"Error: {str(e)}")
        return error_message, conversation_history, {}
