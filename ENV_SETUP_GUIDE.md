# 📋 Guía de Configuración de Variables de Entorno

## 🔧 Archivos de Entorno Disponibles

### 📝 Templates (incluidos en el repositorio)
- `.env.example` - Configuración básica de ejemplo
- `.env.production.template` - Template para producción
- `.env.postgres.template` - Template para PostgreSQL
- `.env.optimization.template` - Template para optimizaciones de performance
- `.env.free-hosting.template` - Template para hosting gratuito

### 🚫 Archivos Locales (NO incluidos en Git)
- `.env` - Configuración local principal
- `.env.local` - Variables locales específicas
- `.env.production` - Variables de producción
- `.env.optimization` - Variables de optimización (con credenciales reales)
- `.env.free-hosting` - Variables para hosting gratuito (con credenciales reales)

## 🚀 Configuración Inicial

### 1. Desarrollo Local
```bash
# Copia el archivo base
cp .env.example .env

# Edita las variables según tu configuración
code .env
```

### 2. Optimización de Performance
```bash
# Copia el template
cp .env.optimization.template .env.optimization

# Configura tus credenciales de Sentry y otras APIs
code .env.optimization
```

### 3. Hosting Gratuito
```bash
# Copia el template
cp .env.free-hosting.template .env.free-hosting

# Configura para Vercel/Netlify free tier
code .env.free-hosting
```

## 🔒 Seguridad

### ✅ Lo que SÍ se incluye en Git
- Templates de configuración
- Valores de ejemplo
- Documentación de variables

### ❌ Lo que NO se incluye en Git
- Credenciales reales (API keys, DSNs, etc.)
- Configuraciones específicas del entorno
- Variables con información sensible

## 🎯 Variables Críticas

### Sentry (Monitoring)
```env
SENTRY_ORG=tu_organizacion
SENTRY_PROJECT=tu_proyecto
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### Vercel (Analytics)
```env
VERCEL_ANALYTICS_ID=...
VERCEL_SPEED_INSIGHTS_ID=...
```

### Base de Datos
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
```

## 📊 Testing

Para verificar que tus variables están configuradas correctamente:

```bash
# Ejecutar validador de entorno
npm run env:validate

# Build de producción
npm run build:prod
```

---

*Mantén tus archivos `.env` locales actualizados y nunca los incluyas en el repositorio.*
