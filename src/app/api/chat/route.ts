import { streamText, convertToModelMessages } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { SYSTEM_PROMPT } from './systemPrompt';
import { requestTools } from './tools';

// Inicializar proveedor Groq
const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages = body.messages ?? [];
        console.log(`[Chat API] POST recibido. Mensajes: ${messages.length}`);

        // Log de diagnóstico: ver estructura del último mensaje
        if (messages.length > 0) {
            const last = messages[messages.length - 1];
            console.log('[Chat API] Último mensaje — role:', last.role,
                '| parts:', JSON.stringify(last.parts ?? last.content)?.slice(0, 200));
        }

        if (!process.env.GROQ_API_KEY) {
            console.error('[Chat API] ❌ Falta GROQ_API_KEY.');
            return new Response(JSON.stringify({ error: 'Falta GROQ_API_KEY.' }), {
                status: 500, headers: { 'Content-Type': 'application/json' },
            });
        }

        // Convertir UIMessage[] → ModelMessage[] preservando tool-results
        const coreMessages = await convertToModelMessages(messages);

        // LOG CRÍTICO: Ver qué memoria le estamos pasando al modelo
        console.log(`[Chat API] 🧠 Memoria enviada (Total: ${coreMessages.length}):`);
        coreMessages.forEach((m, i) => {
            let contentClean = '';
            if (typeof m.content === 'string') {
                contentClean = m.content.slice(0, 100).replace(/\n/g, ' ');
            } else if (Array.isArray(m.content)) {
                contentClean = m.content.map(c => `[${c.type}]`).join(', ');
            } else {
                contentClean = JSON.stringify(m.content).slice(0, 100);
            }
            console.log(`  [${i}] ${m.role.toUpperCase()}: ${contentClean}`);
        });

        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
            system: SYSTEM_PROMPT,
            messages: coreMessages,
            tools: requestTools,
            toolChoice: 'auto', // Permite que el modelo decida si usar tool o responder texto
            // @ts-ignore — maxSteps es válido en runtime (ai@6.x)
            maxSteps: 5,
            onStepFinish: (step: any) => {
                // Log crítico: ver qué pasa en cada paso del ciclo multi-step
                console.log('[Chat API] 📍 Paso completado:',
                    'finishReason=', step.finishReason,
                    '| toolCalls=', step.toolCalls?.length ?? 0,
                    '| text=', step.text?.slice(0, 80).replace(/\n/g, ' ') || '(vacío)',
                    '| tokens=', step.usage?.totalTokens
                );
            },
            onError: (err) => {
                console.error('[Chat API] ❌ Error en streamText:', err);
            },
            onFinish: (completion) => {
                console.log('[Chat API] ✅ Stream finalizado.',
                    'finishReason=', completion.finishReason,
                    '| tokens=', completion.usage.totalTokens
                );
            },
        });

        return result.toUIMessageStreamResponse();

    } catch (error) {
        console.error('[Chat API] ❌ Error CRÍTICO:', error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
        });
    }
}

