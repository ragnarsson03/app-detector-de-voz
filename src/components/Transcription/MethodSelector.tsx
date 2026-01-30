import React from 'react';

interface MethodSelectorProps {
    method: 'upload' | 'record';
    setMethod: (method: 'upload' | 'record') => void;
    disabled?: boolean;
}

export const MethodSelector: React.FC<MethodSelectorProps> = ({ method, setMethod, disabled }) => {
    return (
        <div className="flex gap-1 bg-black/60 p-1.5 rounded-xl border border-zinc-900/80">
            <button
                onClick={() => setMethod('upload')}
                disabled={disabled}
                className={`flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${method === 'upload' ? 'bg-[#1a1a1a] text-white shadow-inner border border-zinc-700' : 'text-zinc-600 hover:text-zinc-400 disabled:opacity-50'}`}
            >
                Cargar Archivo
            </button>
            <button
                onClick={() => setMethod('record')}
                disabled={disabled}
                className={`flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${method === 'record' ? 'bg-[#1a1a1a] text-white shadow-inner border border-zinc-700' : 'text-zinc-600 hover:text-zinc-400 disabled:opacity-50'}`}
            >
                Grabar Voz
            </button>
        </div>
    );
};
