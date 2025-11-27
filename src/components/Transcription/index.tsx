'use client';

import Uploader from '@/components/Uploader';
import Recorder from '@/components/Recorder';

const Transcription = () => {
    return (
        // w-full asegura que ocupe el ancho disponible del contenedor max-w-6xl
        // items-start para que el contenido de las tarjetas se alinee arriba dentro de ellas (por si crecen)
        <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full">
            
            {/* Contenedor para Uploader: Asegura que el Uploader ocupe todo el espacio de su tarjeta */}
            <div
                className="flex flex-col flex-1 bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 transition-transform duration-300 hover:scale-[1.02] animate-fadeIn"
                style={{ animationDelay: '200ms', opacity: 0 }}
            >
                <Uploader />
            </div>

            {/* Contenedor para Recorder: Asegura que el Recorder ocupe todo el espacio de su tarjeta */}
            <div
                className="flex flex-col flex-1 bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 transition-transform duration-300 hover:scale-[1.02] animate-fadeIn"
                style={{ animationDelay: '400ms', opacity: 0 }}
            >
                <Recorder />
            </div>
        </div>
    );
};

export default Transcription;