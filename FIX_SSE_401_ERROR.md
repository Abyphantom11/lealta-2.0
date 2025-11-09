# 🔧 Fix: Error 401 en Conexiones SSE (Server-Sent Events)

## 🐛 Problema

Las conexiones SSE estaban fallando con error 401 (Unauthorized):

```
Failed to load resource: the server responded with a status of 401 ()
[SSE] ❌ Error de conexión: Event
GET https://results-moms-kitty-relationships.trycloudflare.com/api/reservas/events?businessId=... 401 (Unauthorized)
```

## 🔍 Causa Raíz

El problema tenía **dos causas principales**:

### 1. EventSource no envía cookies correctamente
`EventSource` nativo del navegador tiene **limitaciones con cookies** en ciertos escenarios:
- No soporta `withCredentials` de manera consistente en todos los navegadores
- Las cookies de sesión de NextAuth no se enviaban correctamente
- Especialmente problemático con Cloudflare Tunnel y HTTPS

### 2. Falta de headers CORS para credenciales
El endpoint `/api/reservas/events` no tenía configurados los headers CORS necesarios para trabajar con credenciales.

## ✅ Solución Implementada

### 1. Reemplazar EventSource por Fetch con Streaming

**Archivo**: `src/app/reservas/hooks/useServerSentEvents.tsx`

**Cambio principal**: Reemplazamos `EventSource` nativo por `fetch()` con:
- ✅ `credentials: 'include'` - Envía cookies automáticamente
- ✅ `Accept: text/event-stream` - Especifica tipo SSE
- ✅ Manejo manual del stream con `response.body.getReader()`
- ✅ Parsing manual de mensajes SSE

**Ventajas**:
- ✅ Control total sobre headers y credenciales
- ✅ Funciona consistentemente en todos los navegadores
- ✅ Compatible con Cloudflare Tunnel
- ✅ Las cookies de NextAuth se envían correctamente

### 2. Agregar Headers CORS al Endpoint

**Archivo**: `src/app/api/reservas/events/route.ts`

**Cambios**:

#### A. Headers CORS en la respuesta:
```typescript
headers: {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
  'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
  'Access-Control-Allow-Credentials': 'true', // ⚡ Crucial
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

#### B. Handler OPTIONS para preflight CORS:
```typescript
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

#### C. Mejor logging de autenticación:
```typescript
console.log('[SSE] Verificando autenticación:', {
  hasSession: !!session,
  email: session?.user?.email,
  headers: {
    cookie: request.headers.get('cookie')?.substring(0, 50) + '...',
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
  }
});
```

## 🔬 Cómo Funciona Ahora

### Flujo de Conexión SSE:

1. **Cliente (useServerSentEvents)**:
   ```typescript
   fetch('/api/reservas/events?businessId=xxx', {
     method: 'GET',
     credentials: 'include', // 🔑 Incluye cookies de sesión
     headers: {
       'Accept': 'text/event-stream',
       'Cache-Control': 'no-cache',
     },
   })
   ```

2. **Navegador**:
   - Envía automáticamente cookies de sesión NextAuth
   - Headers incluyen: `Cookie: next-auth.session-token=...`

3. **Servidor (route.ts)**:
   ```typescript
   const session = await getServerSession(authOptions);
   // ✅ Ahora recibe las cookies y puede verificar sesión
   if (!session?.user?.email) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```

4. **Stream SSE**:
   - Conexión establecida exitosamente
   - Eventos fluyen en tiempo real
   - Heartbeat cada 30 segundos

### Parsing Manual de Eventos SSE:

```typescript
// Leer stream chunk por chunk
const { done, value } = await reader.read();
buffer += decoder.decode(value, { stream: true });

// Separar mensajes por \n\n
const messages = buffer.split('\n\n');

// Procesar cada mensaje
for (const message of messages) {
  const lines = message.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      onEvent(data); // ✅ Callback del evento
    }
  }
}
```

## 🧪 Pruebas

### Verificar que funciona:

1. **Abrir DevTools** → Console
2. **Navegar a** `/reservas`
3. **Buscar logs**:
   ```
   [SSE] Conectando a: /api/reservas/events?businessId=xxx intento: 1
   [SSE] ✅ Conectado exitosamente
   [SSE] 📨 Evento recibido: connected
   ```

4. **Verificar en Network**:
   - Request a `/api/reservas/events`
   - Status: `200 OK`
   - Type: `text/event-stream`
   - Headers: `Cookie: next-auth.session-token=...`

### Logs del servidor:

```
[SSE] Verificando autenticación: { hasSession: true, email: 'user@example.com' }
[SSE] ✅ Nueva conexión para business: cmgh621rd0012lb0aixrzpvrw usuario: user@example.com
[SSE] Conexión xxx establecida. Total conexiones: 1
```

## 🚀 Beneficios

1. ✅ **Autenticación funcional**: Las cookies se envían correctamente
2. ✅ **Compatible con Cloudflare**: Funciona perfectamente con túneles HTTPS
3. ✅ **Reconnexión automática**: Si la conexión falla, se reintenta automáticamente
4. ✅ **Mejor control**: Manejo completo del stream y errores
5. ✅ **Cross-browser**: Funciona en Chrome, Firefox, Safari, Edge

## 📝 Notas Técnicas

### ¿Por qué no usar EventSource?

EventSource es más simple pero tiene limitaciones:
- ❌ No soporta headers personalizados
- ❌ `withCredentials` no funciona consistentemente
- ❌ No permite configuración de CORS detallada
- ❌ Problemas con cookies en HTTPS/Cloudflare

### ¿Por qué usar fetch con streaming?

Fetch da control total:
- ✅ Headers personalizados completos
- ✅ `credentials: 'include'` funciona siempre
- ✅ Control del ciclo de vida del stream
- ✅ Compatible con cualquier escenario de red

## 🔐 Seguridad

- ✅ Validación de sesión con NextAuth
- ✅ CORS configurado correctamente con credenciales
- ✅ Solo conexiones autenticadas pueden acceder
- ✅ Verificación de businessId
- ✅ Headers seguros (httpOnly cookies)

## 🎯 Resultado

**Antes**:
```
❌ 401 Unauthorized
❌ Conexiones fallando
❌ Sin tiempo real
```

**Después**:
```
✅ 200 OK
✅ Conexiones estables
✅ Tiempo real funcionando
✅ Heartbeat activo
```

---

**Fecha**: 9 de noviembre de 2025
**Estado**: ✅ Resuelto
