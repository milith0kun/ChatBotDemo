import './Message.css';

// SVG Icons for avatars
const BotIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);

const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
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
        <div className={`message ${isUser ? 'message-user' : 'message-bot'}`}>
            <div className="message-avatar">
                {isUser ? <UserIcon /> : <BotIcon />}
            </div>
            <div className="message-body">
                <div className="message-bubble">
                    <p className="message-text">{content}</p>
                </div>
                <span className="message-time">
                    {formatTime(timestamp)}
                </span>
            </div>
        </div>
    );
};

// Typing Indicator Component
export const TypingIndicator = () => {
    return (
        <div className="message message-bot">
            <div className="message-avatar">
                <BotIcon />
            </div>
            <div className="message-body">
                <div className="message-bubble typing-bubble">
                    <div className="typing-indicator">
                        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                        <span className="typing-dot" style={{ animationDelay: '150ms' }} />
                        <span className="typing-dot" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Message;
