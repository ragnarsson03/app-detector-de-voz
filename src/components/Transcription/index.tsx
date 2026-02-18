'use client';
import React, { useState, useEffect } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useFileUploader } from '@/hooks/useFileUploader';
import { MethodSelector } from './MethodSelector';
import { AudioInputArea } from './AudioInputArea';
import { TranscriptionResult } from './TranscriptionResult';
import { StatusBanner } from './StatusBanner';
import clsx from 'clsx';

export default function TranscriptionManager() {
    const [method, setMethod] = useState<'upload' | 'record'>('upload');
    const [result, setResult] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Hooks
    const {
        isRecording,
        audioBlob,
        startRecording,
        stopRecording,
        transcribeAudio,
        isProcessing: isRecordingProcessing,
        message: recorderMessage,
        progress: recorderProgress,
        transcriptionTime: recorderTime
    } = useAudioRecorder();

    const {
        uploadFile,
        isProcessing: isUploadProcessing,
        statusMessage: uploaderMessage,
        progress: uploaderProgress,
        transcriptionResult: uploaderResult,
        transcriptionTime: uploaderTime,
        cancelUpload,
        elapsedTime
    } = useFileUploader();

    const isProcessing = isRecordingProcessing || isUploadProcessing;
    const statusMessage = method === 'record' ? recorderMessage : uploaderMessage;
    const progress = method === 'record' ? recorderProgress : uploaderProgress;
    const activeTime = method === 'record' ? recorderTime : uploaderTime;

    // Sincronizar resultados de los hooks con el estado local
    useEffect(() => {
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

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 font-sans selection:bg-cyan-500/30">
            <header className="text-center mb-16 animate-fadeIn relative z-10">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-cyan-500 drop-shadow-[0_0_35px_rgba(34,211,238,0.5)] font-['Orbitron']"
                    style={{ textShadow: '0 0 40px rgba(6,182,212,0.4), 0 0 10px rgba(6,182,212,0.8)' }}>
                    DETECTOR DE VOZ A TEXTO
                </h1>
                <div className="inline-block px-6 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-2 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                    <p className="text-cyan-400 text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                        &lt; SISTEMA EN DESARROLLO / ALPHA &gt;
                    </p>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-24 bg-cyan-500/10 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
            </header>

            <div className="bg-[#050505] border border-zinc-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[550px] relative overflow-hidden">
                <div className="absolute top-10 left-0 w-1 h-12 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]"></div>

                {/* Columna Izquierda: Entrada */}
                <div className="w-full md:w-2/5 p-6 md:p-10 border-b md:border-b-0 md:border-r border-zinc-900 bg-[#050505] flex flex-col justify-between relative">
                    <div className="flex items-center gap-3 mb-6 md:mb-10 pl-4">
                        <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                        <h2 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Entrada de Audio</h2>
                    </div>

                    <div className="space-y-6 md:space-y-10 flex flex-col">
                        <MethodSelector method={method} setMethod={setMethod} disabled={isProcessing} />

                        <AudioInputArea
                            method={method}
                            selectedFile={selectedFile}
                            isRecording={isRecording}
                            onFileSelect={handleFileSelect}
                            onToggleRecord={handleToggleRecord}
                        />

                        <div className="pt-4 md:pt-6 space-y-6">
                            <button
                                onClick={handleTranscribe}
                                disabled={isProcessing || (method === 'upload' && !selectedFile) || (method === 'record' && (!audioBlob && !isRecording))}
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

                            <StatusBanner
                                isProcessing={isProcessing}
                                statusMessage={statusMessage}
                                progress={progress}
                                elapsedTime={method === 'upload' ? elapsedTime : 0}
                                onCancel={method === 'upload' ? cancelUpload : undefined}
                            />
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Salida */}
                <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col bg-[#050505] relative">
                    <TranscriptionResult
                        result={result}
                        transcriptionTime={activeTime}
                        onCopy={handleCopy}
                    />
                </div>
            </div>
        </div>
    );
}
