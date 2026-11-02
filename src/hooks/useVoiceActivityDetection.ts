import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVADOptions {
    silenceThreshold?: number; // Umbral de volumen (0-100) para considerar silencio
    silenceTimeoutMs?: number; // Tiempo de silencio en ms antes de auto-detener (ej: 1800ms)
    minSpeechDurationMs?: number; // Tiempo mínimo hablando antes de habilitar el auto-stop (ej: 800ms)
    enabled?: boolean;
    onSilenceDetected?: () => void;
}

export const useVoiceActivityDetection = ({
    silenceThreshold = 12,
    silenceTimeoutMs = 1800,
    minSpeechDurationMs = 800,
    enabled = true,
    onSilenceDetected,
}: UseVADOptions = {}) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [silenceProgress, setSilenceProgress] = useState(0); // 0 a 100% de la cuenta regresiva

    const speechStartTimeRef = useRef<number | null>(null);
    const silenceStartTimeRef = useRef<number | null>(null);
    const hasSpokenRef = useRef(false);
    const triggeredRef = useRef(false);

    const resetVAD = useCallback(() => {
        speechStartTimeRef.current = null;
        silenceStartTimeRef.current = null;
        hasSpokenRef.current = false;
        triggeredRef.current = false;
        setIsSpeaking(false);
        setSilenceProgress(0);
    }, []);

    const processVolume = useCallback(
        (volume: number) => {
            if (!enabled || triggeredRef.current) return;

            const now = Date.now();

            if (volume > silenceThreshold) {
                // Usuario está hablando
                if (!speechStartTimeRef.current) {
                    speechStartTimeRef.current = now;
                }

                // Si ha hablado el tiempo mínimo necesario
                if (now - speechStartTimeRef.current >= minSpeechDurationMs) {
                    hasSpokenRef.current = true;
                }

                setIsSpeaking(true);
                silenceStartTimeRef.current = null;
                setSilenceProgress(0);
            } else {
                // Hay silencio o volumen bajo
                setIsSpeaking(false);

                // Solo empezamos a contar silencio si el usuario ya habló previamente
                if (hasSpokenRef.current) {
                    if (!silenceStartTimeRef.current) {
                        silenceStartTimeRef.current = now;
                    }

                    const elapsedSilence = now - silenceStartTimeRef.current;
                    const progressPercent = Math.min(100, Math.round((elapsedSilence / silenceTimeoutMs) * 100));
                    setSilenceProgress(progressPercent);

                    // Se cumplió el tiempo de silencio: auto-detener
                    if (elapsedSilence >= silenceTimeoutMs) {
                        triggeredRef.current = true;
                        setSilenceProgress(100);
                        if (onSilenceDetected) {
                            onSilenceDetected();
                        }
                    }
                }
            }
        },
        [enabled, silenceThreshold, silenceTimeoutMs, minSpeechDurationMs, onSilenceDetected]
    );

    return {
        isSpeaking,
        silenceProgress,
        resetVAD,
        processVolume,
    };
};
