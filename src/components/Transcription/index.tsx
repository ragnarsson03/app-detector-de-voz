'use client';

import Uploader from '@/components/Uploader';
import Recorder from '@/components/Recorder';
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

// Componente para mostrar el resultado de la transcripción
const OutputPanel = ({ transcription, handleDownload }: { transcription: string, handleDownload: () => void }) => {
    const isTranscribed = !!transcription;

    return (
        <div
            className={clsx(
                // Panel base styles
                'flex flex-col p-6 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-500',
                'bg-slate-900/60 border border-cyan-400/20',
                'hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(0,246,255,0.2)]',
                // Output panel specific
                'w-full flex-1 shadow-2xl min-h-[400px] h-full'
            )}
        >
            <h3 className="text-xl font-semibold mb-4 text-emerald-400 border-b border-gray-700 pb-2">
                <i className="fas fa-file-alt mr-3"></i> Transcripción / Output
            </h3>

            {isTranscribed ? (
                <>
                    <textarea
                        readOnly
                        value={transcription}
                        rows={10}
                        className="w-full flex-grow p-4 text-gray-100 bg-gray-900/50 border border-gray-700 rounded-lg shadow-inner resize-none text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="El texto de la transcripción aparecerá aquí..."
                    />
                    <button
                        onClick={handleDownload}
                        className="w-full mt-4 py-3 px-6 rounded-lg font-bold transition-colors bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30 transform hover:-translate-y-0.5"
                    >
                        <i className="fas fa-download mr-2"></i> Descargar Transcripción (.txt)
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-gray-500 text-center">
                    <i className="fas fa-keyboard text-6xl mb-4 opacity-50"></i>
                    <p>El resultado del audio/grabación aparecerá en esta sección.</p>
                </div>
            )}
        </div>
    );
};


const Transcription = () => {
    const [transcription, setTranscription] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record'); // Tab state

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

    const panelClasses = clsx(
        // Panel base styles
        'flex flex-col p-6 rounded-b-2xl rounded-tr-2xl shadow-xl backdrop-blur-md transition-all duration-500',
        'bg-slate-900/60 border border-cyan-400/20',
        'hover:border-cyan-400/50'
    );

    return (
        // Changed to md:flex-row to be side-by-side on tablets and up
        <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full mt-8">

            {/* COLUMNA IZQUIERDA: INPUTS (Tabs) */}
            <div className="flex flex-col flex-1 min-w-0 w-full">

                {/* Tab Switcher */}
                <div className="flex space-x-1 mb-0 ml-2">
                    <button
                        onClick={() => setActiveTab('record')}
                        className={clsx(
                            'px-8 py-3 rounded-t-lg font-bold text-sm uppercase tracking-wider transition-all duration-300',
                            activeTab === 'record'
                                ? 'bg-slate-900/80 text-cyan-400 border-t border-x border-cyan-400/30'
                                : 'bg-transparent text-gray-500 hover:text-cyan-200 hover:bg-slate-800/30'
                        )}
                    >
                        <i className="fas fa-microphone mr-2"></i> Grabar
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={clsx(
                            'px-8 py-3 rounded-t-lg font-bold text-sm uppercase tracking-wider transition-all duration-300',
                            activeTab === 'upload'
                                ? 'bg-slate-900/80 text-cyan-400 border-t border-x border-cyan-400/30'
                                : 'bg-transparent text-gray-500 hover:text-cyan-200 hover:bg-slate-800/30'
                        )}
                    >
                        <i className="fas fa-upload mr-2"></i> Subir
                    </button>
                </div>

                {/* Contenido de Tabs */}
                {/* Usamos un contenedor relativo con altura mínima para evitar saltos bruscos, pero dejamos que crezca con el contenido */}
                <div className={clsx('relative transition-all duration-300 ease-in-out', { 'opacity-100 animate-fadeIn': isMounted, 'opacity-0': !isMounted })}>

                    {activeTab === 'record' && (
                        <div className={clsx(panelClasses, 'animate-fadeIn')}>
                            <Recorder setTranscription={setTranscription} />
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className={clsx(panelClasses, 'animate-fadeIn')}>
                            <Uploader setTranscription={setTranscription} />
                        </div>
                    )}

                </div>
            </div>

            {/* COLUMNA DERECHA: OUTPUT (Panel de Resultados) */}
            <div className="flex flex-col flex-1 min-w-0 w-full lg:min-h-full">
                <OutputPanel transcription={transcription} handleDownload={handleDownload} />
            </div>
        </div>
    );
};

export default Transcription;
