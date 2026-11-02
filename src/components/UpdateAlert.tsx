'use client';

import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, Sparkles, X, ShieldAlert } from 'lucide-react';

const CURRENT_VERSION = '1.0.0';
const VERSION_URL = 'https://dxlrsterbyjgmidyhzrs.supabase.co/storage/v1/object/public/apks/version.json';

interface VersionConfig {
    version: string;
    mandatory?: boolean;
    apkUrl: string;
    notes?: string;
}

// Función auxiliar para comparar versiones semánticas (ej: "1.0.1" > "1.0.0")
const isNewerVersion = (remote: string, local: string): boolean => {
    const r = remote.split('.').map((n) => parseInt(n, 10) || 0);
    const l = local.split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(r.length, l.length); i++) {
        const rVal = r[i] ?? 0;
        const lVal = l[i] ?? 0;
        if (rVal > lVal) return true;
        if (rVal < lVal) return false;
    }
    return false;
};

export const UpdateAlert: React.FC = () => {
    const [updateConfig, setUpdateConfig] = useState<VersionConfig | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Solo evaluar en dispositivos móviles nativos (Capacitor Android)
        // Permitir query param ?debugUpdate=true para previsualizar en navegador durante desarrollo
        const isNative = Capacitor.isNativePlatform();
        const isDebug = typeof window !== 'undefined' && window.location.search.includes('debugUpdate=true');

        if (!isNative && !isDebug) return;

        const checkVersion = async () => {
            try {
                // Fetch silencioso evitando cache para obtener siempre la última versión
                const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
                    cache: 'no-store'
                });

                if (!res.ok) return;

                const data: VersionConfig = await res.json();

                if (data?.version && isNewerVersion(data.version, CURRENT_VERSION)) {
                    setUpdateConfig(data);
                    setIsOpen(true);
                }
            } catch (err) {
                // Silencioso: no interrumpe el uso de la aplicación si no hay internet
                console.log('[UpdateAlert] No se pudo verificar la versión remota:', err);
            }
        };

        checkVersion();
    }, []);

    if (!isOpen || !updateConfig) return null;

    const handleUpdate = () => {
        if (updateConfig.apkUrl) {
            // Abre el navegador del sistema nativo para que el Download Manager de Android descargue e instale el APK
            window.open(updateConfig.apkUrl, '_system');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-sm rounded-2xl bg-[#09090b] border border-cyan-500/40 p-6 shadow-[0_0_50px_rgba(34,211,238,0.25)] text-left">
                {/* Botón de cierre solo si la actualización NO es obligatoria */}
                {!updateConfig.mandatory && (
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        aria-label="Cerrar aviso de actualización"
                    >
                        <X size={18} />
                    </button>
                )}

                {/* Encabezado */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        {updateConfig.mandatory ? <ShieldAlert size={24} className="text-amber-400" /> : <Sparkles size={24} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-black tracking-tight text-white uppercase font-['Orbitron']">
                                {updateConfig.mandatory ? 'Actualización Requerida' : 'Nueva Versión'}
                            </h3>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                v{updateConfig.version}
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                            Versión actual instalada: <span className="font-mono text-zinc-300">v{CURRENT_VERSION}</span>
                        </p>
                    </div>
                </div>

                {/* Notas de la versión */}
                {updateConfig.notes && (
                    <div className="p-3 mb-5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                        <p className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider mb-1">
                            Novedades:
                        </p>
                        <p className="text-zinc-300 text-xs">{updateConfig.notes}</p>
                    </div>
                )}

                {/* Botón de Acción Principal */}
                <button
                    type="button"
                    onClick={handleUpdate}
                    className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-cyan-500 text-black hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.35)] flex items-center justify-center gap-2 transition-all duration-300 active:scale-98"
                >
                    <Download size={16} />
                    <span>Actualizar Ahora (.APK)</span>
                </button>

                {updateConfig.mandatory && (
                    <p className="text-center text-[10px] text-amber-400/80 mt-3 font-medium">
                        * Esta actualización es obligatoria para continuar usando la app
                    </p>
                )}
            </div>
        </div>
    );
};
