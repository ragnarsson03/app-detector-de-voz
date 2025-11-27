'use client';

import Transcription from '@/components/Transcription';

// El componente Page por defecto que se muestra en la raíz (/)
export default function Home() {
    return (
        // EDITADO: Quitamos items-center y justify-center del main para que el contenido fluya
        // a lo largo del ancho de la pantalla y el max-w-screen-lg se centre automáticamente
        // si la pantalla es más grande (aunque para nuestro propósito, el padding de los lados
        // es el que da el margen).
        <main className="flex min-h-screen w-full flex-col p-4 sm:p-6 md:p-10 bg-gradient-to-br from-gray-900 via-gray-950 to-black">
            {/* Contenedor INTERNO: 
            - Centramos este bloque internamente si el ancho de la pantalla excede 'lg' (1024px).
            - Usamos 'mx-auto' para centrar la caja de 'max-w-screen-lg'.
            */}
            <div className="w-full max-w-screen-lg flex flex-col gap-12 mx-auto">
                <h1
                    className="text-5xl sm:text-6xl font-extrabold text-center animate-fadeIn text-glow"
                    style={{ opacity: 0 }}
                >
                    Detector de Voz a Texto
                </h1>
                
                {/* El componente Transcription ahora puede usar el 100% del max-w-screen-lg */}
                <Transcription />
            </div>
        </main>
    );
}