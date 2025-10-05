# 🔐 DEBUG: Error 401 en `/api/reservas/ai-parse`

## Problema
El endpoint está retornando `401 No autorizado` cuando se llama desde `AIReservationModal`.

## Diagnóstico Aplicado

### 1. ✅ Agregado `credentials: 'include'`
- **Archivo:** `AIReservationModal.tsx`
- **Líneas modificadas:** 137 y 72
- **Propósito:** Enviar cookies de sesión con las peticiones

```typescript
const response = await fetch("/api/reservas/ai-parse", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: 'include', // ✅ AGREGADO
  body: JSON.stringify({ text: inputText }),
});
```

### 2. ✅ Agregado Logging Detallado
- **Archivo:** `src/app/api/reservas/ai-parse/route.ts`
- **Líneas:** 15-22
- **Propósito:** Ver qué está recibiendo el servidor

```typescript
console.log('🔐 [AI-PARSE] Session:', {
  hasSession: !!session,
  hasUser: !!session?.user,
  userEmail: session?.user?.email,
  hasBusinessId: !!session?.user?.businessId,
  businessId: session?.user?.businessId
});
```

### 3. ✅ Corregido Warning de Accesibilidad
- **Archivo:** `AIReservationModal.tsx`
- **Cambio:** `<p>` → `<DialogDescription>`
- **Import agregado:** `DialogDescription` desde `./ui/dialog`

## Próximos Pasos de Debugging

### Paso 1: Verificar en la consola del servidor
Al hacer click en "Analizar con IA", deberías ver en la terminal:

```
🔐 [AI-PARSE] Session: {
  hasSession: true/false,
  hasUser: true/false,
  userEmail: "...",
  hasBusinessId: true/false,
  businessId: "..."
}
```

**Si ves `hasSession: false`:**
- La sesión no se está enviando correctamente
- Verificar cookies en DevTools → Application → Cookies
- Buscar: `next-auth.session-token` o `__Secure-next-auth.session-token`

**Si ves `hasBusinessId: false`:**
- La sesión existe pero no tiene businessId
- Verificar que el usuario tenga un businessId en la base de datos
- Revisar el callback de session en `auth.config.ts`

### Paso 2: Comparar con un endpoint que funciona
El endpoint `/api/reservas/stats` usa la misma autenticación:

```bash
# En DevTools Console:
fetch('/api/reservas/stats', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

Si este funciona pero `/api/reservas/ai-parse` no, hay algo específico en la ruta.

### Paso 3: Verificar variables de entorno
Verificar que estas variables estén configuradas:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-aqui
```

### Paso 4: Verificar que el usuario esté logueado
En DevTools Console:

```javascript
fetch('/api/auth/session', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

Debería retornar un objeto con `user.businessId`.

## Posibles Causas del 401

1. **Sesión expirada** → Re-login necesario
2. **Cookies bloqueadas** → Verificar configuración del navegador
3. **Usuario sin businessId** → Verificar en la base de datos
4. **CORS issues** → Verificar dominio
5. **NextAuth mal configurado** → Verificar `NEXTAUTH_SECRET`

## Solución Temporal (Si persiste)

Eliminar validación de sesión temporalmente para testing:

```typescript
// SOLO PARA DEBUG - REMOVER DESPUÉS
export async function POST(request: Request) {
  try {
    // COMENTAR TEMPORALMENTE
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.businessId) {
    //   return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    // }
    
    // HARDCODEAR businessId para testing
    const session = { user: { businessId: 'TU_BUSINESS_ID_AQUI' } };
    
    // ... resto del código
```

**⚠️ IMPORTANTE:** Esto es SOLO para identificar si el problema es la sesión. NUNCA dejar esto en producción.

## Estado Actual

- ✅ Fetch incluye credentials
- ✅ Logging agregado para debugging
- ✅ Warning de accesibilidad corregido
- ⏳ Esperando logs del servidor para diagnosticar

## Siguiente Acción

**Probar el modal de nuevo** y revisar:
1. Consola del navegador (errores frontend)
2. Terminal del servidor (logs de sesión)
3. DevTools → Network → ai-parse (headers, cookies)

Comparte los logs que aparezcan en la terminal cuando hagas click en "Analizar con IA".
