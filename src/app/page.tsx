// src/app/page.tsx
'use client';

import Transcription from '@/components/Transcription';

// El componente Page por defecto que se muestra en la raíz (/)
export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-10 lg:p-24 bg-gray-900">
            <h1
                className="text-4xl font-extrabold mb-8 text-white text-center animate-fadeIn"
                style={{ opacity: 0 }}
            >
                Detector de Voz a Texto
            </h1>

            {/* Componente principal de la aplicación */}
            <Transcription />
        </main>
    );
}