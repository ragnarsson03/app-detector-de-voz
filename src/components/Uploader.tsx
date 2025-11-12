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
    // Asegura que hay archivos y solo toma el primero.
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setMessage(`Archivo seleccionado: ${selectedFile.name}`);
      setTranscription(''); // Limpiar transcripción anterior al seleccionar nuevo archivo
    } else {
      setFile(null);
      setMessage('');
      setTranscription('');
    }
  };

  // 2. Maneja el proceso de subida (la lógica de Supabase irá aquí).
  const handleUpload = useCallback(async () => {
    if (!file) {
      setMessage('Por favor, selecciona un archivo de audio o video primero.');
      return;
    }

    setIsUploading(true);
    setMessage('Subiendo archivo...');

    try {
      // Usamos FormData para enviar el archivo al endpoint
      const formData = new FormData();
      formData.append('file', file);
      
      // Llama a la API Route de Next.js
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData, // FormData envía el archivo
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Fallo desconocido en la subida.');
      }
      
      // Éxito: El archivo está en Supabase. Ahora iniciamos la transcripción.
      setMessage(`✅ Archivo subido. Transcribiendo...`);
      
      // Llama a la API de transcripción con la ruta del archivo
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: result.filePath }),
      });

      const transcribeResult = await transcribeResponse.json();

      if (!transcribeResponse.ok) {
        throw new Error(transcribeResult.error || 'Fallo en la transcripción.');
      }

      // Muestra la transcripción final
      // Muestra la transcripción final
      setTranscription(transcribeResult.transcription);
      setMessage('Transcripción completada.');
      
      setFile(null); // Limpiamos el estado

    } catch (error) {
      console.error('Error durante la subida:', error);
      setMessage(`❌ Error al subir: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  // 3. Maneja la descarga del archivo de texto
  const handleDownload = () => {
    if (!transcription) return;

    // Crear un "blob" (Binary Large Object) con el texto
    const blob = new Blob([transcription], { type: 'text/plain' });
    
    // Crear una URL temporal para el blob
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace <a> invisible para iniciar la descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcripcion.txt'; // Nombre del archivo
    document.body.appendChild(a); // Añadirlo al DOM
    a.click(); // Simular clic
    
    // Limpiar
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Cargar Archivo de Voz</h2>
      
      <div className="mb-4">
        {/* Input de tipo file para seleccionar el archivo */}
        <input
          type="file"
          id="audio-file-input"
          accept="audio/*,video/*" // Acepta archivos de audio y video
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
        disabled={!file || isUploading} // Deshabilitado si no hay archivo o si ya está subiendo
        className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-colors 
          ${!file || isUploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
          }`}
      >
        {isUploading ? 'Procesando...' : 'Subir y Transcribir'}
      </button>

      {/* Área de mensajes de estado */}
      {/* Área de mensajes de estado */}
      {message && (
        <p className={`mt-4 text-sm p-3 rounded ${message.startsWith('❌') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {message}
        </p>
      )}

      {/* Muestra la transcripción y el botón de descarga */}
      {transcription && (
        <div className="mt-4">
          <textarea
            readOnly
            value={transcription}
            className="w-full h-40 p-2 border border-gray-300 rounded bg-gray-50"
          />
          <button
            onClick={handleDownload}
            className="w-full mt-2 py-2 px-4 rounded-lg text-white font-semibold transition-colors bg-blue-600 hover:bg-blue-700"
          >
            Descargar Transcripción (.txt)
          </button>
        </div>
      )}
    </div>
  );
};

export default Uploader;