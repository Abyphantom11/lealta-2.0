# 🚨 Solución a FUNCTION_INVOCATION_TIMEOUT en Vercel

## Problema
Las funciones serverless están alcanzando el timeout de 10 segundos en Vercel.

## Causas Comunes
1. ❌ Conexión lenta a PostgreSQL (Neon)
2. ❌ No usar Connection Pooling
3. ❌ Queries lentas sin optimizar
4. ❌ Cold starts muy largos

## ✅ Solución Inmediata

### 1. Usar Connection Pooling de Neon

En tu dashboard de Neon (https://console.neon.tech):

1. Ve a tu proyecto
2. Ve a "Connection Details"
3. Copia la **Pooled Connection String** (no la Connection String normal)
4. Debe tener este formato:
   ```
   postgresql://user:pass@ep-xxx.pooler.us-east-1.aws.neon.tech/db?sslmode=require&pgbouncer=true
   ```

### 2. Actualizar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Actualiza `DATABASE_URL` con la **Pooled Connection String**
4. Agrega también (si no las tienes):
   ```
   DIRECT_URL=tu-connection-string-directa-de-neon
   DATABASE_URL=tu-pooled-connection-string-de-neon
   ```

### 3. Actualizar `schema.prisma`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled connection
  directUrl = env("DIRECT_URL")        // Direct connection para migraciones
}
```

### 4. Redeploy

Después de actualizar las variables:
```bash
git add .
git commit -m "fix: Optimizar conexiones de BD para Vercel"
git push
```

## 🔧 Optimizaciones Adicionales Aplicadas

### 1. `vercel.json`
- ✅ Configuración de timeout a 10s
- ✅ Headers de cache optimizados
- ✅ Región óptima (iad1 - US East)

### 2. `prisma.ts`
- ✅ Desconexión automática en Vercel
- ✅ Logs solo de errores en producción

### 3. Connection Limits en Prisma
```typescript
// Agregar esto a tu prisma.ts si el problema persiste
new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Límites de conexión para Vercel
  connection_limit: 1,
  pool_timeout: 5,
})
```

## 📊 Verificación

1. Después del deploy, verifica en Vercel Dashboard:
   - Functions → Execution logs
   - Debe mostrar tiempos < 5s

2. Si sigue lento, verifica en Neon Dashboard:
   - Monitoring → Connections
   - No debe haber más de 5-10 conexiones activas

## 🆘 Si El Problema Persiste

### Opción 1: Usar Edge Runtime (más rápido)
Agregar a tus API routes más lentas:
```typescript
export const runtime = 'edge';
```

### Opción 2: Incrementar Plan de Vercel
El plan Pro permite:
- Timeout de hasta 60s
- Más regiones disponibles
- Mayor memoria

### Opción 3: Cachear Queries
Usar React Query o SWR con stale-while-revalidate

### Opción 4: Implementar API Route con Timeout Manual
```typescript
export async function GET(request: NextRequest) {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 8000)
  );
  
  try {
    const result = await Promise.race([
      prisma.reservation.findMany(...),
      timeoutPromise
    ]);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Request timeout' }, 
      { status: 504 }
    );
  }
}
```

## 🎯 Checklist de Acción

- [ ] Obtener Pooled Connection String de Neon
- [ ] Actualizar DATABASE_URL en Vercel
- [ ] Agregar DIRECT_URL en Vercel
- [ ] Actualizar schema.prisma con directUrl
- [ ] Hacer redeploy
- [ ] Verificar logs en Vercel Dashboard
- [ ] Verificar conexiones en Neon Dashboard

## 📞 Recursos

- Neon Connection Pooling: https://neon.tech/docs/connect/connection-pooling
- Vercel Timeout Limits: https://vercel.com/docs/functions/serverless-functions/runtimes#timeout
- Prisma Connection Pool: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
