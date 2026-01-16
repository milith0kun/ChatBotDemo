# Manual de Usuario y Pruebas - InmoBot AI

Bienvenido a **InmoBot AI**, su asistente inmobiliario inteligente. Este documento le servirá de guía para evaluar las funcionalidades del sistema y realizar pruebas efectivas.

## 🔗 Accesos del Sistema

- **Chat Web (Cliente)**: [https://chat-demo-web.ecosdelseo.com](https://chat-demo-web.ecosdelseo.com)
- **Dashboard de Administración**: [https://chat-demo-web.ecosdelseo.com/dashboard](https://chat-demo-web.ecosdelseo.com/dashboard)
- **Bot de Telegram**: [https://t.me/EdmilSairebot](https://t.me/EdmilSairebot)

---

## 🤖 ¿Qué puede hacer este Bot?

A diferencia de un chat tradicional, InmoBot utiliza **Inteligencia Artificial (GPT-4o)** para:
1.  **Entender el lenguaje natural**: No necesita comandos rígidos, hable como si fuera una persona.
2.  **Vender el inventario**: Conoce perfectamente las propiedades disponibles y sus detalles.
3.  **Perfilado automático**: Detecta sutilmente el presupuesto, zona y necesidades del cliente sin parecer un interrogatorio.
4.  **Captura de Leads**: Guarda automáticamente la información de contacto en un Dashboard centralizado.

---

## 🧪 Guía de Pruebas (Escenarios Recomendados)

Siga estos "guiones" para ver al bot en acción:

### Escenario 1: El Cliente Curioso (Ver Catálogo)
*Objetivo: Verificar que el bot muestra el inventario fácilmente.*

1.  **Usted:** "Hola, buenas tardes."
2.  **Bot:** Le saludará amablemente.
3.  **Usted:** "Quiero ver qué propiedades tienen disponibles" o simplemente "¿Qué tienen?".
4.  **Resultado:** El bot desplegará el catálogo completo con precios y fotos referenciales.

### Escenario 2: Búsqueda Específica
*Objetivo: Probar la inteligencia de búsqueda.*

1.  **Usted:** "Estoy buscando un departamento en San Isidro, tengo un presupuesto de 260 mil dólares."
2.  **Resultado:** El bot le recomendará específicamente el **"Departamento Moderno en San Isidro"** (que cuesta $250k) y le explicará por qué encaja con su pedido.

### Escenario 3: La Captura de Datos (Lead)
*Objetivo: Ver cómo el bot guarda la información en el Dashboard.*

1.  **Usted:** "Me interesa, ¿podría visitarlo?"
2.  **Bot:** Le pedirá sus datos para coordinar.
3.  **Usted:** "Claro, soy Juan Pérez y mi celular es 999 888 777."
4.  **Resultado:**
    *   El bot confirmará el registro.
    *   📌 **Vaya al Dashboard**: Verá aparecer a "Juan Pérez" con estado **🔥 Caliente** (porque dio teléfono e intención de visita).

### Escenario 4: Prueba en Telegram
*Objetivo: Probar la omnicanalidad.*

1.  Abra el bot en Telegram.
2.  **Usted:** "¿Tienen alguna casa con jardín?"
3.  **Resultado:** El bot le responderá igual que en la web. La conversación también se registrará en el Dashboard indicando que vino desde Telegram.

---

## 📊 ¿Cómo leer el Dashboard?

El panel de control clasifica a los clientes automáticamente:

*   **Score (Puntaje)**: Del 0 al 100. Sube si el cliente da su nombre (+25), teléfono (+30), presupuesto (+10), etc.
*   **Temperatura**:
    *   🔥 **Caliente**: Cliente listo para comprar (Score alto).
    *   🌤️ **Tibio**: Cliente interesado preguntando detalles.
    *   ❄️ **Frío**: Cliente que solo saludó.

---
*Nota: Al ser una versión de demostración, los datos de los leads pueden reiniciarse si se actualiza el sistema. En la versión final de producción, estos datos quedan guardados permanentemente.*
