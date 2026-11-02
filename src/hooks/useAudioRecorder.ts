import { useState, useRef, useCallback, useEffect } from 'react';
import { handleProcessAudio } from '@/lib/transcription-utils';
import { saveVoiceLogAction } from '@/app/actions/save-voice-log';

interface UseAudioRecorderOptions {
    autoStopOnSilence?: boolean;
    silenceThreshold?: number; // 0 a 100
    silenceDurationMs?: number; // tiempo de silencio antes de parar (ej: 1800ms)
    onAutoTranscribed?: (text: string) => void;
}

export const useAudioRecorder = (options: UseAudioRecorderOptions = {}) => {
    const {
        autoStopOnSilence: initialAutoStop = true,
        silenceThreshold = 12,
        silenceDurationMs = 1800,
        onAutoTranscribed
    } = options;

    const [autoStopEnabled, setAutoStopEnabled] = useState(initialAutoStop);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [volume, setVolume] = useState(0); // 0 a 100

    // Estados de VAD (Voice Activity Detection)
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [silenceProgress, setSilenceProgress] = useState(0); // 0 a 100%

    // VAD Refs
    const speechStartedRef = useRef(false);
    const silenceStartRef = useRef<number | null>(null);
    const isStoppingRef = useRef(false);

    // Audio Analysis Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
    const [transcriptionTime, setTranscriptionTime] = useState<number | null>(null);

    const isRecording = status === 'recording';
    const isProcessing = status === 'processing';

    // Función para limpiar el contexto de audio
    const cleanupAudioContext = useCallback(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        audioContextRef.current = null;
        analyserRef.current = null;
        setVolume(0);
        setIsSpeaking(false);
        setSilenceProgress(0);
        speechStartedRef.current = false;
        silenceStartRef.current = null;
    }, []);

    // Reenviar función transcribeAudio
    const transcribeAudio = useCallback(async (blob: Blob): Promise<string | null> => {
        try {
            setStatus('processing');
            setMessage('Procesando audio en tiempo real con Groq Whisper...');
            setProgress(15);
            setTranscriptionTime(null);
            setTranscriptionResult(null);

            const result = await handleProcessAudio(
                blob,
                `recording_${Date.now()}.wav`,
                (p, m) => {
                    setProgress(p);
                    setMessage(m);
                }
            );

            if (result) {
                try {
                    await saveVoiceLogAction({
                        duration: result.duration,
                        transcript: result.text,
                        label: 'Grabación en vivo',
                    });
                } catch (logError) {
                    console.error('[useAudioRecorder] Aviso: No se pudo guardar el log en el servidor', logError);
                }

                setTranscriptionResult(result.text);
                setTranscriptionTime(result.duration);
                setStatus('success');
                setMessage('¡Transcripción completada y guardada!');
                setTimeout(() => setProgress(0), 2000);

                if (onAutoTranscribed) {
                    onAutoTranscribed(result.text);
                }
                return result.text;
            }
            setStatus('error');
            setMessage('❌ Error: No se pudo obtener la transcripción.');
            setProgress(0);
            return null;
        } catch (error) {
            console.error('[useAudioRecorder] Error crítico:', error);
            setStatus('error');
            setMessage(`❌ Error: ${(error as Error).message}`);
            setProgress(0);
            return null;
        }
    }, [onAutoTranscribed]);

    // Detener grabación y devolver el blob
    const stopRecording = useCallback((): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                isStoppingRef.current = true;
                const recorder = mediaRecorderRef.current;

                recorder.onstop = () => {
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    setAudioBlob(blob);
                    audioChunksRef.current = [];
                    cleanupAudioContext();
                    setMessage('Audio finalizado. Listo.');
                    setStatus('idle');
                    isStoppingRef.current = false;
                    resolve(blob);
                };

                recorder.stop();
            } else {
                resolve(null);
            }
        });
    }, [cleanupAudioContext]);

    // Función para auto-detener y transcribir automáticamente
    const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
        if (isStoppingRef.current) return null;
        const blob = await stopRecording();
        if (blob && blob.size > 0) {
            return await transcribeAudio(blob);
        }
        return null;
    }, [stopRecording, transcribeAudio]);

    // Monitorear volumen en tiempo real y VAD (Detección de Silencio)
    const monitorVolume = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));
        setVolume(normalizedVolume);

        // --- LÓGICA VAD (DETECCIÓN DE ACTIVIDAD Y SILENCIO) ---
        if (autoStopEnabled && !isStoppingRef.current) {
            const now = Date.now();

            if (normalizedVolume >= silenceThreshold) {
                // Usuario está hablando
                speechStartedRef.current = true;
                silenceStartRef.current = null;
                setIsSpeaking(true);
                setSilenceProgress(0);
            } else {
                // Volumen bajo / Silencio
                setIsSpeaking(false);

                // Solo empezamos conteo si el usuario ya empezó a hablar antes
                if (speechStartedRef.current) {
                    if (!silenceStartRef.current) {
                        silenceStartRef.current = now;
                    }

                    const elapsed = now - silenceStartRef.current;
                    const pct = Math.min(100, Math.round((elapsed / silenceDurationMs) * 100));
                    setSilenceProgress(pct);

                    if (elapsed >= silenceDurationMs && !isStoppingRef.current) {
                        isStoppingRef.current = true;
                        // Auto-detener y enviar a transcribir directamente
                        stopAndTranscribe();
                        return; // Termina el loop de animación
                    }
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(monitorVolume);
    }, [autoStopEnabled, silenceThreshold, silenceDurationMs, stopAndTranscribe]);

    // Iniciar grabación
    const startRecording = useCallback(async (onStart?: () => void, onError?: (err: unknown) => void) => {
        if (status === 'processing') return;
        setAudioBlob(null);
        setTranscriptionResult(null);
        setTranscriptionTime(null);
        setStatus('recording');
        isStoppingRef.current = false;
        speechStartedRef.current = false;
        silenceStartRef.current = null;
        setSilenceProgress(0);

        try {
            setMessage('Solicitando acceso al micrófono...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;
            monitorVolume();

            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();

            setMessage('🔴 Grabando... Habla libremente.');
            if (onStart) onStart();

        } catch (err) {
            console.error('Error al acceder al micrófono:', err);
            setMessage('❌ Error: Acceso al micrófono denegado.');
            setStatus('error');
            cleanupAudioContext();
            if (onError) onError(err);
        }
    }, [status, monitorVolume, cleanupAudioContext]);

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            cleanupAudioContext();
        };
    }, [cleanupAudioContext]);

    return {
        isRecording,
        isProcessing,
        status,
        message,
        audioBlob,
        progress,
        volume,
        isSpeaking,
        silenceProgress,
        autoStopEnabled,
        setAutoStopEnabled,
        transcriptionResult,
        transcriptionTime,
        startRecording,
        stopRecording,
        transcribeAudio,
        stopAndTranscribe,
    };
};
