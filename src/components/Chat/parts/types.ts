/**
 * types.ts — Tipos compartidos para el sistema de chat Voicey
 *
 * Modela la estructura de UIMessage de ai@6.x (partes tipadas)
 * y las props de cada sub-componente.
 */

// ─── Partes de un UIMessage ────────────────────────────────────────────────

export interface TextPart {
    type: 'text';
    text: string;
}

export interface ToolInvocationPart {
    type: 'tool-invocation';
    toolInvocation: {
        toolName: string;
        toolCallId: string;
        state: 'call' | 'result' | 'partial-call';
        args?: Record<string, unknown>;
        result?: unknown;
    };
}

export interface ToolResultPart {
    type: 'tool-result';
    toolCallId: string;
    toolName: string;
    result: unknown;
}

export type MessagePart = TextPart | ToolInvocationPart | ToolResultPart | { type: string };

// ─── UIMessage (subconjunto tipado de ai@6.x) ─────────────────────────────

export interface UIMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | MessagePart[];
    parts?: MessagePart[];
}

// ─── Nombres de herramientas disponibles ──────────────────────────────────

export type ToolName = 'get_audio_stats' | 'get_recent_logs' | 'control_detector';

export const TOOL_STATUS_LABELS: Record<ToolName, string> = {
    get_audio_stats: '📊 Consultando estadísticas...',
    get_recent_logs: '🗄️ Buscando registros...',
    control_detector: '⚙️ Ajustando detector...',
};

// ─── Props de sub-componentes ──────────────────────────────────────────────

export interface ChatTriggerProps {
    onClick: () => void;
}

export interface ChatHeaderProps {
    onClose: () => void;
    isStreaming: boolean;
}

export interface MessageBubbleProps {
    message: UIMessage;
}

export interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled: boolean;
}
