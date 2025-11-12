// src/app/api/transcribe/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// URL del modelo Whisper en la API de Inferencia de Hugging Face
// Usamos v3 que es uno de los más recientes y potentes
const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3";

// Nombre de la variable de entorno para tu token de Hugging Face
const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;

export async function POST(request: Request) {
  const { filePath } = await request.json();

  if (!filePath) {
    return NextResponse.json({ error: 'Falta la ruta del archivo en Supabase.' }, { status: 400 });
  }

  // Verificamos que el token esté configurado en el servidor
  if (!HUGGING_FACE_TOKEN) {
    console.error('La variable de entorno HUGGING_FACE_TOKEN no está configurada.');
    return NextResponse.json({ error: 'El servicio de transcripción no está configurado.' }, { status: 500 });
  }

  try {
    // 1. Descargar el archivo de Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseServer.storage
      .from('audio-bucket') // Asegúrate de que 'audio-bucket' es el nombre correcto
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error al descargar de Supabase:', downloadError);
      return NextResponse.json({ error: 'No se pudo descargar el archivo de Storage.' }, { status: 500 });
    }

    // 2. Enviar el audio a la API de Hugging Face para transcribir
    const response = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        // Aquí es donde se usa tu token de Hugging Face
        Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
      },
      body: fileData, // El cuerpo de la solicitud es el archivo de audio
    });

    // Leemos la respuesta como texto para poder inspeccionarla en cualquier caso.
    const responseBody = await response.text();

    if (!response.ok) {
      console.error('Error de la API de Hugging Face:', responseBody);
      // Intentamos interpretar el cuerpo como JSON para un mensaje de error más claro
      try {
        const errorJson = JSON.parse(responseBody);
        return NextResponse.json({ error: errorJson.error || 'Error desconocido de Hugging Face.' }, { status: response.status });
      } catch (e) {
        // Si no es JSON, es probablemente HTML. Devolvemos un fragmento.
        return NextResponse.json({ error: `La API devolvió una respuesta inesperada (no-JSON).` }, { status: response.status });
      }
    }

    // Si la respuesta es OK (2xx), esperamos que sea JSON.
    const result = JSON.parse(responseBody);

    // 3. Eliminar el archivo de Supabase después de la transcripción
    await supabaseServer.storage.from('audio-bucket').remove([filePath]);
    console.log(`Archivo temporal ${filePath} eliminado de Supabase.`);

    // 4. Devolver la transcripción
    return NextResponse.json({
      message: 'Transcripción completada.',
      transcription: result.text, // El texto transcrito está en la propiedad 'text'
    });

  } catch (error) {
    console.error('Error general de transcripción:', error);
    return NextResponse.json({
      error: `Fallo en la transcripción: ${(error as Error).message}`
    }, { status: 500 });
  }
}