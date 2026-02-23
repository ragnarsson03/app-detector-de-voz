// src/lib/transcription-utils.ts

// Hugging Face logic has been removed to switch to Groq API.

export async function handleProcessAudio(
    audioBlob: Blob,
    fileName: string,
    onProgress?: (progress: number, message: string) => void
): Promise<{ text: string; duration: number } | null> {

    // Crear un objeto File a partir del Blob 
    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });

    // Timeout controller global
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
        abortController.abort();
    }, 60000);

    try {
        const startTime = performance.now();
        onProgress?.(10, 'Preparando audio...');

        const formData = new FormData();
        formData.append('file', audioFile);

        onProgress?.(40, 'Conectando al servidor (Groq API)...');

        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
            signal: abortController.signal
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la transcripción');
        }

        onProgress?.(80, 'Procesando resultados...');

        const data = await response.json();

        clearTimeout(timeoutId);
        onProgress?.(100, 'Completado');

        const endTime = performance.now();
        const duration = parseFloat(((endTime - startTime) / 1000).toFixed(3));

        console.log('[DEBUG] Transcripción (Groq) extraída:', data.text);

        return { text: data.text || "", duration };
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('[transcription-utils] Error con Groq API:', error);
        throw error;
    }
}
