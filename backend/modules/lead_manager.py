import json
import os
from datetime import datetime
from typing import Optional
import uuid

from config import LEADS_FILE, PROPERTIES_FILE


def load_properties() -> list:
    """Carga las propiedades desde el archivo JSON."""
    try:
        with open(PROPERTIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def search_properties(
    zone: Optional[str] = None,
    property_type: Optional[str] = None,
    max_price: Optional[int] = None,
    min_bedrooms: Optional[int] = None
) -> list:
    """Busca propiedades según criterios."""
    properties = load_properties()
    results = []
    
    for prop in properties:
        # Filtrar por zona (búsqueda parcial)
        if zone:
            zone_lower = zone.lower()
            prop_zone_lower = prop["zone"].lower()
            if zone_lower not in prop_zone_lower and prop_zone_lower not in zone_lower:
                continue
        
        # Filtrar por tipo
        if property_type and property_type.lower() != prop["type"].lower():
            continue
        
        # Filtrar por precio máximo
        if max_price and prop["price"] > max_price:
            continue
        
        # Filtrar por habitaciones mínimas
        if min_bedrooms and prop["bedrooms"] < min_bedrooms:
            continue
        
        results.append(prop)
    
    return results


def load_leads() -> list:
    """Carga los leads desde el archivo JSON."""
    try:
        with open(LEADS_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                return []
            return json.loads(content)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_leads(leads: list) -> None:
    """Guarda los leads en el archivo JSON."""
    os.makedirs(os.path.dirname(LEADS_FILE), exist_ok=True)
    with open(LEADS_FILE, "w", encoding="utf-8") as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)


def calculate_lead_score(lead_data: dict) -> tuple[int, str]:
    """
    Calcula el score del lead y su temperatura.
    Retorna (score, temperature)
    """
    score = 0
    
    # Puntuación según datos capturados
    if lead_data.get("name"):
        score += 25
    if lead_data.get("phone"):
        score += 30
    if lead_data.get("email"):
        score += 15
    if lead_data.get("budget_min") or lead_data.get("budget_max"):
        score += 10
    if lead_data.get("zone"):
        score += 5
    if lead_data.get("property_type") or lead_data.get("bedrooms"):
        score += 5
    if lead_data.get("interested_property"):
        score += 10
    if lead_data.get("wants_visit"):
        score += 20
    
    # Bonus por tener conversación activa
    if lead_data.get("message_count", 0) >= 3:
        score += 10
    
    # Determinar temperatura
    if score <= 30:
        temperature = "frío"
    elif score <= 60:
        temperature = "tibio"
    else:
        temperature = "caliente"
    
    return min(score, 100), temperature


def find_existing_lead(leads: list, session_id: str = None, telegram_username: str = None, 
                       phone: str = None, email: str = None) -> Optional[dict]:
    """Busca un lead existente por múltiples criterios."""
    for lead in leads:
        # Buscar por session_id
        if session_id and lead.get("session_id") == session_id:
            return lead
        # Buscar por telegram_username
        if telegram_username and lead.get("telegram_username") == telegram_username:
            return lead
        # Buscar por teléfono (para detectar mismo usuario en diferentes canales)
        if phone and lead.get("phone") == phone:
            return lead
        # Buscar por email
        if email and lead.get("email") == email:
            return lead
    return None


def create_or_update_lead(
    channel: str,
    session_id: Optional[str] = None,
    telegram_username: Optional[str] = None,
    telegram_chat_id: Optional[str] = None,
    lead_data: Optional[dict] = None,
    conversation_history: Optional[list] = None
) -> dict:
    """
    Crea un nuevo lead o actualiza uno existente.
    Esta función se puede llamar cada vez que hay una interacción.
    """
    leads = load_leads()
    lead_data = lead_data or {}
    
    # Buscar lead existente
    existing_lead = find_existing_lead(
        leads,
        session_id=session_id,
        telegram_username=telegram_username,
        phone=lead_data.get("phone"),
        email=lead_data.get("email")
    )
    
    # Calcular score con los datos actuales
    combined_data = {}
    if existing_lead:
        combined_data.update({k: v for k, v in existing_lead.items() if v})
    combined_data.update({k: v for k, v in lead_data.items() if v})
    
    # Contar mensajes
    message_count = len([m for m in (conversation_history or []) if m.get("role") == "user"])
    combined_data["message_count"] = message_count
    
    score, temperature = calculate_lead_score(combined_data)
    
    if existing_lead:
        # Actualizar lead existente
        # Solo actualizar campos que tienen valor
        if lead_data.get("name"):
            existing_lead["name"] = lead_data["name"]
        if lead_data.get("phone"):
            existing_lead["phone"] = lead_data["phone"]
        if lead_data.get("email"):
            existing_lead["email"] = lead_data["email"]
        if lead_data.get("budget_min"):
            existing_lead["budget_min"] = lead_data["budget_min"]
        if lead_data.get("budget_max"):
            existing_lead["budget_max"] = lead_data["budget_max"]
        if lead_data.get("zone"):
            existing_lead["zone"] = lead_data["zone"]
        if lead_data.get("property_type"):
            existing_lead["property_type"] = lead_data["property_type"]
        if lead_data.get("bedrooms"):
            existing_lead["bedrooms"] = lead_data["bedrooms"]
        if lead_data.get("urgency"):
            existing_lead["urgency"] = lead_data["urgency"]
        if lead_data.get("interested_property"):
            existing_lead["interested_property"] = lead_data["interested_property"]
        if lead_data.get("wants_visit") is not None:
            existing_lead["wants_visit"] = lead_data["wants_visit"]
        
        # Actualizar campos calculados
        existing_lead["score"] = score
        existing_lead["temperature"] = temperature
        existing_lead["message_count"] = message_count
        existing_lead["updated_at"] = datetime.now().isoformat()
        
        # Actualizar historial de conversación
        if conversation_history:
            existing_lead["conversation_history"] = conversation_history
        
        save_leads(leads)
        return existing_lead
    else:
        # Crear nuevo lead
        new_lead = {
            "id": str(uuid.uuid4()),
            "channel": channel,
            "session_id": session_id,
            "telegram_username": telegram_username,
            "telegram_chat_id": telegram_chat_id,
            "name": lead_data.get("name"),
            "phone": lead_data.get("phone"),
            "email": lead_data.get("email"),
            "budget_min": lead_data.get("budget_min"),
            "budget_max": lead_data.get("budget_max"),
            "zone": lead_data.get("zone"),
            "property_type": lead_data.get("property_type"),
            "bedrooms": lead_data.get("bedrooms"),
            "urgency": lead_data.get("urgency"),
            "interested_property": lead_data.get("interested_property"),
            "wants_visit": lead_data.get("wants_visit"),
            "status": "nuevo",
            "score": score,
            "temperature": temperature,
            "message_count": message_count,
            "conversation_history": conversation_history or [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        leads.append(new_lead)
        save_leads(leads)
        return new_lead


# Mantener compatibilidad con función anterior
def save_lead(
    channel: str,
    lead_data: dict,
    conversation_history: list,
    telegram_username: Optional[str] = None,
    session_id: Optional[str] = None
) -> dict:
    """Guarda un nuevo lead o actualiza uno existente (función legacy)."""
    return create_or_update_lead(
        channel=channel,
        session_id=session_id,
        telegram_username=telegram_username,
        lead_data=lead_data,
        conversation_history=conversation_history
    )


def get_all_leads() -> list:
    """Retorna todos los leads ordenados por fecha de actualización."""
    leads = load_leads()
    # Ordenar por fecha de actualización (más recientes primero)
    leads.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return leads


def get_lead_by_id(lead_id: str) -> Optional[dict]:
    """Busca un lead por su ID."""
    leads = load_leads()
    for lead in leads:
        if lead["id"] == lead_id:
            return lead
    return None


def get_leads_by_channel(channel: str) -> list:
    """Retorna leads filtrados por canal."""
    leads = load_leads()
    return [lead for lead in leads if lead.get("channel") == channel]


def get_hot_leads() -> list:
    """Retorna leads con temperatura 'caliente'."""
    leads = load_leads()
    return [lead for lead in leads if lead.get("temperature") == "caliente"]
