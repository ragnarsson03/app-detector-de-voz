'use client';

import Uploader from '@/components/Uploader';
import Recorder from '@/components/Recorder';
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

// Componente para mostrar el resultado de la transcripción - Minimalista
const OutputPanel = ({ transcription, handleDownload }: { transcription: string, handleDownload: () => void }) => {
    const isTranscribed = !!transcription;

    return (
        <div
            className="flex flex-col w-full h-full min-h-[400px]"
        >
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
                    Output
                </h3>
            </div>

            {isTranscribed ? (
                <>
                    <textarea
                        readOnly
                        value={transcription}
                        rows={10}
                        className="w-full flex-grow p-6 text-neutral-300 bg-neutral-900/40 border border-white/5 rounded-3xl resize-none text-base font-sans leading-relaxed focus:outline-none focus:bg-neutral-900/60 focus:border-white/10 transition-all duration-300 scroll-smooth"
                        placeholder="El texto de la transcripción aparecerá aquí..."
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleDownload}
                            className="text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                        >
                            Descargar .txt <i className="fas fa-arrow-down transform group-hover:translate-y-1 transition-transform"></i>
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center flex-grow border border-dashed border-white/10 rounded-3xl bg-neutral-900/20 text-neutral-600">
                    <i className="fas fa-quote-left text-4xl mb-4 opacity-20"></i>
                    <p className="text-sm font-medium">La transcripción aparecerá aquí.</p>
                </div>
            )}
        </div>
    );
};


const Transcription = () => {
    const [transcription, setTranscription] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleDownload = () => {
        if (!transcription) return;
        const blob = new Blob([transcription], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcripcion_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full animate-fadeIn delay-100">

            {/* COLUMNA IZQUIERDA: INPUTS */}
            <div className="flex flex-col w-full">

                {/* Tab Switcher - Minimalist Pill Style */}
                <div className="flex justify-center lg:justify-start mb-8">
                    <div className="flex p-1 bg-neutral-900/50 rounded-full border border-white/5">
                        <button
                            onClick={() => setActiveTab('record')}
                            className={clsx(
                                'px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300',
                                activeTab === 'record'
                                    ? 'bg-neutral-800 text-white shadow-lg'
                                    : 'text-neutral-500 hover:text-neutral-300'
                            )}
                        >
                            Grabar
                        </button>
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={clsx(
                                'px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300',
                                activeTab === 'upload'
                                    ? 'bg-neutral-800 text-white shadow-lg'
                                    : 'text-neutral-500 hover:text-neutral-300'
                            )}
                        >
                            Subir
                        </button>
                    </div>
                </div>

                {/* Contenido de Tabs */}
                {/* Usamos un contenedor que mantiene su altura o fluye naturalmente */}
                <div className="w-full transition-all duration-500 ease-in-out">

                    {activeTab === 'record' && (
                        <div className="animate-fadeIn">
                            <Recorder setTranscription={setTranscription} />
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="animate-fadeIn">
                            <Uploader setTranscription={setTranscription} />
                        </div>
                    )}

                </div>
            </div>

            {/* COLUMNA DERECHA: OUTPUT */}
            <div className="w-full flex flex-col">
                <OutputPanel transcription={transcription} handleDownload={handleDownload} />
            </div>
        </div>
    );
};

export default Transcription;
