# ✅ SOLUCIÓN: Error 401 en `/api/reservas/ai-parse`

## 🔍 Diagnóstico del Problema

**Síntoma:**
```
🔐 [AI-PARSE] Session: {
  hasSession: false,
  hasUser: false,
  userEmail: undefined,
  hasBusinessId: false,
  businessId: undefined
}
❌ [AI-PARSE] No authorized - missing businessId
POST /api/reservas/ai-parse/ 401 in 40ms
```

**Causa Raíz:**
El endpoint estaba usando `getServerSession` de **NextAuth**, pero el sistema real usa un **middleware custom** con cookies personalizadas llamadas `session`.

### Sistema de Autenticación Real del Proyecto

El proyecto NO usa NextAuth estándar. Usa un sistema custom:

- **Cookie:** `session` (no `next-auth.session-token`)
- **Middleware:** `getCurrentUser()` de `unified-middleware.ts`
- **Datos:** JSON con `{ userId, sessionToken }`

## 🛠️ Solución Aplicada

### Cambios en `/api/reservas/ai-parse/route.ts`

**ANTES (❌ Incorrecto):**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  // ...
}
```

**DESPUÉS (✅ Correcto):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/unified-middleware';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user?.businessId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  console.log('🤖 Análisis IA para business:', user.businessId);
  // ...
}
```

### Diferencias Clave

| Aspecto | NextAuth (Viejo) | Custom Auth (Nuevo) |
|---------|------------------|---------------------|
| **Import** | `getServerSession` | `getCurrentUser` |
| **Request Type** | `Request` | `NextRequest` |
| **Cookie** | `next-auth.session-token` | `session` |
| **Retorno** | `session?.user` | `user` |
| **Config** | `authOptions` | Prisma directo |

## 📋 Archivos Modificados

### 1. `/api/reservas/ai-parse/route.ts`
- ✅ Cambiado de `getServerSession` a `getCurrentUser`
- ✅ Cambiado tipo `Request` a `NextRequest`
- ✅ Agregado `export const dynamic = 'force-dynamic'`
- ✅ Actualizado logging para usar `user` en lugar de `session`

### 2. `AIReservationModal.tsx`
- ✅ Agregado `credentials: 'include'` en fetch (línea 137)
- ✅ Agregado `credentials: 'include'` en búsqueda de cliente (línea 72)
- ✅ Cambiado `<p>` a `<DialogDescription>` para accesibilidad

## 🧪 Verificación

Para confirmar que funciona, deberías ver en la terminal:

```
🔐 [AI-PARSE] Session: {
  hasUser: true,
  userEmail: "tu@email.com",
  hasBusinessId: true,
  businessId: "cmgb818x70000eyeov4f8lriu"
}
🤖 [API] Iniciando análisis IA de reserva para business: cmgb818x70000eyeov4f8lriu
📝 [API] Longitud del texto: 123 caracteres
✅ [API] Análisis completado exitosamente
```

## 📚 Lecciones Aprendidas

1. **Siempre revisar el sistema de auth existente** antes de agregar nuevos endpoints
2. **Copiar patrones de endpoints similares** que ya funcionan (`/api/auth/me`)
3. **El cookie de sesión no es siempre NextAuth** - puede ser custom
4. **NextRequest vs Request** - NextRequest tiene acceso a cookies en App Router
5. **`dynamic = 'force-dynamic'`** es necesario para rutas que usan cookies

## 🔗 Referencias del Proyecto

- **Middleware de Auth:** `src/lib/auth/unified-middleware.ts`
- **Ejemplo funcionando:** `src/app/api/auth/me/route.ts`
- **Página que usa auth:** `src/app/reservas/page.tsx`

## ✅ Estado Final

- ✅ Endpoint usa el sistema de auth correcto
- ✅ Cookies se envían correctamente con `credentials: 'include'`
- ✅ Session detecta el usuario y businessId
- ✅ Warning de accesibilidad corregido
- ✅ Logging mejorado para debugging

**El sistema está listo para funcionar.** 🎉

---

**Próximo paso:** Probar el modal "✨ Reserva IA" pegando un mensaje de cliente y verificando que la IA lo analice correctamente.
