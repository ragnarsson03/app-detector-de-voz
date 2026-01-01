import { useState, useRef, useCallback } from 'react';
import { handleProcessAudio } from '@/lib/transcription-utils';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('Presiona el micrófono para grabar.');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async (onStart?: () => void, onError?: (err: unknown) => void) => {
        if (isProcessing) return;

        try {
            setMessage('Solicitando acceso al micrófono...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // We return a promise that resolves with the blob when recording stops
            mediaRecorder.onstop = () => {
                // Logic handled in stopRecording wrapper or externally if needed, 
                // but here we mainly manage the state. 
                // Actual processing happens when we call stop.
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

    const stopRecording = useCallback(async (): Promise<string | null> => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {

                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    audioChunksRef.current = [];

                    // Stop all tracks
                    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

                    setIsRecording(false);
                    setIsProcessing(true);
                    setMessage('Subiendo audio y esperando transcripción...');

                    try {
                        const transcription = await handleProcessAudio(audioBlob, 'audio.webm');
                        setMessage('✅ Transcripción completada.');
                        resolve(transcription);
                    } catch (error) {
                        const errMsg = error instanceof Error ? error.message : 'Error desconocido';
                        setMessage(`❌ Error al transcribir: ${errMsg}`);
                        resolve(null);
                    } finally {
                        setIsProcessing(false);
                    }
                };

                mediaRecorderRef.current.stop();
            } else {
                resolve(null);
            }
        });
    }, []);

    return {
        isRecording,
        isProcessing,
        message,
        startRecording,
        stopRecording
    };
};
