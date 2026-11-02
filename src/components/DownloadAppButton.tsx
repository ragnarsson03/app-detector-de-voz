'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, ShieldCheck, X, Sparkles, AlertCircle } from 'lucide-react';

interface DownloadAppButtonProps {
    className?: string;
}

// URL pública permanente requerida en Supabase Storage
const APK_DOWNLOAD_URL = 'https://dxlrsterbyjgmidyhzrs.supabase.co/storage/v1/object/public/apks/app-detector-de-voz.apk';

export const DownloadAppButton: React.FC<DownloadAppButtonProps> = ({ className = '' }) => {
    const [showInstructions, setShowInstructions] = useState(false);
    const [isAndroidDevice, setIsAndroidDevice] = useState(false);

    // Detectar si el usuario está navegando desde un dispositivo Android
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const ua = navigator.userAgent || '';
            setIsAndroidDevice(/android/i.test(ua));
        }
    }, []);

    return (
        <>
            <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
                {/* Banner contextual si se detecta Android */}
                {isAndroidDevice && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold animate-pulse">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Dispositivo Android detectado</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <a
                        href={APK_DOWNLOAD_URL}
                        download="app-detector-de-voz.apk"
                        className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs md:text-sm font-black tracking-wider uppercase text-cyan-200 bg-cyan-950/50 border border-cyan-500/50 hover:border-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.45)] backdrop-blur-md active:scale-95"
                    >
                        <Smartphone className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>Descargar App (.APK)</span>
                        <Download className="w-4 h-4 text-cyan-300 opacity-80 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute -top-2.5 -right-2 px-2 py-0.5 rounded-full text-[9px] bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-extrabold uppercase tracking-tighter shadow-sm">
                            Android
                        </span>
                    </a>

                    <button
                        type="button"
                        onClick={() => setShowInstructions(true)}
                        className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400/90 hover:text-cyan-200 underline underline-offset-4 transition-colors"
                    >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>¿Cómo instalar? (Permitir fuentes desconocidas)</span>
                    </button>
                </div>

                <p className="text-[10px] text-zinc-500 tracking-wide">
                    Requiere activar <span className="text-zinc-400 font-medium">&quot;Permitir fuentes desconocidas&quot;</span> en ajustes de Android
                </p>
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
                                    Guía rápida de instalación manual
                                </p>
                            </div>
                        </div>

                        <ol className="space-y-3.5 text-xs text-neutral-300">
                            <li className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
                                    1
                                </span>
                                <span>
                                    Pulsa <strong>Descargar App (.APK)</strong> para guardar el archivo en tu dispositivo.
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
                                    2
                                </span>
                                <span>
                                    Abre la notificación de descarga o busca <code>app-detector-de-voz.apk</code> en tu carpeta de <em>Descargas</em>.
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
                                    3
                                </span>
                                <span>
                                    <strong>Importante:</strong> Si el sistema avisa sobre fuentes externas, entra a Ajustes y activa <strong>&quot;Permitir instalar aplicaciones de fuentes desconocidas&quot;</strong> para tu navegador o gestor de archivos.
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
                                    4
                                </span>
                                <span>
                                    Pulsa <strong>Instalar</strong> y concede los permisos de <strong>Micrófono</strong> para que el detector capture audio en tiempo real.
                                </span>
                            </li>
                        </ol>

                        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-[10px] text-cyan-400/90 font-medium">
                                <Sparkles className="w-3.5 h-3.5" /> Arquitectura Capacitor Shell
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
