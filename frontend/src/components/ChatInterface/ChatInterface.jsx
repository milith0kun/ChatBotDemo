import { useState, useRef, useEffect } from 'react';
import Message, { TypingIndicator } from '../Message/Message.jsx';
import VoiceRecorder from '../VoiceRecorder/VoiceRecorder.jsx';
import { sendChatMessage } from '../../services/api';
import './ChatInterface.css';

// SVG Icons
const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const HomeIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const BuildingIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
    </svg>
);

const HouseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const MapPinIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const DollarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const AlertCircleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [error, setError] = useState(null);
    const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSendMessage = async (messageText = inputValue) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            content: messageText.trim(),
            role: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await sendChatMessage(messageText.trim(), sessionId);

            if (response.session_id) {
                setSessionId(response.session_id);
            }

            const botMessage = {
                id: Date.now() + 1,
                content: response.response,
                role: 'assistant',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Error al conectar con el servidor. Por favor, verifica que el backend este corriendo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleQuickAction = (action) => {
        handleSendMessage(action);
    };

    // Manejar mensaje de voz
    const handleVoiceMessage = ({ transcribedText, botResponse, sessionId: newSessionId, showAudioButton }) => {
        if (!transcribedText || !botResponse) return;

        // Actualizar session_id si es nuevo
        if (newSessionId && !sessionId) {
            setSessionId(newSessionId);
        }

        // Agregar mensaje del usuario (transcripción)
        const userMessage = {
            id: Date.now(),
            content: transcribedText,
            role: 'user',
            timestamp: new Date(),
            isVoice: true
        };

        // Agregar respuesta del bot
        const botMessage = {
            id: Date.now() + 1,
            content: botResponse,
            role: 'assistant',
            timestamp: new Date(),
            // Si la respuesta es larga, mostrar botón para escuchar
            showAudioButton: showAudioButton
        };

        setMessages(prev => [...prev, userMessage, botMessage]);
    };

    const quickActions = [
        { icon: BuildingIcon, label: 'Busco un apartamento', action: 'Busco un apartamento' },
        { icon: HouseIcon, label: 'Busco una villa', action: 'Busco una villa o casa' },
        { icon: MapPinIcon, label: 'Ver zonas', action: '¿Qué zonas tenéis disponibles?' },
        { icon: DollarIcon, label: 'Ver precios', action: '¿Cuáles son los precios?' }
    ];

    return (
        <div className="chat-wrapper">
            <div className="chat-container">
                {/* Chat Header */}
                <div className="chat-header">
                    <div className="chat-header-content">
                        <div className="chat-header-info">
                            <h2>InmoBot</h2>
                            <p className="chat-subtitle">Asistente Inmobiliario</p>
                            <div className="chat-status">
                                <span className="status-dot" />
                                <span>En línea</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="messages-container">
                    {messages.length === 0 ? (
                        <div className="welcome-section">
                            <div className="welcome-content">

                                <h3>Bienvenido a InmoBot</h3>
                                <p>
                                    Tu asistente personal para encontrar la propiedad perfecta en España.
                                    Estoy aquí para ayudarte las 24 horas.
                                </p>
                                <div className="quick-actions-grid">
                                    {quickActions.map((item, index) => (
                                        <button
                                            key={index}
                                            className="quick-action-card"
                                            onClick={() => handleQuickAction(item.action)}
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            <div className="quick-action-icon">
                                                <item.icon />
                                            </div>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="messages-list">
                            {messages.map((message) => (
                                <Message
                                    key={message.id}
                                    content={message.content}
                                    role={message.role}
                                    timestamp={message.timestamp}
                                    isVoice={message.isVoice}
                                    showAudioButton={message.showAudioButton}
                                />
                            ))}
                            {isLoading && <TypingIndicator />}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-section">
                    {error && (
                        <div className="error-banner">
                            <AlertCircleIcon />
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="chat-input-wrapper">
                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe o usa el micrófono 🎙️"
                            rows={1}
                            disabled={isLoading || isVoiceProcessing}
                        />
                        <div className="input-actions">
                            <VoiceRecorder
                                onVoiceMessage={handleVoiceMessage}
                                sessionId={sessionId}
                                disabled={isLoading}
                            />
                            <button
                                className="send-button"
                                onClick={() => handleSendMessage()}
                                disabled={!inputValue.trim() || isLoading}
                                aria-label="Enviar mensaje"
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                    <p className="input-hint">
                        Enter para enviar • Shift+Enter nueva línea • 🎙️ Grabar voz
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
