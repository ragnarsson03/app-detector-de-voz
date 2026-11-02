import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appdetectordevoz.app',
  appName: 'Detector de Voz',
  webDir: 'public',
  server: {
    // Apunta al despliegue de producción en Vercel para ejecutar Server Actions,
    // WebMCP, Supabase y Groq Whisper sin geobloqueo
    url: 'https://app-detector-de-voz.vercel.app',
    cleartext: false
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
