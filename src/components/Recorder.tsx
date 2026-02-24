'use client';
import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import clsx from 'clsx';

const Recorder = ({ setTranscription }: { setTranscription: (text: string) => void }) => {
    // Usamos el hook personalizado con las nuevas métricas
    const { isRecording, isProcessing, message, volume, startRecording, stopRecording, transcribeAudio } = useAudioRecorder();

    const handleToggleRecording = async () => {
        if (isRecording) {
            const blob = await stopRecording();
            if (blob) {
                const text = await transcribeAudio(blob);
                if (text) setTranscription(text);
            }
        } else {
            await startRecording();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/30 border border-white/5 rounded-[2rem] w-full min-h-[300px]">

            {/* Visualizador de Estado Minimalista */}
            <div className="mb-12 h-8 flex items-center justify-center">
                {isRecording ? (
                    <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20 animate-fadeIn">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-xs font-medium text-red-400 uppercase tracking-widest">Grabando</span>
                    </div>
                ) : isProcessing ? (
                    <div className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/20 animate-fadeIn">
                        <i className="fas fa-circle-notch fa-spin text-cyan-400 text-xs"></i>
                        <span className="text-xs font-medium text-cyan-400 uppercase tracking-widest">Procesando</span>
                    </div>
                ) : (
                    <span className="text-neutral-600 text-sm font-light tracking-wide">Listo para escuchar</span>
                )}
            </div>

            {/* Botón Principal - Con visualización de volumen en tiempo real */}
            <button
                onClick={handleToggleRecording}
                disabled={isProcessing}
                className={clsx(
                    'group relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500 ease-out focus:outline-none',
                    isRecording
                        ? 'bg-red-500 shadow-[0_0_30px_-5px_rgba(239,68,68,0.4)] scale-110'
                        : 'bg-white hover:bg-neutral-200 hover:scale-105 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]',
                    isProcessing && 'opacity-50 cursor-not-allowed scale-95 bg-neutral-700'
                )}
                style={{
                    // El volumen 0-100 se usa para expandir la sombra exterior
                    boxShadow: isRecording ? `0 0 ${20 + (volume / 2)}px rgba(239, 68, 68, ${0.4 + (volume / 200)})` : undefined
                }}
                aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
            >
                <i className={clsx(
                    "fas fa-microphone text-3xl transition-colors duration-300",
                    isRecording ? "text-white" : "text-black group-hover:text-black/80"
                )}></i>

                {/* Feedback visual de volumen (anillo dinámico) */}
                {isRecording && (
                    <span
                        className="absolute inset-x-[-10px] inset-y-[-10px] rounded-full border-2 border-red-500/30 transition-transform duration-100 ease-linear"
                        style={{ transform: `scale(${1 + (volume / 200)})`, opacity: 0.1 + (volume / 100) }}
                    ></span>
                )}

                {/* Anillos decorativos sutiles en hover cuando no graba */}
                {!isRecording && !isProcessing && (
                    <span className="absolute inset-0 rounded-full border border-white/30 scale-110 opacity-0 group-hover:scale-125 group-hover:opacity-100 transition-all duration-700"></span>
                )}
            </button>

            <p className="mt-8 text-neutral-500 text-xs tracking-wider uppercase opacity-60">
                {isRecording ? 'Presiona para detener' : 'Click para grabar'}
            </p>

            {/* Mensaje de error o estado secundario */}
            {message && (
                <p className={clsx(
                    "mt-4 text-[10px] font-medium text-center max-w-xs animate-fadeIn uppercase tracking-tighter",
                    message.includes('❌') ? "text-red-400" : "text-cyan-400/80"
                )}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default Recorder;
