// src/lib/transcription-utils.ts

/**
 * Procesa el audio Blob (grabado) enviándolo al backend para su subida y transcripción.
 * @param audioBlob El Blob de audio capturado por el micrófono.
 * @param fileName El nombre de archivo a usar para la subida.
 * @returns El texto de la transcripción.
 */
export async function handleProcessAudio(audioBlob: Blob, fileName: string): Promise<string> {
    
    // Crear un objeto File a partir del Blob, ya que el backend espera un File/FormData
    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });

    // --- PASO 1: SUBIR ARCHIVO A SUPABASE (API Route /api/upload-file) ---
    const formData = new FormData();
    formData.append('file', audioFile);
    
    const uploadResponse = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'Fallo desconocido en la subida a Storage.');
    }
    
    const filePath = uploadResult.filePath;
    
    // --- PASO 2: INICIAR TRANSCRIPCIÓN (API Route /api/transcribe) ---
    
    const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }), // Enviamos la ruta de Supabase
    });

    const transcribeResult = await transcribeResponse.json();

    if (!transcribeResponse.ok) {
        throw new Error(transcribeResult.error || 'Fallo en la transcripción.');
    }

    return transcribeResult.transcription;
}