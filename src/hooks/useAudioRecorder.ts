import { useState, useRef, useCallback } from 'react';
import { handleProcessAudio } from '@/lib/transcription-utils';
import { saveVoiceLog } from '@/lib/save-log';

export const useAudioRecorder = () => {
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
    const [transcriptionTime, setTranscriptionTime] = useState<number | null>(null);

    const isRecording = status === 'recording';
    const isProcessing = status === 'processing';

    const startRecording = useCallback(async (onStart?: () => void, onError?: (err: unknown) => void) => {
        if (status === 'processing') return; // Use status instead of isProcessing
        setAudioBlob(null); // Clear previous recording
        setTranscriptionResult(null); // Clear previous transcription
        setTranscriptionTime(null); // Clear previous transcription time
        setStatus('recording'); // Set status to recording

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
                setStatus('idle'); // Back to idle after recording stops
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();

            setMessage('🔴 Grabando... Haz clic en el botón para detener.');
            if (onStart) onStart();

        } catch (err) {
            console.error('Error al acceder al micrófono:', err);
            setMessage('❌ Error: Acceso al micrófono denegado. Revisa los permisos.');
            setStatus('error');
            if (onError) onError(err);
        }
    }, [status]); // Depend on status

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, [isRecording]);

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
                // Guardar log en Supabase
                await saveVoiceLog({
                    duration: result.duration,
                    transcript: result.text,
                    label: 'Grabación de micrófono',
                });

                setTranscriptionResult(result.text);
                setTranscriptionTime(result.duration);
                setStatus('success');
                setMessage('¡Transcripción completada y guardada!');
                setTimeout(() => setProgress(0), 1000);
                return result.text;
            }
            setStatus('error'); // If result is null, it's an error
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

    return {
        isRecording,
        isProcessing,
        status,
        message,
        audioBlob,
        progress,
        transcriptionResult,
        transcriptionTime,
        startRecording,
        stopRecording,
        transcribeAudio
    };
};
