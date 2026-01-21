import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { getVoiceResponse } from '../../services/api';
import './Message.css';

// Evento global para detener todos los audios
const STOP_ALL_AUDIO_EVENT = 'stopAllAudio';

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
            // Detener si ya está reproduciendo
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsPlaying(false);
            return;
        }

        // Emitir evento para detener otros audios
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
        <div className={`message ${isUser ? 'user' : 'bot'}`}>
            <div className="message-avatar">
                {isUser ? '👤' : '🏠'}
            </div>
            <div className="message-content">
                <div className="message-bubble">
                    {isUser ? (
                        content
                    ) : (
                        <ReactMarkdown
                            components={{
                                // Personalizar estilos de los elementos Markdown
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

                    {/* Botón de reproducción para respuestas largas */}
                    {showAudioButton && !isUser && (
                        <button
                            className={`audio-play-btn ${isPlaying ? 'playing' : ''} ${isLoadingAudio ? 'loading' : ''}`}
                            onClick={handlePlayAudio}
                            disabled={isLoadingAudio}
                            title={isPlaying ? 'Detener audio' : 'Escuchar respuesta'}
                        >
                            {isLoadingAudio ? (
                                <span className="audio-spinner">⏳</span>
                            ) : isPlaying ? (
                                <span>⏹️ Detener</span>
                            ) : (
                                <span>🔊 Escuchar</span>
                            )}
                        </button>
                    )}
                </div>
                <span className="message-time">
                    {isVoice && <span className="voice-indicator" title="Mensaje de voz">🎤</span>}
                    {formatTime(timestamp)}
                </span>
            </div>
        </div>
    );
};

// Componente para el indicador de escritura
export const TypingIndicator = () => {
    return (
        <div className="message bot">
            <div className="message-avatar">🏠</div>
            <div className="message-content">
                <div className="message-bubble">
                    <div className="typing-indicator">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Message;
