// src/app/api/transcribe/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
export async function POST(request: Request) {
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

    const formData = new FormData();
    formData.append('file', new Blob([audioArrayBuffer]));

    const response = await fetch('https://huggingface.co/spaces/openai/whisper-large-v3/api/predict', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error de la API de Hugging Face:', response.status, errorText);
        return NextResponse.json({
            error: 'Fallo la llamada a la API de transcripción de Hugging Face.',
            details: errorText
        }, { status: response.status });
    }

    const result = await response.json();
    console.log('Transcripción recibida de Hugging Face:', result);


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
      // La estructura de la respuesta de la API de predict puede variar.
      // A menudo, para los espacios de Gradio, el resultado está en un array `data`.
      // Si la salida es un solo campo de texto, estará en `result.data[0]`.
      transcription: result.data && Array.isArray(result.data) && result.data.length > 0
        ? result.data[0]
        : 'No se pudo extraer la transcripción del resultado.',
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