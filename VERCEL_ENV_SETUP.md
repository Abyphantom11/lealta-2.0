# 🚀 CONFIGURACIÓN DE VERCEL - VARIABLES DE ENTORNO

## Variables REQUERIDAS para Producción

Copia estas variables en el dashboard de Vercel (Project Settings > Environment Variables):

### 🗄️ Base de Datos
DATABASE_URL=postgresql://neondb_owner:npg_XcL6eWBCMz9b@ep-floral-morning-ad47ojau-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

### 🔐 Autenticación
NEXTAUTH_SECRET=3nULI9Ywt+8ALxxA9zvL6JJIRHImT6ALSMlhUN8wbDs=
AUTH_SECRET=icVrI5x7M6RgbdmwIw87rQsAd7Dju5tS8uJOIXoSV1c=
NEXTAUTH_URL=https://lealta.app

### 🚦 Rate Limiting
UPSTASH_REDIS_REST_URL=https://renewed-moose-7795.upstash.io
UPSTASH_REDIS_REST_TOKEN=AR5zAAImcDJiNmY3ZGY5ZDYyZDQ0ZTZlYTYyMDlkNWNiMWNjYWE0ZXAyNzc5NQ

### 📊 Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://279dffa541feca85b97b3d15fa4ec6f4@o4509716657405953.ingest.us.sentry.io/4510057803546624

### 🔑 Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=00a9ab43-4d1d-4fe3-9134-55418101affe
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_1rvpjpcsq64cx09a1sh31q648sstfk0rbfjzqzfkc9y28
STACK_SECRET_SERVER_KEY=ssk_xwtda9tpyqg4vtws199m68c8k3gvym17bh05j91w19drg

### 🌐 App Config
NEXT_PUBLIC_APP_NAME=Lealta
NEXT_PUBLIC_APP_URL=https://lealta.app

### 🤖 Google Gemini AI (CRÍTICO)
GOOGLE_GEMINI_API_KEY=AIzaSyAkSmHtoNHHNAwukPwtJEL5pQ0U7IzAM7k

### 🔧 Otros
OCR_PROVIDER=local
RESEND_FROM_EMAIL=hello@lealta.app
RESEND_NO_REPLY_EMAIL=no-reply@lealta.app
RESEND_TRIALS_EMAIL=trials@lealta.app

## Variables OPCIONALES (Configura si las necesitas)

### 📧 Email (Para notificaciones)
# RESEND_API_KEY=tu-api-key-de-resend
# Obtener en: https://resend.com/api-keys

---

## 📝 INSTRUCCIONES PASO A PASO

### Para Vercel Dashboard:

1. **Ve a tu proyecto en Vercel**
2. **Settings** > **Environment Variables**
3. **Copia TODAS las variables de arriba**
4. **IMPORTANTE**: Cambia `TU-URL-DE-VERCEL` por tu URL real

### Variables que se auto-configuran:
- NODE_ENV (automático en Vercel)
- VERCEL_URL (automático en Vercel)

### Variables que debes cambiar:
- NEXTAUTH_URL → Tu URL de producción
- NEXT_PUBLIC_APP_URL → Tu URL de producción

---

## 🎯 TESTING

### Para probar en desarrollo:
npm run dev

### Para probar en producción:
.\deploy.ps1 staging

---

## 🆘 TROUBLESHOOTING

### Si algo no funciona:
1. Verificar que todas las variables estén en Vercel
2. Verificar que no haya espacios extra
3. Verificar que las URLs sean correctas
4. Revisar logs en Vercel dashboard
