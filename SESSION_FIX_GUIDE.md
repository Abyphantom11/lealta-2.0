# 🔐 Guía de Solución de Problemas de Sesión

## Cambios Realizados en `auth.config.ts`

### 1. **Duración de Sesión Extendida**
```typescript
session: { 
  maxAge: 30 * 24 * 60 * 60, // 30 días
  updateAge: 24 * 60 * 60,   // Actualizar cada 24 horas
}
```
- ✅ Las sesiones ahora duran **30 días** en lugar de la configuración por defecto (30 minutos)
- ✅ La sesión se actualiza automáticamente cada 24 horas mientras el usuario esté activo

### 2. **JWT Duradero**
```typescript
jwt: {
  maxAge: 30 * 24 * 60 * 60, // 30 días
}
```
- ✅ El JWT también dura 30 días, sincronizado con la sesión

### 3. **Cookies Optimizadas para Cloudflare Tunnel y Vercel**
```typescript
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token',
    options: {
      secure: true,           // ✅ HTTPS obligatorio
      httpOnly: true,         // ✅ Protección XSS
      sameSite: 'lax',        // ✅ Protección CSRF
      maxAge: 30 * 24 * 60 * 60,
      domain: undefined,      // ✅ Auto-detecta el dominio
    }
  }
}
```

## 🚀 Configuración Adicional Necesaria

### Variables de Entorno (.env)

Para **desarrollo con Cloudflare Tunnel**:
```bash
NEXTAUTH_URL="https://tu-tunnel.trycloudflare.com"
NEXTAUTH_SECRET="tu-secret-key-min-32-chars"
NODE_ENV="development"
```

Para **producción en Vercel**:
```bash
NEXTAUTH_URL="https://lealta.app"
NEXTAUTH_SECRET="tu-secret-key-de-produccion"
NEXTAUTH_COOKIE_DOMAIN=".lealta.app"  # Opcional: para subdominios
NODE_ENV="production"
```

### Variables en Vercel Dashboard

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `NEXTAUTH_URL` = `https://lealta.app`
   - `NEXTAUTH_SECRET` = tu secret key (la misma que usas)
   - `NEXTAUTH_COOKIE_DOMAIN` = `.lealta.app` (opcional)

## 🔍 Verificación

### 1. Verificar Cookies en el Navegador
1. Abre DevTools (F12)
2. Application → Cookies
3. Deberías ver:
   - `__Secure-next-auth.session-token` (desarrollo)
   - `next-auth.session-token` (producción)
   - Con `MaxAge` de ~2592000 segundos (30 días)

### 2. Verificar Sesión
```typescript
// En cualquier componente cliente
import { useSession } from 'next-auth/react';

export default function Component() {
  const { data: session, status } = useSession();
  
  console.log('Session status:', status);
  console.log('Session data:', session);
  
  return <div>Status: {status}</div>;
}
```

## 🐛 Troubleshooting

### Problema: Sesión se cierra en Cloudflare Tunnel
**Solución**: Asegúrate de que `NEXTAUTH_URL` usa HTTPS:
```bash
NEXTAUTH_URL="https://tu-tunnel.trycloudflare.com"
```

### Problema: Sesión se cierra en Vercel
**Solución**: 
1. Verifica que `NEXTAUTH_SECRET` sea el mismo en .env y Vercel
2. Verifica que `NEXTAUTH_URL` coincida exactamente con tu dominio

### Problema: "Invalid CSRF token"
**Solución**: Limpia las cookies del navegador y vuelve a iniciar sesión

### Problema: Cookies no persisten después de refresh
**Solución**: 
1. Verifica que `secure: true` esté configurado
2. Asegúrate de usar HTTPS (no HTTP)
3. En desarrollo, Cloudflare Tunnel proporciona HTTPS automáticamente

## 📝 Notas Importantes

1. **Seguridad**: Las cookies con `__Secure-` y `__Host-` prefijos son más seguras y requieren HTTPS
2. **SameSite**: `lax` permite cookies en navegación normal pero protege contra CSRF
3. **HttpOnly**: Las cookies no son accesibles desde JavaScript del cliente
4. **Domain**: No especificar `domain` permite que las cookies funcionen automáticamente en el dominio actual

## 🎯 Resultado Esperado

- ✅ Sesión dura 30 días
- ✅ No te deslogea al cambiar de página
- ✅ No te deslogea al cerrar el navegador
- ✅ Funciona en Cloudflare Tunnel (desarrollo)
- ✅ Funciona en Vercel (producción)
- ✅ Funciona en localhost con HTTPS

## 🔄 Reiniciar para Aplicar Cambios

```bash
# Detener el servidor
Ctrl + C

# Limpiar caché de Next.js
rm -rf .next

# Iniciar de nuevo
npm run dev
```

## 📞 Si el Problema Persiste

1. Borra todas las cookies del dominio en DevTools
2. Cierra sesión completamente
3. Reinicia el servidor
4. Inicia sesión nuevamente
5. Verifica que las cookies se crearon con `MaxAge` correcto
