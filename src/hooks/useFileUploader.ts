import { useState, useCallback, useMemo, useRef } from 'react';
import { Client } from '@gradio/client';

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
    const abortControllerRef = useRef<AbortController | null>(null);

    const isProcessing = useMemo(() => status === 'uploading' || status === 'transcribing', [status]);

    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        if (!file) return null;

        // Crear AbortController para timeout
        abortControllerRef.current = new AbortController();
        const timeoutId = setTimeout(() => {
            abortControllerRef.current?.abort();
        }, CONNECTION_TIMEOUT);

        try {
            // Reset progress
            setProgress(0);

            // --- Conexión directa con Hugging Face usando Gradio Client ---
            setStatus('uploading');
            setStatusMessage('Conectando con Hugging Face...');
            setProgress(10);

            const client = await getGradioClient();
            setProgress(20);

            setStatus('transcribing');
            setStatusMessage('Enviando audio...');

            // Usar submit() en lugar de predict() para obtener eventos de progreso
            // gr.Interface espera un array con los inputs en orden
            const job = client.submit("/predict", [file]);

            let transcription: string | null = null;

            // Escuchar eventos de progreso
            for await (const message of job) {
                // Verificar si fue abortado
                if (abortControllerRef.current?.signal.aborted) {
                    throw new Error('Timeout: La transcripción tardó demasiado (>60s)');
                }

                if (message.type === 'status') {
                    const stage = message.stage as string;
                    if (stage === 'pending') {
                        setStatusMessage('⏳ En cola de procesamiento...');
                        setProgress(30);
                    } else if (stage === 'generating' || stage === 'complete') {
                        setStatusMessage('🔄 Transcribiendo audio...');
                        setProgress(50);
                    }
                } else if (message.type === 'data') {
                    setProgress(90);
                    setStatusMessage('✨ Finalizando...');
                    // Extraer transcripción del evento data
                    transcription = (message.data as unknown) as string;
                }
            }

            clearTimeout(timeoutId);
            setProgress(100);

            if (!transcription) {
                throw new Error('No se recibió transcripción del servidor');
            }

            // --- Éxito ---
            setStatus('success');
            setStatusMessage('¡Transcripción completada con éxito!');
            setTranscriptionResult(transcription);

            // Reset progress after 1 second
            setTimeout(() => setProgress(0), 1000);

            return transcription;

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error en el proceso:', error);

            // Si es error de conexión, resetear cliente para reconectar
            if ((error as Error).message.includes('connect') || (error as Error).message.includes('Timeout')) {
                gradioClient = null;
            }

            setStatus('error');
            setStatusMessage(`❌ Error: ${(error as Error).message}`);
            setProgress(0);
            return null;
        }
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
        resetStatus,
        setStatusMessage,
        progress // Exportar progreso para la barra visual
    };
};
