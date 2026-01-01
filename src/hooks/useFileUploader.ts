import { useState, useCallback, useMemo } from 'react';

export type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';

export const useFileUploader = () => {
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);

    const isProcessing = useMemo(() => status === 'uploading' || status === 'transcribing', [status]);

    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        if (!file) return null;

        try {
            // --- 1. Subir el archivo ---
            setStatus('uploading');
            setStatusMessage('Subiendo archivo a almacenamiento seguro...');
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch('/api/upload-file', { method: 'POST', body: formData });
            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok) throw new Error(uploadResult.error || 'Fallo en la subida del archivo.');

            // --- 2. Transcribir el archivo ---
            setStatus('transcribing');
            setStatusMessage('✅ Archivo subido. Transcribiendo...');
            const { publicUrl } = uploadResult;

            const transcribeResponse = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicUrl }),
            });
            const transcribeResult = await transcribeResponse.json();

            if (!transcribeResponse.ok) throw new Error(transcribeResult.error || 'Fallo en la transcripción.');

            // --- 3. Éxito ---
            setStatus('success');
            setStatusMessage('¡Transcripción completada con éxito!');
            setTranscriptionResult(transcribeResult.transcription);
            return transcribeResult.transcription;

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
        setStatusMessage // Exposing this in case we need to set manual messages like "File selected"
    };
};
