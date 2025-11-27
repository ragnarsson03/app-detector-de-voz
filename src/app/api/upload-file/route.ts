// src/app/api/upload-file/route.ts

import { NextResponse } from 'next/server';
import { uploadFileToStorage } from '@/lib/supabase-storage';

/**
 * API route handler para subir un archivo.
 * Extrae el archivo de la solicitud, lo sube a Supabase Storage
 * usando un módulo de servicio, y devuelve la URL pública.
 */
export async function POST(request: Request) {
  try {
    // 1. Validar y obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No se encontró un archivo de audio válido.' }, { status: 400 });
    }

    // 2. Convertir el archivo a un Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 3. Subir el archivo usando el módulo de storage
    // La lógica de nombre de archivo, subida y obtención de URL está encapsulada.
    const publicUrl = await uploadFileToStorage(fileBuffer, file.type, 'audio-bucket');

    // 4. Devolver la URL pública en la respuesta
    return NextResponse.json({
      message: 'Archivo subido con éxito.',
      publicUrl: publicUrl,
    });

  } catch (error) {
    console.error('Error en el handler de subida:', error);
    
    // Devuelve un mensaje de error más específico si es posible
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
    
    return NextResponse.json({ error: `Error interno del servidor: ${errorMessage}` }, { status: 500 });
  }
}