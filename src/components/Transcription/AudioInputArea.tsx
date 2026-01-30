import React from 'react';
import { Upload, Mic, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface AudioInputAreaProps {
    method: 'upload' | 'record';
    selectedFile: File | null;
    isRecording: boolean;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleRecord: () => void;
}

export const AudioInputArea: React.FC<AudioInputAreaProps> = ({
    method,
    selectedFile,
    isRecording,
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
                <div className="h-48 flex items-center justify-center bg-[#0a0a0a] rounded-3xl border border-zinc-800 relative overflow-hidden animate-fadeIn">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 to-transparent opacity-0 transition-opacity duration-500" style={{ opacity: isRecording ? 1 : 0 }}></div>
                    <button
                        onClick={onToggleRecord}
                        className={clsx(
                            "relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group",
                            isRecording
                                ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                                : "bg-zinc-800 hover:bg-zinc-700"
                        )}
                    >
                        <div className={clsx("transition-transform duration-300", isRecording ? "scale-90" : "group-hover:scale-110")}>
                            {isRecording ? (
                                <div className="w-6 h-6 bg-white rounded-sm animate-pulse"></div>
                            ) : (
                                <Mic className="text-zinc-400 group-hover:text-white" size={24} />
                            )}
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};
