import { useState, useEffect, useRef } from 'react';
import useWebRTC from '../../hooks/useWebRTC';
import './VoiceCall.css';

// Iconos SVG
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

const VoiceCall = ({ onCallEnd, onMessage }) => {
    const [callDuration, setCallDuration] = useState(0);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    // Hook de WebRTC
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
            console.log('[VoiceCall] Mensaje:', msg);
            onMessage?.(msg);
        },
        onError: (err) => {
            console.error('[VoiceCall] Error:', err);
            setError(err);
        }
    });

    // Temporizador de duración
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

    // Formatear duración
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Manejar inicio de llamada
    const handleStartCall = async () => {
        setError(null);
        setCallDuration(0);
        await startSession();
    };

    // Manejar fin de llamada
    const handleEndCall = () => {
        stopSession();
        onCallEnd?.({ duration: callDuration });
    };

    // Obtener último mensaje del bot
    const getLastBotMessage = () => {
        const assistantMessages = conversation.filter(m => m.role === 'assistant');
        return assistantMessages[assistantMessages.length - 1]?.text || '';
    };

    // Obtener último mensaje del usuario
    const getLastUserMessage = () => {
        const userMessages = conversation.filter(m => m.role === 'user');
        return userMessages[userMessages.length - 1]?.text || '';
    };

    // Determinar estado visual
    const getStateInfo = () => {
        switch (connectionState) {
            case CONNECTION_STATES.IDLE:
                return { text: 'Listo para llamar', color: '#666', state: 'idle' };
            case CONNECTION_STATES.CONNECTING:
                return { text: status || 'Conectando...', color: '#f59e0b', state: 'connecting' };
            case CONNECTION_STATES.CONNECTED:
                // Determinar si está hablando el usuario o el bot
                const lastMsg = conversation[conversation.length - 1];
                if (lastMsg?.role === 'user' && !lastMsg.isFinal) {
                    return { text: 'Escuchando...', color: '#10b981', state: 'listening' };
                } else if (lastMsg?.role === 'assistant' && !lastMsg.isFinal) {
                    return { text: 'InmoBot hablando...', color: '#8b5cf6', state: 'speaking' };
                } else if (currentVolume > 0.1) {
                    return { text: 'InmoBot hablando...', color: '#8b5cf6', state: 'speaking' };
                }
                return { text: 'Escuchando...', color: '#10b981', state: 'listening' };
            case CONNECTION_STATES.ERROR:
                return { text: 'Error de conexión', color: '#ef4444', state: 'error' };
            default:
                return { text: '', color: '#666', state: 'idle' };
        }
    };

    const stateInfo = getStateInfo();
    const containerClass = `voice-call-container state-${stateInfo.state}`;

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
                        {isSessionActive && (
                            <span className="call-duration">{formatDuration(callDuration)}</span>
                        )}
                    </div>
                </div>
                {/* Badge de WebRTC */}
                {isSessionActive && (
                    <div className="webrtc-badge">
                        <span className="badge-dot"></span>
                        WebRTC
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="voice-call-main">
                {!isSessionActive ? (
                    /* Estado Idle */
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
                            Habla con InmoBot en tiempo real usando OpenAI Realtime API.
                            Latencia ultra-baja y conversación natural.
                        </p>
                        <div className="tech-badge">
                            <span>🚀 Powered by WebRTC + GPT-4o Realtime</span>
                        </div>
                    </div>
                ) : (
                    /* Estado de llamada activa */
                    <>
                        <div className="avatar-section">
                            <div className="avatar-container">
                                {/* Anillos de animación basados en volumen */}
                                <div className="avatar-rings" style={{
                                    transform: `scale(${1 + currentVolume * 0.5})`,
                                    opacity: 0.3 + currentVolume * 0.7
                                }}>
                                    <div className="avatar-ring"></div>
                                    <div className="avatar-ring"></div>
                                    <div className="avatar-ring"></div>
                                </div>
                                <div className="avatar-orb" style={{
                                    boxShadow: currentVolume > 0.1
                                        ? `0 0 ${20 + currentVolume * 40}px rgba(139, 92, 246, ${0.3 + currentVolume * 0.5})`
                                        : undefined
                                }}>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="status-section">
                            <span className="status-label" style={{ color: stateInfo.color }}>
                                {stateInfo.text}
                            </span>
                            <p className="status-message">
                                {getLastBotMessage() || 'Esperando respuesta...'}
                            </p>
                        </div>

                        {/* Transcripción del usuario */}
                        {getLastUserMessage() && (
                            <div className="transcript-section">
                                <div className="transcript-bubble">
                                    <span className="transcript-label">Tú dijiste</span>
                                    <p className="transcript-text user">{getLastUserMessage()}</p>
                                </div>
                            </div>
                        )}

                        {/* Indicador de volumen */}
                        <div className="volume-indicator">
                            <div
                                className="volume-bar"
                                style={{ width: `${Math.min(currentVolume * 200, 100)}%` }}
                            />
                        </div>

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
                {!isSessionActive ? (
                    <button className="control-button start-call" onClick={handleStartCall}>
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

                        <button className="control-button end-call" onClick={handleEndCall}>
                            <PhoneOffIcon />
                        </button>
                    </>
                )}
            </footer>
        </div>
    );
};

export default VoiceCall;
