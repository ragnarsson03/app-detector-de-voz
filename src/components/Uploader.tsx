// src/components/Uploader.tsx

'use client';

import { useState, useCallback, useMemo } from 'react';

// Tipos para un manejo de estado más robusto
type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';

// Componente para subir y transcribir archivos de audio
export const Uploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [transcription, setTranscription] = useState('');

  const isProcessing = useMemo(() => status === 'uploading' || status === 'transcribing', [status]);

  // Maneja la selección de un nuevo archivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setStatusMessage(`Archivo listo: ${selectedFile.name}`);
      setTranscription(''); // Limpia la transcripción anterior
    }
  };

  // Orquesta el proceso de subida y transcripción
  const handleSubmit = useCallback(async () => {
    if (!file) {
      setStatusMessage('Por favor, selecciona un archivo primero.');
      setStatus('error');
      return;
    }

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
      setTranscription(transcribeResult.transcription);
      setFile(null); // Limpia el input de archivo

    } catch (error) {
      console.error('Error en el proceso:', error);
      setStatus('error');
      setStatusMessage(`❌ Error: ${(error as Error).message}`);
    }
  }, [file]);

  // Determina el texto del botón basado en el estado
  const buttonText = useMemo(() => {
    switch (status) {
      case 'uploading': return 'Subiendo...';
      case 'transcribing': return 'Transcribiendo...';
      default: return 'Subir y Transcribir';
    }
  }, [status]);

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold mb-6 text-gray-200 text-center">Cargar Archivo</h3>
      
      <div className="mb-5">
        <label htmlFor="audio-file-input" className="sr-only">Seleccionar archivo</label>
        <input
          type="file"
          id="audio-file-input"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          disabled={isProcessing}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || isProcessing}
        className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-300 ease-in-out
          ${!file || isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 transform hover:-translate-y-1'
          }`}
      >
        {buttonText}
      </button>

      {statusMessage && (
        <div className={`mt-4 text-center p-3 rounded-lg text-sm
          ${status === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          <p>{statusMessage}</p>
        </div>
      )}

      {transcription && (
        <div className="mt-6 p-4 border rounded-md bg-gray-50 text-left">
          <h3 className="font-semibold text-gray-800 mb-2">Transcripción:</h3>
          <p className="text-gray-700 whitespace-pre-wrap font-mono">{transcription}</p>
        </div>
      )}
    </div>
  );
};

export default Uploader;