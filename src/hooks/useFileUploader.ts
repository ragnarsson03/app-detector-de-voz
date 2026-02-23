import { useState, useCallback, useMemo, useRef } from 'react';
import { saveVoiceLogAction } from '@/app/actions/save-voice-log';

export type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';
const CONNECTION_TIMEOUT = 60000;

// Hugging Face logic has been removed to switch to Groq API via our backend server.

export const useFileUploader = () => {
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0); // 0-100
    const [transcriptionTime, setTranscriptionTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const isProcessing = useMemo(() => status === 'uploading' || status === 'transcribing', [status]);

    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        if (!file) return null;

        // Crear AbortController para timeout
        abortControllerRef.current = new AbortController();
        const timeoutId = setTimeout(() => {
            abortControllerRef.current?.abort();
        }, CONNECTION_TIMEOUT);

        try {
            const startTime = performance.now();
            // Reset state
            setProgress(0);
            setTranscriptionResult(null);
            setTranscriptionTime(null);
            setElapsedTime(0);

            // Start Timer
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

            setStatus('uploading');
            setStatusMessage('Preparando archivo...');
            setProgress(10);

            const formData = new FormData();
            formData.append('file', file);

            setStatus('transcribing');
            setStatusMessage('Transcribiendo AUdio...');
            setProgress(40);

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fallo en la transcripción');
            }

            setProgress(80);
            setStatusMessage('Procesando resultados...');

            const data = await response.json();
            const text = data.text || "";

            console.log('[DEBUG] Texto extraído con Groq:', text);

            // Guardamos en variable local y actualizamos ESTADO INMEDIATAMENTE
            setTranscriptionResult(text);

            // Finalizamos visualmente
            const endTime = performance.now();
            const duration = parseFloat(((endTime - startTime) / 1000).toFixed(3));
            setTranscriptionTime(duration);

            // Guardar log en Supabase (Server Action) - No bloquear si falla
            try {
                await saveVoiceLogAction({
                    duration: duration,
                    transcript: text,
                    label: `Archivo: ${file.name}`,
                });
            } catch (logErr) {
                console.error('[useFileUploader] Aviso: No se pudo guardar el log en el servidor', logErr);
            }

            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

            setProgress(100);
            setStatusMessage('✨ Finalizado y guardado');
            setStatus('success'); // Liberar el botón inmediatamente

            return text; // Salir de la función directamente

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error en el proceso:', error);

            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (abortControllerRef.current?.signal.aborted) {
                setStatus('idle');
                setStatusMessage('Operación cancelada');
            } else {
                setStatus('error');
                setStatusMessage(`❌ Error: ${(error as Error).message}`);
            }
            setProgress(0);
            return null;
        }
    }, []);

    const cancelUpload = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        setStatus('idle');
        setStatusMessage('Cancelado por el usuario');
        setProgress(0);
    }, []);

    const resetStatus = useCallback(() => {
        setStatus('idle');
        setStatusMessage('');
        setTranscriptionResult(null);
        setProgress(0);
    }, []);

    return {
        status,
        statusMessage,
        isProcessing,
        uploadFile,
        transcriptionResult,
        transcriptionTime, // <--- AÑADIDO
        resetStatus,
        setStatusMessage,
        progress, // Exportar progreso para la barra visual
        cancelUpload,
        elapsedTime
    };
};
