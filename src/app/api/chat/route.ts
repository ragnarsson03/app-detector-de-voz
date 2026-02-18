import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { SYSTEM_PROMPT } from './systemPrompt';
import { requestTools } from './tools';

// Inicializar proveedor Groq
const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        console.log(`[Chat API] Recibida petición POST con ${messages.length} mensajes.`);

        // Verificar API Key de Groq
        if (!process.env.GROQ_API_KEY) {
            console.error('[Chat API] ❌ Error: Falta GROQ_API_KEY.');
            return new Response(JSON.stringify({ error: 'Error: Falta GROQ_API_KEY en el servidor.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log('[Chat API] Iniciando streamText con Groq...');

        // En ai@6.x, streamText NO es async — retorna un objeto con métodos de stream.
        // Usar await destruye el prototipo y causa "toUIMessageStreamResponse is not a function".
        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
            system: SYSTEM_PROMPT,
            messages,
            tools: requestTools,
            // @ts-ignore — maxSteps es válido en runtime (ai@6.x) pero falta en los tipos
            maxSteps: 5,
            onError: (err) => {
                console.error('[Chat API] ❌ Error en streamText:', err);
            },
            onFinish: (completion) => {
                console.log('[Chat API] ✅ Stream finalizado. Tokens usados:', completion.usage.totalTokens);
            },
        });

        console.log('[Chat API] Retornando UI message stream response.');
        return result.toUIMessageStreamResponse();

    } catch (error) {
        console.error('[Chat API] ❌ Error CRÍTICO en /api/chat:', error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
