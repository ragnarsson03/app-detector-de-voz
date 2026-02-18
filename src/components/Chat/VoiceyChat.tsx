/**
 * VoiceyChat — Componente de Chat Flotante
 * 
 * Asistente IA que flota en la esquina inferior derecha.
 * Usa useChat de @ai-sdk/react v3 para streaming de respuestas.
 * Conecta con /api/chat que tiene tools de Supabase.
 * 
 * API v3: useChat devuelve { messages, sendMessage, status, error }.
 * El input se maneja con estado local de React.
 * Los mensajes usan .parts[] en lugar de .content.
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

/**
 * Extraer texto legible de un UIMessage de ai@6.x.
 * Los mensajes usan .parts[] con tipos: 'text', 'tool-invocation', 'tool-result', etc.
 */
function getMessageText(msg: any): string {
    // 1. Leer .parts[] — formato principal en ai@6.x
    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
        const text = msg.parts
            .filter((p: any) => p.type === 'text' && typeof p.text === 'string')
            .map((p: any) => p.text as string)
            .join('');
        if (text) return text;
    }
    // 2. Fallback: .content como string
    if (typeof msg.content === 'string' && msg.content) return msg.content;
    // 3. Fallback: .content como array (formato CoreMessage)
    if (Array.isArray(msg.content)) {
        return msg.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text as string)
            .join('');
    }
    return '';
}

export default function VoiceyChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status, error } = useChat({
        onError: (err) => {
            console.error('[VoiceyChat] ❌ Error en el chat:', err);
        }
    });

    const isStreaming = status === 'streaming' || status === 'submitted';

    // Auto-scroll al final cuando llegan mensajes nuevos
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text || isStreaming) return;
        sendMessage({ text });
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* ===== Botón flotante (Burbuja) ===== */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] transition-all duration-300 flex items-center justify-center group hover:scale-105"
                    aria-label="Abrir asistente Voicey"
                >
                    <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></span>
                </button>
            )}

            {/* ===== Panel de Chat ===== */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-[#0a0a0a] border border-zinc-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-fadeIn">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#050505]">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                                <Bot size={14} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">Voicey</h3>
                                <p className="text-[9px] text-cyan-500/70">Asistente de Audio IA</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                        {/* Mensaje de bienvenida si no hay mensajes */}
                        {messages.length === 0 && (
                            <div className="text-center py-8 space-y-3">
                                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                    <Bot size={24} className="text-cyan-500" />
                                </div>
                                <p className="text-zinc-400 text-xs">
                                    ¡Hola! Soy <span className="text-cyan-400 font-bold">Voicey</span>.
                                    Puedo analizar tus registros de audio.
                                </p>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Prueba preguntar:</p>
                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                        {['¿Cuál fue el audio más largo?', 'Dame un resumen', 'Últimos 5 registros'].map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => setInputValue(q)}
                                                className="text-[10px] px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-400 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lista de mensajes */}
                        {messages.map((msg) => {
                            const text = getMessageText(msg);
                            // Loguear para debug (solo en dev)
                            if (process.env.NODE_ENV === 'development') {
                                console.log('[VoiceyChat] msg:', msg.role, '| parts:', JSON.stringify(msg.parts)?.slice(0, 120), '| text:', text);
                            }
                            // Mostrar mensajes con texto; para el asistente sin texto aún, mostrar placeholder
                            const displayText = text || (msg.role === 'assistant' ? '...' : '');
                            if (!displayText) return null;
                            return (
                                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Bot size={12} className="text-cyan-400" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-cyan-600/20 text-cyan-100 border border-cyan-500/10 rounded-tr-sm'
                                        : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 rounded-tl-sm'
                                        }`}>
                                        {displayText}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <User size={12} className="text-zinc-300" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Indicador de carga */}
                        {isStreaming && (
                            <div className="flex gap-2.5 items-center">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                    <Bot size={12} className="text-cyan-400" />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                    <Loader2 size={12} className="text-cyan-400 animate-spin" />
                                    <span className="text-[10px] text-zinc-500">Analizando...</span>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="px-3 py-2 rounded-xl bg-red-900/20 border border-red-500/20 text-red-400 text-[10px]">
                                Error: {error.message}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-zinc-800 bg-[#050505] flex items-center gap-2">
                        <input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pregunta sobre tus audios..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/10 transition-all"
                            disabled={isStreaming}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isStreaming || !inputValue.trim()}
                            className="w-9 h-9 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
