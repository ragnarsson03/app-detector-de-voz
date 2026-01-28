'use client';
import React, { useState } from 'react';
import { Mic, Upload, FileText, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useFileUploader } from '@/hooks/useFileUploader';
import clsx from 'clsx';

export default function TranscriptionManager() {
    const [method, setMethod] = useState<'upload' | 'record'>('upload');
    const [result, setResult] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Hooks Hooks
    const {
        isRecording,
        audioBlob,
        startRecording,
        stopRecording,
        transcribeAudio,
        isProcessing: isRecordingProcessing,
        message: recorderMessage,
        progress: recorderProgress
    } = useAudioRecorder();

    const {
        uploadFile,
        isProcessing: isUploadProcessing,
        statusMessage: uploaderMessage,
        progress: uploaderProgress,
        transcriptionResult: uploaderResult
    } = useFileUploader();

    const isProcessing = isRecordingProcessing || isUploadProcessing;
    const statusMessage = method === 'record' ? recorderMessage : uploaderMessage;
    const progress = method === 'record' ? recorderProgress : uploaderProgress;

    // Sincronizar resultados de los hooks con el estado local
    React.useEffect(() => {
        if (method === 'upload' && uploaderResult) {
            setResult(uploaderResult);
        }
    }, [uploaderResult, method]);

    // Handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
            setResult("");
        }
    };

    const handleToggleRecord = async () => {
        if (isRecording) {
            stopRecording();
        } else {
            setResult("");
            await startRecording();
        }
    };

    const handleTranscribe = async () => {
        setResult("");

        if (method === 'upload') {
            if (!selectedFile) return;
            await uploadFile(selectedFile);
        } else {
            if (!audioBlob) return;
            const text = await transcribeAudio(audioBlob);
            if (text) setResult(text);
        }
    };

    // Determine if main button should be disabled
    const isButtonDisabled = isProcessing || (method === 'upload' && !selectedFile) || (method === 'record' && (!audioBlob && !isRecording));

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 font-sans selection:bg-cyan-500/30">
            {/* Título Neon Cyberpunk */}
            <header className="text-center mb-16 animate-fadeIn relative z-10">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-cyan-500 drop-shadow-[0_0_35px_rgba(34,211,238,0.5)] font-['Orbitron']"
                    style={{ textShadow: '0 0 40px rgba(6,182,212,0.4), 0 0 10px rgba(6,182,212,0.8)' }}>
                    DETECTOR DE VOZ A TEXTO
                </h1>

                {/* Glow ambiental detrás del título */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-24 bg-cyan-500/10 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
            </header>

            {/* Contenedor Unificado (Split Card) - Darker and wider gaps if needed */}
            <div className="bg-[#050505] border border-zinc-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[550px] relative">
                {/* Decoración de borde brillante en la izquierda */}
                <div className="absolute top-10 left-0 w-1 h-12 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]"></div>

                {/* Columna Izquierda: Entrada */}
                <div className="w-full md:w-2/5 p-6 md:p-10 border-b md:border-b-0 md:border-r border-zinc-900 bg-[#050505] flex flex-col justify-between relative">
                    <div className="flex items-center gap-3 mb-6 md:mb-10 pl-4">
                        {/* Indicador visual tipo 'chip' */}
                        <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                        <h2 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Entrada de Audio</h2>
                    </div>

                    <div className="space-y-6 md:space-y-10 flex flex-col">
                        {/* Selector de Método - Estilo Botones Puros */}
                        <div className="flex gap-1 bg-black/60 p-1.5 rounded-xl border border-zinc-900/80">
                            <button
                                onClick={() => setMethod('upload')}
                                className={`flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${method === 'upload' ? 'bg-[#1a1a1a] text-white shadow-inner border border-zinc-700' : 'text-zinc-600 hover:text-zinc-400'}`}
                            >
                                Cargar Archivo
                            </button>
                            <button
                                onClick={() => setMethod('record')}
                                className={`flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${method === 'record' ? 'bg-[#1a1a1a] text-white shadow-inner border border-zinc-700' : 'text-zinc-600 hover:text-zinc-400'}`}
                            >
                                Grabar Voz
                            </button>
                        </div>

                        {/* Contenido Dinámico */}
                        <div className="flex-1 flex flex-col justify-center">
                            {method === 'upload' ? (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className={clsx(
                                        "group relative border-2 border-dashed rounded-3xl h-48 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden",
                                        selectedFile
                                            ? "border-cyan-500/30 bg-cyan-900/5 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]"
                                            : "border-zinc-800 hover:border-zinc-700 bg-[#0a0a0a]"
                                    )}>
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        {selectedFile ? (
                                            <div className="flex flex-col items-center z-10 px-6 text-center">
                                                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3">
                                                    <CheckCircle2 className="text-cyan-400" size={20} />
                                                </div>
                                                <p className="text-xs text-white font-bold mb-1 truncate w-full">{selectedFile.name}</p>
                                                <span className="text-[10px] text-cyan-500/60 uppercase tracking-widest">Listo para procesar</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center z-10">
                                                <Upload className="mb-4 text-zinc-700 group-hover:text-zinc-400 transition-colors duration-300" size={24} />
                                                <p className="text-xs text-zinc-500 font-bold mb-1">Seleccionar audio o video</p>
                                                <p className="text-[10px] text-zinc-700 italic">MP3, WAV, M4A, MP4</p>
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            accept="audio/*,video/*,.mp4,.mkv,.mov"
                                            onChange={handleFileSelect}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center bg-[#0a0a0a] rounded-3xl border border-zinc-800 relative overflow-hidden animate-fadeIn">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 to-transparent opacity-0 transition-opacity duration-500" style={{ opacity: isRecording ? 1 : 0 }}></div>
                                    <button
                                        onClick={handleToggleRecord}
                                        className={clsx(
                                            "relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group",
                                            isRecording
                                                ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                                                : "bg-zinc-800 hover:bg-zinc-700"
                                        )}
                                    >
                                        <div className={clsx("transition-transform duration-300", isRecording ? "scale-90" : "group-hover:scale-110")}>
                                            {isRecording ? (
                                                <div className="w-6 h-6 bg-white rounded-sm animate-pulse"></div>
                                            ) : (
                                                <Mic className="text-zinc-400 group-hover:text-white" size={24} />
                                            )}
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Botón de Acción Principal - THE GLOWING CYAN BUTTON */}
                        <div className="pt-4 md:pt-6">
                            <button
                                onClick={handleTranscribe}
                                disabled={isProcessing}
                                className={clsx(
                                    "w-full py-5 rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden group",
                                    isProcessing
                                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                                        : "bg-[#4ff0b7] text-black hover:bg-[#3ddfab] shadow-[0_20px_40px_-10px_rgba(79,240,183,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(79,240,183,0.6)]"
                                )}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                                    {isProcessing ? 'PROCESANDO...' : 'SUBIR Y TRANSCRIBIR'}
                                </span>
                            </button>

                            {/* Barra de Progreso */}
                            {isProcessing && progress > 0 && (
                                <div className="mt-4 animate-fadeIn">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{statusMessage}</span>
                                        <span className="text-[10px] text-cyan-400 font-mono">{progress}%</span>
                                    </div>
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Salida - Minimal Dark Void */}
                <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col bg-[#050505] relative">
                    <div className="absolute top-8 right-8 text-zinc-800 hover:text-zinc-600 transition-colors cursor-pointer">
                        <span className="text-[10px] font-mono">v1.1</span>
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                        <FileText size={14} className="text-zinc-600" />
                        <span className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Transcripción / Output</span>
                    </div>

                    <div className="flex-1 bg-black rounded-[2rem] border border-zinc-900/50 p-10 text-zinc-400 font-mono text-xs leading-loose relative min-h-[400px] shadow-inner">
                        {!result ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-800 select-none">
                                <div className="p-6 bg-zinc-900/30 rounded-3xl mb-4">
                                    <FileText size={32} className="opacity-20" />
                                </div>
                                <p className="text-xs font-bold tracking-widest opacity-20 uppercase">El resultado aparecerá aquí...</p>
                                <p className="text-[10px] font-mono mt-2 opacity-10">ESPERANDO SEÑAL</p>
                            </div>
                        ) : (
                            <div className="animate-fadeIn whitespace-pre-wrap h-full overflow-y-auto pr-2 custom-scrollbar">
                                {result}
                            </div>
                        )}

                        {/* Status dots visualization */}
                        <div className="absolute bottom-6 left-8 flex gap-1.5 opacity-20">
                            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-75"></div>
                            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
