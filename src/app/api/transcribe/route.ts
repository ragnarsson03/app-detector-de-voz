import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Send the file to Groq Whisper
        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3-turbo", // Versión turbo para extrema velocidad (solicitado por el usuario)
            prompt: "Especificar que es lenguaje natural en español si es necesario",
            response_format: "json",
            language: "es", // Fuerzo español para evitar saltos al inglés
        });

        return NextResponse.json({ text: transcription.text });
    } catch (error) {
        console.error('Error transcibiendo con Groq:', error);
        return NextResponse.json(
            { error: 'Error processing audio via Groq' },
            { status: 500 }
        );
    }
}
