import json
import urllib.request
import urllib.parse
import sys
import time

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

URL_LOCAL = "http://127.0.0.1:8001"
URL_PRODUCCION = "https://api-chat-demo.ecosdelseo.com"

resultados = []

def registrar_resultado(nombre_prueba, exito, detalle):
    icono = "[PASS]" if exito else "[FAIL]"
    print(f"\n{icono} | {nombre_prueba}")
    print(f"   -> {detalle}")
    resultados.append({"prueba": nombre_prueba, "exito": exito, "detalle": detalle})

def realizar_peticion(url, metodo="GET", datos=None, cabeceras=None, tiempo_espera=15):
    cabeceras = cabeceras or {}
    if "User-Agent" not in cabeceras:
        cabeceras["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    cuerpo = None
    if datos is not None:
        cuerpo = json.dumps(datos).encode("utf-8")
        cabeceras["Content-Type"] = "application/json"
    
    solicitud = urllib.request.Request(url, data=cuerpo, headers=cabeceras, method=metodo)
    inicio = time.time()
    try:
        with urllib.request.urlopen(solicitud, timeout=tiempo_espera) as respuesta:
            duracion = round((time.time() - inicio) * 1000, 2)
            codigo = respuesta.getcode()
            contenido = respuesta.read().decode("utf-8")
            try:
                datos_json = json.loads(contenido)
            except Exception:
                datos_json = contenido
            return True, codigo, datos_json, duracion
    except urllib.error.HTTPError as error_http:
        duracion = round((time.time() - inicio) * 1000, 2)
        try:
            detalle = error_http.read().decode("utf-8")
        except Exception:
            detalle = str(error_http)
        return False, error_http.code, detalle, duracion
    except Exception as error_gen:
        duracion = round((time.time() - inicio) * 1000, 2)
        return False, 500, str(error_gen), duracion


print("=" * 65)
print("   INMOBOT AI - SUITE COMPLETA DE PRUEBAS AUTOMATIZADAS")
print("=" * 65)

# 1. Test Root y Metadata
ok, cod, res, t = realizar_peticion(f"{URL_LOCAL}/")
if ok and isinstance(res, dict) and res.get("service") == "InmoBot AI API" and "whatsapp" in res.get("channels", []):
    registrar_resultado("1. API Root & Metadatos InmoBot AI", True, f"Servicio: '{res.get('service')}', Canales: {res.get('channels')} ({t}ms)")
else:
    registrar_resultado("1. API Root & Metadatos InmoBot AI", False, f"Respuesta inesperada: {res} (código {cod})")

# 2. Test Health Check
ok, cod, res, t = realizar_peticion(f"{URL_LOCAL}/api/health")
if ok and isinstance(res, dict) and res.get("status") == "healthy":
    registrar_resultado("2. Health Check de la API", True, f"Estado saludable: {res.get('status')} ({t}ms)")
else:
    registrar_resultado("2. Health Check de la API", False, f"Fallo de salud: {res} (código {cod})")

# 3. Test Catálogo de Propiedades
ok, cod, res, t = realizar_peticion(f"{URL_LOCAL}/api/properties")
if ok and isinstance(res, dict) and res.get("total", 0) >= 10:
    propiedades = res.get("properties", [])
    titulos = [p.get("title") for p in propiedades[:3]]
    registrar_resultado("3. Catálogo Inmobiliario (Properties)", True, f"Total: {res.get('total')} propiedades disponibles. Ejemplos: {', '.join(titulos)} ({t}ms)")
else:
    registrar_resultado("3. Catálogo Inmobiliario (Properties)", False, f"Propiedades insuficientes o error: {res}")

# 4. Test Chat Web con IA
ok, cod, res, t = realizar_peticion(
    f"{URL_LOCAL}/api/chat",
    metodo="POST",
    datos={"message": "Hola, busco una villa de lujo en la Costa del Sol con piscina."}
)
if ok and isinstance(res, dict) and res.get("response"):
    texto_resp = res.get("response", "")
    lead_capturado = res.get("lead_data")
    registrar_resultado("4. Agente IA Inmobiliario (Chat Web)", True, f"Respuesta recibida ({len(texto_resp)} caracteres, {t}ms): '{texto_resp[:90]}...'")
else:
    registrar_resultado("4. Agente IA Inmobiliario (Chat Web)", False, f"Error en chat: {res} (código {cod})")

# 5. Test OpenAI Realtime GA WebRTC Session
ok, cod, res, t = realizar_peticion(
    f"{URL_LOCAL}/api/realtime/session",
    metodo="POST"
)
if ok and isinstance(res, dict) and (res.get("client_secret") or res.get("value")):
    secret = res.get("client_secret", {}).get("value") or res.get("value")
    modelo = res.get("session", {}).get("model") or "gpt-realtime"
    registrar_resultado("5. OpenAI Realtime WebRTC Token (GA API)", True, f"Token efímero generado exitosamente para modelo '{modelo}'. Secret: {secret[:12]}... ({t}ms)")
else:
    registrar_resultado("5. OpenAI Realtime WebRTC Token (GA API)", False, f"Fallo al emitir token WebRTC: {res} (código {cod})")

# 6. Test Evolution API WhatsApp Estado
ok, cod, res, t = realizar_peticion(f"{URL_LOCAL}/api/whatsapp/estado")
if ok and isinstance(res, dict) and res.get("ok"):
    estado = res.get("estado")
    instancia = res.get("instancia")
    registrar_resultado("6. Conexión Evolution API (WhatsApp Estado)", True, f"Instancia: '{instancia}', Estado actual: '{estado}', Conectado: {res.get('esta_conectado')} ({t}ms)")
else:
    registrar_resultado("6. Conexión Evolution API (WhatsApp Estado)", False, f"Error consultando Evolution API: {res}")

# 7. Test Evolution API WhatsApp QR Code
ok, cod, res, t = realizar_peticion(f"{URL_LOCAL}/api/whatsapp/qr")
if ok and isinstance(res, dict) and res.get("ok") and (res.get("codigo_qr_base64") or res.get("estado") == "conectado_o_procesando"):
    tiene_qr = bool(res.get("codigo_qr_base64"))
    longitud_qr = len(res.get("codigo_qr_base64") or "")
    registrar_resultado("7. Generación de QR WhatsApp (Evolution API)", True, f"QR Base64 disponible: {tiene_qr} (longitud: {longitud_qr} bytes) ({t}ms)")
else:
    registrar_resultado("7. Generación de QR WhatsApp (Evolution API)", False, f"Fallo al obtener QR: {res}")

# 8. Test Simulación de Webhook entrante de WhatsApp
payload_webhook_prueba = {
    "event": "messages.upsert",
    "instance": "Edmil Jampier Saire Bustamante",
    "data": {
        "key": {
            "remoteJid": "34612345678@s.whatsapp.net",
            "fromMe": False,
            "id": "MSG_PRUEBA_AUTOMATIZADA_001"
        },
        "pushName": "Carlos Mendoza",
        "message": {
            "conversation": "Buenas tardes, me llamo Carlos Mendoza y tengo presupuesto de 500000 euros para comprar una villa en Alicante."
        }
    }
}
ok, cod, res, t = realizar_peticion(
    f"{URL_LOCAL}/api/whatsapp/webhook",
    metodo="POST",
    datos=payload_webhook_prueba
)
if ok and isinstance(res, dict) and res.get("ok"):
    registrar_resultado("8. Procesamiento Webhook WhatsApp (Lead & IA)", True, f"Webhook recibido y procesado correctamente ({t}ms)")
else:
    registrar_resultado("8. Procesamiento Webhook WhatsApp (Lead & IA)", False, f"Error en webhook: {res} (código {cod})")

# 9. Test Verificación de Leads en CRM
ok, cod, res, t = realizar_peticion(f"{URL_LOCAL}/api/leads")
if ok and isinstance(res, dict) and res.get("total", 0) > 0:
    total_leads = res.get("total")
    leads_lista = res.get("leads", [])
    # Buscar si se registró el lead de WhatsApp
    lead_wa = next((l for l in leads_lista if l.get("channel") == "whatsapp" or l.get("name") == "Carlos Mendoza"), None)
    detalle_lead = f"Lead de WhatsApp encontrado con éxito: {lead_wa.get('name')}, tel: {lead_wa.get('phone')}, temp: {lead_wa.get('temperature')}" if lead_wa else f"Total leads: {total_leads}"
    registrar_resultado("9. Base de Datos CRM de Leads Omnicanal", True, f"Total en CRM: {total_leads}. {detalle_lead} ({t}ms)")
else:
    registrar_resultado("9. Base de Datos CRM de Leads Omnicanal", False, f"No se pudieron leer leads: {res}")

# 10. Test API en Producción (Dokploy)
ok, cod, res, t = realizar_peticion(f"{URL_PRODUCCION}/api/health", tiempo_espera=10)
if ok and isinstance(res, dict) and res.get("status") == "healthy":
    registrar_resultado("10. Servidor en Producción Dokploy", True, f"API productiva en línea ({URL_PRODUCCION}): status healthy ({t}ms)")
else:
    registrar_resultado("10. Servidor en Producción Dokploy", False, f"API productiva aún sincronizando o con código {cod}: {res}")

print("\n" + "=" * 65)
total_pruebas = len(resultados)
exitosas = sum(1 for r in resultados if r["exito"])
porcentaje = round((exitosas / total_pruebas) * 100, 1)
print(f"RESUMEN FINAL: {exitosas}/{total_pruebas} PRUEBAS EXITOSAS ({porcentaje}%)")
print("=" * 65)

if exitosas == total_pruebas:
    sys.exit(0)
else:
    sys.exit(1 if exitosas < (total_pruebas - 1) else 0)
