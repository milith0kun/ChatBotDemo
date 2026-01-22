import { useState, useRef, useCallback, useEffect } from 'react';
import { sendVoiceMessage, getVoiceResponse } from '../../services/api';
import './VoiceCall.css';

// Iconos SVG para llamada
const PhoneIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const PhoneOffIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
        <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
);

const MicOnIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const MicOffIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);



// Estados de la llamada
const CALL_STATES = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    LISTENING: 'listening',
    PROCESSING: 'processing',
    SPEAKING: 'speaking',
    ENDED: 'ended'
};

const VoiceCall = ({ sessionId: initialSessionId, onCallEnd, onMessage }) => {
    const [callState, setCallState] = useState(CALL_STATES.IDLE);
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [botResponse, setBotResponse] = useState('');
    const [error, setError] = useState(null);
    const [processingStep, setProcessingStep] = useState('');

    // Referencias
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const audioRef = useRef(null);
    const timerRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const analyserRef = useRef(null);
    const audioContextRef = useRef(null);
    const isProcessingRef = useRef(false);
    const callStateRef = useRef(CALL_STATES.IDLE);
    // IMPORTANTE: useRef para sessionId para que siempre tenga el valor actualizado
    const sessionIdRef = useRef(initialSessionId || null);

    // Sincronizar callStateRef con callState
    useEffect(() => {
        callStateRef.current = callState;
        console.log(`🔄 Estado cambiado a: ${callState}`);
    }, [callState]);

    // Configuración ULTRA-RÁPIDA para respuesta inmediata
    const SILENCE_THRESHOLD = 0.035;  // Umbral aumentado para filtrar ruido ambiental (0.026-0.030)
    const SILENCE_DURATION = 400;     // 0.4 segundos - balance entre velocidad y precisión
    const MAX_CALL_DURATION = 300;
    const CHECK_INTERVAL = 50;        // Revisar cada 50ms para máxima velocidad
    const MAX_LISTENING_TIME = 10000; // 10 segundos máximo escuchando sin habla

    // Temporizador de duración
    useEffect(() => {
        if (callState !== CALL_STATES.IDLE && callState !== CALL_STATES.ENDED) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => {
                    if (prev >= MAX_CALL_DURATION) {
                        endCall();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [callState]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Función para limpiar y detener todo
    const cleanupRecording = useCallback(() => {
        console.log('🧹 Limpiando grabación...');

        if (silenceTimerRef.current) {
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.error('Error deteniendo mediaRecorder:', e);
            }
        }
    }, []);

    // Iniciar llamada
    const startCall = useCallback(async () => {
        console.log('📞 Iniciando llamada...');
        setError(null);
        setCallState(CALL_STATES.CONNECTING);
        setBotResponse('');
        setCurrentTranscript('');
        setProcessingStep('');
        isProcessingRef.current = false;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });
            streamRef.current = stream;
            console.log('🎤 Micrófono obtenido');

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.3;
            source.connect(analyserRef.current);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('⏹️ MediaRecorder detenido');

                if (audioChunksRef.current.length > 0 && !isProcessingRef.current) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    console.log(`📦 Audio capturado: ${audioBlob.size} bytes`);

                    if (audioBlob.size > 1000) {
                        await processAudio(audioBlob);
                    } else {
                        console.log('⚠️ Audio muy pequeño, ignorando');
                        // Volver a escuchar
                        setCallState(CALL_STATES.LISTENING);
                        setTimeout(() => startListening(), 500);
                    }
                }

                // Limpiar chunks
                audioChunksRef.current = [];
            };

            // Bienvenida
            setCallState(CALL_STATES.SPEAKING);
            setBotResponse('Hola, soy InmoBot. Dime en qué puedo ayudarte.');
            await playWelcomeMessage();

        } catch (err) {
            console.error('❌ Error iniciando llamada:', err);
            setError('No se pudo acceder al micrófono.');
            setCallState(CALL_STATES.ENDED);
        }
    }, []);

    const playWelcomeMessage = async () => {
        console.log('👋 Reproduciendo bienvenida...');
        try {
            setProcessingStep('Preparando bienvenida...');
            const audioBlob = await getVoiceResponse('Hola, soy InmoBot. Dime en qué puedo ayudarte.');
            setProcessingStep('');
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                console.log('✅ Bienvenida terminada, iniciando escucha...');
                URL.revokeObjectURL(audioUrl);
                setCallState(CALL_STATES.LISTENING);
                setTimeout(() => startListening(), 500);
            };

            audio.onerror = (e) => {
                console.error('❌ Error reproduciendo bienvenida:', e);
                URL.revokeObjectURL(audioUrl);
                setCallState(CALL_STATES.LISTENING);
                setTimeout(() => startListening(), 500);
            };

            await audio.play();
        } catch (err) {
            console.error('❌ Error en bienvenida:', err);
            setCallState(CALL_STATES.LISTENING);
            setTimeout(() => startListening(), 500);
        }
    };

    const startListening = useCallback(() => {
        console.log('👂 Intentando iniciar escucha...');
        console.log(`   - Estado actual: ${callStateRef.current}`);
        console.log(`   - isProcessing: ${isProcessingRef.current}`);
        console.log(`   - isMuted: ${isMuted}`);
        console.log(`   - mediaRecorder existe: ${!!mediaRecorderRef.current}`);

        if (!mediaRecorderRef.current) {
            console.error('❌ No hay mediaRecorder');
            return;
        }

        if (isMuted) {
            console.log('🔇 Está muteado, no escuchar');
            return;
        }

        if (isProcessingRef.current) {
            console.log('⚠️ Ya está procesando, no escuchar');
            return;
        }

        if (callStateRef.current === CALL_STATES.ENDED) {
            console.log('📵 Llamada terminada, no escuchar');
            return;
        }

        // SOLO limpiar el timer de silencio, NO detener el MediaRecorder
        if (silenceTimerRef.current) {
            console.log('🧹 Limpiando timer de silencio...');
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        setCallState(CALL_STATES.LISTENING);
        setCurrentTranscript('');
        setProcessingStep('');
        audioChunksRef.current = [];

        try {
            const currentState = mediaRecorderRef.current.state;
            console.log(`📝 MediaRecorder state: ${currentState}`);

            if (currentState === 'recording') {
                // Ya está grabando, solo reiniciar detección de silencio
                console.log('⚠️ Ya estaba grabando, solo reiniciando detección de silencio');
                detectSilence();
            } else if (currentState === 'inactive') {
                mediaRecorderRef.current.start(100);
                console.log('✅ Grabación iniciada');
                detectSilence();
            } else if (currentState === 'paused') {
                mediaRecorderRef.current.resume();
                console.log('▶️ Grabación resumida');
                detectSilence();
            } else {
                console.log(`⚠️ MediaRecorder en estado inesperado: ${currentState}`);
            }
        } catch (err) {
            console.error('❌ Error iniciando grabación:', err);
            setError('Error al iniciar grabación');
        }
    }, [isMuted]);

    const detectSilence = useCallback(() => {
        if (!analyserRef.current) {
            console.error('❌ No hay analyser');
            return;
        }

        console.log('👁️ Iniciando detección de silencio...');
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let silenceStart = null;
        let hasSpoken = false;
        let consecutiveSpeechChecks = 0;
        let consecutiveSilenceChecks = 0;
        const SPEECH_CHECKS_REQUIRED = 3;  // 3 checks consecutivos para confirmar habla (150ms)
        const SILENCE_CHECKS_REQUIRED = 3;  // 3 checks consecutivos para confirmar silencio (150ms)
        const listeningStartTime = Date.now();

        const checkSilence = () => {
            // Verificar que aún debemos estar escuchando
            if (callStateRef.current !== CALL_STATES.LISTENING) {
                if (silenceTimerRef.current) {
                    clearInterval(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
                return;
            }

            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
                if (silenceTimerRef.current) {
                    clearInterval(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
                return;
            }

            // Timeout: si lleva más de 10s escuchando sin hablar, procesar de todas formas
            const listeningDuration = Date.now() - listeningStartTime;
            if (!hasSpoken && listeningDuration > MAX_LISTENING_TIME) {
                console.log('⏱️ Timeout: 10s sin habla, procesando...');
                stopListening();
                return;
            }

            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength / 255;

            if (average > SILENCE_THRESHOLD) {
                consecutiveSpeechChecks++;
                consecutiveSilenceChecks = 0;  // Resetear contador de silencio

                // Solo considerar que está hablando después de varios checks consecutivos
                if (consecutiveSpeechChecks >= SPEECH_CHECKS_REQUIRED && !hasSpoken) {
                    console.log(`🗣️ Usuario comenzó a hablar (nivel: ${average.toFixed(4)})`);
                    hasSpoken = true;
                    silenceStart = null;
                }
            } else {
                consecutiveSpeechChecks = 0;  // Resetear contador de habla

                if (hasSpoken) {
                    consecutiveSilenceChecks++;

                    // Solo marcar inicio de silencio después de confirmación
                    if (consecutiveSilenceChecks >= SILENCE_CHECKS_REQUIRED && !silenceStart) {
                        silenceStart = Date.now();
                        console.log(`🤫 Silencio confirmado (nivel: ${average.toFixed(4)})`);
                    } else if (silenceStart) {
                        const silenceDuration = Date.now() - silenceStart;
                        if (silenceDuration >= SILENCE_DURATION) {
                            console.log(`✅ Silencio completo (${silenceDuration}ms), procesando...`);
                            stopListening();
                        }
                    }
                }
            }
        };

        silenceTimerRef.current = setInterval(checkSilence, CHECK_INTERVAL);
    }, []);

    const stopListening = useCallback(() => {
        console.log('⏸️ Deteniendo escucha...');

        if (silenceTimerRef.current) {
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            setCallState(CALL_STATES.PROCESSING);
            setProcessingStep('Procesando...');
            mediaRecorderRef.current.stop();
        }
    }, []);

    const processAudio = async (audioBlob) => {
        if (isProcessingRef.current) {
            console.log('⚠️ Ya hay un audio procesándose, ignorando...');
            return;
        }

        console.log('⚙️ Procesando audio...');
        console.log('📋 Session ID actual:', sessionIdRef.current);
        isProcessingRef.current = true;

        try {
            setProcessingStep('Transcribiendo...');

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 30000)
            );

            const responsePromise = sendVoiceMessage(audioBlob, sessionIdRef.current);
            const response = await Promise.race([responsePromise, timeoutPromise]);

            if (response.error) {
                console.error('❌ Error del servidor:', response.error);
                setError(response.error);
                setProcessingStep('');
                isProcessingRef.current = false;
                setCallState(CALL_STATES.LISTENING);
                setTimeout(() => startListening(), 500);
                return;
            }

            console.log('✅ Respuesta recibida:', {
                transcribed: response.transcribed_text,
                response: response.bot_response
            });

            setProcessingStep('Generando respuesta...');
            if (response.session_id) {
                console.log('📥 Nuevo Session ID recibido:', response.session_id);
                sessionIdRef.current = response.session_id;
            }
            setCurrentTranscript(response.transcribed_text || '');
            setBotResponse(response.bot_response || '');

            if (onMessage) {
                onMessage({
                    userMessage: response.transcribed_text,
                    botResponse: response.bot_response,
                    sessionId: response.session_id
                });
            }

            if (response.bot_response) {
                setProcessingStep('Preparando audio...');
                await playBotResponse(response.bot_response);
            } else if (response.filtered) {
                // El backend filtró ruido ambiental
                console.log('🔇 Ruido ambiental filtrado, volviendo a escuchar');
                setProcessingStep('');
                isProcessingRef.current = false;
                setCallState(CALL_STATES.LISTENING);
                setTimeout(() => startListening(), 300);
            } else {
                console.log('⚠️ Sin respuesta del bot, volviendo a escuchar');
                setProcessingStep('');
                isProcessingRef.current = false;
                setCallState(CALL_STATES.LISTENING);
                setTimeout(() => startListening(), 500);
            }
        } catch (err) {
            console.error('❌ Error procesando:', err);
            setError(err.message === 'Timeout' ? 'Tiempo agotado, intenta de nuevo.' : 'Error al procesar.');
            setProcessingStep('');
            isProcessingRef.current = false;
            setCallState(CALL_STATES.LISTENING);
            setTimeout(() => startListening(), 500);
        }
    };

    const playBotResponse = async (text) => {
        console.log('🔊 Reproduciendo respuesta del bot...');
        setCallState(CALL_STATES.SPEAKING);
        setProcessingStep('');

        try {
            const audioBlob = await getVoiceResponse(text);
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onloadedmetadata = () => {
                console.log(`🎵 Audio cargado, duración: ${audio.duration}s`);
            };

            audio.onended = () => {
                console.log('✅✅✅ EVENTO ONENDED EJECUTADO ✅✅✅');
                console.log('✅ Reproducción terminada, volviendo a escuchar...');
                console.log(`   - Estado actual antes de limpiar: ${callStateRef.current}`);
                console.log(`   - isProcessingRef: ${isProcessingRef.current}`);
                console.log(`   - audioRef existe: ${!!audioRef.current}`);

                URL.revokeObjectURL(audioUrl);
                isProcessingRef.current = false;

                // Verificar que no se haya terminado la llamada
                if (callStateRef.current !== CALL_STATES.ENDED) {
                    console.log('   - ✅ Cambiando a LISTENING y programando startListening()');
                    setCallState(CALL_STATES.LISTENING);

                    const timeoutId = setTimeout(() => {
                        console.log('   - ⏰ EJECUTANDO startListening() después del delay de 400ms');
                        console.log(`   - Estado justo antes de startListening: ${callStateRef.current}`);
                        startListening();
                    }, 400);

                    console.log(`   - Timeout programado con ID: ${timeoutId}`);
                } else {
                    console.log('   - ❌ Llamada terminada, NO reiniciar escucha');
                }
            };

            audio.onpause = () => {
                console.log('⏸️ Audio pausado');
            };

            audio.onplay = () => {
                console.log('▶️ Audio comenzó a reproducirse');
            };

            audio.onerror = (e) => {
                console.error('❌ Error reproduciendo audio:', e);
                URL.revokeObjectURL(audioUrl);
                isProcessingRef.current = false;
                setCallState(CALL_STATES.LISTENING);
                setTimeout(() => startListening(), 600);
            };

            await audio.play();
            console.log('▶️ Audio reproduciéndose...');
        } catch (err) {
            console.error('❌ Error en playBotResponse:', err);
            isProcessingRef.current = false;
            setCallState(CALL_STATES.LISTENING);
            setTimeout(() => startListening(), 600);
        }
    };

    const endCall = useCallback(() => {
        console.log('📴 Finalizando llamada...');
        isProcessingRef.current = false;

        if (silenceTimerRef.current) {
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }

        setCallState(CALL_STATES.ENDED);
        setProcessingStep('');

        if (onCallEnd) onCallEnd({ duration: callDuration });
    }, [callDuration, onCallEnd]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newMuted = !prev;
            console.log(`🔇 Mute: ${newMuted}`);
            if (streamRef.current) {
                streamRef.current.getAudioTracks().forEach(track => {
                    track.enabled = !newMuted;
                });
            }
            return newMuted;
        });
    }, []);

    useEffect(() => {
        return () => { endCall(); };
    }, []);

    const getStateInfo = () => {
        switch (callState) {
            case CALL_STATES.IDLE: return { text: 'Listo para llamar', color: '#666' };
            case CALL_STATES.CONNECTING: return { text: 'Conectando...', color: '#f59e0b' };
            case CALL_STATES.LISTENING: return { text: 'Escuchando...', color: '#10b981' };
            case CALL_STATES.PROCESSING: return { text: processingStep || 'Procesando...', color: '#3b82f6' };
            case CALL_STATES.SPEAKING: return { text: 'InmoBot hablando...', color: '#8b5cf6' };
            case CALL_STATES.ENDED: return { text: 'Llamada terminada', color: '#ef4444' };
            default: return { text: '', color: '#666' };
        }
    };

    const stateInfo = getStateInfo();

    // Agregar clase de estado al container
    const containerClass = `voice-call-container state-${callState}`;

    return (
        <div className={containerClass}>
            {/* Header */}
            <header className="voice-call-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => window.history.back()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="header-title">
                        <h1>InmoBot</h1>
                        {callState !== CALL_STATES.IDLE && callState !== CALL_STATES.ENDED && (
                            <span className="call-duration">{formatDuration(callDuration)}</span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="voice-call-main">
                {callState === CALL_STATES.IDLE || callState === CALL_STATES.ENDED ? (
                    /* Idle State */
                    <div className="idle-content">
                        <div className="avatar-section">
                            <div className="avatar-container">
                                <div className="avatar-orb">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <h2 className="idle-title">Asistente Inmobiliario</h2>
                        <p className="idle-subtitle">
                            Habla con InmoBot para encontrar tu propiedad ideal. Solo presiona el botón para comenzar.
                        </p>
                    </div>
                ) : (
                    /* Active Call State */
                    <>
                        <div className="avatar-section">
                            <div className="avatar-container">
                                <div className="avatar-rings">
                                    <div className="avatar-ring"></div>
                                    <div className="avatar-ring"></div>
                                    <div className="avatar-ring"></div>
                                </div>
                                <div className="avatar-orb">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="status-section">
                            <span className="status-label">{stateInfo.text}</span>
                            <p className="status-message">{botResponse || 'Esperando...'}</p>
                            {processingStep && <span className="processing-step">{processingStep}</span>}
                        </div>

                        {currentTranscript && (
                            <div className="transcript-section">
                                <div className="transcript-bubble">
                                    <span className="transcript-label">Tú dijiste</span>
                                    <p className="transcript-text user">{currentTranscript}</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                </svg>
                                {error}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Controls */}
            <footer className="voice-call-controls">
                {callState === CALL_STATES.IDLE || callState === CALL_STATES.ENDED ? (
                    <button className="control-button start-call" onClick={startCall}>
                        <PhoneIcon />
                    </button>
                ) : (
                    <>
                        <button
                            className={`control-button mute ${isMuted ? 'active' : ''}`}
                            onClick={toggleMute}
                        >
                            {isMuted ? <MicOffIcon /> : <MicOnIcon />}
                        </button>

                        <button className="control-button end-call" onClick={endCall}>
                            <PhoneOffIcon />
                        </button>
                    </>
                )}
            </footer>
        </div>
    );
};

export default VoiceCall;

