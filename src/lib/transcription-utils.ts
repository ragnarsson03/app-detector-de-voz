// src/lib/transcription-utils.ts

import { Client } from '@gradio/client';

const HUGGINGFACE_SPACE = 'xxNikoXx/whisper-asr';
const CONNECTION_TIMEOUT = 60000; // 60 segundos
const FINALIZING_TIMEOUT = 10000; // 10 segundos extra para el estado final

// Cliente persistente (singleton) compartido
let gradioClient: Client | null = null;

async function getGradioClient(): Promise<Client> {
    if (!gradioClient) {
        gradioClient = await Client.connect(HUGGINGFACE_SPACE);
    }
    return gradioClient;
}

/**
 * Procesa el audio Blob (grabado) enviándolo directamente a Hugging Face.
 * @param audioBlob El Blob de audio capturado por el micrófono.
 * @param fileName El nombre de archivo a usar para la subida.
 * @param onProgress Callback opcional para reportar progreso (0-100).
 * @returns El texto de la transcripción.
 */
export async function handleProcessAudio(
    audioBlob: Blob,
    fileName: string,
    onProgress?: (progress: number, message: string) => void
): Promise<{ text: string; duration: number } | null> {

    // Crear un objeto File a partir del Blob para enviarlo a Gradio
    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });

    // Timeout controller global
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
        abortController.abort();
    }, CONNECTION_TIMEOUT);

    // Watchdog para el estado 90% (Finalizando)
    let finalizingTimeoutId: NodeJS.Timeout | null = null;

    try {
        const startTime = performance.now();
        // --- Conexión directa con Hugging Face usando Gradio Client ---
        onProgress?.(10, 'Conectando con Hugging Face...');
        const client = await getGradioClient();

        onProgress?.(20, 'Enviando audio...');

        // Usar submit() para obtener eventos de progreso
        const job = client.submit("/predict", [audioFile]);

        let transcription: string | null = null;

        // Escuchar eventos de progreso
        for await (const message of job) {
            // Verificar timeout global
            if (abortController.signal.aborted) {
                throw new Error('Timeout: La transcripción tardó demasiado (>60s)');
            }

            if (message.type === 'status') {
                const stage = message.stage as string;
                if (stage === 'pending') {
                    onProgress?.(30, '⏳ En cola de procesamiento...');
                } else if (stage === 'generating' || stage === 'streaming') {
                    onProgress?.(50, '🔄 Transcribiendo audio...');
                }
            } else if (message.type === 'data') {
                // Entramos en "Finalizando"
                onProgress?.(90, '✨ Finalizando...');

                // Iniciar watchdog de seguridad de 5 segundos para este estado específico
                finalizingTimeoutId = setTimeout(() => {
                    if (!transcription) {
                        console.warn('[handleProcessAudio] Forzando timeout en fase de finalización');
                        abortController.abort();
                    }
                }, 5000);

                try {
                    const data = message.data;
                    if (Array.isArray(data) && data.length > 0) {
                        transcription = String(data[0]);
                    } else {
                        transcription = String(data);
                    }
                    console.log('[DEBUG] Transcripción (voz) extraída:', transcription);
                } catch (e) {
                    console.error('Error extrayendo data:', e);
                }

                // Ya tenemos la data, limpiar el watchdog y salir del loop
                if (finalizingTimeoutId) clearTimeout(finalizingTimeoutId);
                break;
            }
        }

        clearTimeout(timeoutId);
        onProgress?.(100, 'Completado');

        const endTime = performance.now();
        const duration = parseFloat(((endTime - startTime) / 1000).toFixed(3));

        return { text: transcription || "", duration };
    } catch (error) {
        clearTimeout(timeoutId);
        if (finalizingTimeoutId) clearTimeout(finalizingTimeoutId);

        // Si es error de conexión, resetear cliente
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('connect') || errorMessage.includes('Timeout') || abortController.signal.aborted) {
            gradioClient = null;
            if (abortController.signal.aborted) {
                throw new Error('Timeout de Seguridad: La transcripción se detuvo. Por favor reintenta.');
            }
        }

        throw error;
    }
}
