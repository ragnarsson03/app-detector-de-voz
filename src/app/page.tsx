// src/app/page.tsx
'use client';

import Uploader from '@/components/Uploader';
import Recorder from '@/components/Recorder';

// El componente Page por defecto que se muestra en la raíz (/)
export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-10 lg:p-24 bg-gray-900">
            <h1 className="text-4xl font-extrabold mb-8 text-white text-center">
                Detector de Voz a Texto
            </h1>

            {/* Contenedor Flex para Uploader y Recorder */}
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
                {/* Componente para subir archivos */}
                <div className="flex-1">
                    <Uploader />
                </div>
                
                {/* Componente para grabar con micrófono */}
                <div className="flex-1">
                    <Recorder />
                </div>
            </div>
        </main>
    );
}