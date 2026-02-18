'use client';

import React from 'react';
import { Send } from 'lucide-react';
import type { ChatInputProps } from './types';

/**
 * ChatInput — Campo de texto y botón de enviar.
 * Soporta envío con Enter (sin Shift).
 */
export default function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="p-3 border-t border-zinc-800 bg-[#050505] flex items-center gap-2">
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre tus audios..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/10 transition-all"
                disabled={disabled}
                aria-label="Mensaje para Voicey"
            />
            <button
                onClick={onSend}
                disabled={disabled || !value.trim()}
                className="w-9 h-9 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0"
                aria-label="Enviar mensaje"
            >
                <Send size={14} />
            </button>
        </div>
    );
}
