'use client';

import React from 'react';
import { Zap, Loader2, Mic, Send, Square } from 'lucide-react';
import { TranscriptionProgress } from './TranscriptionProgress';
import clsx from 'clsx';

interface TranscriptionControlsProps {
    method: 'upload' | 'record';
    isSystemBusy: boolean;
    isRecording: boolean;
    selectedFile: File | null;
    statusMessage: string;
    progress: number;
    hasResult: boolean;
    elapsedTime: number;
    onUploadTranscribe: () => void;
    onToggleRecord: () => void;
    onCancelUpload?: () => void;
}

export const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
    method,
    isSystemBusy,
    isRecording,
    selectedFile,
    statusMessage,
    progress,
    hasResult,
    elapsedTime,
    onUploadTranscribe,
    onToggleRecord,
    onCancelUpload,
}) => {
    return (
        <div className="space-y-4">
            {method === 'upload' ? (
                /* Modo Archivo: Subir y Transcribir */
                <button
                    onClick={onUploadTranscribe}
                    disabled={isSystemBusy || !selectedFile}
                    className={clsx(
                        "w-full py-5 rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden group active:scale-98",
                        isSystemBusy || !selectedFile
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                            : "bg-[#4ff0b7] text-black hover:bg-[#3ddfab] shadow-[0_20px_40px_-10px_rgba(79,240,183,0.4)]"
                    )}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {isSystemBusy ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                        {isSystemBusy ? 'PROCESANDO ARCHIVO...' : 'SUBIR Y TRANSCRIBIR'}
                    </span>
                </button>
            ) : (
                /* Modo Grabación: Control directo y simplificado */
                <button
                    onClick={onToggleRecord}
                    disabled={isSystemBusy}
                    className={clsx(
                        "w-full py-5 rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden group active:scale-98",
                        isSystemBusy
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                            : isRecording
                            ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-400 animate-pulse"
                            : "bg-gradient-to-r from-cyan-400 to-cyan-500 text-black hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                    )}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {isSystemBusy ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>TRANSCRIBIENDO AUDIO...</span>
                            </>
                        ) : isRecording ? (
                            <>
                                <Send size={16} />
                                <span>DETENER Y ENVIAR</span>
                            </>
                        ) : (
                            <>
                                <Mic size={16} />
                                <span>INICIAR GRABACIÓN</span>
                            </>
                        )}
                    </span>
                </button>
            )}

            {/* Barra de Progreso y Mensajes */}
            <TranscriptionProgress
                isProcessing={isSystemBusy}
                statusMessage={statusMessage}
                progress={progress}
                hasResult={hasResult}
                elapsedTime={method === 'upload' ? elapsedTime : 0}
                onCancel={method === 'upload' ? onCancelUpload : undefined}
            />
        </div>
    );
};
