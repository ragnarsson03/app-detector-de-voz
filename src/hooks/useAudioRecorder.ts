import { useState, useRef, useCallback } from 'react';
import { handleProcessAudio } from '@/lib/transcription-utils';

export const useAudioRecorder = () => {
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('Presiona el micrófono para grabar.');
    const [progress, setProgress] = useState<number>(0); // 0-100
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async (onStart?: () => void, onError?: (err: unknown) => void) => {
        if (isProcessing) return;
        setAudioBlob(null); // Clear previous recording

        try {
            setMessage('Solicitando acceso al micrófono...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            audioChunksRef.current = []; // Reset chunks

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                audioChunksRef.current = [];
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                setMessage('Audio capturado. Listo para transcribir.');
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setMessage('🔴 Grabando... Haz clic en el botón para detener.');
            if (onStart) onStart();

        } catch (err) {
            console.error('Error al acceder al micrófono:', err);
            setMessage('❌ Error: Acceso al micrófono denegado. Revisa los permisos.');
            setIsRecording(false);
            if (onError) onError(err);
        }
    }, [isProcessing]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const transcribeAudio = useCallback(async (blob: Blob): Promise<string | null> => {
        setIsProcessing(true);
        setProgress(0);
        setMessage('Preparando audio...');

        try {
            const transcription = await handleProcessAudio(
                blob,
                'audio.webm',
                (progressValue, progressMessage) => {
                    setProgress(progressValue);
                    setMessage(progressMessage);
                }
            );

            setMessage('✅ Transcripción completada.');
            setTimeout(() => setProgress(0), 1000);
            return transcription;
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Error desconocido';
            setMessage(`❌ Error al transcribir: ${errMsg}`);
            setProgress(0);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    return {
        isRecording,
        isProcessing,
        message,
        audioBlob,
        progress, // Exportar progreso
        startRecording,
        stopRecording,
        transcribeAudio
    };
};
