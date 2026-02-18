import { useState, useCallback, useMemo, useRef } from 'react';
import { Client } from '@gradio/client';
import { saveVoiceLogAction } from '@/app/actions/save-voice-log';

export type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';

const HUGGINGFACE_SPACE = 'xxNikoXx/whisper-asr';
const CONNECTION_TIMEOUT = 60000; // 60 segundos

// Cliente persistente (singleton) para evitar reconexiones
let gradioClient: Client | null = null;

async function getGradioClient(): Promise<Client> {
    if (!gradioClient) {
        gradioClient = await Client.connect(HUGGINGFACE_SPACE);
    }
    return gradioClient;
}

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

            // --- Conexión directa con Hugging Face usando Gradio Client ---
            setStatus('uploading');
            setStatusMessage('Conectando con Hugging Face...');
            setProgress(10);


            console.log('[DEBUG] Conectando a Gradio Space:', HUGGINGFACE_SPACE);
            const client = await getGradioClient();
            console.log('[DEBUG] Cliente conectado exitosamente');
            setProgress(20);

            setStatus('transcribing');
            setStatusMessage('Enviando audio...');

            // Usar submit() en lugar de predict() para obtener eventos de progreso
            // gr.Interface espera un array con los inputs en orden
            console.log('[DEBUG] Enviando archivo:', {
                name: file.name,
                size: file.size,
                type: file.type
            });
            const job = client.submit("/predict", [file]);
            console.log('[DEBUG] Job creado, esperando eventos...');

            let transcription: string | null = null;

            // Escuchar eventos de progreso
            for await (const message of job) {
                console.log('[DEBUG] Evento recibido:', {
                    type: message.type,
                    stage: message.type === 'status' ? (message as any).stage : undefined,
                    hasData: message.type === 'data'
                });

                // Verificar si fue abortado
                if (abortControllerRef.current?.signal.aborted) {
                    throw new Error('Timeout: La transcripción tardó demasiado (>60s)');
                }

                if (message.type === 'status') {
                    const stage = message.stage as string;
                    console.log('[DEBUG] Status stage:', stage);
                    if (stage === 'pending') {
                        setStatusMessage('⏳ En cola de procesamiento...');
                        setProgress(30);
                    } else if (stage === 'generating' || stage === 'complete') {
                        setStatusMessage('🔄 Transcribiendo audio...');
                        setProgress(50);
                    }
                } else if (message.type === 'data') {
                    console.log('[DEBUG] Data recibida RAW:', message.data);

                    try {
                        const data = message.data;
                        let text = "";

                        // Extracción segura usando String() para evitar problemas de tipos
                        if (Array.isArray(data) && data.length > 0) {
                            text = String(data[0]);
                        } else {
                            text = String(data);
                        }

                        console.log('[DEBUG] Texto extraído con éxito:', text);

                        // Guardamos en variable local y actualizamos ESTADO INMEDIATAMENTE
                        transcription = text;
                        setTranscriptionResult(text);

                        // Finalizamos visualmente
                        const endTime = performance.now();
                        const duration = parseFloat(((endTime - startTime) / 1000).toFixed(3));
                        setTranscriptionTime(duration);

                        // Guardar log en Supabase (Server Action)
                        await saveVoiceLogAction({
                            duration: duration,
                            transcript: text,
                            label: `Archivo: ${file.name}`,
                        });

                        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

                        setProgress(100);
                        setStatusMessage('✨ Finalizado y guardado');
                        setStatus('success'); // Liberar el botón inmediatamente

                        // Limpiar timeout
                        clearTimeout(timeoutId);

                        // Reset visual retardado
                        setTimeout(() => {
                            setProgress(0);
                            setStatus('idle');
                        }, 2000);

                        return text; // Salir de la función directamente

                    } catch (err) {
                        console.error('[DEBUG] Error fatal al procesar data:', err);
                        throw err;
                    }
                }
            }

            // Si llegamos aquí sin haber retornado, algo falló
            throw new Error('El proceso terminó sin recibir datos finales');

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error en el proceso:', error);

            // Si es error de conexión, resetear cliente para reconectar
            if ((error as Error).message.includes('connect') || (error as Error).message.includes('Timeout')) {
                gradioClient = null;
            }

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
