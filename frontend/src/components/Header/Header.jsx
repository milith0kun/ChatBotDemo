import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WhatsAppModal from '../WhatsAppModal/WhatsAppModal';
import { obtenerEstadoWhatsApp } from '../../services/api';
import './Header.css';

// SVG Icons as components
const LogoIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
        <path d="M16 6L8 12V24H12V18H20V24H24V12L16 6Z" fill="#c4a35a" fillOpacity="0.95" />
        <path d="M14 14H18V18H14V14Z" fill="url(#logo-gradient)" />
        <circle cx="16" cy="10" r="1.5" fill="#c4a35a" fillOpacity="0.8" />
        <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0d4f4f" />
                <stop offset="1" stopColor="#1a6b6b" />
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

const PhoneIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.16 8.16 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.39-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1 1.03-.15 1.47-.84 1.68-1.17.2-.33.2-.62.14-.68-.06-.06-.22-.11-.47-.24z" />
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
    const isCall = location.pathname === '/call';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [modalWhatsAppAbierto, setModalWhatsAppAbierto] = useState(false);
    const [whatsAppConectado, setWhatsAppConectado] = useState(false);

    // Consultar estado periódico de WhatsApp para el badge
    useEffect(() => {
        const revisarEstado = async () => {
            try {
                const res = await obtenerEstadoWhatsApp();
                if (res && res.ok) {
                    setWhatsAppConectado(Boolean(res.esta_conectado));
                }
            } catch (err) {
                // Silencioso
            }
        };
        revisarEstado();
        const timer = setInterval(revisarEstado, 15000);
        return () => clearInterval(timer);
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const abrirWhatsApp = () => {
        closeMobileMenu();
        setModalWhatsAppAbierto(true);
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
                        <p className="header-subtitle">Asistente Inmobiliario Inteligente</p>
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

                    <Link
                        to="/call"
                        className={`nav-item call-link ${isCall ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <PhoneIcon />
                        <span>Voz IA</span>
                    </Link>

                    {/* Botón de WhatsApp con estado */}
                    <button
                        type="button"
                        onClick={abrirWhatsApp}
                        className={`boton-header-whatsapp ${whatsAppConectado ? 'conectado' : 'esperando'}`}
                        title="Vincular o ver WhatsApp con Evolution API"
                    >
                        <WhatsAppIcon />
                        <span>WhatsApp</span>
                        <span className="punto-estado-whatsapp" />
                    </button>

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

            {/* Modal de WhatsApp */}
            <WhatsAppModal
                estaAbierto={modalWhatsAppAbierto}
                alCerrar={() => setModalWhatsAppAbierto(false)}
            />
        </header>
    );
};

export default Header;
