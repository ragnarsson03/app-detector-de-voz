import { useState, useRef, useCallback, useEffect } from 'react';
import { handleProcessAudio } from '@/lib/transcription-utils';
import { saveVoiceLogAction } from '@/app/actions/save-voice-log';

export const useAudioRecorder = () => {
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [volume, setVolume] = useState(0); // 0 a 100

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
    }, []);

    // Monitorear volumen en tiempo real
    const monitorVolume = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calcular promedio de volumen (RMS aproximado)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Normalizar 0 a 100 (ajustado para que sea sensible pero no sature)
        // El valor máximo de byte es 255. Un valor de 128 suele ser ya bastante alto.
        const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));
        setVolume(normalizedVolume);

        animationFrameRef.current = requestAnimationFrame(monitorVolume);
    }, []);

    const startRecording = useCallback(async (onStart?: () => void, onError?: (err: unknown) => void) => {
        if (status === 'processing') return;
        setAudioBlob(null);
        setTranscriptionResult(null);
        setTranscriptionTime(null);
        setStatus('recording');

        try {
            setMessage('Solicitando acceso al micrófono...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Configurar Web Audio API para métricas
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

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
                cleanupAudioContext();
                setMessage('Audio capturado. Listo para transcribir.');
                setStatus('idle');
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();

            setMessage('🔴 Grabando... Haz clic en el botón para detener.');
            if (onStart) onStart();

        } catch (err) {
            console.error('Error al acceder al micrófono:', err);
            setMessage('❌ Error: Acceso al micrófono denegado. Revisa los permisos.');
            setStatus('error');
            cleanupAudioContext();
            if (onError) onError(err);
        }
    }, [status, monitorVolume, cleanupAudioContext]);

    const stopRecording = useCallback((): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                const handleStop = () => {
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    setAudioBlob(blob);
                    // No llamamos a resolve aquí directamente porque queremos el blob final
                    // que se asienta en onstop oficial del mediaRecorder para limpiar pistas.
                    // Pero para facilitar el flujo, podemos capturarlo aquí también.
                };

                // Usamos una vez onstop local para capturar el blob rápidamente si es necesario
                const originalOnStop = mediaRecorderRef.current?.onstop;
                if (mediaRecorderRef.current) {
                    mediaRecorderRef.current.onstop = (e) => {
                        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        if (originalOnStop) originalOnStop.call(mediaRecorderRef.current!, e);
                        resolve(blob);
                    };
                }

                mediaRecorderRef.current?.stop();
            } else {
                resolve(null);
            }
        });
    }, []);

    const transcribeAudio = useCallback(async (blob: Blob): Promise<string | null> => {
        try {
            setStatus('processing');
            setMessage('Procesando audio...');
            setProgress(0);
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
                await saveVoiceLogAction({
                    duration: result.duration,
                    transcript: result.text,
                    label: 'Grabación de micrófono',
                });

                setTranscriptionResult(result.text);
                setTranscriptionTime(result.duration);
                setStatus('success');
                setMessage('¡Transcripción completada y guardada!');
                setTimeout(() => setProgress(0), 2000);
                return result.text;
            }
            setStatus('error');
            setMessage('❌ Error: No se pudo obtener la transcripción.');
            setProgress(0);
            return null;
        } catch (error) {
            setStatus('error');
            setMessage(`❌ Error: ${(error as Error).message}`);
            setProgress(0);
            return null;
        }
    }, []);

    // Cleanup on unmount
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
        transcriptionResult,
        transcriptionTime,
        startRecording,
        stopRecording,
        transcribeAudio
    };
};
