'use client';

import React from 'react';
import { Zap, Loader2, Mic, Square, Sparkles, Volume2 } from 'lucide-react';
import { TranscriptionProgress } from './TranscriptionProgress';
import clsx from 'clsx';

interface TranscriptionControlsProps {
    method: 'upload' | 'record';
    isSystemBusy: boolean;
    isRecording: boolean;
    isSpeaking: boolean;
    silenceProgress: number;
    autoStopEnabled: boolean;
    setAutoStopEnabled: (val: boolean) => void;
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
    isSpeaking,
    silenceProgress,
    autoStopEnabled,
    setAutoStopEnabled,
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
                /* Controles para Modo Archivo */
                <button
                    onClick={onUploadTranscribe}
                    disabled={isSystemBusy || !selectedFile}
                    className={clsx(
                        "w-full py-5 rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden group",
                        isSystemBusy || !selectedFile
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                            : "bg-[#4ff0b7] text-black hover:bg-[#3ddfab] shadow-[0_20px_40px_-10px_rgba(79,240,183,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(79,240,183,0.6)] active:scale-98"
                    )}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {isSystemBusy ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                        {isSystemBusy ? 'PROCESANDO ARCHIVO...' : 'SUBIR Y TRANSCRIBIR'}
                    </span>
                </button>
            ) : (
                /* Controles Inteligentes para Modo Grabación en Vivo */
                <div className="space-y-3">
                    {/* Botón principal de control de grabación */}
                    <button
                        onClick={onToggleRecord}
                        disabled={isSystemBusy}
                        className={clsx(
                            "w-full py-5 rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden group active:scale-98",
                            isSystemBusy
                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                                : isRecording
                                ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-400"
                                : "bg-gradient-to-r from-cyan-400 to-cyan-500 text-black hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                        )}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isSystemBusy ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>TRANSCRIBIENDO AUTOMÁTICAMENTE...</span>
                                </>
                            ) : isRecording ? (
                                <>
                                    <Square size={16} fill="currentColor" className="animate-pulse" />
                                    <span>DETENER Y TRANSCRIBIR AHORA</span>
                                </>
                            ) : (
                                <>
                                    <Mic size={16} />
                                    <span>INICIAR GRABACIÓN EN VIVO</span>
                                </>
                            )}
                        </span>
                    </button>

                    {/* Feedback y Barra de Silencio durante Grabación */}
                    {isRecording && (
                        <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                    <span className={clsx(
                                        "w-2 h-2 rounded-full",
                                        isSpeaking ? "bg-emerald-400 animate-ping" : "bg-amber-400"
                                    )}></span>
                                    <span className={isSpeaking ? "text-emerald-400 font-bold" : "text-zinc-400"}>
                                        {isSpeaking ? '🗣️ Voz activa detectada' : '🤫 Esperando voz / Silencio...'}
                                    </span>
                                </div>
                                {autoStopEnabled && silenceProgress > 0 && (
                                    <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                                        Auto-stop en {Math.max(0, Math.round((100 - silenceProgress) / 50))}s
                                    </span>
                                )}
                            </div>

                            {/* Barra de progreso de auto-stop */}
                            {autoStopEnabled && (
                                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-100 ease-out"
                                        style={{ width: `${silenceProgress}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Switch de Manos Libres (Auto-Stop por Silencio) */}
                    {!isRecording && !isSystemBusy && (
                        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-900 text-xs text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-cyan-400" />
                                <span className="text-[11px]">Auto-stop al dejar de hablar</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAutoStopEnabled(!autoStopEnabled)}
                                className={clsx(
                                    "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-colors tracking-wider",
                                    autoStopEnabled
                                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                        : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                                )}
                            >
                                {autoStopEnabled ? 'Activado' : 'Manual'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Barra de Progreso Global */}
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
