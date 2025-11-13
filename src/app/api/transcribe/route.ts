// src/app/api/transcribe/route.ts
import { NextResponse } from "next/server";
import { Client } from "@gradio/client";

// Si tienes MOCK_TRANSCRIPTION=1, simulamos para pruebas locales
const MOCK_TRANSCRIPTION = process.env.MOCK_TRANSCRIPTION === "1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicUrl } = body;

    if (!publicUrl) {
      return NextResponse.json(
        { error: "La URL pública del audio es requerida." },
        { status: 400 }
      );
    }

    if (MOCK_TRANSCRIPTION) {
      console.log("🧪 MOCK activado: simulando transcripción");
      return NextResponse.json({
        transcription: "Simulación de texto transcrito desde MOCK.",
      });
    }

    console.log("🎧 Descargando audio desde:", publicUrl);

    // 1️⃣ Descargar el archivo de audio desde Supabase o URL pública
    const audioResponse = await fetch(publicUrl);
    if (!audioResponse.ok) {
      throw new Error(`No se pudo descargar el audio: ${audioResponse.statusText}`);
    }

    const audioArrayBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioArrayBuffer], { type: "audio/wav" });

    // 2️⃣ Conectarse al Space de Hugging Face
    const spaceId = "xxNikoXx/whisper-asr";
    const client = await Client.connect(spaceId, {
      hf_token: process.env.HUGGING_FACE_TOKEN, // opcional si el Space es público
    } as any);

    console.log("✅ Conectado al Space:", spaceId);

    // 3️⃣ Enviar el audio a la API de Whisper
    const result: any = await client.predict("/predict", { audio: audioBlob });

    console.log("🧾 Resultado crudo:", result);

    // 4️⃣ Extraer el texto transcrito
    const transcription = result?.data?.[0] || "No se obtuvo texto de la API.";

    // 5️⃣ Devolver el texto
    return NextResponse.json({ transcription });
  } catch (error: any) {
    console.error("Error durante la transcripción:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}