/**
 * VoiceyChat — Orquestador del Chat Flotante
 *
 * Responsabilidades:
 * - Gestionar el estado del panel (abierto/cerrado) y el input
 * - Conectar con /api/chat via useChat de @ai-sdk/react
 * - Componer los sub-componentes de parts/
 * - Detectar tool activa en el último mensaje para el indicador de carga
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, Loader2 } from 'lucide-react';

import ChatTrigger from './parts/ChatTrigger';
import ChatHeader from './parts/ChatHeader';
import MessageBubble from './parts/MessageBubble';
import ChatInput from './parts/ChatInput';
import { TOOL_STATUS_LABELS } from './parts/types';
import type { UIMessage, ToolInvocationPart, ToolName } from './parts/types';

// ─── Helper: label de tool activa en el último mensaje del assistant ──────

function getStreamingLabel(messages: UIMessage[]): string {
    const lastMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastMsg || !Array.isArray(lastMsg.parts)) return 'Analizando...';

    const activeTool = lastMsg.parts.find(
        (p): p is ToolInvocationPart =>
            p.type === 'tool-invocation' &&
            ((p as ToolInvocationPart).toolInvocation?.state === 'call' ||
                (p as ToolInvocationPart).toolInvocation?.state === 'partial-call')
    );

    if (!activeTool) return 'Analizando...';
    const name = activeTool.toolInvocation.toolName as ToolName;
    return TOOL_STATUS_LABELS[name] ?? '🤖 Procesando...';
}

// ─── Sugerencias de inicio ────────────────────────────────────────────────

const SUGGESTIONS = ['¿Cuál fue el audio más largo?', 'Dame un resumen', 'Últimos 5 registros'];

// ─── Componente principal ─────────────────────────────────────────────────

export default function VoiceyChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status, error } = useChat({
        onError: (err) => console.error('[VoiceyChat] ❌ Error:', err),
    });

    const isStreaming = status === 'streaming' || status === 'submitted';
    const streamingLabel = isStreaming ? getStreamingLabel(messages as UIMessage[]) : '';

    // DEBUG: loguear estructura completa de mensajes en cada render
    if (process.env.NODE_ENV === 'development') {
        messages.forEach((m: any) => {
            if (m.role === 'assistant') {
                console.log('[VoiceyChat DEBUG] assistant msg:',
                    'content=', JSON.stringify(m.content)?.slice(0, 100),
                    '| parts=', JSON.stringify(m.parts)?.slice(0, 200)
                );
            }
        });
    }


    // Auto-scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text || isStreaming) return;
        // DEBUG: confirmar que el historial existe antes de enviar
        console.log(`[VoiceyChat] Enviando mensaje. Historial actual: ${messages.length} mensajes`);
        sendMessage({ text });
        setInputValue('');
    };

    return (
        <>
            {/* Burbuja flotante */}
            {!isOpen && <ChatTrigger onClick={() => setIsOpen(true)} />}

            {/* Panel de chat */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-[#0a0a0a] border border-zinc-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-fadeIn">

                    <ChatHeader onClose={() => setIsOpen(false)} isStreaming={isStreaming} />

                    {/* Área de mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">

                        {/* Pantalla de bienvenida */}
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
                                        {SUGGESTIONS.map((q) => (
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
                        {(messages as UIMessage[]).map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {/* Indicador de carga descriptivo */}
                        {isStreaming && (
                            <div className="flex gap-2.5 items-center">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                    <Bot size={12} className="text-cyan-400" />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                    <Loader2 size={12} className="text-cyan-400 animate-spin" />
                                    <span className="text-[10px] text-zinc-400">{streamingLabel}</span>
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

                    <ChatInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={handleSend}
                        disabled={isStreaming}
                    />
                </div>
            )}
        </>
    );
}
