import React from 'react';
import { Upload, Mic, CheckCircle2, Volume2, Square } from 'lucide-react';
import clsx from 'clsx';

interface AudioInputAreaProps {
    method: 'upload' | 'record';
    selectedFile: File | null;
    isRecording: boolean;
    volume?: number;
    isSpeaking?: boolean;
    silenceProgress?: number;
    autoStopEnabled?: boolean;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleRecord: () => void;
}

export const AudioInputArea: React.FC<AudioInputAreaProps> = ({
    method,
    selectedFile,
    isRecording,
    volume = 0,
    isSpeaking = false,
    silenceProgress = 0,
    autoStopEnabled = true,
    onFileSelect,
    onToggleRecord
}) => {
    return (
        <div className="flex-1 flex flex-col justify-center">
            {method === 'upload' ? (
                <div className="space-y-4 animate-fadeIn">
                    <div className={clsx(
                        "group relative border-2 border-dashed rounded-3xl h-48 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden",
                        selectedFile
                            ? "border-cyan-500/30 bg-cyan-900/5 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]"
                            : "border-zinc-800 hover:border-zinc-700 bg-[#0a0a0a]"
                    )}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        {selectedFile ? (
                            <div className="flex flex-col items-center z-10 px-6 text-center">
                                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle2 className="text-cyan-400" size={20} />
                                </div>
                                <p className="text-xs text-white font-bold mb-1 truncate w-full">{selectedFile.name}</p>
                                <span className="text-[10px] text-cyan-500/60 uppercase tracking-widest">Listo para procesar</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center z-10">
                                <Upload className="mb-4 text-zinc-700 group-hover:text-zinc-400 transition-colors duration-300" size={24} />
                                <p className="text-xs text-zinc-500 font-bold mb-1">Seleccionar audio o video</p>
                                <p className="text-[10px] text-zinc-700 italic">MP3, WAV, M4A, MP4</p>
                            </div>
                        )}

                        <input
                            type="file"
                            accept="audio/*,video/*,.mp4,.mkv,.mov"
                            onChange={onFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                        />
                    </div>
                </div>
            ) : (
                <div
                    className={clsx(
                        "h-48 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-3xl border relative overflow-hidden animate-fadeIn transition-all duration-300",
                        isRecording
                            ? isSpeaking
                                ? "border-cyan-500/40 shadow-[inset_0_0_25px_rgba(34,211,238,0.1)]"
                                : "border-red-500/30 shadow-[inset_0_0_25px_rgba(239,68,68,0.08)]"
                            : "border-zinc-800 hover:border-zinc-700"
                    )}
                >
                    {/* Efecto de pulso reactivo al volumen */}
                    <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] transition-opacity duration-150 pointer-events-none"
                        style={{
                            background: isSpeaking
                                ? 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)',
                            opacity: isRecording ? 0.3 + (volume / 150) : 0,
                            transform: `scale(${1 + (volume / 400)})`
                        }}
                    ></div>

                    {/* Botón Central de Micrófono */}
                    <button
                        type="button"
                        onClick={onToggleRecord}
                        className={clsx(
                            "relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group shadow-lg active:scale-95",
                            isRecording
                                ? isSpeaking
                                    ? "bg-cyan-500 text-black shadow-[0_0_35px_rgba(34,211,238,0.5)] scale-105"
                                    : "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                        )}
                        aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
                    >
                        {isRecording ? (
                            <Square size={22} fill="currentColor" className="animate-pulse" />
                        ) : (
                            <Mic size={26} className="group-hover:scale-110 transition-transform" />
                        )}
                    </button>

                    {/* Estado descriptivo debajo del botón */}
                    <div className="relative z-10 mt-3 text-center">
                        <p className="text-xs font-bold tracking-wider uppercase">
                            {isRecording ? (
                                isSpeaking ? (
                                    <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                                        Detectando voz...
                                    </span>
                                ) : autoStopEnabled ? (
                                    <span className="text-amber-400">
                                        Silencio... se enviará solo
                                    </span>
                                ) : (
                                    <span className="text-red-400">
                                        Grabando (modo manual)
                                    </span>
                                )
                            ) : (
                                <span className="text-zinc-500">
                                    Haz clic para hablar
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Indicador de volumen lateral / ondas */}
                    {isRecording && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-900 overflow-hidden">
                            <div
                                className={clsx(
                                    "h-full transition-all duration-100 ease-out",
                                    isSpeaking
                                        ? "bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
                                        : "bg-red-500 shadow-[0_0_10px_#ef4444]"
                                )}
                                style={{ width: `${Math.max(4, volume)}%` }}
                            ></div>
                        </div>
                    )}

                    {/* Métrica de decibelios / volumen en la esquina */}
                    {isRecording && (
                        <div className="absolute top-3 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-zinc-800 text-[10px] font-mono text-zinc-400 tabular-nums">
                            <Volume2 size={12} className={isSpeaking ? "text-cyan-400 animate-pulse" : "text-zinc-600"} />
                            <span>{volume}% dB</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
