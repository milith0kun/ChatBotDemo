import { useState, useEffect } from 'react';
import { getLeads } from '../../services/api';
import WhatsAppModal from '../WhatsAppModal/WhatsAppModal';
import './Dashboard.css';

// SVG Icons
const UsersIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.16 8.16 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.39-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1 1.03-.15 1.47-.84 1.68-1.17.2-.33.2-.62.14-.68-.06-.06-.22-.11-.47-.24z" />
    </svg>
);

const PhoneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const TelegramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

const GlobeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const FireIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const LoaderIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loader-spin">
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
);

const InboxIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
);

const SnowflakeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22" />
        <path d="M20 6L12 12 4 6" />
        <path d="M20 18L12 12 4 18" />
    </svg>
);

const SunIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const Dashboard = () => {
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);
    const [modalWhatsAppAbierto, setModalWhatsAppAbierto] = useState(false);

    const [channelFilter, setChannelFilter] = useState('all');
    const [temperatureFilter, setTemperatureFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const cargarLeads = async () => {
        try {
            setLoading(true);
            const data = await getLeads();
            setLeads(data.leads || []);
            setFilteredLeads(data.leads || []);
        } catch (err) {
            console.error('Error fetching leads:', err);
            setError('Error al cargar los leads. Verifica que el backend esté corriendo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarLeads();
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
                lead.email?.toLowerCase().includes(query) ||
                lead.zone?.toLowerCase().includes(query) ||
                lead.property_type?.toLowerCase().includes(query)
            );
        }

        setFilteredLeads(result);
    }, [leads, channelFilter, temperatureFilter, searchQuery]);

    // Estadísticas omnicanal completas
    const stats = {
        total: leads.length,
        whatsapp: leads.filter(l => l.channel === 'whatsapp').length,
        voice: leads.filter(l => l.channel === 'voice').length,
        web: leads.filter(l => l.channel === 'web').length,
        telegram: leads.filter(l => l.channel === 'telegram').length,
        hot: leads.filter(l => l.temperature === 'caliente').length
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
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
            default: return 'Frío';
        }
    };

    // Render de icono y nombre de canal
    const renderIconoCanal = (channel) => {
        switch (channel) {
            case 'whatsapp': return <WhatsAppIcon />;
            case 'voice': return <PhoneIcon />;
            case 'telegram': return <TelegramIcon />;
            default: return <GlobeIcon />;
        }
    };

    const renderNombreCanal = (channel) => {
        switch (channel) {
            case 'whatsapp': return 'WhatsApp';
            case 'voice': return 'Voz IA';
            case 'telegram': return 'Telegram';
            default: return 'Web';
        }
    };

    // Función para exportar la lista de leads a CSV
    const exportarLeadsCSV = () => {
        if (leads.length === 0) {
            alert('No hay leads para exportar.');
            return;
        }

        const encabezados = [
            'ID',
            'Canal',
            'Nombre',
            'Teléfono',
            'Email',
            'Presupuesto Mín',
            'Presupuesto Máx',
            'Zona',
            'Tipo Propiedad',
            'Habitaciones',
            'Score',
            'Temperatura',
            'Fecha'
        ];

        const filas = leads.map(l => [
            `"${l.id || ''}"`,
            `"${renderNombreCanal(l.channel)}"`,
            `"${(l.name || '').replace(/"/g, '""')}"`,
            `"${l.phone || ''}"`,
            `"${l.email || ''}"`,
            `"${l.budget_min || ''}"`,
            `"${l.budget_max || ''}"`,
            `"${(l.zone || '').replace(/"/g, '""')}"`,
            `"${(l.property_type || '').replace(/"/g, '""')}"`,
            `"${l.bedrooms || ''}"`,
            `"${l.score || 0}"`,
            `"${l.temperature || 'frío'}"`,
            `"${l.created_at || ''}"`
        ]);

        const contenidoCSV = '\uFEFF' + [encabezados.join(';'), ...filas.map(f => f.join(';'))].join('\n');
        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = `leads_inmobot_${new Date().toISOString().slice(0, 10)}.csv`;
        enlace.click();
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading-state">
                    <LoaderIcon />
                    <p>Cargando leads inmobiliarios...</p>
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
                    <p>Gestión de prospectos inmobiliarios desde WhatsApp, Voz IA, Web y Telegram</p>
                </div>

                <div className="acciones-cabecera-dashboard">
                    <button
                        type="button"
                        onClick={() => setModalWhatsAppAbierto(true)}
                        className="boton-panel-whatsapp"
                        title="Abrir vinculación WhatsApp con Evolution API"
                    >
                        <WhatsAppIcon />
                        <span>Conectar WhatsApp</span>
                    </button>

                    <button
                        type="button"
                        onClick={exportarLeadsCSV}
                        className="boton-exportar-csv"
                        title="Descargar prospectos en formato CSV"
                    >
                        <DownloadIcon />
                        <span>Exportar CSV</span>
                    </button>

                    <div className="dashboard-date">
                        <CalendarIcon />
                        <span>{new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</span>
                    </div>
                </div>
            </header>

            {/* Stats Cards (6 canales & métricas) */}
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

                <div className="stat-card stat-whatsapp">
                    <div className="stat-icon">
                        <WhatsAppIcon />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.whatsapp}</span>
                        <span className="stat-label">WhatsApp</span>
                    </div>
                    {stats.total > 0 && (
                        <span className="stat-badge">
                            {Math.round((stats.whatsapp / stats.total) * 100)}%
                        </span>
                    )}
                </div>

                <div className="stat-card stat-voice">
                    <div className="stat-icon">
                        <PhoneIcon />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.voice}</span>
                        <span className="stat-label">Voz Realtime</span>
                    </div>
                    {stats.total > 0 && (
                        <span className="stat-badge">
                            {Math.round((stats.voice / stats.total) * 100)}%
                        </span>
                    )}
                </div>

                <div className="stat-card stat-web">
                    <div className="stat-icon">
                        <GlobeIcon />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.web}</span>
                        <span className="stat-label">Chat Web</span>
                    </div>
                    {stats.total > 0 && (
                        <span className="stat-badge">
                            {Math.round((stats.web / stats.total) * 100)}%
                        </span>
                    )}
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

                <div className="stat-card stat-hot">
                    <div className="stat-icon">
                        <FireIcon />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.hot}</span>
                        <span className="stat-label">Leads Calientes</span>
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
                        <option value="whatsapp">WhatsApp</option>
                        <option value="voice">Voz Realtime</option>
                        <option value="web">Chat Web</option>
                        <option value="telegram">Telegram</option>
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
                        <option value="frio">Frío</option>
                    </select>
                </div>

                <div className="filter-group filter-search">
                    <label>Buscar</label>
                    <div className="search-input-wrapper">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Nombre, teléfono, zona o propiedad..."
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
                        <p>Los leads aparecerán aquí automáticamente cuando los usuarios interactúen por cualquier canal.</p>
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
                                                {renderIconoCanal(lead.channel)}
                                                {renderNombreCanal(lead.channel)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="lead-name">{lead.name || 'Prospecto Inmobiliario'}</span>
                                        </td>
                                        <td>
                                            <div className="lead-contact">
                                                <span>{lead.phone || '-'}</span>
                                                <span className="email">{lead.email || '-'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {lead.budget_min || lead.budget_max ? (
                                                `€${lead.budget_min?.toLocaleString() || '?'} - €${lead.budget_max?.toLocaleString() || '?'}`
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
                                            <span className="date-cell">{formatDate(lead.created_at || lead.updated_at)}</span>
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
                            <h2>Detalle del Lead Inmobiliario</h2>
                            <button className="modal-close" onClick={() => setSelectedLead(null)}>
                                <CloseIcon />
                            </button>
                        </header>

                        <div className="modal-body">
                            {/* Channel Info */}
                            <div className="detail-section">
                                <h3>Canal de Origen</h3>
                                <span className={`channel-badge channel-${selectedLead.channel}`}>
                                    {renderIconoCanal(selectedLead.channel)}
                                    {renderNombreCanal(selectedLead.channel)}
                                </span>
                                {selectedLead.telegram_username && (
                                    <span className="telegram-username">@{selectedLead.telegram_username}</span>
                                )}
                            </div>

                            {/* Client Info */}
                            <div className="detail-section">
                                <h3>Información del Cliente</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Nombre</label>
                                        <span>{selectedLead.name || 'No proporcionado'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Teléfono</label>
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
                                <h3>Preferencias de Búsqueda</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Tipo de Propiedad</label>
                                        <span>{selectedLead.property_type || 'No definido'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Zona de Interés</label>
                                        <span>{selectedLead.zone || 'No definida'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Habitaciones</label>
                                        <span>{selectedLead.bedrooms || 'No definido'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Presupuesto Estimado</label>
                                        <span>
                                            {selectedLead.budget_min || selectedLead.budget_max ? (
                                                `€${selectedLead.budget_min?.toLocaleString() || '?'} - €${selectedLead.budget_max?.toLocaleString() || '?'}`
                                            ) : 'No definido'}
                                        </span>
                                    </div>
                                    {selectedLead.interested_property && (
                                        <div className="detail-item">
                                            <label>Propiedad de Interés</label>
                                            <span><strong>{selectedLead.interested_property}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Classification */}
                            <div className="detail-section">
                                <h3>Clasificación Comercial</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Score Calificación</label>
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
                                    <h3>Historial de Conversación</h3>
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

            {/* Modal de WhatsApp integrado */}
            <WhatsAppModal
                estaAbierto={modalWhatsAppAbierto}
                alCerrar={() => {
                    setModalWhatsAppAbierto(false);
                    cargarLeads();
                }}
            />
        </div>
    );
};

export default Dashboard;
