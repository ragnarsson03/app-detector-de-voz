import { useState, useCallback, useMemo } from 'react';
import { Client } from '@gradio/client';

export type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';

const HUGGINGFACE_SPACE = 'xxNikoXx/whisper-asr';

export const useFileUploader = () => {
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0); // 0-100

    const isProcessing = useMemo(() => status === 'uploading' || status === 'transcribing', [status]);

    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        if (!file) return null;

        try {
            // Reset progress
            setProgress(0);

            // --- Conexión directa con Hugging Face usando Gradio Client ---
            setStatus('uploading');
            setStatusMessage('Conectando con Hugging Face...');
            setProgress(10);

            const client = await Client.connect(HUGGINGFACE_SPACE);
            setProgress(20);

            setStatus('transcribing');
            setStatusMessage('Enviando audio...');

            // Usar submit() en lugar de predict() para obtener eventos de progreso
            const job = client.submit("/predict", {
                audio: file
            });

            // Escuchar eventos de progreso
            for await (const message of job) {
                if (message.type === 'status') {
                    if (message.stage === 'pending') {
                        setStatusMessage('⏳ En cola de procesamiento...');
                        setProgress(30);
                    } else if (message.stage === 'processing') {
                        setStatusMessage('🔄 Transcribiendo audio...');
                        setProgress(50);
                    }
                } else if (message.type === 'data') {
                    setProgress(90);
                    setStatusMessage('✨ Finalizando...');
                }
            }

            // Obtener resultado final
            const result = await job;
            setProgress(100);

            // Extraer transcripción del resultado
            const transcription = result.data as string;

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
            console.error('Error en el proceso:', error);
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
