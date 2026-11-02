'use client';

import React, { useState } from 'react';
import { Smartphone, Download, ShieldCheck, X, Sparkles } from 'lucide-react';

interface DownloadAppButtonProps {
    className?: string;
}

export const DownloadAppButton: React.FC<DownloadAppButtonProps> = ({ className = '' }) => {
    const [showInstructions, setShowInstructions] = useState(false);

    // URL pública del APK en Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const defaultApkUrl = supabaseUrl
        ? `${supabaseUrl}/storage/v1/object/public/apks/app-detector-de-voz.apk`
        : 'https://app-detector-de-voz.vercel.app/app-detector-de-voz.apk';

    const apkUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || defaultApkUrl;

    return (
        <>
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 ${className}`}>
                <a
                    href={apkUrl}
                    download="app-detector-de-voz.apk"
                    className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold tracking-wider uppercase text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-900/40 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.35)] backdrop-blur-md active:scale-95"
                >
                    <Smartphone className="w-4 h-4 text-cyan-400 group-hover:animate-bounce" />
                    <span>Descargar App (.APK)</span>
                    <Download className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] bg-cyan-500 text-black font-extrabold uppercase tracking-tighter">
                        Android
                    </span>
                </a>

                <button
                    type="button"
                    onClick={() => setShowInstructions(true)}
                    className="text-[11px] text-cyan-400/80 hover:text-cyan-300 underline underline-offset-4 transition-colors"
                >
                    ¿Cómo instalar en mi móvil?
                </button>
            </div>

            {/* Modal de Instrucciones de Instalación */}
            {showInstructions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="relative w-full max-w-md bg-neutral-950 border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(34,211,238,0.25)] text-left">
                        <button
                            type="button"
                            onClick={() => setShowInstructions(false)}
                            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                            aria-label="Cerrar instrucciones"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">
                                    Instalación del APK en Android
                                </h3>
                                <p className="text-xs text-neutral-400">
                                    Guía rápida paso a paso
                                </p>
                            </div>
                        </div>

                        <ol className="space-y-3.5 text-xs text-neutral-300">
                            <li className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
                                    1
                                </span>
                                <span>
                                    Haz clic en el botón <strong>Descargar App (.APK)</strong> y guarda el archivo en tu dispositivo.
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
                                    2
                                </span>
                                <span>
                                    Abre la notificación de descarga o busca el archivo en tu carpeta <em>Descargas</em>.
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
                                    3
                                </span>
                                <span>
                                    Si Android lo solicita, activa la casilla <strong>&quot;Permitir instalar aplicaciones de fuentes desconocidas&quot;</strong> para tu navegador.
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
                                    4
                                </span>
                                <span>
                                    Pulsa <strong>Instalar</strong> y luego concede permisos de <strong>Micrófono</strong> para activar la transcripción y detección de audio.
                                </span>
                            </li>
                        </ol>

                        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-[10px] text-cyan-400/90 font-medium">
                                <Sparkles className="w-3.5 h-3.5" /> Desarrollado con Capacitor Shell
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowInstructions(false)}
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
