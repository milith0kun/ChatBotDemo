import { useState, useEffect, useRef } from 'react';
import {
    obtenerEstadoWhatsApp,
    obtenerQrWhatsApp,
    reiniciarWhatsApp,
    configurarWebhookWhatsApp,
    enviarMensajeWhatsAppPrueba
} from '../../services/api';
import './WhatsAppModal.css';

const IconoWhatsApp = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.16 8.16 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.39-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1 1.03-.15 1.47-.84 1.68-1.17.2-.33.2-.62.14-.68-.06-.06-.22-.11-.47-.24z" />
    </svg>
);

const IconoCerrar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconoRefrescar = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
);

const IconoCheck = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconoAlerta = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const WhatsAppModal = ({ estaAbierto, alCerrar }) => {
    const [cargando, setCargando] = useState(true);
    const [reiniciando, setReiniciando] = useState(false);
    const [estadoConexion, setEstadoConexion] = useState('conectando');
    const [estaConectado, setEstaConectado] = useState(false);
    const [codigoQrBase64, setCodigoQrBase64] = useState('');
    const [telefonoConectado, setTelefonoConectado] = useState('');
    const [nombrePerfil, setNombrePerfil] = useState('');
    const [instanciaNombre, setInstanciaNombre] = useState('Edmil Jampier Saire Bustamante');
    const [mensajeEstado, setMensajeEstado] = useState('');
    const [numeroPrueba, setNumeroPrueba] = useState('');
    const [textoPrueba, setTextoPrueba] = useState('Hola InmoBot, me interesa información sobre villas en Marbella.');
    const [enviandoPrueba, setEnviandoPrueba] = useState(false);
    const [resultadoPrueba, setResultadoPrueba] = useState(null);
    const [configurandoWebhook, setConfigurandoWebhook] = useState(false);
    const [contadorRefresco, setContadorRefresco] = useState(18);

    const temporizadorRefrescoRef = useRef(null);

    // Cargar QR fresco
    const refrescarQr = async (mostrarCargando = false) => {
        try {
            if (mostrarCargando) setCargando(true);
            const respuestaQr = await obtenerQrWhatsApp();
            if (respuestaQr && respuestaQr.ok) {
                setCodigoQrBase64(respuestaQr.codigo_qr_base64 || '');
                setContadorRefresco(18);
            }
        } catch (error) {
            console.error('Error al refrescar QR:', error);
        } finally {
            if (mostrarCargando) setCargando(false);
        }
    };

    // Cargar estado inicial
    const cargarInformacionWhatsApp = async () => {
        try {
            setCargando(true);
            setMensajeEstado('Conectando con Evolution API...');
            
            const respuestaEstado = await obtenerEstadoWhatsApp();
            if (respuestaEstado && respuestaEstado.ok) {
                setEstadoConexion(respuestaEstado.estado || 'desconocido');
                setEstaConectado(Boolean(respuestaEstado.esta_conectado));
                setTelefonoConectado(respuestaEstado.telefono || '');
                setNombrePerfil(respuestaEstado.nombre_perfil || '');
                if (respuestaEstado.instancia) {
                    setInstanciaNombre(respuestaEstado.instancia);
                }

                if (!respuestaEstado.esta_conectado) {
                    setMensajeEstado('Generando código QR nítido...');
                    await refrescarQr(false);
                }
            }
        } catch (error) {
            console.error('Error al cargar datos de WhatsApp:', error);
            setMensajeEstado('No se pudo comunicar con la API de WhatsApp.');
        } finally {
            setCargando(false);
        }
    };

    // Reiniciar sesión en Evolution API para limpiar sockets colgados
    const manejarReinicioSesion = async () => {
        try {
            setReiniciando(true);
            setMensajeEstado('Restableciendo sesión en Evolution API...');
            const respuesta = await reiniciarWhatsApp();
            if (respuesta && respuesta.ok) {
                if (respuesta.codigo_qr_base64) {
                    setCodigoQrBase64(respuesta.codigo_qr_base64);
                } else {
                    await refrescarQr(false);
                }
                setEstaConectado(false);
                setEstadoConexion('connecting');
                setContadorRefresco(18);
            } else {
                alert('No se pudo reiniciar la sesión. Intenta de nuevo.');
            }
        } catch (error) {
            alert('Error al reiniciar sesión de WhatsApp.');
        } finally {
            setReiniciando(false);
        }
    };

    // Efecto principal: carga inicial y sondeo periódico
    useEffect(() => {
        if (!estaAbierto) return;
        cargarInformacionWhatsApp();

        // Sondeo de estado cada 5 segundos para detectar el escaneo en vivo
        const intervaloEstado = setInterval(() => {
            if (!estaConectado) {
                obtenerEstadoWhatsApp().then(datos => {
                    if (datos && datos.ok && datos.esta_conectado) {
                        setEstaConectado(true);
                        setEstadoConexion('open');
                        setTelefonoConectado(datos.telefono || '');
                        setNombrePerfil(datos.nombre_perfil || '');
                    }
                }).catch(() => {});
            }
        }, 5000);

        // Auto-refresco del QR cada 35 segundos (tiempo prudencial para enfocar sin interrupciones)
        const intervaloQr = setInterval(() => {
            if (!estaConectado) {
                refrescarQr(false);
            }
        }, 35000);

        // Contador regresivo visual
        const intervaloCuenta = setInterval(() => {
            setContadorRefresco(prev => (prev > 1 ? prev - 1 : 35));
        }, 1000);

        return () => {
            clearInterval(intervaloEstado);
            clearInterval(intervaloQr);
            clearInterval(intervaloCuenta);
        };
    }, [estaAbierto, estaConectado]);

    // Enviar mensaje de prueba
    const manejarEnvioPrueba = async (e) => {
        e.preventDefault();
        if (!numeroPrueba || !textoPrueba) return;

        try {
            setEnviandoPrueba(true);
            setResultadoPrueba(null);
            const respuesta = await enviarMensajeWhatsAppPrueba(numeroPrueba, textoPrueba);
            if (respuesta && respuesta.ok) {
                setResultadoPrueba({ exito: true, mensaje: '¡Mensaje enviado con éxito por WhatsApp!' });
            } else {
                setResultadoPrueba({ exito: false, mensaje: respuesta.error || 'No se pudo enviar el mensaje.' });
            }
        } catch (error) {
            setResultadoPrueba({ exito: false, mensaje: 'Error al enviar mensaje de prueba.' });
        } finally {
            setEnviandoPrueba(false);
        }
    };

    // Configurar webhook hacia producción
    const manejarConfiguracionWebhook = async () => {
        try {
            setConfigurandoWebhook(true);
            const urlDefecto = 'https://api-chat-demo.ecosdelseo.com/api/whatsapp/webhook';
            const respuesta = await configurarWebhookWhatsApp(urlDefecto);
            if (respuesta && respuesta.ok) {
                alert(`Webhook configurado exitosamente hacia: ${urlDefecto}`);
            } else {
                alert(`Error al configurar webhook: ${respuesta.error || 'Error desconocido'}`);
            }
        } catch (error) {
            alert('Error al intentar registrar el webhook.');
        } finally {
            setConfigurandoWebhook(false);
        }
    };

    if (!estaAbierto) return null;

    return (
        <div className="modal-fondo-whatsapp">
            <div className="modal-tarjeta-whatsapp" onClick={(e) => e.stopPropagation()}>
                {/* Cabecera del Modal */}
                <div className="cabecera-modal-whatsapp">
                    <div className="identificador-whatsapp">
                        <div className="icono-contenedor-whatsapp">
                            <IconoWhatsApp />
                        </div>
                        <div>
                            <h3 className="titulo-modal-whatsapp">WhatsApp Inmobiliario</h3>
                            <p className="subtitulo-modal-whatsapp">Evolution API v2 • Instancia Oficial</p>
                        </div>
                    </div>
                    <button className="boton-cerrar-whatsapp" onClick={alCerrar} aria-label="Cerrar">
                        <IconoCerrar />
                    </button>
                </div>

                {/* Contenido Principal */}
                <div className="cuerpo-modal-whatsapp">
                    {/* Barra de Estado */}
                    <div className="barra-estado-whatsapp">
                        <div className="indicador-info-instancia">
                            <span className="etiqueta-instancia">Instancia:</span>
                            <span className="valor-instancia" title={instanciaNombre}>{instanciaNombre}</span>
                        </div>
                        <div className={`insignia-estado-whatsapp ${estaConectado ? 'estado-conectado' : 'estado-esperando'}`}>
                            <span className="punto-pulso-whatsapp" />
                            <span>{estaConectado ? 'WhatsApp Conectado' : 'Esperando Escaneo'}</span>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="contenedor-cargando-whatsapp">
                            <div className="animacion-giro-whatsapp" />
                            <p className="texto-progreso-whatsapp">{mensajeEstado}</p>
                        </div>
                    ) : estaConectado ? (
                        /* Estado Conectado */
                        <div className="seccion-conectado-whatsapp">
                            <div className="tarjeta-exito-whatsapp">
                                <div className="icono-check-circulo">
                                    <IconoCheck />
                                </div>
                                <h4 className="titulo-exito-whatsapp">¡WhatsApp Conectado y Activo!</h4>
                                <p className="descripcion-exito-whatsapp">
                                    InmoBot está recibiendo y respondiendo consultas de clientes en tiempo real.
                                </p>

                                <div className="detalles-perfil-conectado">
                                    {telefonoConectado && (
                                        <div className="item-detalle-whatsapp">
                                            <span className="etiqueta-detalle">Número Vinculado:</span>
                                            <strong className="valor-detalle">+{telefonoConectado}</strong>
                                        </div>
                                    )}
                                    {nombrePerfil && (
                                        <div className="item-detalle-whatsapp">
                                            <span className="etiqueta-detalle">Nombre en WhatsApp:</span>
                                            <strong className="valor-detalle">{nombrePerfil}</strong>
                                        </div>
                                    )}
                                    <div className="item-detalle-whatsapp">
                                        <span className="etiqueta-detalle">Estado de Respuesta:</span>
                                        <span className="valor-badge-omnicanal">En línea 24/7</span>
                                    </div>
                                </div>
                            </div>

                            {/* Enviar Mensaje de Prueba */}
                            <form className="formulario-prueba-whatsapp" onSubmit={manejarEnvioPrueba}>
                                <h5 className="subtitulo-seccion-whatsapp">Probar Envío de Mensaje</h5>
                                <div className="fila-formulario-whatsapp">
                                    <input
                                        type="tel"
                                        placeholder="Ej: 51987654321 (con código de país)"
                                        value={numeroPrueba}
                                        onChange={(e) => setNumeroPrueba(e.target.value)}
                                        className="campo-texto-whatsapp"
                                        required
                                    />
                                </div>
                                <div className="fila-formulario-whatsapp">
                                    <textarea
                                        rows="2"
                                        placeholder="Escribe el mensaje de prueba..."
                                        value={textoPrueba}
                                        onChange={(e) => setTextoPrueba(e.target.value)}
                                        className="campo-texto-whatsapp campo-area-whatsapp"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={enviandoPrueba}
                                    className="boton-accion-whatsapp boton-enviar-whatsapp"
                                >
                                    {enviandoPrueba ? 'Enviando...' : 'Enviar Mensaje Directo'}
                                </button>

                                {resultadoPrueba && (
                                    <div className={`alerta-prueba-whatsapp ${resultadoPrueba.exito ? 'alerta-exito' : 'alerta-error'}`}>
                                        {resultadoPrueba.mensaje}
                                    </div>
                                )}
                            </form>

                            {/* Configuración de Webhook */}
                            <div className="bloque-webhook-whatsapp">
                                <button
                                    type="button"
                                    onClick={manejarConfiguracionWebhook}
                                    disabled={configurandoWebhook}
                                    className="boton-secundario-whatsapp"
                                >
                                    {configurandoWebhook ? 'Configurando...' : '⚡ Sincronizar Webhook con Dokploy'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Estado No Conectado - Mostrar QR Limpio y Nítido */
                        <div className="seccion-qr-whatsapp">
                            <div className="instrucciones-vinculacion-whatsapp">
                                <p className="paso-instruccion-whatsapp">
                                    Abre <strong>WhatsApp</strong> ➔ <strong>Dispositivos vinculados</strong> ➔ <strong>Vincular un dispositivo</strong> y apunta al código:
                                </p>
                            </div>

                            {/* Marco con Código QR Nítido y Limpio (sin animaciones invasivas) */}
                            <div className="marco-qr-whatsapp">
                                {reiniciando ? (
                                    <div className="qr-cargando-estado">
                                        <div className="animacion-giro-whatsapp" />
                                        <p>Generando sesión limpia en Evolution API...</p>
                                    </div>
                                ) : codigoQrBase64 ? (
                                    <div className="imagen-qr-contenedor">
                                        <img
                                            src={codigoQrBase64}
                                            alt="Código QR WhatsApp Evolution API"
                                            className="imagen-qr-whatsapp"
                                        />
                                    </div>
                                ) : (
                                    <div className="qr-marcador-posicion">
                                        <div className="animacion-giro-whatsapp" />
                                        <p style={{ textAlign: 'center', maxWidth: '240px', lineHeight: 1.4 }}>
                                            Esperando código QR de Evolution API...
                                        </p>
                                        <a
                                            href="https://cgbacademyti-evolutionapi-b4df35-72-60-114-137.sslip.io/manager/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: '11.5px',
                                                color: '#0d4f4f',
                                                textDecoration: 'underline',
                                                fontWeight: 600,
                                                marginTop: '4px'
                                            }}
                                        >
                                            Abrir Manager de Evolution API
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Indicador de vigencia del QR */}
                            <div className="indicador-vigencia-qr">
                                <span className="punto-verde-vigencia" />
                                <span>Código QR activo y sincronizado en vivo (auto-refresco en {contadorRefresco}s)</span>
                            </div>

                            <div className="acciones-pie-modal-whatsapp">
                                <button
                                    type="button"
                                    onClick={() => refrescarQr(true)}
                                    className="boton-refrescar-qr-whatsapp"
                                    title="Actualizar el código QR manualmente"
                                >
                                    <IconoRefrescar />
                                    <span>Actualizar QR</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={manejarReinicioSesion}
                                    disabled={reiniciando}
                                    className="boton-reiniciar-sesion-whatsapp"
                                    title="Si no vincula, reinicia la sesión para un código nuevo desde cero"
                                >
                                    <IconoAlerta />
                                    <span>{reiniciando ? 'Reiniciando...' : 'Reiniciar Sesión QR'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatsAppModal;
