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
        # Filtrar por zona
        if zone and zone.lower() not in prop["zone"].lower():
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
            return json.load(f)
    except FileNotFoundError:
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
        score += 30
    if lead_data.get("phone"):
        score += 30
    if lead_data.get("email"):
        score += 10
    if lead_data.get("budget_min") or lead_data.get("budget_max"):
        score += 15
    if lead_data.get("zone"):
        score += 10
    if lead_data.get("property_type") or lead_data.get("bedrooms"):
        score += 10
    if lead_data.get("interested_property"):
        score += 10
    if lead_data.get("wants_visit"):
        score += 20
    
    # Determinar temperatura
    if score <= 40:
        temperature = "frío"
    elif score <= 70:
        temperature = "tibio"
    else:
        temperature = "caliente"
    
    return min(score, 100), temperature


def save_lead(
    channel: str,
    lead_data: dict,
    conversation_history: list,
    telegram_username: Optional[str] = None,
    session_id: Optional[str] = None
) -> dict:
    """Guarda un nuevo lead o actualiza uno existente."""
    leads = load_leads()
    
    # Buscar lead existente por session_id o telegram_username
    existing_lead = None
    for lead in leads:
        if session_id and lead.get("session_id") == session_id:
            existing_lead = lead
            break
        if telegram_username and lead.get("telegram_username") == telegram_username:
            existing_lead = lead
            break
    
    score, temperature = calculate_lead_score(lead_data)
    
    if existing_lead:
        # Actualizar lead existente
        existing_lead.update({
            "name": lead_data.get("name") or existing_lead.get("name"),
            "phone": lead_data.get("phone") or existing_lead.get("phone"),
            "email": lead_data.get("email") or existing_lead.get("email"),
            "budget_min": lead_data.get("budget_min") or existing_lead.get("budget_min"),
            "budget_max": lead_data.get("budget_max") or existing_lead.get("budget_max"),
            "zone": lead_data.get("zone") or existing_lead.get("zone"),
            "property_type": lead_data.get("property_type") or existing_lead.get("property_type"),
            "bedrooms": lead_data.get("bedrooms") or existing_lead.get("bedrooms"),
            "urgency": lead_data.get("urgency") or existing_lead.get("urgency"),
            "interested_property": lead_data.get("interested_property") or existing_lead.get("interested_property"),
            "wants_visit": lead_data.get("wants_visit") or existing_lead.get("wants_visit"),
            "score": score,
            "temperature": temperature,
            "conversation_history": conversation_history,
            "updated_at": datetime.now().isoformat()
        })
        save_leads(leads)
        return existing_lead
    else:
        # Crear nuevo lead
        new_lead = {
            "id": str(uuid.uuid4()),
            "channel": channel,
            "session_id": session_id,
            "telegram_username": telegram_username,
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
            "conversation_history": conversation_history,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        leads.append(new_lead)
        save_leads(leads)
        return new_lead


def get_all_leads() -> list:
    """Retorna todos los leads."""
    return load_leads()


def get_lead_by_id(lead_id: str) -> Optional[dict]:
    """Busca un lead por su ID."""
    leads = load_leads()
    for lead in leads:
        if lead["id"] == lead_id:
            return lead
    return None
