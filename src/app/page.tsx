'use client';

import Transcription from '@/components/Transcription';
import VoiceyChat from '@/components/Chat/VoiceyChat';
import WebMCPRegistration from '@/components/Chat/WebMCPRegistration';

export default function Home() {
    return (
        <main className="flex min-h-screen w-full flex-col p-0 bg-[#000000]">
            <Transcription />
            <VoiceyChat />
            <WebMCPRegistration />
        </main>
    );
}