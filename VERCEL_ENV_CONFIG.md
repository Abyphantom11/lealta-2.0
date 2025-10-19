# Configuración de Variables de Entorno en Vercel

## 🚀 Variables Requeridas para Producción

Para que los links de compartir QR usen **https://lealta.app** correctamente, debes configurar estas variables en el panel de Vercel:

### 1. Ir a tu proyecto en Vercel
- Abre: https://vercel.com/dashboard
- Selecciona el proyecto: `lealta-2.0` (o como se llame)

### 2. Configurar Variables de Entorno
- Ve a: **Settings** → **Environment Variables**
- Agrega las siguientes variables para **Production**:

```
NEXT_PUBLIC_APP_URL=https://lealta.app
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:YiGpWDsLrMBp@ep-floral-morning-a47ojau-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:YiGpWDsLrMBp@ep-floral-morning-a47ojau.us-east-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_URL=https://lealta.app
NEXTAUTH_SECRET=your-secret-key-here
AUTH_SECRET=your-auth-secret-here
```

### 3. Variables Opcionales (según tu configuración)
```
# Si usas Upstash Redis
UPSTASH_REDIS_REST_URL=your-url
UPSTASH_REDIS_REST_TOKEN=your-token

# Si usas Google Gemini
GOOGLE_GEMINI_API_KEY=your-key

# Si usas Resend para emails
RESEND_API_KEY=your-key
RESEND_FROM_EMAIL=hello@lealta.app

# Si usas Sentry
SENTRY_DSN=your-dsn
NEXT_PUBLIC_SENTRY_DSN=your-dsn
```

### 4. Re-desplegar
Después de agregar las variables:
- Ve a la pestaña **Deployments**
- Haz clic en el último deployment
- Selecciona: **... → Redeploy**
- Marca: ✅ **Use existing Build Cache**

## ✅ Verificación

Después del re-deploy, los links de compartir deberían verse así:
```
https://lealta.app/share/qr/abc123xyz
```

En lugar de:
```
https://lealta-dcqv19rpv-themaster2648-9501s-projects.vercel.app/share/qr/abc123xyz
```

## 🔒 Seguridad

- ❌ NO compartas este archivo en repositorios públicos
- ✅ Las variables en Vercel están encriptadas y seguras
- ✅ El archivo `.env.local` ya está en `.gitignore`

## 📝 Notas

- `NEXT_PUBLIC_*` variables son accesibles en el cliente
- Variables sin `NEXT_PUBLIC_` solo están en el servidor
- Cambios en variables requieren re-deploy para aplicarse
