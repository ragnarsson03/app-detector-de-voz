// src/lib/supabase-storage.ts

import { supabaseServer } from '@/lib/supabase-server';

/**
 * Sube un archivo a un bucket de Supabase Storage.
 *
 * @param fileBuffer - El archivo como un Buffer.
 * @param fileType - El tipo MIME del archivo (ej. 'audio/mpeg').
 * @param bucketName - El nombre del bucket en Supabase.
 * @returns La URL pública del archivo subido.
 * @throws Si ocurre un error durante la subida o al obtener la URL pública.
 */
export async function uploadFileToStorage(
  fileBuffer: Buffer,
  fileType: string,
  bucketName: string = 'audio-bucket' 
): Promise<string> {
  
  // 1. Generar un nombre de archivo único
  const fileExtension = fileType.split('/')[1] || 'tmp';
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

  // 2. Subir el archivo al bucket de Supabase
  const { data, error: uploadError } = await supabaseServer.storage
    .from(bucketName)
    .upload(uniqueFileName, fileBuffer, {
      contentType: fileType,
      upsert: false,
    });

  if (uploadError) {
    console.error('Error al subir a Supabase Storage:', uploadError);
    throw new Error('Error al subir el archivo a Supabase Storage.');
  }

  // 3. Obtener la URL pública del archivo subido
  const { data: publicUrlData } = supabaseServer.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  if (!publicUrlData.publicUrl) {
    console.error('Error: No se pudo obtener la URL pública. Asegúrate de que el bucket es público.');
    throw new Error('No se pudo obtener la URL pública del archivo.');
  }

  console.log('Archivo subido con éxito. URL pública:', publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
}