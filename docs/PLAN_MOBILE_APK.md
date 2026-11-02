# 📱 Plan de Portabilidad a Android (.APK) y Distribución

## 1. Análisis de Compatibilidad Técnica

### ¿Es compatible el proyecto actual para generar un .APK?
**Sí, 100% compatible mediante Arquitectura Híbrida (Capacitor / Android WebView Shell).**

### Diagnóstico del Stack Actual
| Componente | Stack Actual | Compatibilidad Android | Notas Técnicas |
|---|---|---|---|
| **Frontend** | React 19 + Next.js 16 (App Router) |  Alta | El motor Chromium de Android WebView soporta React 19 y Turbopack sin incidencias. |
| **Estilos** | TailwindCSS + Lucide Icons |  100% | Totalmente responsive; ya adaptado a pantallas táctiles y móviles. |
| **Audio Hardware** | `navigator.mediaDevices.getUserMedia` |  Compatible | Requiere declarar `RECORD_AUDIO` en `AndroidManifest.xml` y permisos de WebView. |
| **Audio Analysis** | Web Audio API (`AudioContext`, `AnalyserNode`) |  Compatible | Funciona nativamente en Android WebView para cálculo de decibelios (dB) en vivo. |
| **Grabación** | `MediaRecorder` API |  Compatible | Genera audio `audio/webm;codecs=opus` o `audio/mp4`, ambos aceptados por Groq Whisper. |
| **Backend & IA** | Next.js API Routes (`/api/chat`, `/api/transcribe`) | ⚠️ Requiere Servidor | Las rutas ejecutan Node.js y llaman a Groq/Supabase. Por tanto, el APK debe apuntar al backend desplegado (Vercel) para no perder la IA. |

---

## 2. Estrategia de Arquitectura Recomendada: Capacitor Shell

Para aplicaciones Next.js con Server Actions y API Routes (`/api/chat`, `/api/transcribe`), la mejor práctica industrial es **Capacitor Remote Shell**:

```
+-------------------------------------------------------------+
|                     Dispositivo Android                     |
|                                                             |
|   +-----------------------------------------------------+   |
|   |         Aplicación Nativa Android (.APK)            |   |
|   |                                                     |   |
|   |  +-----------------------------------------------+  |   |
|   |  | Capacitor Runtime (Android Native Layer)      |  |   |
|   |  | - Permisos de Micrófono (RECORD_AUDIO)        |  |   |
|   |  | - Splash Screen nativo                        |  |   |
|   |  | - WebView de Alto Rendimiento (Chromium)      |  |   |
|   |  |                                               |  |   |
|   |  |   Carga: https://app-detector-de-voz.vercel...|  |   |
|   |  +-----------------------------------------------+  |   |
|   +--------------------------+--------------------------+   |
+------------------------------|------------------------------+
                               | HTTPS / WebSockets
                               v
+-------------------------------------------------------------+
|                 Nube (Vercel + Supabase)                    |
|  - API Routes: /api/chat (Groq Llama 3.3 WebMCP)            |
|  - API Routes: /api/transcribe (Groq Whisper Turbo)         |
|  - Base de Datos: Supabase PostgreSQL (voice_logs)          |
|  - Storage: Bucket 'apks' para descarga directa del instalador|
+-------------------------------------------------------------+
```

### Ventajas de este Enfoque:
1. **Actualizaciones Instantáneas (Over-The-Air)**: Cada cambio subido a GitHub y desplegado en Vercel se refleja de inmediato en los teléfonos de los usuarios sin obligarlos a reinstalar el APK.
2. **Cero Geobloqueo**: Las peticiones de IA pasan por Vercel (servidores en EE.UU.), permitiendo que usuarios en cualquier país (incluyendo Venezuela) usen la transcripción sin VPN.
3. **Hardware Directo**: Acceso total al micrófono y a la pantalla completa (Full Screen sin barra de navegador).
4. **Peso Mínimo del APK**: Menos de 4 MB.

---

## 3. Estrategia de Distribución vía Supabase Storage

### Arquitectura de Descargas
```
[ Developer / CI/CD ]
         │
         ▼ Compila .apk (Release / Debug)
[ app-detector-de-voz.apk ]
         │
         ▼ Sube a Supabase Storage Bucket
[ Supabase Bucket: 'apks' (Public) ]
         │
         ▼ URL Pública CDN Directa
https://<project-ref>.supabase.co/storage/v1/object/public/apks/app-detector-de-voz.apk
         │
         ▼
[ Botón en Web: "📱 Descargar App Android (.APK)" ]
         │
         ▼
[ Usuario Móvil: Descarga e Instalación Directa ]
```

### Pasos para Configurar en Supabase:
1. En el panel de Supabase: **Storage** -> **New Bucket**.
2. Nombre: `apks` (marcar como **Public bucket**).
3. Subir el archivo `app-detector-de-voz.apk`.
4. El enlace permanente tendrá la estructura:
   `https://[TU_PROYECTO].supabase.co/storage/v1/object/public/apks/app-detector-de-voz.apk`

---

## 4. Fases de Ejecución Paso a Paso

### Fase 1: Inicialización de Capacitor en el Proyecto
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Detector de Voz" "com.appdetectordevoz.app" --web-dir public
```

### Fase 2: Configuración de `capacitor.config.ts`
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appdetectordevoz.app',
  appName: 'Detector de Voz',
  webDir: 'public',
  server: {
    // Apunta al despliegue productivo para ejecutar Server Actions y WebMCP
    url: 'https://app-detector-de-voz.vercel.app',
    cleartext: false
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
```

### Fase 3: Adición de la Plataforma Android y Permisos
```bash
npx cap add android
```
En `android/app/src/main/AndroidManifest.xml`, agregar permisos indispensables para audio:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### Fase 4: Compilación del Instalador `.APK`
```bash
cd android
./gradlew assembleDebug
# El APK generado queda en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Fase 5: Integración del Botón de Descarga en el Frontend
Crear componente `src/components/DownloadAppButton.tsx` en la barra superior o pie de página:
* Detecta si el visitante está en Android.
* Ofrece descarga directa del `.apk` alojado en Supabase.
* Muestra guía emergente de instalación ("Permitir fuentes desconocidas").
