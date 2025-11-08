// src/app/api/transcribe/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server'; 
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

// Inicializa el cliente de OpenAI. Busca OPENAI_API_KEY en .env.local automáticamente.
// IMPORTANTE: Asegúrate de que esta librería esté instalada: npm install openai
const openai = new OpenAI();

export async function POST(request: Request) {
  const { filePath } = await request.json(); // Recibimos la ruta del archivo en Supabase

  if (!filePath) {
    return NextResponse.json({ error: 'Falta la ruta del archivo en Supabase.' }, { status: 400 });
  }

  try {
    // 1. Descargar el archivo de Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseServer.storage
      .from('audio-bucket')
      .download(filePath); 

    if (downloadError || !fileData) {
      console.error('Error al descargar de Supabase:', downloadError);
      return NextResponse.json({ error: 'No se pudo descargar el archivo de Storage. Revise la ruta o permisos.' }, { status: 500 });
    }

    // 2. Transcribir usando la API de OpenAI (Whisper)
    
    // La API de OpenAI necesita el archivo como un objeto File.
    // Creamos un objeto File a partir del Blob descargado. Usamos un nombre de archivo genérico.
    // Convertimos el Blob a un objeto File-like que el SDK de OpenAI pueda entender en Node.js
    const audioFile = await toFile(fileData, 'audio.mp3', { type: fileData.type });

    // Cuando response_format: "text", la respuesta (transcription) es directamente un string.
    const transcription: string = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "es", // Especificamos el idioma español
      response_format: "text",
    });

    // 3. Eliminar el archivo de Supabase (Opcional pero recomendado para limpiar)
    // No queremos guardar archivos de audio indefinidamente a menos que sea necesario.
    await supabaseServer.storage.from('audio-bucket').remove([filePath]);
    console.log(`Archivo temporal ${filePath} eliminado de Supabase.`);


    // 4. Devolver la transcripción
    return NextResponse.json({ 
      message: 'Transcripción completada.',
      // CORRECCIÓN: Usamos 'transcription' directamente ya que es un string
      transcription: transcription 
    });

  } catch (error) {
    console.error('Error durante la transcripción con OpenAI:', error);
    // Este error a menudo indica una clave API inválida o expirada.
    return NextResponse.json({ 
      error: `Fallo en la transcripción: ${(error as Error).message}. Asegúrese de que su OPENAI_API_KEY es válida.` 
    }, { status: 500 });
  }
}