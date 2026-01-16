import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

// AI Bot Logo - Moderno y tecnológico
const LogoIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="url(#ai-gradient)" />
        {/* Robot/AI face */}
        <circle cx="16" cy="14" r="8" fill="white" fillOpacity="0.95" />
        <circle cx="13" cy="13" r="2" fill="url(#ai-gradient)" />
        <circle cx="19" cy="13" r="2" fill="url(#ai-gradient)" />
        <path d="M12 17C12 17 14 19 16 19C18 19 20 17 20 17" stroke="url(#ai-gradient)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Antenna */}
        <circle cx="16" cy="5" r="1.5" fill="white" fillOpacity="0.8" />
        <line x1="16" y1="6" x2="16" y2="6" stroke="white" strokeWidth="1.5" />
        {/* Circuit lines */}
        <path d="M8 24H12M20 24H24M14 26H18" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
            <linearGradient id="ai-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>
    </svg>
);

const ChatIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const DashboardIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
);

const TelegramIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const Header = () => {
    const location = useLocation();
    const isChat = location.pathname === '/';
    const isDashboard = location.pathname === '/dashboard';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <header className="header">
            <div className="header-container">
                {/* Brand */}
                <Link to="/" className="header-brand" onClick={closeMobileMenu}>
                    <div className="header-logo">
                        <LogoIcon />
                    </div>
                    <div className="header-brand-text">
                        <h1 className="header-title">InmoBot AI</h1>
                        <p className="header-subtitle">Asistente Inteligente</p>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <Link
                        to="/"
                        className={`nav-item ${isChat ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <ChatIcon />
                        <span>Chat</span>
                    </Link>

                    <Link
                        to="/dashboard"
                        className={`nav-item ${isDashboard ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <DashboardIcon />
                        <span>Dashboard</span>
                    </Link>

                    <div className="nav-divider" />

                    <a
                        href="https://t.me/EdmilSairebot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="telegram-link"
                        onClick={closeMobileMenu}
                    >
                        <TelegramIcon />
                        <span>Telegram</span>
                        <ExternalLinkIcon />
                    </a>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
                    aria-label="Menu"
                    onClick={toggleMobileMenu}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div className="mobile-overlay" onClick={closeMobileMenu} />
            )}
        </header>
    );
};

export default Header;
