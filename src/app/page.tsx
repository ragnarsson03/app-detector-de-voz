'use client';

import Transcription from '@/components/Transcription';

// El componente Page por defecto que se muestra en la raíz (/)
export default function Home() {
    return (
        // El contenedor principal (main) asegura la altura mínima de la pantalla (min-h-screen)
        // y centra su contenido (items-center, justify-center).
        <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-900 via-gray-950 to-black">
            <div className="w-full max-w-screen-lg flex flex-col items-center justify-center gap-12">
                <h1
                    className="text-5xl sm:text-6xl font-extrabold text-center animate-fadeIn text-glow"
                    style={{ opacity: 0 }}
                >
                    Detector de Voz a Texto
                </h1>
                
                <Transcription />
            </div>
        </main>
    );
}