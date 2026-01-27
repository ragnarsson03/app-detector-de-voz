// src/lib/transcription-utils.ts

import { Client } from '@gradio/client';

const HUGGINGFACE_SPACE = 'xxNikoXx/whisper-asr';

/**
 * Procesa el audio Blob (grabado) enviándolo directamente a Hugging Face.
 * @param audioBlob El Blob de audio capturado por el micrófono.
 * @param fileName El nombre de archivo a usar para la subida.
 * @returns El texto de la transcripción.
 */
export async function handleProcessAudio(audioBlob: Blob, fileName: string): Promise<string> {

    // Crear un objeto File a partir del Blob para enviarlo a Gradio
    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });

    // --- Conexión directa con Hugging Face usando Gradio Client ---
    const client = await Client.connect(HUGGINGFACE_SPACE);

    // Enviar archivo directamente al endpoint /predict
    const result = await client.predict("/predict", {
        inputs: audioFile
    });

    // Extraer transcripción del resultado
    const transcription = result.data as string;

    if (!transcription) {
        throw new Error('No se recibió transcripción del servidor de Hugging Face');
    }

    return transcription;
}
