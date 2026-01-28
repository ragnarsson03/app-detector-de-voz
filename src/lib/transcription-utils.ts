// src/lib/transcription-utils.ts

import { Client } from '@gradio/client';

const HUGGINGFACE_SPACE = 'xxNikoXx/whisper-asr';

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
): Promise<string> {

    // Crear un objeto File a partir del Blob para enviarlo a Gradio
    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });

    // --- Conexión directa con Hugging Face usando Gradio Client ---
    onProgress?.(10, 'Conectando con Hugging Face...');
    const client = await Client.connect(HUGGINGFACE_SPACE);

    onProgress?.(20, 'Enviando audio...');

    // Usar submit() para obtener eventos de progreso
    const job = client.submit("/predict", {
        audio: audioFile
    });

    let transcription: string | null = null;

    // Escuchar eventos de progreso
    for await (const message of job) {
        if (message.type === 'status') {
            const stage = message.stage as string;
            if (stage === 'pending') {
                onProgress?.(30, '⏳ En cola de procesamiento...');
            } else if (stage === 'generating' || stage === 'streaming') {
                onProgress?.(50, '🔄 Transcribiendo audio...');
            }
        } else if (message.type === 'data') {
            onProgress?.(90, '✨ Finalizando...');
            // Extraer transcripción del evento data
            transcription = (message.data as unknown) as string;
        }
    }

    onProgress?.(100, 'Completado');

    if (!transcription) {
        throw new Error('No se recibió transcripción del servidor de Hugging Face');
    }

    return transcription;
}
