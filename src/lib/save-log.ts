import { supabase } from './supabase';

/**
 * Guarda un registro de voz en la base de datos Supabase.
 * Simula el nivel de dB si no se proporciona.
 */
export async function saveVoiceLog(data: {
    duration: number;
    transcript: string;
    db_level?: number;
    label?: string;
}) {
    // Simular dB si no viene (entre 30 y 85 dB - ambiente normal a ruidoso)
    const db = data.db_level ?? Math.floor(Math.random() * (85 - 30 + 1) + 30);

    // Label por defecto
    const label = data.label || 'Grabación de voz';

    try {
        const { error } = await supabase
            .from('voice_logs')
            .insert({
                duration: data.duration,
                transcript: data.transcript,
                db_level: db,
                label: label,
                // user_id: opcional, si tuviéramos auth
            });

        if (error) {
            console.error('❌ Error guardando log en Supabase:', error.message);
            return null;
        }

        console.log('✅ Log guardado en Supabase:', { duration: data.duration, db, label });
        return true;
    } catch (err) {
        console.error('❌ Error inesperado al guardar log:', err);
        return null;
    }
}
