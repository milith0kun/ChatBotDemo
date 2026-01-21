import { useState, useRef, useCallback } from 'react';
import { sendVoiceMessage, getVoiceResponse } from '../../services/api';
import './VoiceRecorder.css';

// Iconos SVG
const MicrophoneIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const StopIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
);

const VolumeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
);

const VoiceRecorder = ({ onVoiceMessage, sessionId, disabled = false }) => {
    // Estados
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(null);

    // Referencias
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);
    const audioRef = useRef(null);

    // Tiempo máximo de grabación (60 segundos)
    const MAX_RECORDING_TIME = 60;

    // Solicitar permiso de micrófono
    const requestPermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setPermissionGranted(true);
            // Detener el stream inmediatamente después de obtener permiso
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            console.error('Error obteniendo permiso de micrófono:', err);
            setPermissionGranted(false);
            setError('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
            return false;
        }
    }, []);

    // Iniciar grabación
    const startRecording = useCallback(async () => {
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            streamRef.current = stream;
            setPermissionGranted(true);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4'
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: 'audio/webm'
                });

                // Detener stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }

                // Validar duración mínima
                if (audioBlob.size < 1000) {
                    setError('La grabación es muy corta. Intenta de nuevo.');
                    return;
                }

                await processAudio(audioBlob);
            };

            mediaRecorder.start(100); // Capturar cada 100ms
            setIsRecording(true);
            setRecordingTime(0);

            // Iniciar timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= MAX_RECORDING_TIME - 1) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err) {
            console.error('Error iniciando grabación:', err);
            setPermissionGranted(false);
            setError('No se pudo iniciar la grabación. Verifica los permisos.');
        }
    }, []);

    // Detener grabación
    const stopRecording = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    // Procesar audio
    const processAudio = async (audioBlob) => {
        setIsProcessing(true);
        setError(null);

        try {
            // Enviar audio al backend
            const response = await sendVoiceMessage(audioBlob, sessionId);

            if (response.error) {
                setError(response.error);
                setIsProcessing(false);
                return;
            }

            const botResponse = response.bot_response || '';
            const isShortResponse = botResponse.length < 300;

            // Notificar al componente padre
            if (onVoiceMessage) {
                onVoiceMessage({
                    transcribedText: response.transcribed_text,
                    botResponse: botResponse,
                    sessionId: response.session_id,
                    leadData: response.lead_data,
                    // Indicar si se debe mostrar botón de audio
                    showAudioButton: !isShortResponse
                });
            }

            // Solo reproducir audio automáticamente para respuestas cortas
            if (botResponse && isShortResponse) {
                await playVoiceResponse(botResponse);
            }

        } catch (err) {
            console.error('Error procesando audio:', err);
            setError('Error al procesar el audio. Intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Reproducir respuesta de voz
    const playVoiceResponse = async (text) => {
        try {
            const audioBlob = await getVoiceResponse(text);
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };
            audio.onerror = () => {
                setIsPlaying(false);
                console.error('Error reproduciendo audio');
            };

            await audio.play();

        } catch (err) {
            console.error('Error obteniendo audio de respuesta:', err);
            // No mostrar error, el texto ya está visible
        }
    };

    // Detener reproducción
    const stopPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    }, []);

    // Formatear tiempo
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Manejar clic en botón principal
    const handleMainButtonClick = () => {
        if (isRecording) {
            stopRecording();
        } else if (!isProcessing && !disabled) {
            startRecording();
        }
    };

    return (
        <div className="voice-recorder">
            {/* Botón principal */}
            <button
                className={`voice-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''} ${isPlaying ? 'playing' : ''}`}
                onClick={handleMainButtonClick}
                disabled={isProcessing || disabled}
                title={isRecording ? 'Detener grabación' : 'Grabar mensaje de voz'}
            >
                {isProcessing ? (
                    <div className="voice-spinner" />
                ) : isRecording ? (
                    <StopIcon />
                ) : isPlaying ? (
                    <VolumeIcon />
                ) : (
                    <MicrophoneIcon />
                )}
            </button>

            {/* Indicador de grabación */}
            {isRecording && (
                <div className="recording-indicator">
                    <div className="recording-pulse" />
                    <span className="recording-time">{formatTime(recordingTime)}</span>
                </div>
            )}

            {/* Indicador de procesamiento */}
            {isProcessing && (
                <span className="processing-text">Procesando...</span>
            )}

            {/* Indicador de reproducción */}
            {isPlaying && (
                <button
                    className="stop-playback-btn"
                    onClick={stopPlayback}
                    title="Detener reproducción"
                >
                    ⏹
                </button>
            )}

            {/* Error */}
            {error && (
                <div className="voice-error">
                    {error}
                </div>
            )}
        </div>
    );
};

export default VoiceRecorder;
