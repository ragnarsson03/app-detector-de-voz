// src/app/api/upload-file/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// POST handler para recibir el archivo
export async function POST(request: Request) {
  // 1. Validar la solicitud
  if (!request.body) {
    return NextResponse.json({ error: 'No se encontró el cuerpo de la solicitud (archivo).' }, { status: 400 });
  }

  // 2. Leer el formulario multipart (que contiene el archivo)
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No se encontró el archivo de voz.' }, { status: 400 });
  }

  const fileExtension = file.name.split('.').pop();
  // Crea un nombre único para el archivo en el bucket
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

  try {
    // Convierte el archivo a ArrayBuffer para subirlo
    const fileBody = await file.arrayBuffer();

    // 3. Subir a Supabase Storage
    const { data, error } = await supabaseServer.storage
      .from('audio-bucket') // Asegúrate de que este bucket exista y tenga permisos de escritura
      .upload(uniqueFileName, fileBody, { // Pasamos el ArrayBuffer directamente
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Error de Supabase:', error);
      return NextResponse.json({ error: 'Error al subir a Storage.' }, { status: 500 });
    }

    // 4. Devolver la ubicación del archivo
    return NextResponse.json({
      message: 'Archivo subido con éxito.',
      filePath: data.path, // Esto será importante para el paso de transcripción
    });
    
  } catch (error) {
    console.error('Error general del servidor:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}