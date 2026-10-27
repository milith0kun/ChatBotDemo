import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Envía un mensaje al chat y obtiene respuesta del agente
 * @param {string} message - Mensaje del usuario
 * @param {string|null} sessionId - ID de sesión existente
 * @returns {Promise<{response: string, session_id: string, lead_data: object|null}>}
 */
export const sendChatMessage = async (message, sessionId = null) => {
    try {
        const response = await api.post('/api/chat', {
            message,
            session_id: sessionId,
        });
        return response.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

/**
 * Obtiene todos los leads
 * @returns {Promise<{total: number, leads: array}>}
 */
export const getLeads = async () => {
    try {
        const response = await api.get('/api/leads');
        return response.data;
    } catch (error) {
        console.error('Error fetching leads:', error);
        throw error;
    }
};

/**
 * Obtiene un lead por ID
 * @param {string} leadId - ID del lead
 * @returns {Promise<object>}
 */
export const getLeadById = async (leadId) => {
    try {
        const response = await api.get(`/api/leads/${leadId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching lead:', error);
        throw error;
    }
};

/**
 * Obtiene todas las propiedades inmobiliarias
 * @returns {Promise<{total: number, properties: array}>}
 */
export const getProperties = async () => {
    try {
        const response = await api.get('/api/properties');
        return response.data;
    } catch (error) {
        console.error('Error fetching properties:', error);
        throw error;
    }
};

/**
 * Consulta el estado de conexión de WhatsApp (Evolution API)
 * @returns {Promise<{ok: boolean, instancia: string, estado: string, esta_conectado: boolean, telefono?: string, nombre_perfil?: string}>}
 */
export const obtenerEstadoWhatsApp = async () => {
    try {
        const response = await api.get('/api/whatsapp/estado');
        return response.data;
    } catch (error) {
        console.error('Error fetching WhatsApp status:', error);
        throw error;
    }
};

/**
 * Obtiene el código QR en base64 para vincular WhatsApp
 * @returns {Promise<{ok: boolean, codigo_qr_base64: string, codigo_emparejamiento?: string}>}
 */
export const obtenerQrWhatsApp = async () => {
    try {
        const response = await api.get('/api/whatsapp/qr');
        return response.data;
    } catch (error) {
        console.error('Error fetching WhatsApp QR:', error);
        throw error;
    }
};

/**
 * Reinicia la sesión de WhatsApp en Evolution API y obtiene un QR fresco
 * @returns {Promise<{ok: boolean, codigo_qr_base64?: string}>}
 */
export const reiniciarWhatsApp = async () => {
    try {
        const response = await api.post('/api/whatsapp/reiniciar');
        return response.data;
    } catch (error) {
        console.error('Error restarting WhatsApp session:', error);
        throw error;
    }
};

/**
 * Configura la URL del webhook en Evolution API
 * @param {string} urlWebhook
 */
export const configurarWebhookWhatsApp = async (urlWebhook) => {
    try {
        const response = await api.post('/api/whatsapp/configurar-webhook', {
            webhook_url: urlWebhook
        });
        return response.data;
    } catch (error) {
        console.error('Error setting WhatsApp webhook:', error);
        throw error;
    }
};

/**
 * Envía un mensaje manual de WhatsApp desde el panel (prueba o contacto)
 * @param {string} numero
 * @param {string} mensaje
 */
export const enviarMensajeWhatsAppPrueba = async (numero, mensaje) => {
    try {
        const response = await api.post('/api/whatsapp/enviar-mensaje', {
            numero,
            mensaje
        });
        return response.data;
    } catch (error) {
        console.error('Error sending test WhatsApp message:', error);
        throw error;
    }
};

/**
 * Verifica el estado de la API
 * @returns {Promise<{status: string, message: string}>}
 */
export const checkHealth = async () => {
    try {
        const response = await api.get('/api/health');
        return response.data;
    } catch (error) {
        console.error('Error checking health:', error);
        throw error;
    }
};

/**
 * Envía audio grabado al backend para transcripción y procesamiento
 * @param {Blob} audioBlob - Blob de audio grabado
 * @param {string|null} sessionId - ID de sesión existente
 * @returns {Promise<{transcribed_text: string, bot_response: string, session_id: string}>}
 */
export const sendVoiceMessage = async (audioBlob, sessionId = null) => {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        if (sessionId) {
            formData.append('session_id', sessionId);
        }

        const response = await axios.post(`${API_URL}/api/voice/transcribe`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error sending voice message:', error);
        throw error;
    }
};

/**
 * Obtiene audio sintetizado del texto de respuesta
 * @param {string} text - Texto a sintetizar
 * @returns {Promise<Blob>} - Blob de audio MP3
 */
export const getVoiceResponse = async (text) => {
    try {
        const response = await axios.post(
            `${API_URL}/api/voice/synthesize`,
            { text },
            { responseType: 'blob' }
        );
        return response.data;
    } catch (error) {
        console.error('Error getting voice response:', error);
        throw error;
    }
};

export default api;

