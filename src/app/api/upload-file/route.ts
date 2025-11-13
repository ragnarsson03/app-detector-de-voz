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
    // Convierte el archivo a Buffer para subirlo
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 3. Subir a Supabase Storage
    const { data, error } = await supabaseServer.storage
      .from('audio-bucket') // Cambia 'audio-bucket' por el nombre de tu bucket en Supabase
      .upload(uniqueFileName, fileBuffer, {
        contentType: file.type,
        upsert: false, // No sobreescribir si ya existe
      });

    if (error) {
      console.error('Error al subir a Supabase Storage:', error);
      return NextResponse.json({ error: 'Error al subir a Storage.' }, { status: 500 });
    }

    console.log('Archivo subido con éxito a Supabase. Path:', data.path);

    // 4. Obtener la URL pública del archivo subido
    const { data: publicUrlData } = supabaseServer.storage
      .from('audio-bucket')
      .getPublicUrl(data.path);

    if (!publicUrlData.publicUrl) {
      console.error('Error: No se pudo obtener la URL pública. ¿El bucket "audio-bucket" es público?');
      return NextResponse.json({ error: 'No se pudo obtener la URL pública.' }, { status: 500 });
    }
    
    console.log('URL pública obtenida:', publicUrlData.publicUrl);

    // 5. Devolver la URL pública
    return NextResponse.json({
      message: 'Archivo subido con éxito.',
      publicUrl: publicUrlData.publicUrl,
    });
    
  } catch (error) {
    console.error('Error general del servidor:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}