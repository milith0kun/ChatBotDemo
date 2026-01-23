/**
 * Hook para manejar sesiones WebRTC con OpenAI Realtime API.
 * Proporciona comunicación de voz en tiempo real con latencia ultra-baja.
 */
import { useState, useRef, useEffect, useCallback } from 'react';

// Estados de la conexión
const CONNECTION_STATES = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error'
};

/**
 * Genera un UUID v4 simple
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Hook principal para WebRTC con OpenAI Realtime API
 */
export default function useWebRTC(options = {}) {
    const {
        voice = 'shimmer',
        onMessage,
        onError,
        onStatusChange
    } = options;

    // Estados
    const [status, setStatus] = useState('');
    const [connectionState, setConnectionState] = useState(CONNECTION_STATES.IDLE);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [currentVolume, setCurrentVolume] = useState(0);
    const [conversation, setConversation] = useState([]);
    const [isMuted, setIsMuted] = useState(false);

    // Referencias
    const peerConnectionRef = useRef(null);
    const dataChannelRef = useRef(null);
    const audioStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const volumeIntervalRef = useRef(null);
    const audioElementRef = useRef(null);

    // Para tracking de mensajes efímeros del usuario
    const ephemeralUserIdRef = useRef(null);

    // Actualizar estado de conexión
    const updateConnectionState = useCallback((state) => {
        setConnectionState(state);
        onStatusChange?.(state);
    }, [onStatusChange]);

    // Actualizar status
    const updateStatus = useCallback((text) => {
        setStatus(text);
        console.log(`[WebRTC] ${text}`);
    }, []);

    /**
     * Obtener token efímero del backend
     */
    const getEphemeralToken = async () => {
        try {
            const response = await fetch('/api/realtime/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error ${response.status}`);
            }

            const data = await response.json();
            return data.client_secret?.value || data.client_secret;
        } catch (err) {
            console.error('[WebRTC] Error obteniendo token:', err);
            throw err;
        }
    };

    /**
     * Crear o obtener ID de mensaje efímero del usuario
     */
    const getOrCreateEphemeralUserId = () => {
        if (!ephemeralUserIdRef.current) {
            ephemeralUserIdRef.current = generateUUID();

            const newMessage = {
                id: ephemeralUserIdRef.current,
                role: 'user',
                text: '',
                timestamp: new Date().toISOString(),
                isFinal: false,
                status: 'speaking'
            };

            setConversation(prev => [...prev, newMessage]);
        }
        return ephemeralUserIdRef.current;
    };

    /**
     * Actualizar mensaje efímero del usuario
     */
    const updateEphemeralUserMessage = (partial) => {
        const ephemeralId = ephemeralUserIdRef.current;
        if (!ephemeralId) return;

        setConversation(prev =>
            prev.map(msg =>
                msg.id === ephemeralId ? { ...msg, ...partial } : msg
            )
        );
    };

    /**
     * Limpiar mensaje efímero
     */
    const clearEphemeralUserMessage = () => {
        ephemeralUserIdRef.current = null;
    };

    /**
     * Manejar mensajes del canal de datos
     */
    const handleDataChannelMessage = useCallback(async (event) => {
        try {
            const msg = JSON.parse(event.data);
            console.log('[WebRTC] Mensaje recibido:', msg.type);

            switch (msg.type) {
                // Usuario empezó a hablar
                case 'input_audio_buffer.speech_started':
                    getOrCreateEphemeralUserId();
                    updateEphemeralUserMessage({ status: 'speaking' });
                    break;

                // Usuario dejó de hablar
                case 'input_audio_buffer.speech_stopped':
                    updateEphemeralUserMessage({ status: 'processing' });
                    break;

                // Audio enviado para procesar
                case 'input_audio_buffer.committed':
                    updateEphemeralUserMessage({
                        text: 'Procesando...',
                        status: 'processing'
                    });
                    break;

                // Transcripción parcial del usuario
                case 'conversation.item.input_audio_transcription':
                    updateEphemeralUserMessage({
                        text: msg.transcript || 'Hablando...',
                        status: 'speaking',
                        isFinal: false
                    });
                    break;

                // Transcripción final del usuario
                case 'conversation.item.input_audio_transcription.completed':
                    updateEphemeralUserMessage({
                        text: msg.transcript || '',
                        isFinal: true,
                        status: 'final'
                    });
                    clearEphemeralUserMessage();

                    // Notificar al padre
                    onMessage?.({
                        type: 'user',
                        text: msg.transcript
                    });
                    break;

                // Respuesta parcial del asistente (streaming)
                case 'response.audio_transcript.delta':
                    setConversation(prev => {
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.isFinal) {
                            // Agregar al mensaje existente
                            const updated = [...prev];
                            updated[updated.length - 1] = {
                                ...lastMsg,
                                text: lastMsg.text + msg.delta
                            };
                            return updated;
                        } else {
                            // Nuevo mensaje del asistente
                            return [...prev, {
                                id: generateUUID(),
                                role: 'assistant',
                                text: msg.delta,
                                timestamp: new Date().toISOString(),
                                isFinal: false
                            }];
                        }
                    });
                    break;

                // Respuesta completa del asistente
                case 'response.audio_transcript.done':
                    setConversation(prev => {
                        if (prev.length === 0) return prev;
                        const updated = [...prev];
                        const lastMsg = updated[updated.length - 1];
                        if (lastMsg?.role === 'assistant') {
                            updated[updated.length - 1] = {
                                ...lastMsg,
                                isFinal: true
                            };
                            // Notificar al padre
                            onMessage?.({
                                type: 'assistant',
                                text: lastMsg.text
                            });
                        }
                        return updated;
                    });
                    break;

                // Errores
                case 'error':
                    console.error('[WebRTC] Error del servidor:', msg.error);
                    onError?.(msg.error?.message || 'Error del servidor');
                    break;

                default:
                    // Ignorar otros tipos de mensajes
                    break;
            }
        } catch (error) {
            console.error('[WebRTC] Error procesando mensaje:', error);
        }
    }, [onMessage, onError]);

    /**
     * Configurar canal de datos al abrirse
     */
    const configureDataChannel = useCallback((dataChannel) => {
        // Enviar configuración de sesión
        const sessionUpdate = {
            type: 'session.update',
            session: {
                modalities: ['text', 'audio'],
                input_audio_transcription: {
                    model: 'whisper-1'
                }
            }
        };
        dataChannel.send(JSON.stringify(sessionUpdate));
        console.log('[WebRTC] Configuración de sesión enviada');

        // Solicitar saludo inicial
        const createResponse = {
            type: 'response.create'
        };
        dataChannel.send(JSON.stringify(createResponse));
    }, []);

    /**
     * Calcular volumen del audio entrante
     */
    const getVolume = useCallback(() => {
        if (!analyserRef.current) return 0;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const float = (dataArray[i] - 128) / 128;
            sum += float * float;
        }
        return Math.sqrt(sum / dataArray.length);
    }, []);

    /**
     * Iniciar sesión WebRTC
     */
    const startSession = useCallback(async () => {
        try {
            updateConnectionState(CONNECTION_STATES.CONNECTING);
            updateStatus('Solicitando acceso al micrófono...');

            // Obtener acceso al micrófono
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            audioStreamRef.current = stream;
            console.log('[WebRTC] Micrófono obtenido');

            updateStatus('Obteniendo token de sesión...');
            const ephemeralToken = await getEphemeralToken();
            console.log('[WebRTC] Token obtenido');

            updateStatus('Estableciendo conexión...');

            // Crear conexión WebRTC
            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc;

            // Elemento de audio para reproducir respuestas
            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            audioElementRef.current = audioEl;

            // Manejar audio entrante del asistente
            pc.ontrack = (event) => {
                console.log('[WebRTC] Track recibido');
                audioEl.srcObject = event.streams[0];

                // Configurar análisis de volumen
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const src = audioCtx.createMediaStreamSource(event.streams[0]);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                src.connect(analyser);
                analyserRef.current = analyser;

                // Monitorear volumen
                volumeIntervalRef.current = setInterval(() => {
                    setCurrentVolume(getVolume());
                }, 100);
            };

            // Crear canal de datos para transcripciones
            const dataChannel = pc.createDataChannel('oai-events');
            dataChannelRef.current = dataChannel;

            dataChannel.onopen = () => {
                console.log('[WebRTC] Canal de datos abierto');
                configureDataChannel(dataChannel);
            };

            dataChannel.onmessage = handleDataChannelMessage;

            dataChannel.onerror = (error) => {
                console.error('[WebRTC] Error en canal de datos:', error);
                onError?.('Error en la conexión de datos');
            };

            // Agregar track de audio local (micrófono)
            pc.addTrack(stream.getTracks()[0]);

            // Crear oferta SDP
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Enviar oferta a OpenAI
            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview-2024-12-17';

            const response = await fetch(`${baseUrl}?model=${model}&voice=${voice}`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    'Authorization': `Bearer ${ephemeralToken}`,
                    'Content-Type': 'application/sdp'
                }
            });

            if (!response.ok) {
                throw new Error(`Error de conexión: ${response.status}`);
            }

            // Establecer respuesta SDP
            const answerSdp = await response.text();
            await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

            setIsSessionActive(true);
            updateConnectionState(CONNECTION_STATES.CONNECTED);
            updateStatus('Conectado - Habla para comenzar');
            console.log('[WebRTC] Sesión establecida exitosamente');

        } catch (err) {
            console.error('[WebRTC] Error iniciando sesión:', err);
            updateStatus(`Error: ${err.message}`);
            updateConnectionState(CONNECTION_STATES.ERROR);
            onError?.(err.message);
            stopSession();
        }
    }, [voice, updateStatus, updateConnectionState, configureDataChannel, handleDataChannelMessage, getVolume, onError]);

    /**
     * Detener sesión
     */
    const stopSession = useCallback(() => {
        console.log('[WebRTC] Deteniendo sesión...');

        // Cerrar canal de datos
        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }

        // Cerrar conexión WebRTC
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Detener contexto de audio
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Detener stream de micrófono
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }

        // Limpiar elemento de audio
        if (audioElementRef.current) {
            audioElementRef.current.srcObject = null;
            audioElementRef.current = null;
        }

        // Detener monitoreo de volumen
        if (volumeIntervalRef.current) {
            clearInterval(volumeIntervalRef.current);
            volumeIntervalRef.current = null;
        }

        analyserRef.current = null;
        ephemeralUserIdRef.current = null;

        setCurrentVolume(0);
        setIsSessionActive(false);
        setConversation([]);
        updateConnectionState(CONNECTION_STATES.IDLE);
        updateStatus('Sesión terminada');
    }, [updateConnectionState, updateStatus]);

    /**
     * Toggle mute del micrófono
     */
    const toggleMute = useCallback(() => {
        if (audioStreamRef.current) {
            const newMuted = !isMuted;
            audioStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newMuted;
            });
            setIsMuted(newMuted);
            console.log(`[WebRTC] Micrófono ${newMuted ? 'muteado' : 'activado'}`);
        }
    }, [isMuted]);

    /**
     * Enviar mensaje de texto (opcional)
     */
    const sendTextMessage = useCallback((text) => {
        if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
            console.error('[WebRTC] Canal de datos no disponible');
            return;
        }

        const messageId = generateUUID();

        // Agregar a conversación
        setConversation(prev => [...prev, {
            id: messageId,
            role: 'user',
            text,
            timestamp: new Date().toISOString(),
            isFinal: true,
            status: 'final'
        }]);

        // Enviar por canal de datos
        const message = {
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [{
                    type: 'input_text',
                    text: text
                }]
            }
        };

        dataChannelRef.current.send(JSON.stringify(message));
        dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
    }, []);

    // Cleanup al desmontar
    useEffect(() => {
        return () => stopSession();
    }, [stopSession]);

    return {
        // Estado
        status,
        connectionState,
        isSessionActive,
        currentVolume,
        conversation,
        isMuted,

        // Acciones
        startSession,
        stopSession,
        toggleMute,
        sendTextMessage,

        // Constantes
        CONNECTION_STATES
    };
}
