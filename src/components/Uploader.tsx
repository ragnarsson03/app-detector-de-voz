// src/components/Uploader.tsx

'use client'; // Indica que es un componente de cliente en Next.js App Router

import { useState, useCallback } from 'react';

// Define el componente principal para subir el archivo.
export const Uploader = () => {
  // Estado para almacenar el archivo seleccionado por el usuario.
  const [file, setFile] = useState<File | null>(null);
  // Estado para manejar el estado de la carga.
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [transcription, setTranscription] = useState('');

  // 1. Maneja la selección del archivo.
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setMessage(`Archivo seleccionado: ${selectedFile.name}`);
      setTranscription(''); // Limpiar transcripción al seleccionar nuevo archivo
    } else {
      setFile(null);
      setMessage('');
    }
  };

  // 2. Maneja el proceso de subida y transcripción.
  const handleUpload = useCallback(async () => {
    if (!file) {
      setMessage('Por favor, selecciona un archivo de audio primero.');
      return;
    }

    setIsUploading(true);
    setMessage('Subiendo archivo...');
    setTranscription('');

    try {
      // --- Paso 1: Subir el archivo ---
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'Fallo desconocido en la subida.');
      }
      
      // --- Paso 2: Transcribir el archivo ---
      setMessage(`✅ Archivo subido. Transcribiendo...`);
      const { publicUrl } = uploadResult;

      if (!publicUrl) {
        throw new Error('La API de subida no devolvió una URL pública.');
      }
      
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicUrl }), // Enviamos la URL pública
      });

      const transcribeResult = await transcribeResponse.json();

      if (!transcribeResponse.ok) {
        throw new Error(transcribeResult.error || 'Fallo en la transcripción.');
      }

      // --- Paso 3: Mostrar el resultado ---
      setTranscription(transcribeResult.transcription);
      setMessage('¡Transcripción completada!');
      setFile(null);

    } catch (error) {
      console.error('Error durante el proceso:', error);
      setMessage(`❌ Error: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  return (
    <div className="p-8 max-w-lg mx-auto bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Cargar Archivo de Voz</h2>
      
      <div className="mb-4">
        <input
          type="file"
          id="audio-file-input"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
          disabled={isUploading}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-colors 
          ${!file || isUploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
          }`}
      >
        {isUploading ? 'Procesando...' : 'Subir y Transcribir'}
      </button>

      {message && (
        <p className={`mt-4 text-sm text-center p-3 rounded ${message.startsWith('❌') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {message}
        </p>
      )}

      {transcription && (
        <div className="mt-6 p-4 border rounded-md bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-2">Transcripción:</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{transcription}</p>
        </div>
      )}
    </div>
  );
};

export default Uploader;