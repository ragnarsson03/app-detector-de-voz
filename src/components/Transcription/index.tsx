'use client';

import Uploader from '@/components/Uploader';
import Recorder from '@/components/Recorder';
import React, { useState, useEffect } from 'react'; // Importamos useEffect
import styles from './transcription.module.css'; // Importamos los módulos de CSS
import clsx from 'clsx'; // Importamos clsx

// Componente para mostrar el resultado de la transcripción
const OutputPanel = ({ transcription, handleDownload }: { transcription: string, handleDownload: () => void }) => {
    const isTranscribed = !!transcription;

    return (
        <div 
            // Usamos las clases del módulo de CSS combinadas con la clase de Tailwind para la animación
            className={clsx(styles.panel, styles.outputPanel, 'w-full', 'flex-1', 'shadow-2xl')}
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
    // ESTADO DE LA TRANSCRIPCIÓN: MOVIDO AQUÍ PARA COMPARTIR ENTRE INPUT Y OUTPUT
    const [transcription, setTranscription] = useState('');
    // NUEVO ESTADO para controlar la visibilidad después de la hidratación
    const [isMounted, setIsMounted] = useState(false); 

    // useEffect se ejecuta solo en el cliente, después de la hidratación
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
        // CORREGIDO: Usamos 'justify-center' y 'items-start' para centrar el bloque horizontalmente 
        // y asegurar la alineación superior de los paneles.
        <div className="flex flex-col md:flex-row items-start justify-center gap-10 w-full mt-8">
            
            {/* COLUMNA IZQUIERDA: INPUTS (Uploader y Recorder apilados verticalmente) */}
            {/* ELIMINADO: md:w-1/2. Ahora flex-1 manejará el 50% del espacio disponible. */}
            <div className="flex flex-col space-y-8 flex-1 min-w-0 w-full">
                {/* Panel 1: Uploader */}
                <div
                    // Usamos clsx y las clases del módulo CSS para manejar el estado de montaje y la apariencia
                    className={clsx(styles.panel, {
                        [styles.visibleState]: isMounted,
                        [styles.initialState]: !isMounted
                    })}
                >
                    <Uploader setTranscription={setTranscription} />
                </div>

                {/* Panel 2: Recorder */}
                <div
                    // Usamos clsx y las clases del módulo CSS para manejar el estado de montaje y la apariencia
                    // Añadimos el delay de Tailwind, ya que no se puede aplicar a una animación definida con @keyframes
                    // sin modificar la definición del keyframe, pero funciona bien para clases de Tailwind.
                    className={clsx(styles.panel, 'delay-200', {
                        [styles.visibleState]: isMounted,
                        [styles.initialState]: !isMounted
                    })}
                >
                    <Recorder setTranscription={setTranscription} />
                </div>
            </div>

            {/* COLUMNA DERECHA: OUTPUT (Panel de Resultados) */}
            {/* ELIMINADO: md:w-1/2. Ahora flex-1 manejará el 50% del espacio disponible. */}
            <div className="flex flex-col flex-1 min-w-0 w-full lg:min-h-full">
                <OutputPanel transcription={transcription} handleDownload={handleDownload} />
            </div>
        </div>
    );
};

export default Transcription;