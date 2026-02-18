
import { tool } from 'ai';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabaseServer';

// ============================
// TOOL 1: Estadísticas de Audio
// ============================
export const getAudioStatsTool = tool({
    description: 'Obtiene estadísticas generales de los registros de audio: el más largo, el más ruidoso, promedio de duración y total de grabaciones.',
    parameters: z.object({
        period: z.enum(['today', 'week', 'month', 'all']).optional()
            .describe('Período de tiempo. "today"=hoy, "week"=última semana, "month"=último mes, "all"=todos.'),
    }).passthrough(),
    // @ts-ignore
    execute: async (args: any) => {
        console.log('[Tool: get_audio_stats] Ejecutando con args:', JSON.stringify(args));
        try {
            const period = args?.period;

            if (!supabaseServer) {
                return { error: 'Servicio de base de datos no disponible (Faltan credenciales).' };
            }

            let query = supabaseServer
                .from('voice_logs')
                .select('id, duration, db_level, label, transcript, created_at')
                .order('created_at', { ascending: false });

            if (period && period !== 'all') {
                const now = new Date();
                let since: Date;
                if (period === 'today') {
                    since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                } else if (period === 'week') {
                    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                } else {
                    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                }
                query = query.gte('created_at', since.toISOString());
            }

            const { data, error } = await query.limit(500);

            if (error) {
                console.error('[Tool: get_audio_stats] ❌ Error Supabase:', error);
                return { error: error.message };
            }
            if (!data || data.length === 0) return { message: 'No hay registros de audio en el período seleccionado.' };

            const durations = data.map(d => d.duration).filter(Boolean) as number[];
            const dbLevels = data.map(d => d.db_level).filter(Boolean) as number[];

            const longest = data.reduce((max, d) => (d.duration ?? 0) > (max.duration ?? 0) ? d : max, data[0]);
            const loudest = data.reduce((max, d) => (d.db_level ?? 0) > (max.db_level ?? 0) ? d : max, data[0]);

            const result = {
                total_grabaciones: data.length,
                audio_mas_largo: { duracion_segundos: longest.duration, etiqueta: longest.label, fecha: longest.created_at },
                audio_mas_ruidoso: { nivel_db: loudest.db_level, etiqueta: loudest.label, fecha: loudest.created_at },
                promedio_duracion: durations.length > 0 ? parseFloat((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2)) : null,
                promedio_db: dbLevels.length > 0 ? parseFloat((dbLevels.reduce((a, b) => a + b, 0) / dbLevels.length).toFixed(2)) : null,
            };
            console.log('[Tool: get_audio_stats] ✅ Resultado:', JSON.stringify(result));
            return result;
        } catch (err) {
            console.error('[Tool: get_audio_stats] ❌ Error inesperado:', err);
            return { error: `Error inesperado: ${err instanceof Error ? err.message : String(err)}` };
        }
    },
});

// ============================
// TOOL 2: Logs Recientes
// ============================
export const getRecentLogsTool = tool({
    description: 'Obtiene los últimos N registros de detección de voz.',
    parameters: z.object({
        limit: z.number().min(1).max(50).optional()
            .describe('Número de registros a obtener. Máximo 50. Por defecto 10.'),
    }).passthrough(),
    // @ts-ignore
    execute: async (args: any) => {
        console.log('[Tool: get_recent_logs] Ejecutando con args:', JSON.stringify(args));
        try {
            const n = args?.limit ?? 10;

            if (!supabaseServer) {
                return { error: 'Servicio de base de datos no disponible (Faltan credenciales).' };
            }

            const { data, error } = await supabaseServer
                .from('voice_logs')
                .select('id, duration, db_level, label, transcript, created_at')
                .order('created_at', { ascending: false })
                .limit(n);

            if (error) {
                console.error('[Tool: get_recent_logs] ❌ Error Supabase:', error);
                return { error: error.message };
            }
            if (!data || data.length === 0) return { message: 'No hay registros recientes.' };

            const result = {
                cantidad: data.length,
                registros: data.map(log => ({
                    id: log.id,
                    duracion: log.duration,
                    nivel_db: log.db_level,
                    etiqueta: log.label,
                    texto: log.transcript?.substring(0, 100) ?? '(sin transcripción)',
                    fecha: log.created_at,
                })),
            };
            console.log('[Tool: get_recent_logs] ✅ Registros obtenidos:', result.cantidad);
            return result;
        } catch (err) {
            console.error('[Tool: get_recent_logs] ❌ Error inesperado:', err);
            return { error: `Error inesperado: ${err instanceof Error ? err.message : String(err)}` };
        }
    },
});

// ============================
// TOOL 3: Control del Detector
// ============================
export const controlDetectorTool = tool({
    description: 'Cambia la configuración del detector de voz (sensibilidad).',
    parameters: z.object({
        action: z.enum(['get_config', 'set_sensitivity']).describe('Acción a realizar'),
        sensitivity: z.number().min(0).max(100).optional()
            .describe('Nivel de sensibilidad (0-100). Solo para set_sensitivity.'),
    }),
    // @ts-ignore
    execute: async (args: any) => {
        console.log('[Tool: control_detector] Ejecutando con args:', JSON.stringify(args));
        try {
            const { action, sensitivity } = args ?? {};
            if (action === 'get_config') {
                return {
                    message: 'Configuración actual del detector',
                    sensibilidad: 50,
                    nota: 'Este valor se gestiona en el frontend.',
                };
            }
            return {
                message: `Sensibilidad configurada a ${sensitivity}%`,
                nota: 'Cambio conceptual. Se aplicará en futuras versiones.',
            };
        } catch (err) {
            console.error('[Tool: control_detector] ❌ Error inesperado:', err);
            return { error: `Error inesperado: ${err instanceof Error ? err.message : String(err)}` };
        }
    },
});

export const requestTools = {
    get_audio_stats: getAudioStatsTool,
    get_recent_logs: getRecentLogsTool,
    control_detector: controlDetectorTool
};
