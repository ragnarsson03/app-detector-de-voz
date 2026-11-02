import { useState, useRef, useCallback, useEffect } from 'react';
import { handleProcessAudio } from '@/lib/transcription-utils';
import { saveVoiceLogAction } from '@/app/actions/save-voice-log';

interface UseAudioRecorderOptions {
    onAutoTranscribed?: (text: string) => void;
}

export const useAudioRecorder = (options: UseAudioRecorderOptions = {}) => {
    const { onAutoTranscribed } = options;

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

    // Limpiar contexto de audio
    const cleanupAudioContext = useCallback(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        audioContextRef.current = null;
        analyserRef.current = null;
        setVolume(0);
    }, []);

    // Monitorear volumen en tiempo real (métrica de dB / ondas)
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

        animationFrameRef.current = requestAnimationFrame(monitorVolume);
    }, []);

    // Transcribir audio procesado
    const transcribeAudio = useCallback(async (blob: Blob): Promise<string | null> => {
        try {
            setStatus('processing');
            setMessage('Transcribiendo audio...');
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
                        label: 'Grabación de voz',
                    });
                } catch (logError) {
                    console.error('[useAudioRecorder] Error guardando log:', logError);
                }

                setTranscriptionResult(result.text);
                setTranscriptionTime(result.duration);
                setStatus('success');
                setMessage('¡Transcripción completada!');
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

    // Iniciar grabación
    const startRecording = useCallback(async (onStart?: () => void, onError?: (err: unknown) => void) => {
        if (status === 'processing') return;
        setAudioBlob(null);
        setTranscriptionResult(null);
        setTranscriptionTime(null);
        setStatus('recording');

        try {
            setMessage('Accediendo al micrófono...');
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

            setMessage('🔴 Grabando... Pulsa "Detener y Enviar" cuando termines.');
            if (onStart) onStart();

        } catch (err) {
            console.error('Error al acceder al micrófono:', err);
            setMessage('❌ Error: Acceso al micrófono denegado.');
            setStatus('error');
            cleanupAudioContext();
            if (onError) onError(err);
        }
    }, [status, monitorVolume, cleanupAudioContext]);

    // Detener grabación y devolver Blob
    const stopRecording = useCallback((): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                const recorder = mediaRecorderRef.current;
                recorder.onstop = () => {
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    setAudioBlob(blob);
                    audioChunksRef.current = [];
                    cleanupAudioContext();
                    setStatus('idle');
                    resolve(blob);
                };
                recorder.stop();
            } else {
                resolve(null);
            }
        });
    }, [cleanupAudioContext]);

    // Detener y transcribir de una sola vez al pulsar Enviar
    const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
        const blob = await stopRecording();
        if (blob && blob.size > 0) {
            return await transcribeAudio(blob);
        }
        return null;
    }, [stopRecording, transcribeAudio]);

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
        transcribeAudio,
        stopAndTranscribe,
    };
};
