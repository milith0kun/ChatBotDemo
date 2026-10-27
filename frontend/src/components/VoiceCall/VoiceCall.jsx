import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useWebRTC from '../../hooks/useWebRTC';
import './VoiceCall.css';

// ==================== ICONOS VECTORIALES DE ALTA GAMA ====================

const IconoVolver = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const IconoTelefono = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const IconoColgar = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
        <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
);

const IconoMicrofono = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const IconoMicrofonoSilenciado = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const IconoOndaVoz = () => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5v14M7 5v14M22 10v4M2 10v4" />
    </svg>
);

const IconoChispas = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

// ==================== COMPONENTE PRINCIPAL ====================

const VoiceCall = ({ onCallEnd, onMessage }) => {
    const navigate = useNavigate();
    const [callDuration, setCallDuration] = useState(0);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    // Hook WebRTC
    const {
        status,
        connectionState,
        isSessionActive,
        currentVolume,
        conversation,
        isMuted,
        startSession,
        stopSession,
        toggleMute,
        CONNECTION_STATES
    } = useWebRTC({
        voice: 'shimmer',
        onMessage: (msg) => {
            console.log('[VoiceCall] Mensaje recibido:', msg);
            onMessage?.(msg);
        },
        onError: (err) => {
            console.error('[VoiceCall] Error de sesión:', err);
            setError(err);
        }
    });

    // Temporizador de duración de llamada
    useEffect(() => {
        if (isSessionActive) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isSessionActive]);

    // Formatear duración en mm:ss
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Iniciar llamada
    const handleStartCall = async () => {
        setError(null);
        setCallDuration(0);
        await startSession();
    };

    // Finalizar llamada
    const handleEndCall = () => {
        stopSession();
        onCallEnd?.({ duration: callDuration });
    };

    // Volver a la vista anterior o al inicio
    const handleVolver = () => {
        if (isSessionActive) {
            stopSession();
        }
        navigate('/');
    };

    // Mensajes recientes
    const getLastBotMessage = () => {
        const assistantMessages = conversation.filter(m => m.role === 'assistant');
        return assistantMessages[assistantMessages.length - 1]?.text || '';
    };

    const getLastUserMessage = () => {
        const userMessages = conversation.filter(m => m.role === 'user');
        return userMessages[userMessages.length - 1]?.text || '';
    };

    // Estado visual legible
    const getStateInfo = () => {
        switch (connectionState) {
            case CONNECTION_STATES.IDLE:
                return { text: 'Disponible', color: '#94a3b8', state: 'idle' };
            case CONNECTION_STATES.CONNECTING:
                return { text: status || 'Conectando con el asesor...', color: '#f59e0b', state: 'connecting' };
            case CONNECTION_STATES.CONNECTED:
                const lastMsg = conversation[conversation.length - 1];
                if (lastMsg?.role === 'user' && !lastMsg.isFinal) {
                    return { text: 'Escuchando tu voz...', color: '#10b981', state: 'listening' };
                } else if (lastMsg?.role === 'assistant' && !lastMsg.isFinal) {
                    return { text: 'InmoBot respondiendo...', color: '#c4a35a', state: 'speaking' };
                } else if (currentVolume > 0.1) {
                    return { text: 'InmoBot hablando...', color: '#c4a35a', state: 'speaking' };
                }
                return { text: 'En línea • Escuchando...', color: '#10b981', state: 'listening' };
            case CONNECTION_STATES.ERROR:
                return { text: 'Error de conexión', color: '#ef4444', state: 'error' };
            default:
                return { text: '', color: '#94a3b8', state: 'idle' };
        }
    };

    const stateInfo = getStateInfo();
    const containerClass = `voice-call-container state-${stateInfo.state}`;

    return (
        <div className={containerClass}>
            {/* Iluminación de fondo cinemática */}
            <div className="fondo-aura-ambiente" aria-hidden="true" />

            {/* Cabecera Flotante de Cristal */}
            <header className="voice-call-header">
                <div className="header-left">
                    <button className="back-button" onClick={handleVolver} title="Volver al chat">
                        <IconoVolver />
                        <span className="back-button-texto">Volver</span>
                    </button>
                    <div className="header-brand">
                        <span className="brand-title">InmoBot AI</span>
                        <span className="brand-dot-separator">•</span>
                        <span className="brand-mode">Asesoría de Voz</span>
                    </div>
                </div>

                <div className="header-right">
                    {isSessionActive ? (
                        <div className="indicador-llamada-activa">
                            <span className="punto-grabacion-activo" />
                            <span className="call-duration">{formatDuration(callDuration)}</span>
                        </div>
                    ) : (
                        <div className="insignia-disponible">
                            <span className="punto-verde-disponible" />
                            <span>Línea Directa</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="voice-call-main">
                {!isSessionActive ? (
                    /* Vista de Reposo - Lista para Presentación Ejecutiva */
                    <div className="idle-content">
                        {/* Orbe Central Escultórico */}
                        <div className="avatar-section">
                            <div className="avatar-container">
                                <div className="orbe-halo-exterior" aria-hidden="true" />
                                <div className="orbe-borde-doble" aria-hidden="true" />
                                <div className="avatar-orb">
                                    <IconoOndaVoz />
                                </div>
                            </div>
                        </div>

                        {/* Textos de Alta Gama para Presentación */}
                        <div className="bloque-presentacion-textos">
                            <div className="etiqueta-presentacion">
                                <IconoChispas />
                                <span>Asesoría Inmobiliaria en Tiempo Real</span>
                            </div>

                            <h1 className="idle-title">Asesor Inmobiliario por Voz</h1>

                            <p className="idle-subtitle">
                                Conversación fluida con inteligencia contextual para consultar propiedades exclusivas en España, evaluar oportunidades de inversión y agendar visitas privadas al instante.
                            </p>

                            {/* Sugerencias de Preguntas para Demostración */}
                            <div className="sugerencias-presentacion">
                                <span className="sugerencia-chip">"¿Qué villas con piscina tenéis disponibles?"</span>
                                <span className="sugerencia-chip">"Busco un ático en Madrid o Barcelona"</span>
                                <span className="sugerencia-chip">"Quiero invertir en la Costa del Sol"</span>
                            </div>
                        </div>

                        {/* Botón Principal de Inicio de Llamada */}
                        <div className="contenedor-accion-llamada">
                            <button
                                className="boton-iniciar-llamada"
                                onClick={handleStartCall}
                                type="button"
                                aria-label="Iniciar llamada de voz con InmoBot"
                            >
                                <div className="icono-llamada-wrapper">
                                    <IconoTelefono />
                                </div>
                                <span className="texto-boton-llamada">Iniciar Conversación</span>
                            </button>
                            <p className="pie-accion-llamada">
                                Pulsa para hablar directamente con el asesor inmobiliario
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Vista de Llamada Activa */
                    <div className="llamada-activa-content">
                        <div className="avatar-section">
                            <div className="avatar-container activa">
                                <div
                                    className="avatar-rings"
                                    style={{
                                        transform: `scale(${1 + currentVolume * 0.4})`,
                                        opacity: 0.35 + currentVolume * 0.65
                                    }}
                                    aria-hidden="true"
                                >
                                    <div className="avatar-ring" />
                                    <div className="avatar-ring" />
                                    <div className="avatar-ring" />
                                </div>

                                <div
                                    className="avatar-orb activa"
                                    style={{
                                        boxShadow: currentVolume > 0.08
                                            ? `0 0 ${25 + currentVolume * 45}px rgba(196, 163, 90, 0.45), 0 0 ${45 + currentVolume * 65}px rgba(13, 79, 79, 0.6)`
                                            : undefined
                                    }}
                                >
                                    <div className="ecualizador-onda-activo" aria-hidden="true">
                                        <span className="barra-onda" style={{ height: `${25 + currentVolume * 70}%` }} />
                                        <span className="barra-onda" style={{ height: `${40 + currentVolume * 100}%` }} />
                                        <span className="barra-onda" style={{ height: `${30 + currentVolume * 85}%` }} />
                                        <span className="barra-onda" style={{ height: `${50 + currentVolume * 110}%` }} />
                                        <span className="barra-onda" style={{ height: `${25 + currentVolume * 65}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Estado y Transcripción en Tarjetas de Cristal */}
                        <div className="status-section">
                            <div className="insignia-estado-enlace">
                                <span className="punto-pulso-estado" style={{ backgroundColor: stateInfo.color }} />
                                <span className="status-label" style={{ color: stateInfo.color }}>
                                    {stateInfo.text}
                                </span>
                            </div>

                            {getLastBotMessage() && (
                                <p className="status-message">
                                    "{getLastBotMessage()}"
                                </p>
                            )}
                        </div>

                        {getLastUserMessage() && (
                            <div className="transcript-section">
                                <div className="transcript-bubble">
                                    <span className="transcript-label">Tu consulta</span>
                                    <p className="transcript-text user">{getLastUserMessage()}</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Controles Flotantes al Pie (Sin división brusca) */}
            {isSessionActive && (
                <footer className="voice-call-controls-activa">
                    <div className="isla-controles-flotante">
                        <button
                            className={`control-button mute ${isMuted ? 'active' : ''}`}
                            onClick={toggleMute}
                            title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                            type="button"
                        >
                            {isMuted ? <IconoMicrofonoSilenciado /> : <IconoMicrofono />}
                            <span className="control-texto-boton">{isMuted ? 'Silenciado' : 'Silenciar'}</span>
                        </button>

                        <div className="vumetro-volumen-contenedor" title="Sensibilidad de voz">
                            <div
                                className="vumetro-volumen-barra"
                                style={{ width: `${Math.min(currentVolume * 220, 100)}%` }}
                            />
                        </div>

                        <button
                            className="control-button end-call"
                            onClick={handleEndCall}
                            title="Finalizar llamada"
                            type="button"
                        >
                            <IconoColgar />
                            <span className="control-texto-boton">Finalizar</span>
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default VoiceCall;
