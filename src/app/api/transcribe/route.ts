// src/app/api/transcribe/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { HfInference } from '@huggingface/inference';

// Inicializa el cliente de Hugging Face con tu token
const hfToken = process.env.HF_TOKEN;
let hf: HfInference | null = null;

if (hfToken) {
  hf = new HfInference(hfToken);
} else {
  console.error('La variable de entorno HF_TOKEN no está configurada. El servicio de transcripción estará deshabilitado.');
}

export async function POST(request: Request) {
  // 1. Validar la configuración del servicio
  if (!hf) {
    console.error('Intento de usar la API de transcripción sin HF_TOKEN configurado.');
    return NextResponse.json({ error: 'El servicio de transcripción no está configurado.' }, { status: 500 });
  }

  const { filePath } = await request.json();

  if (!filePath) {
    return NextResponse.json({ error: 'Falta la ruta del archivo en Supabase.' }, { status: 400 });
  }

  try {
    // 2. Descargar el archivo de Supabase Storage
    console.log(`Descargando archivo: ${filePath}`);
    const { data: fileData, error: downloadError } = await supabaseServer.storage
      .from('audio-bucket')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error al descargar de Supabase:', downloadError);
      return NextResponse.json({ error: 'No se pudo descargar el archivo de Storage.', details: downloadError?.message }, { status: 500 });
    }
    console.log('Archivo descargado de Supabase con éxito.');

    // 3. Enviar el audio a la API de Hugging Face para transcribir
    const audioArrayBuffer = await fileData.arrayBuffer(); // Convertir Blob a ArrayBuffer
    console.log('Enviando archivo a Hugging Face para transcripción...');
    let result;
    try {
      result = await hf.automaticSpeechRecognition({
        model: 'facebook/wav2vec2-base-960h', // Modelo Whisper en español 
        data: audioArrayBuffer, // Usar el ArrayBuffer
      });
    } catch (inferenceError) {
        const fullErrorDetails = JSON.stringify(inferenceError, Object.getOwnPropertyNames(inferenceError));
        console.error('Error detallado de Hugging Face:', fullErrorDetails);
        return NextResponse.json({
            error: 'Fallo la inferencia del modelo de transcripción.',
            details: fullErrorDetails // Devolvemos el error completo para debug
        }, { status: 500 });
    }
    
    console.log('Transcripción recibida de Hugging Face.');

    // 4. Eliminar el archivo de Supabase después de la transcripción
    console.log(`Eliminando archivo temporal: ${filePath}`);
    const { error: deleteError } = await supabaseServer.storage.from('audio-bucket').remove([filePath]);
    if (deleteError) {
        // No es un error fatal, pero es bueno saberlo.
        console.warn(`No se pudo eliminar el archivo temporal ${filePath} de Supabase:`, deleteError);
    } else {
        console.log(`Archivo temporal ${filePath} eliminado de Supabase.`);
    }

    // 5. Devolver la transcripción
    return NextResponse.json({
      message: 'Transcripción completada.',
      transcription: result.text,
    });

  } catch (error) {
    console.error('Error general en el proceso de transcripción:', error);
    const errorMessage = (error instanceof Error) ? error.message : 'Error interno del servidor.';
    return NextResponse.json({
      error: 'Fallo en el proceso de transcripción.',
      details: errorMessage
    }, { status: 500 });
  }
}