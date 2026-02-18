'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import type { ChatTriggerProps } from './types';

/**
 * ChatTrigger — Botón flotante que abre el panel de chat.
 * Muestra un punto verde animado para indicar que el asistente está online.
 */
export default function ChatTrigger({ onClick }: ChatTriggerProps) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] transition-all duration-300 flex items-center justify-center group hover:scale-105"
            aria-label="Abrir asistente Voicey"
        >
            <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
            {/* Indicador de estado "online" */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse" />
        </button>
    );
}
