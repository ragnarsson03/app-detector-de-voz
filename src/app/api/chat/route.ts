
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

        // Verificar API Key de Groq
        if (!process.env.GROQ_API_KEY) {
            return new Response(JSON.stringify({ error: 'Error: Falta GROQ_API_KEY en el servidor.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ⚠️ IMPORTANTE: 'streamText' en esta versión de 'ai' SDK parece ser ASYNC
        // (Aunque algunas docs dicen lo contrario, el error runtime indica que retorna una Promise)
        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
            system: SYSTEM_PROMPT,
            messages,
            tools: requestTools,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Error en /api/chat:', error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
