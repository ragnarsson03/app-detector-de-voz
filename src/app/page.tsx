'use client';

import Transcription from '@/components/Transcription';

export default function Home() {
    return (
        <main className="flex min-h-screen w-full flex-col p-6 md:p-12 lg:p-24 bg-[#0b0b0b]">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-16">

                {/* Header Sutil y Elegante */}
                <header className="flex flex-col items-center gap-4 animate-fadeIn">
                    <h1
                        className="text-4xl sm:text-5xl font-bold text-center tracking-tight text-gradient-minimal"
                    >
                        Detector de Voz a Texto
                    </h1>
                    <p className="text-neutral-500 text-sm font-medium tracking-wide uppercase">
                        Transcripción Inteligente de Audio
                    </p>
                </header>

                <Transcription />
            </div>
        </main>
    );
}