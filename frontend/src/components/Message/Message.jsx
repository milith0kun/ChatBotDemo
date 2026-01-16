import ReactMarkdown from 'react-markdown';
import './Message.css';

const Message = ({ content, role, timestamp }) => {
    const isUser = role === 'user';

    // Formatear hora
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit'
        });
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
                </div>
                <span className="message-time">
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
