// src/components/Recorder.tsx

'use client'; 

import { useState, useRef, useCallback } from 'react';
// Importación con extensión explícita, a veces más robusta en ciertos entornos
import { handleProcessAudio } from '@/lib/transcription-utils'; 

export const Recorder = () => {
    // Estados del componente
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('Presiona el micrófono para grabar.');
    const [transcriptionText, setTranscriptionText] = useState('');
    
    // Referencias a objetos del navegador para la grabación
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Función para iniciar la grabación
    const startRecording = useCallback(async () => {
        if (isProcessing) return; // Evitar iniciar mientras procesa
        setTranscriptionText('');
        setMessage('Solicitando acceso al micrófono...');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());

                handleStopAndProcess(audioBlob); 
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setMessage('🔴 Grabando... Haz clic en el botón para detener.');
            
        } catch (err) {
            console.error('Error al acceder al micrófono:', err);
            setMessage('❌ Error: Acceso al micrófono denegado. Revisa los permisos.');
            setIsRecording(false);
        }
    }, [isProcessing]);

    // Función para detener la grabación
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);
    
    // Llama al backend con el audio grabado
    const handleStopAndProcess = async (audioBlob: Blob) => {
        setIsProcessing(true);
        setMessage('Subiendo audio y esperando transcripción...');
        
        try {
            const transcription = await handleProcessAudio(audioBlob, 'audio.webm'); 

            setTranscriptionText(transcription);
            setMessage('✅ Transcripción completada.');

        } catch (error) {
            setMessage(`❌ Error al transcribir: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Función de descarga (la misma que ya implementamos)
    const handleDownload = () => {
        if (!transcriptionText) return;
        const blob = new Blob([transcriptionText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcripcion_microfono_${Date.now()}.txt`; 
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    return (
        <div className="p-8 max-w-2xl mx-auto bg-gray-900 shadow-xl rounded-xl text-white font-sans">
            <h2 className="text-2xl font-bold mb-4 text-gray-200">Grabación Directa del Micrófono</h2>

            {/* Botón de control de grabación */}
            <div className="flex justify-center mb-6">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`w-24 h-24 rounded-full text-white text-3xl transition-all shadow-lg 
                        ${isProcessing ? 'bg-gray-500 cursor-not-allowed' : 
                          isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                </button>
            </div>

            {/* Área de mensajes de estado */}
            <p className={`text-sm p-3 rounded-lg font-medium text-center whitespace-pre-wrap 
              ${message.includes('❌') ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'}`}>
                {isProcessing ? 'Procesando en el servidor...' : message}
            </p>

            {/* Área de Transcripción Final */}
            {transcriptionText && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-3 text-emerald-400">Transcripción:</h3>
                    <textarea
                        readOnly
                        value={transcriptionText}
                        className="w-full h-40 p-4 text-gray-100 bg-gray-800 border border-gray-700 rounded-lg overflow-y-auto shadow-inner resize-none"
                        style={{ outline: 'none' }}
                    />
                    <button
                        onClick={handleDownload}
                        className="w-full mt-3 py-2 px-6 rounded-lg font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <i className="fas fa-download mr-2"></i> Descargar Transcripción (.txt)
                    </button>
                </div>
            )}
        </div>
    );
};
export default Recorder;