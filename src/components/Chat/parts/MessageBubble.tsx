'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import type { MessageBubbleProps, MessagePart, ToolInvocationPart, ToolName, TextPart } from './types';
import { TOOL_STATUS_LABELS } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Extrae el texto legible de un UIMessage de ai@6.x.
 * Prioridad: parts[].text → content (string) → content[].text
 */
function getMessageText(msg: MessageBubbleProps['message']): string {
    // 1. parts[] — formato principal en ai@6.x
    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
        const text = msg.parts
            .filter((p): p is TextPart => p.type === 'text' && typeof (p as TextPart).text === 'string')
            .map((p) => (p as TextPart).text)
            .join('');
        if (text) return text;
    }
    // 2. content como string (fallback)
    if (typeof msg.content === 'string' && msg.content) return msg.content;
    // 3. content como array (formato CoreMessage)
    if (Array.isArray(msg.content)) {
        return (msg.content as MessagePart[])
            .filter((c): c is TextPart => c.type === 'text')
            .map((c) => c.text)
            .join('');
    }
    return '';
}

/**
 * Detecta el estado de tool-invocation en el mensaje y retorna un label descriptivo.
 *
 * Estados posibles:
 * - 'partial-call' / 'call' → la tool está ejecutándose
 * - 'result'                → la tool terminó, la IA está generando el texto final
 */
function getToolLabel(msg: MessageBubbleProps['message']): { label: string; isDone: boolean } | null {
    if (!Array.isArray(msg.parts)) return null;

    const toolPart = msg.parts.find(
        (p): p is ToolInvocationPart => p.type === 'tool-invocation'
    ) as ToolInvocationPart | undefined;

    if (!toolPart) return null;

    const state = toolPart.toolInvocation?.state;
    const name = toolPart.toolInvocation.toolName as ToolName;
    const baseLabel = TOOL_STATUS_LABELS[name] ?? '🤖 Procesando...';

    if (state === 'call' || state === 'partial-call') {
        return { label: baseLabel, isDone: false };
    }
    if (state === 'result') {
        // La tool terminó — la IA está procesando el resultado para generar texto
        return { label: '✍️ Escribiendo respuesta...', isDone: true };
    }
    return null;
}

// ─── Componente ───────────────────────────────────────────────────────────

/**
 * MessageBubble — Renderiza un único mensaje del chat.
 *
 * Lógica de display:
 * - Si hay texto → muestra el texto (+ badge de tool si hay una activa)
 * - Si no hay texto pero hay tool activa → muestra el label descriptivo de la tool
 * - Si no hay nada → retorna null (no renderiza)
 */
export default function MessageBubble({ message: msg }: MessageBubbleProps) {
    const text = getMessageText(msg);
    const toolInfo = getToolLabel(msg);

    // Debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
        console.log(
            '[MessageBubble]',
            msg.role,
            '| text:', text.slice(0, 60) || '(vacío)',
            '| tool:', toolInfo ? `${toolInfo.label} (done=${toolInfo.isDone})` : 'ninguna'
        );
    }

    // Lógica de display:
    // 1. Si hay texto → mostrarlo (es la respuesta final o streaming)
    // 2. Si no hay texto pero la tool está en 'call' → label de ejecución
    // 3. Si no hay texto pero la tool está en 'result' → "Escribiendo respuesta..."
    // 4. Si no hay nada → no renderizar
    const displayText = text || (toolInfo ? toolInfo.label : '');
    if (!displayText) return null;

    const isUser = msg.role === 'user';

    return (
        <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar del asistente */}
            {!isUser && (
                <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={12} className="text-cyan-400" />
                </div>
            )}

            {/* Burbuja del mensaje */}
            <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${isUser
                    ? 'bg-cyan-600/20 text-cyan-100 border border-cyan-500/10 rounded-tr-sm'
                    : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 rounded-tl-sm'
                    }`}
            >
                {displayText}

                {/* Badge de tool activa cuando ya hay texto (tool en paralelo con respuesta) */}
                {toolInfo && !toolInfo.isDone && text && (
                    <span className="block text-[10px] opacity-50 mt-1 italic">
                        {toolInfo.label}
                    </span>
                )}
            </div>

            {/* Avatar del usuario */}
            {isUser && (
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={12} className="text-zinc-300" />
                </div>
            )}
        </div>
    );
}
