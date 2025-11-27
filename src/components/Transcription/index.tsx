// src/components/Transcription/index.tsx
'use client';

import Uploader from '@/components/Uploader';
import Recorder from '@/components/Recorder';

const Transcription = () => {
    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl">
            {/* Contenedor para Uploader */}
            <div
                className="flex-1 bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 transition-transform duration-300 hover:scale-[1.02] animate-fadeIn"
                style={{ animationDelay: '200ms', opacity: 0 }}
            >
                <Uploader />
            </div>
            
            {/* Contenedor para Recorder */}
            <div
                className="flex-1 bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 transition-transform duration-300 hover:scale-[1.02] animate-fadeIn"
                style={{ animationDelay: '400ms', opacity: 0 }}
            >
                <Recorder />
            </div>
        </div>
    );
};

export default Transcription;