import ReactMarkdown from 'react-markdown';
import './Message.css';

// AI Bot icon for messages
const AIBotIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="10" r="6" fill="currentColor" fillOpacity="0.2" />
        <circle cx="9.5" cy="9" r="1.5" fill="currentColor" />
        <circle cx="14.5" cy="9" r="1.5" fill="currentColor" />
        <path d="M9 12.5C9 12.5 10.5 14 12 14C13.5 14 15 12.5 15 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="3" r="1" fill="currentColor" />
        <line x1="12" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 18H9M15 18H18M10 20H14" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const Message = ({ content, role, timestamp }) => {
    const isUser = role === 'user';

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`message ${isUser ? 'user' : 'bot'}`}>
            <div className="message-avatar">
                {isUser ? '👤' : <AIBotIcon />}
            </div>
            <div className="message-content">
                <div className="message-bubble">
                    {isUser ? (
                        content
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
                </div>
                <span className="message-time">
                    {formatTime(timestamp)}
                </span>
            </div>
        </div>
    );
};

// AI Typing Indicator
export const TypingIndicator = () => {
    return (
        <div className="message bot">
            <div className="message-avatar">
                <AIBotIcon />
            </div>
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
