'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Copy } from 'lucide-react';

interface TranscriptionDisplayProps {
    text: string;
    transcriptionTime: number | null;
    onCopy: () => void;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
    text,
    transcriptionTime,
    onCopy
}) => {
    return (
        <div className="flex-1 flex flex-col bg-[#070707] rounded-3xl border border-zinc-900 overflow-hidden relative group/result">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900/50 bg-black/40">
                <div className="flex items-center gap-2">
                    <FileText className="text-zinc-600" size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Transcripción / Output</span>
                </div>
                {transcriptionTime && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 animate-fadeIn">
                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,211,238,0.8)]"></span>
                        <span className="text-[9px] font-bold text-cyan-400/90 tracking-tighter">
                            Tiempo de IA: {transcriptionTime}s
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 p-6 relative overflow-hidden flex flex-col">
                <textarea
                    readOnly
                    value={text}
                    placeholder={!text ? "El texto aparecerá aquí..." : ""}
                    className="flex-1 w-full bg-transparent border-none focus:ring-0 text-zinc-300 text-sm leading-relaxed resize-none scroll-smooth placeholder:text-zinc-800 placeholder:italic"
                />

                {text && (
                    <div className="mt-4 flex justify-between items-center animate-fadeIn">
                        <div className="flex gap-4">
                            <button
                                onClick={onCopy}
                                className="flex items-center gap-2 text-zinc-600 hover:text-cyan-400 transition-colors duration-300"
                            >
                                <Copy size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Copiar</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-800 uppercase tracking-[0.2em]">
                            Whisper ASR Optimized
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[80px] rounded-full -mr-10 -mt-10 pointer-events-none opacity-0 group-hover/result:opacity-100 transition-opacity duration-1000"></div>
        </div>
    );
};
