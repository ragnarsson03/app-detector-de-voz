import { useState, useCallback, useMemo } from 'react';
import { Client } from '@gradio/client';

export type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';

const HUGGINGFACE_SPACE = 'xxNikoXx/whisper-asr';

export const useFileUploader = () => {
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);

    const isProcessing = useMemo(() => status === 'uploading' || status === 'transcribing', [status]);

    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        if (!file) return null;

        try {
            // --- Conexión directa con Hugging Face usando Gradio Client ---
            setStatus('transcribing');
            setStatusMessage('Conectando con Hugging Face...');

            const client = await Client.connect(HUGGINGFACE_SPACE);

            setStatusMessage('Enviando audio para transcripción...');

            // Enviar archivo directamente al endpoint /predict
            const result = await client.predict("/predict", {
                audio: file
            });

            // Extraer transcripción del resultado
            const transcription = result.data as string;

            if (!transcription) {
                throw new Error('No se recibió transcripción del servidor');
            }

            // --- Éxito ---
            setStatus('success');
            setStatusMessage('¡Transcripción completada con éxito!');
            setTranscriptionResult(transcription);
            return transcription;

        } catch (error) {
            console.error('Error en el proceso:', error);
            setStatus('error');
            setStatusMessage(`❌ Error: ${(error as Error).message}`);
            return null;
        }
    }, []);

    const resetStatus = useCallback(() => {
        setStatus('idle');
        setStatusMessage('');
        setTranscriptionResult(null);
    }, []);

    return {
        status,
        statusMessage,
        isProcessing,
        uploadFile,
        transcriptionResult,
        resetStatus,
        setStatusMessage
    };
};
