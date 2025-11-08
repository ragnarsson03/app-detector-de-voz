// src/app/api/transcribe/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server'; 
import OpenAI from 'openai';

// -----------------------------------------------------
// 1. LÓGICA DE MOCKING (SIMULACIÓN)
// -----------------------------------------------------
const IS_MOCKING_MODE = process.env.MOCK_TRANSCRIPTION === '1';

// Solo inicializamos el cliente de OpenAI si NO estamos en modo de simulación
const openai = IS_MOCKING_MODE ? null : new OpenAI(); 
// -----------------------------------------------------


export async function POST(request: Request) {
  const { filePath } = await request.json(); 

  if (!filePath) {
    return NextResponse.json({ error: 'Falta la ruta del archivo en Supabase.' }, { status: 400 });
  }

  try {
    // -----------------------------------------------------
    // Lógica de SIMULACIÓN
    // -----------------------------------------------------
    if (IS_MOCKING_MODE) {
      // Simular que el procesamiento toma 3 segundos
      await new Promise(resolve => setTimeout(resolve, 3000)); 
      
      // Simular la eliminación del archivo (porque fue "procesado")
      await supabaseServer.storage.from('audio-bucket').remove([filePath]);
      console.log(`[MOCK] Archivo temporal ${filePath} eliminado de Supabase.`);

      // Devolver una respuesta simulada
      return NextResponse.json({ 
        message: 'Transcripción simulada completada.',
        transcription: 'Hola, esta es una transcripción de prueba exitosa generada en modo de desarrollo. Todo funciona correctamente en tu frontend y backend de Supabase.'
      });
    }
    // -----------------------------------------------------
    
    // --- LÓGICA REAL (Si MOCK_TRANSCRIPTION=0) ---
    
    // 1. Descargar el archivo de Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseServer.storage
      .from('audio-bucket')
      .download(filePath); 

    if (downloadError || !fileData) {
      console.error('Error al descargar de Supabase:', downloadError);
      return NextResponse.json({ error: 'No se pudo descargar el archivo de Storage.' }, { status: 500 });
    }

    // 2. Transcribir usando la API de OpenAI (Whisper)
    const audioFile = new File([fileData], 'transcription_audio', { type: fileData.type });
    // Aseguramos que openai no es null ya que IS_MOCKING_MODE es falso aquí
    const transcription: string = await openai!.audio.transcriptions.create({ 
      file: audioFile,
      model: "whisper-1",
      language: "es", 
      response_format: "text",
    });

    // 3. Eliminar el archivo
    await supabaseServer.storage.from('audio-bucket').remove([filePath]);
    console.log(`Archivo temporal ${filePath} eliminado de Supabase.`);

    // 4. Devolver la transcripción
    return NextResponse.json({ 
      message: 'Transcripción completada.',
      transcription: transcription
    });

  } catch (error) {
    console.error('Error general de transcripción:', error);
    return NextResponse.json({ 
      error: `Fallo en la transcripción: ${(error as Error).message}` 
    }, { status: 500 });
  }
}