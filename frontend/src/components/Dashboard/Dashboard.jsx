import { useState, useEffect } from 'react';
import { getLeads } from '../../services/api';
import './Dashboard.css';

// SVG Icons
const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const TelegramIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

const GlobeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
);

const FireIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
);

const CalendarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const LoaderIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader-spin">
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
);

const InboxIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
);

const SnowflakeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22"/>
        <path d="M20 6L12 12 4 6"/>
        <path d="M20 18L12 12 4 18"/>
    </svg>
);

const SunIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
);

const Dashboard = () => {
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);

    const [channelFilter, setChannelFilter] = useState('all');
    const [temperatureFilter, setTemperatureFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                setLoading(true);
                const data = await getLeads();
                setLeads(data.leads || []);
                setFilteredLeads(data.leads || []);
            } catch (err) {
                console.error('Error fetching leads:', err);
                setError('Error al cargar los leads. Verifica que el backend este corriendo.');
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, []);

    useEffect(() => {
        let result = [...leads];

        if (channelFilter !== 'all') {
            result = result.filter(lead => lead.channel === channelFilter);
        }

        if (temperatureFilter !== 'all') {
            result = result.filter(lead => lead.temperature === temperatureFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(lead =>
                lead.name?.toLowerCase().includes(query) ||
                lead.phone?.includes(query) ||
                lead.email?.toLowerCase().includes(query)
            );
        }

        setFilteredLeads(result);
    }, [leads, channelFilter, temperatureFilter, searchQuery]);

    const stats = {
        total: leads.length,
        telegram: leads.filter(l => l.channel === 'telegram').length,
        web: leads.filter(l => l.channel === 'web').length,
        hot: leads.filter(l => l.temperature === 'caliente').length
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTemperatureClass = (temp) => {
        switch (temp) {
            case 'caliente': return 'hot';
            case 'tibio': return 'warm';
            default: return 'cold';
        }
    };

    const getTemperatureIcon = (temp) => {
        switch (temp) {
            case 'caliente': return <FireIcon />;
            case 'tibio': return <SunIcon />;
            default: return <SnowflakeIcon />;
        }
    };

    const getTemperatureLabel = (temp) => {
        switch (temp) {
            case 'caliente': return 'Caliente';
            case 'tibio': return 'Tibio';
            default: return 'Frio';
        }
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading-state">
                    <LoaderIcon />
                    <p>Cargando leads...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Dashboard Header */}
            <header className="dashboard-header">
                <div className="dashboard-title-section">
                    <h1>Dashboard Omnicanal</h1>
                    <p>Gestion de leads desde Telegram y Web</p>
                </div>
                <div className="dashboard-date">
                    <CalendarIcon />
                    <span>{new Date().toLocaleDateString('es-PE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>
            </header>

            {/* Stats Cards */}
            <section className="stats-section">
                <div className="stat-card">
                    <div className="stat-icon">
                        <UsersIcon />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Leads</span>
                    </div>
                </div>

                <div className="stat-card stat-telegram">
                    <div className="stat-icon">
                        <TelegramIcon />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.telegram}</span>
                        <span className="stat-label">Telegram</span>
                    </div>
                    {stats.total > 0 && (
                        <span className="stat-badge">
                            {Math.round((stats.telegram / stats.total) * 100)}%
                        </span>
                    )}
                </div>

                <div className="stat-card stat-web">
                    <div className="stat-icon">
                        <GlobeIcon />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.web}</span>
                        <span className="stat-label">Web</span>
                    </div>
                    {stats.total > 0 && (
                        <span className="stat-badge">
                            {Math.round((stats.web / stats.total) * 100)}%
                        </span>
                    )}
                </div>

                <div className="stat-card stat-hot">
                    <div className="stat-icon">
                        <FireIcon />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.hot}</span>
                        <span className="stat-label">Calientes</span>
                    </div>
                    {stats.total > 0 && (
                        <span className="stat-badge">
                            {Math.round((stats.hot / stats.total) * 100)}%
                        </span>
                    )}
                </div>
            </section>

            {/* Filters Section */}
            <section className="filters-section">
                <div className="filter-group">
                    <label>Canal</label>
                    <select
                        value={channelFilter}
                        onChange={(e) => setChannelFilter(e.target.value)}
                    >
                        <option value="all">Todos los canales</option>
                        <option value="telegram">Telegram</option>
                        <option value="web">Web</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Temperatura</label>
                    <select
                        value={temperatureFilter}
                        onChange={(e) => setTemperatureFilter(e.target.value)}
                    >
                        <option value="all">Todas</option>
                        <option value="caliente">Caliente</option>
                        <option value="tibio">Tibio</option>
                        <option value="frio">Frio</option>
                    </select>
                </div>

                <div className="filter-group filter-search">
                    <label>Buscar</label>
                    <div className="search-input-wrapper">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Nombre, telefono o email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                </div>
            )}

            {/* Leads Table */}
            <section className="table-section">
                {filteredLeads.length === 0 ? (
                    <div className="empty-state">
                        <InboxIcon />
                        <h3>No hay leads que mostrar</h3>
                        <p>Los leads apareceran aqui cuando los usuarios interactuen con el chat</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="leads-table">
                            <thead>
                                <tr>
                                    <th>Canal</th>
                                    <th>Nombre</th>
                                    <th>Contacto</th>
                                    <th>Presupuesto</th>
                                    <th>Zona</th>
                                    <th>Score</th>
                                    <th>Temperatura</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} onClick={() => setSelectedLead(lead)}>
                                        <td>
                                            <span className={`channel-badge channel-${lead.channel}`}>
                                                {lead.channel === 'telegram' ? <TelegramIcon /> : <GlobeIcon />}
                                                {lead.channel === 'telegram' ? 'Telegram' : 'Web'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="lead-name">{lead.name || 'Sin nombre'}</span>
                                        </td>
                                        <td>
                                            <div className="lead-contact">
                                                <span>{lead.phone || '-'}</span>
                                                <span className="email">{lead.email || '-'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {lead.budget_min || lead.budget_max ? (
                                                `$${lead.budget_min?.toLocaleString() || '?'} - $${lead.budget_max?.toLocaleString() || '?'}`
                                            ) : '-'}
                                        </td>
                                        <td>{lead.zone || '-'}</td>
                                        <td>
                                            <div className="score-cell">
                                                <span className="score-value">{lead.score || 0}</span>
                                                <div className="score-bar">
                                                    <div
                                                        className={`score-fill score-${getTemperatureClass(lead.temperature)}`}
                                                        style={{ width: `${lead.score || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`temp-badge temp-${getTemperatureClass(lead.temperature)}`}>
                                                {getTemperatureIcon(lead.temperature)}
                                                {getTemperatureLabel(lead.temperature)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="date-cell">{formatDate(lead.created_at)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <header className="modal-header">
                            <h2>Detalle del Lead</h2>
                            <button className="modal-close" onClick={() => setSelectedLead(null)}>
                                <CloseIcon />
                            </button>
                        </header>

                        <div className="modal-body">
                            {/* Channel Info */}
                            <div className="detail-section">
                                <h3>Canal de Origen</h3>
                                <span className={`channel-badge channel-${selectedLead.channel}`}>
                                    {selectedLead.channel === 'telegram' ? <TelegramIcon /> : <GlobeIcon />}
                                    {selectedLead.channel === 'telegram' ? 'Telegram' : 'Web'}
                                </span>
                                {selectedLead.telegram_username && (
                                    <span className="telegram-username">@{selectedLead.telegram_username}</span>
                                )}
                            </div>

                            {/* Client Info */}
                            <div className="detail-section">
                                <h3>Informacion del Cliente</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Nombre</label>
                                        <span>{selectedLead.name || 'No proporcionado'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Telefono</label>
                                        <span>{selectedLead.phone || 'No proporcionado'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Email</label>
                                        <span>{selectedLead.email || 'No proporcionado'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Urgencia</label>
                                        <span>{selectedLead.urgency || 'No definida'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Preferences */}
                            <div className="detail-section">
                                <h3>Preferencias de Busqueda</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Tipo de Propiedad</label>
                                        <span>{selectedLead.property_type || 'No definido'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Zona</label>
                                        <span>{selectedLead.zone || 'No definida'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Habitaciones</label>
                                        <span>{selectedLead.bedrooms || 'No definido'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Presupuesto</label>
                                        <span>
                                            {selectedLead.budget_min || selectedLead.budget_max ? (
                                                `$${selectedLead.budget_min?.toLocaleString() || '?'} - $${selectedLead.budget_max?.toLocaleString() || '?'}`
                                            ) : 'No definido'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Classification */}
                            <div className="detail-section">
                                <h3>Clasificacion</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Score</label>
                                        <span className="score-display">{selectedLead.score || 0}/100</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Temperatura</label>
                                        <span className={`temp-badge temp-${getTemperatureClass(selectedLead.temperature)}`}>
                                            {getTemperatureIcon(selectedLead.temperature)}
                                            {getTemperatureLabel(selectedLead.temperature)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Conversation History */}
                            {selectedLead.conversation_history && selectedLead.conversation_history.length > 0 && (
                                <div className="detail-section">
                                    <h3>Historial de Conversacion</h3>
                                    <div className="conversation-container">
                                        {selectedLead.conversation_history
                                            .filter(msg => msg.role !== 'system' && msg.role !== 'tool')
                                            .map((msg, index) => (
                                                <div key={index} className={`conv-message conv-${msg.role}`}>
                                                    {msg.content}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
