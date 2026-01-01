'use client';

import { useMemo, Dispatch, SetStateAction, useCallback } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface RecorderProps {
    setTranscription: Dispatch<SetStateAction<string>>;
}

export const Recorder = ({ setTranscription }: RecorderProps) => {
    const { isRecording, isProcessing, message, startRecording, stopRecording } = useAudioRecorder();

    const handleStart = useCallback(() => {
        setTranscription('');
        startRecording();
    }, [startRecording, setTranscription]);

    const handleStop = useCallback(async () => {
        const text = await stopRecording();
        if (text) {
            setTranscription(text);
        }
    }, [stopRecording, setTranscription]);

    // Icono a usar
    const Icon = useMemo(() => {
        if (isProcessing) return <i className="fas fa-circle-notch fa-spin"></i>; // Icono de carga
        return <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>;
    }, [isProcessing, isRecording]);


    return (
        <div className="w-full text-white font-sans flex flex-col items-center">
            <h3 className="text-2xl font-bold mb-4 text-cyan-200 text-center" style={{ textShadow: '0 0 8px rgba(0, 246, 255, 0.5)' }}>Grabación Directa</h3>

            {/* Botón de control de grabación */}
            <div className="flex justify-center mb-6">
                <button
                    onClick={isRecording ? handleStop : handleStart}
                    disabled={isProcessing}
                    aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
                    className={`w-24 h-24 rounded-full text-3xl transition-all shadow-lg transform hover:scale-110 flex items-center justify-center
                        ${isProcessing ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600' :
                            isRecording ? 'bg-red-500/90 text-white hover:bg-red-600 ring-4 ring-red-400/50 animate-pulse' :
                                'bg-transparent border-2 border-cyan-400/60 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,246,255,0.4)]'}`}
                >
                    {Icon}
                </button>
            </div>

            {/* Área de mensajes de estado */}
            <p className={`text-sm p-3 rounded-lg font-medium text-center whitespace-pre-wrap w-full
              ${message.includes('❌') ? 'bg-red-900/50 text-red-300' : 'bg-cyan-900/50 text-cyan-200'}`}>
                {isProcessing ? 'Procesando en el servidor...' : message}
            </p>

        </div>
    );
};
export default Recorder;
