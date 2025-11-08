// src/app/page.tsx

import Uploader from '@/components/Uploader';

// El componente Page por defecto que se muestra en la raíz (/)
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <h1 className="text-4xl font-extrabold mb-10 text-gray-900">
        Detector de Voz a Texto
      </h1>
      
      {/* Componente Uploader creado en el Paso 2 */}
      <Uploader />
    </main>
  );
}