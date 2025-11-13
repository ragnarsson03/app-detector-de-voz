// src/app/api/transcribe/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const secretKey = process.env.APP_SECRET_KEY;
    const hfSpaceUrl = process.env.HF_SPACE_URL; // p.ej. https://xxnikoxx-whisper-asr.hf.space/api/predict/
    const hfToken = process.env.HF_TOKEN;

    // Seguridad básica: validar clave del frontend
    if (!authHeader || authHeader.substring(7) !== secretKey) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { filePath } = await request.json();
    if (!filePath)
      return NextResponse.json({ error: 'Falta la ruta del archivo.' }, { status: 400 });

    // Descargar el archivo desde Supabase
    const { data: fileData, error } = await supabaseServer.storage
      .from('audio-bucket')
      .download(filePath);

    if (error || !fileData)
      return NextResponse.json({ error: 'Error al descargar archivo.' }, { status: 500 });

    // Preparar el archivo para enviar al Space de Hugging Face
    const formData = new FormData();
    formData.append('file', fileData);

    // Llamar al Space (tu endpoint público)
    const response = await fetch(hfSpaceUrl!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error Hugging Face:', errText);
      return NextResponse.json(
        { error: 'Fallo en el proceso de transcripción.', details: errText },
        { status: 500 }
      );
    }

    const result = await response.json();

    // El formato de salida depende del Space, pero casi siempre tiene un campo 'data'
    const transcription =
      result?.data?.[0]?.text ||
      result?.data?.[0] ||
      result?.text ||
      JSON.stringify(result);

    return NextResponse.json({
      message: 'Transcripción completada.',
      transcription,
    });
  } catch (err) {
    console.error('Error general en /transcribe:', err);
    return NextResponse.json(
      { error: 'Error interno en el servidor.', details: String(err) },
      { status: 500 }
    );
  }
}
