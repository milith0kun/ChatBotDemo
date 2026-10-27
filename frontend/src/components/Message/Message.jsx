import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { getVoiceResponse } from '../../services/api';
import './Message.css';

// Evento global para detener todos los audios
const STOP_ALL_AUDIO_EVENT = 'stopAllAudio';

// ==================== ICONOS SVG VECTORIALES DE ALTA GAMA ====================

const IconoUsuario = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const IconoInmoBot = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
        <path d="M12 7.5v.01" />
    </svg>
);

const IconoPlayAudio = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const IconoStopAudio = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
);

const IconoMicrofonoNota = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
);

const IconoSpinner = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="audio-spinner-svg">
        <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" />
    </svg>
);

// ==================== COMPONENTE MENSAJE ====================

const Message = ({ content, role, timestamp, isVoice = false, showAudioButton = false }) => {
    const isUser = role === 'user';
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const audioRef = useRef(null);

    // Formatear hora
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Escuchar evento global para detener audio
    useEffect(() => {
        const handleStopAllAudio = () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsPlaying(false);
        };

        window.addEventListener(STOP_ALL_AUDIO_EVENT, handleStopAllAudio);
        return () => {
            window.removeEventListener(STOP_ALL_AUDIO_EVENT, handleStopAllAudio);
        };
    }, []);

    // Reproducir audio de la respuesta
    const handlePlayAudio = async () => {
        if (isPlaying) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsPlaying(false);
            return;
        }

        window.dispatchEvent(new CustomEvent(STOP_ALL_AUDIO_EVENT));

        setIsLoadingAudio(true);
        try {
            const audioBlob = await getVoiceResponse(content);
            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };
            audio.onerror = () => {
                setIsPlaying(false);
                setIsLoadingAudio(false);
            };

            await audio.play();
        } catch (err) {
            console.error('Error reproduciendo audio:', err);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    return (
        <div className={`message ${isUser ? 'message-user' : 'message-bot'}`}>
            <div className="message-avatar" aria-hidden="true">
                {isUser ? <IconoUsuario /> : <IconoInmoBot />}
            </div>
            <div className="message-body">
                <div className="message-bubble">
                    {isUser ? (
                        <p className="message-text">{content}</p>
                    ) : (
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p className="md-paragraph">{children}</p>,
                                strong: ({ children }) => <strong className="md-bold">{children}</strong>,
                                em: ({ children }) => <em className="md-italic">{children}</em>,
                                ul: ({ children }) => <ul className="md-list">{children}</ul>,
                                ol: ({ children }) => <ol className="md-list md-list-ordered">{children}</ol>,
                                li: ({ children }) => <li className="md-list-item">{children}</li>,
                                h1: ({ children }) => <h3 className="md-heading">{children}</h3>,
                                h2: ({ children }) => <h3 className="md-heading">{children}</h3>,
                                h3: ({ children }) => <h4 className="md-heading">{children}</h4>,
                                hr: () => <hr className="md-divider" />,
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    )}

                    {/* Botón de reproducción de audio elegante */}
                    {showAudioButton && !isUser && (
                        <button
                            className={`audio-play-btn ${isPlaying ? 'playing' : ''} ${isLoadingAudio ? 'loading' : ''}`}
                            onClick={handlePlayAudio}
                            disabled={isLoadingAudio}
                            title={isPlaying ? 'Detener lectura' : 'Escuchar respuesta'}
                            type="button"
                        >
                            {isLoadingAudio ? (
                                <>
                                    <IconoSpinner />
                                    <span>Cargando...</span>
                                </>
                            ) : isPlaying ? (
                                <>
                                    <IconoStopAudio />
                                    <span>Detener</span>
                                </>
                            ) : (
                                <>
                                    <IconoPlayAudio />
                                    <span>Escuchar</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
                <span className="message-time">
                    {isVoice && (
                        <span className="voice-indicator" title="Mensaje procesado por voz">
                            <IconoMicrofonoNota />
                        </span>
                    )}
                    {formatTime(timestamp)}
                </span>
            </div>
        </div>
    );
};

// Componente para el indicador de escritura de lujo
export const TypingIndicator = () => {
    return (
        <div className="message message-bot">
            <div className="message-avatar" aria-hidden="true">
                <IconoInmoBot />
            </div>
            <div className="message-body">
                <div className="message-bubble typing-bubble">
                    <div className="typing-indicator" aria-label="InmoBot está escribiendo">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Message;
