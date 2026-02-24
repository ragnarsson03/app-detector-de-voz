'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, X, Clock } from 'lucide-react';

interface TranscriptionProgressProps {
    isProcessing: boolean;
    statusMessage: string;
    progress: number;
    hasResult: boolean;
    elapsedTime?: number;
    onCancel?: () => void;
}

export const TranscriptionProgress: React.FC<TranscriptionProgressProps> = ({
    isProcessing,
    statusMessage,
    progress,
    hasResult,
    elapsedTime = 0,
    onCancel
}) => {
    const [displayProgress, setDisplayProgress] = useState(progress);
    const [displayMessage, setDisplayMessage] = useState(statusMessage);

    useEffect(() => {
        // Vía de escape: Si ya hay resultado, forzamos 100% inmediatamente
        if (hasResult) {
            setDisplayProgress(100);
            setDisplayMessage('Completado');
        } else {
            setDisplayProgress(progress);
            setDisplayMessage(statusMessage);
        }
    }, [progress, statusMessage, hasResult]);

    if (!isProcessing && displayProgress === 0) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    {isProcessing && !hasResult && <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />}
                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 drop-shadow-sm flex items-center gap-2">
                        {displayMessage}
                        {elapsedTime > 0 && (
                            <span className="flex items-center gap-1 text-cyan-500/80 ml-2 bg-cyan-900/10 px-2 py-0.5 rounded-full border border-cyan-500/10">
                                <Clock size={10} />
                                {formatTime(elapsedTime)}
                            </span>
                        )}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {isProcessing && onCancel && !hasResult && (
                        <button
                            onClick={onCancel}
                            className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors bg-red-500/10 px-2 py-1 rounded hover:bg-red-500/20"
                        >
                            <X size={10} />
                            Cancelar
                        </button>
                    )}
                    <span className="text-[11px] font-black tabular-nums text-cyan-500/80">
                        {displayProgress}%
                    </span>
                </div>
            </div>

            <div className="h-1.5 w-full bg-zinc-900/50 rounded-full overflow-hidden border border-zinc-800/50 relative p-[1px]">
                <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(34,211,238,0.3)] relative"
                    style={{ width: `${displayProgress}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] animate-shimmer"></div>
                </div>
            </div>
        </div>
    );
};
