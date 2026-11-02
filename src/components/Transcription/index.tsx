'use client';

import React, { useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useFileUploader } from '@/hooks/useFileUploader';
import { MethodSelector } from './MethodSelector';
import { AudioInputArea } from './AudioInputArea';
import { TranscriptionControls } from './TranscriptionControls';
import { TranscriptionDisplay } from './TranscriptionDisplay';
import { DownloadAppButton } from '@/components/DownloadAppButton';

export default function TranscriptionManager() {
    // --- ESTADOS LOCALES ---
    const [method, setMethod] = useState<'upload' | 'record'>('record');
    const [result, setResult] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploadBusy, setIsUploadBusy] = useState(false);

    /**
     * Centraliza el resultado de la transcripción
     */
    const finalizeTranscription = (text: string) => {
        setResult(text);
        setIsUploadBusy(false);
    };

    // --- HOOK DE GRABACIÓN SIMPLIFICADO ---
    const {
        isRecording,
        isProcessing: isRecorderProcessing,
        startRecording,
        stopAndTranscribe,
        message: recorderMessage,
        progress: recorderProgress,
        volume: recorderVolume,
        transcriptionTime: recorderTime
    } = useAudioRecorder({
        onAutoTranscribed: (text) => {
            finalizeTranscription(text);
        }
    });

    // --- HOOK DE SUBIDA DE ARCHIVO ---
    const {
        uploadFile,
        statusMessage: uploaderMessage,
        progress: uploaderProgress,
        transcriptionTime: uploaderTime,
        cancelUpload,
        elapsedTime
    } = useFileUploader();

    // --- DERIVACIONES ---
    const isSystemBusy = isUploadBusy || isRecorderProcessing;
    const progress = method === 'record' ? recorderProgress : uploaderProgress;
    const statusMessage = method === 'record' ? recorderMessage : uploaderMessage;
    const activeTime = method === 'record' ? recorderTime : uploaderTime;

    // --- ACCIONES ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
            setResult("");
        }
    };

    /**
     * Alterna la grabación: Iniciar o Detener y Enviar
     */
    const handleToggleRecord = async () => {
        if (isRecording) {
            // Usuario decide cuándo terminar y enviar
            await stopAndTranscribe();
        } else {
            setResult("");
            await startRecording();
        }
    };

    /**
     * Procesa archivo en modo 'upload'
     */
    const handleUploadTranscribe = async () => {
        if (isSystemBusy || !selectedFile) return;
        setIsUploadBusy(true);
        setResult("");

        try {
            const text = await uploadFile(selectedFile);
            finalizeTranscription(text || "");
        } catch (error) {
            console.error('[Frontend] Error al subir archivo:', error);
            setIsUploadBusy(false);
        }
    };

    const handleCopy = () => {
        if (result) navigator.clipboard.writeText(result);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 font-sans selection:bg-cyan-500/30">
            {/* Cabecera Principal */}
            <header className="text-center mb-16 animate-fadeIn relative z-10">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-cyan-500 drop-shadow-[0_0_35px_rgba(34,211,238,0.5)] font-['Orbitron']"
                    style={{ textShadow: '0 0 40px rgba(6,182,212,0.4), 0 0 10px rgba(6,182,212,0.8)' }}>
                    DETECTOR DE VOZ A TEXTO
                </h1>
                <div className="inline-block px-6 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-4 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                    <p className="text-cyan-400 text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                        &lt; SISTEMA EN DESARROLLO / ALPHA &gt;
                    </p>
                </div>
                <div className="mt-2 mb-2">
                    <DownloadAppButton />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-cyan-500/10 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
            </header>

            {/* Contenedor Principal */}
            <div className="bg-[#050505] border border-zinc-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[550px] relative overflow-hidden">
                <div className="absolute top-10 left-0 w-1 h-12 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]"></div>

                {/* Columna Izquierda: Entrada y Controles */}
                <div className="w-full md:w-2/5 p-6 md:p-10 border-b md:border-b-0 md:border-r border-zinc-900 bg-[#050505] flex flex-col justify-between relative">
                    <div className="flex items-center gap-3 mb-6 md:mb-10 pl-4">
                        <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                        <h2 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Entrada de Audio</h2>
                    </div>

                    <div className="space-y-6 md:space-y-10 flex flex-col">
                        <MethodSelector method={method} setMethod={setMethod} disabled={isSystemBusy} />

                        <AudioInputArea
                            method={method}
                            selectedFile={selectedFile}
                            isRecording={isRecording}
                            volume={recorderVolume}
                            onFileSelect={handleFileSelect}
                            onToggleRecord={handleToggleRecord}
                        />

                        {/* Panel de Controles Simplificado */}
                        <div className="pt-4 md:pt-6">
                            <TranscriptionControls
                                method={method}
                                isSystemBusy={isSystemBusy}
                                isRecording={isRecording}
                                selectedFile={selectedFile}
                                statusMessage={statusMessage}
                                progress={progress}
                                hasResult={!!result}
                                elapsedTime={elapsedTime}
                                onUploadTranscribe={handleUploadTranscribe}
                                onToggleRecord={handleToggleRecord}
                                onCancelUpload={cancelUpload}
                            />
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Resultado */}
                <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col bg-[#050505] relative">
                    <TranscriptionDisplay
                        text={result}
                        transcriptionTime={activeTime}
                        onCopy={handleCopy}
                    />
                </div>
            </div>
        </div>
    );
}
