'use client';

import Transcription from '@/components/Transcription';

// El componente Page por defecto que se muestra en la raíz (/)
export default function Home() {
    return (
        // El contenedor principal (main) asegura la altura mínima de la pantalla (min-h-screen)
        // y centra su contenido (items-center, justify-center).
        <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-10 bg-gray-900">
            <h1
                className="text-4xl font-extrabold mb-8 text-white text-center animate-fadeIn"
                style={{ opacity: 0 }}
            >
                Detector de Voz a Texto
            </h1>

            {/* Contenedor principal de la aplicación. max-w-6xl limita el ancho en escritorios. */}
            {/* Como el padre (main) tiene justify-center y items-center, este div está centrado. */}
            <div className="w-full max-w-6xl flex-grow flex items-start justify-center">
                <Transcription />
            </div>
        </main>
    );
}