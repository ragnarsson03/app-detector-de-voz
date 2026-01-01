// src/components/Uploader.tsx

'use client';

import { useState, useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import { useFileUploader } from '@/hooks/useFileUploader';

interface UploaderProps {
  setTranscription: Dispatch<SetStateAction<string>>;
}

export const Uploader = ({ setTranscription }: UploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const { status, statusMessage, isProcessing, uploadFile, setStatusMessage, resetStatus } = useFileUploader();

  // Maneja la selección de un nuevo archivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      resetStatus();
      setStatusMessage(`Archivo listo: ${selectedFile.name}`);
      setTranscription(''); // Limpia la transcripción anterior en el componente padre
    }
  };

  // Orquesta el proceso de subida y transcripción
  const handleSubmit = useCallback(async () => {
    if (!file) {
      setStatusMessage('Por favor, selecciona un archivo primero.');
      return;
    }

    const transcription = await uploadFile(file);
    if (transcription) {
      setTranscription(transcription);
      setFile(null); // Limpia el input de archivo
    }
  }, [file, uploadFile, setTranscription, setStatusMessage]);

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
      <h3 className="text-2xl font-bold mb-6 text-cyan-200 text-center" style={{ textShadow: '0 0 8px rgba(0, 246, 255, 0.5)' }}>Cargar Archivo</h3>

      <div className="mb-5">
        <label htmlFor="audio-file-input" className="sr-only">Seleccionar archivo</label>
        <input
          type="file"
          id="audio-file-input"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          disabled={isProcessing}
          aria-label="Seleccionar archivo de audio o video"
          className="block w-full text-sm text-gray-400 cursor-pointer
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border file:border-cyan-400/50
            file:text-sm file:font-semibold
            file:bg-transparent file:text-cyan-300
            hover:file:bg-cyan-900/40 hover:file:border-cyan-400
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || isProcessing}
        aria-label={buttonText}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out border
          ${!file || isProcessing
            ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border-gray-600'
            : 'text-cyan-300 border-cyan-400/50 hover:bg-cyan-900/40 hover:text-white hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,246,255,0.3)] transform hover:-translate-y-1'
          }`}
      >
        {buttonText}
      </button>

      {statusMessage && (
        <div className={`mt-4 text-center p-3 rounded-lg text-sm font-medium
          ${status === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-cyan-900/50 text-cyan-200'}`}>
          <p>{statusMessage}</p>
        </div>
      )}

    </div>
  );
};

export default Uploader;
