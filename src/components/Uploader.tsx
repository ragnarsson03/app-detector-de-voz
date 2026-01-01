// src/components/Uploader.tsx

'use client';

import { useFileUploader } from '@/hooks/useFileUploader';
import React, { useRef, ChangeEvent } from 'react';
import clsx from 'clsx';

const Uploader = ({ setTranscription }: { setTranscription: (text: string) => void }) => {
  // Usamos el hook personalizado para manejar la lógica de subida y transcripción
  const { status, statusMessage, isProcessing, uploadFile, setStatusMessage, resetStatus } = useFileUploader();

  // Referencia al input para poder limpiarlo
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpiar transcripción previa
    setTranscription('');

    // Ejecutar subida
    const text = await uploadFile(file);

    // Si hay resultado, actualizar el padre
    if (text) {
      setTranscription(text);
    }

    // Limpiar el input para permitir subir el mismo archivo de nuevo si se desea
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-neutral-900/30 border border-white/5 rounded-[2rem] w-full min-h-[300px]">

      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Zona de Input de Archivo Minimalista */}
        <div className="relative group w-full">
          <input
            type="file"
            id="file-upload"
            ref={fileInputRef}
            accept="audio/*"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="hidden"
            aria-label="Seleccionar archivo de audio"
          />
          <label
            htmlFor="file-upload"
            className={clsx(
              "flex flex-col items-center justify-center w-full h-32 border border-dashed rounded-2xl cursor-pointer transition-all duration-300",
              isProcessing
                ? "border-white/10 bg-neutral-900/50 cursor-not-allowed opacity-50"
                : "border-neutral-700 bg-neutral-900/20 hover:bg-neutral-800 hover:border-neutral-500"
            )}
          >
            <div className="flex flex-col items-center gap-3 text-neutral-500 group-hover:text-neutral-300 transition-colors">
              {isProcessing ? (
                <i className="fas fa-circle-notch fa-spin text-2xl"></i>
              ) : (
                <i className="fas fa-cloud-upload-alt text-3xl mb-1"></i>
              )}
              <span className="text-sm font-medium tracking-wide">
                {isProcessing ? 'Procesando...' : 'Seleccionar Archivo'}
              </span>
            </div>
          </label>
        </div>

        {/* Mensaje de Estado */}
        <div className="h-6 text-center">
          {statusMessage && (
            <p className={clsx(
              "text-xs font-medium animate-fadeIn",
              status === 'error' ? "text-red-400" : "text-neutral-400"
            )}>
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      <p className="mt-8 text-neutral-600 text-[10px] uppercase tracking-widest opacity-40">
        Soporta MP3, WAV, WebM
      </p>
    </div>
  );
};

export default Uploader;
