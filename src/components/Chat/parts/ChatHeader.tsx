'use client';

import React from 'react';
import { Bot, X, Loader2 } from 'lucide-react';
import type { ChatHeaderProps } from './types';

/**
 * ChatHeader — Encabezado del panel de chat.
 * Muestra el avatar, nombre y subtítulo de Voicey.
 * Cuando isStreaming=true, añade un pequeño indicador de actividad junto al nombre.
 */
export default function ChatHeader({ onClose, isStreaming }: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#050505]">
            <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                    {/* Anillo de actividad visible solo durante streaming */}
                    {isStreaming && (
                        <span className="absolute inset-0 rounded-full border border-cyan-400/60 animate-ping" />
                    )}
                </div>

                {/* Nombre y subtítulo */}
                <div>
                    <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">Voicey</h3>
                        {isStreaming && (
                            <Loader2 size={9} className="text-cyan-400 animate-spin" />
                        )}
                    </div>
                    <p className="text-[9px] text-cyan-500/70">Asistente de Audio IA</p>
                </div>
            </div>

            {/* Botón cerrar */}
            <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800"
                aria-label="Cerrar chat"
            >
                <X size={16} />
            </button>
        </div>
    );
}
