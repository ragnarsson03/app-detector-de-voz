'use server';

import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

// Esquema de validación para asegurar que solo recibimos datos esperados
const LogSchema = z.object({
    duration: z.number().positive(),
    transcript: z.string().min(1),
    db_level: z.number().optional(),
    label: z.string().optional(),
});

export async function saveVoiceLogAction(input: z.infer<typeof LogSchema>) {
    console.log('\n--- 🗣️ NUEVA TRANSCRIPCIÓN RECIBIDA EN EL SERVIDOR ---');
    console.log(`[Texto]: ${input.transcript}`);
    console.log(`[Duración]: ${input.duration}s`);
    console.log('-----------------------------------------------------\n');

    // 1. Validar inputs
    const result = LogSchema.safeParse(input);
    if (!result.success) {
        console.error('❌ Datos inválidos para guardar log:', result.error);
        return { success: false, error: 'Datos inválidos' };
    }

    const data = result.data;

    // 2. Usar supabaseServer (Service Role) 
    // Esto es seguro porque se ejecuta SOLO en el servidor. 
    // La llave maestra nunca sale de este entorno.
    if (!supabaseServer) {
        console.error('❌ Supabase Server no inicializado (falta llave Service Role)');
        return { success: false, error: 'Error de configuración del servidor' };
    }

    // 3. Simular dB si no viene (lógica de negocio)
    const db = data.db_level ?? Math.floor(Math.random() * (85 - 30 + 1) + 30);
    const label = data.label || 'Grabación de voz';

    try {
        const { error } = await supabaseServer
            .from('voice_logs')
            .insert({
                duration: data.duration,
                transcript: data.transcript,
                db_level: db,
                label: label,
            });

        if (error) {
            console.error('❌ Error Supabase:', error.message);
            return { success: false, error: error.message };
        }

        console.log('✅ Log guardado (Server Action):', { id: label, duration: data.duration });
        return { success: true };

    } catch (err) {
        console.error('❌ Error inesperado:', err);
        return { success: false, error: 'Error interno' };
    }
}
