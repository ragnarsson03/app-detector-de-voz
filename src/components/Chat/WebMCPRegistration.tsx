/**
 * WebMCP Registration
 * 
 * Registra las herramientas del asistente Voicey en el estándar WebMCP
 * usando navigator.modelContext (si el navegador lo soporta).
 * 
 * Esto permite que navegadores agénticos (como Chrome con Gemini Nano)
 * reconozcan las capacidades de la app automáticamente.
 * 
 * NOTA: WebMCP es experimental. Si el navegador no lo soporta,
 * este componente no hace nada (fail-safe).
 */
'use client';

import { useEffect } from 'react';

// Declaración de tipos para la API experimental WebMCP
declare global {
    interface Navigator {
        modelContext?: {
            registerTool: (config: {
                name: string;
                description: string;
                parameters?: Record<string, unknown>;
                execute: (...args: unknown[]) => Promise<unknown>;
            }) => void;
        };
    }
}

export default function WebMCPRegistration() {
    useEffect(() => {
        // Solo registrar si el navegador soporta WebMCP
        if (!navigator.modelContext) {
            console.log('[WebMCP] navigator.modelContext no disponible en este navegador. Omitiendo registro.');
            return;
        }

        console.log('[WebMCP] Registrando herramientas...');

        // Tool 1: Estadísticas de Audio
        navigator.modelContext.registerTool({
            name: 'consultar_estadisticas_voz',
            description: 'Obtiene estadísticas sobre los audios grabados: duración, volumen (dB) y horas de grabación. Incluye el audio más largo, el más ruidoso y promedios.',
            execute: async () => {
                try {
                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [{ role: 'user', content: 'Dame las estadísticas de audio usando get_audio_stats' }]
                        }),
                    });
                    return await res.json();
                } catch (error) {
                    return { error: 'No se pudieron obtener las estadísticas' };
                }
            },
        });

        // Tool 2: Logs Recientes
        navigator.modelContext.registerTool({
            name: 'obtener_logs_recientes',
            description: 'Obtiene los últimos registros de detección de voz con duración, nivel de dB, etiqueta y transcripción.',
            execute: async () => {
                try {
                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [{ role: 'user', content: 'Muéstrame los últimos 10 registros usando get_recent_logs' }]
                        }),
                    });
                    return await res.json();
                } catch (error) {
                    return { error: 'No se pudieron obtener los registros' };
                }
            },
        });

        // Tool 3: Control del Detector
        navigator.modelContext.registerTool({
            name: 'control_detector_voz',
            description: 'Configura la sensibilidad del detector de voz en el frontend.',
            execute: async () => {
                return {
                    message: 'Función de control disponible',
                    sensibilidad_actual: 50,
                    nota: 'Para cambiar la sensibilidad, usa el panel de configuración de la app.',
                };
            },
        });

        console.log('[WebMCP] 3 herramientas registradas exitosamente ✓');
    }, []);

    // Este componente no renderiza nada visible
    return null;
}
