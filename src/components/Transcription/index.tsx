'use client';

import Uploader from '@/components/Uploader';
import Recorder from '@/components/Recorder';
import React, { useState, useEffect } from 'react';
import styles from './transcription.module.css'; // Importamos los módulos de CSS
import clsx from 'clsx'; // Importamos clsx

// Componente para mostrar el resultado de la transcripción
const OutputPanel = ({ transcription, handleDownload }: { transcription: string, handleDownload: () => void }) => {
    const isTranscribed = !!transcription;

    return (
        <div 
            // Usamos las clases del módulo de CSS.
            className={clsx(styles.panel, styles.outputPanel, 'animate-fadeIn')}
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
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-10 w-full mt-8">
            
            {/* COLUMNA IZQUIERDA: INPUTS */}
            <div className="flex flex-col space-y-8 flex-1 min-w-0">
                {/* Panel 1: Uploader */}
                <div
                    // clsx maneja la lógica condicional para las clases de animación.
                    className={clsx(styles.panel, styles.inputPanel, {
                        [styles.visibleState]: isMounted,
                        [styles.initialState]: !isMounted
                    })}
                >
                    <Uploader setTranscription={setTranscription} />
                </div>

                {/* Panel 2: Recorder */}
                <div
                    // Añadimos la clase de delay directamente.
                    className={clsx(styles.panel, styles.inputPanel, {
                        [styles.visibleState]: isMounted,
                        [styles.initialState]: !isMounted
                    }, 'delay-200')}
                >
                    <Recorder setTranscription={setTranscription} />
                </div>
            </div>

            {/* COLUMNA DERECHA: OUTPUT */}
            <div className="flex flex-col flex-1 min-w-0 lg:min-h-full">
                <OutputPanel transcription={transcription} handleDownload={handleDownload} />
            </div>
        </div>
    );
};

export default Transcription;