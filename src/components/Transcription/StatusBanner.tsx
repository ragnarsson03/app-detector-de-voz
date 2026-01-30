import React from 'react';
import { Loader2 } from 'lucide-react';

interface StatusBannerProps {
    isProcessing: boolean;
    statusMessage: string;
    progress: number;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
    isProcessing,
    statusMessage,
    progress
}) => {
    if (!isProcessing && progress === 0) return null;

    return (
        <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    {isProcessing && <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />}
                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 drop-shadow-sm">
                        {statusMessage}
                    </span>
                </div>
                <span className="text-[11px] font-black tabular-nums text-cyan-500/80">
                    {progress}%
                </span>
            </div>

            <div className="h-1.5 w-full bg-zinc-900/50 rounded-full overflow-hidden border border-zinc-800/50 relative p-[1px]">
                <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(34,211,238,0.3)] relative"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] animate-shimmer"></div>
                </div>
            </div>
        </div>
    );
};
