# 🎯 Cambio Adicional: Landing Page → Login Directo

**Fecha**: 2 de enero de 2026  
**Descripción**: La página principal (`lealta.app`) ahora redirige DIRECTAMENTE a `/login` en lugar de mostrar el landing page.

---

## 📋 Cambio Realizado

### **`src/app/page.tsx`** ✅

**Antes**:
```typescript
// Verificaba si había sesión activa
// Si estaba logueado → redirigía a /reservas
// Si NO estaba logueado → mostraba landing page
useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        const businessSlug = userData.user.business?.slug || userData.user.business?.subdomain;
        
        if (businessSlug) {
          router.push(`/${businessSlug}/reservas`);
        }
      }
    } catch {
      // Mostraba landing page
    }
  };
  checkAuth();
}, [router]);
```

**Ahora**:
```typescript
// 🎯 REDIRIGIR SIEMPRE A LOGIN
// Si está logueado → /reservas (maneja login/page.tsx)
// Si NO está logueado → /login (formulario de inicio de sesión)
useEffect(() => {
  console.log('🔄 Redirigiendo desde landing page a /login...');
  router.push('/login');
}, [router]);
```

---

## 🔄 Flujo Completo

### Escenario 1: Usuario NO logueado
```
1. Usuario abre lealta.app (/)
2. Redirección inmediata → /login
3. Ve formulario de inicio de sesión
4. Ingresa credenciales
5. Login exitoso → /[businessSlug]/reservas
```

### Escenario 2: Usuario YA logueado
```
1. Usuario abre lealta.app (/)
2. Redirección inmediata → /login
3. /login detecta sesión activa (auto-login)
4. Redirección automática → /[businessSlug]/reservas
5. Usuario ve el módulo de reservas
```

---

## ⚡ Resultado

| Ruta | Comportamiento |
|------|----------------|
| `lealta.app` | → Redirige a `/login` |
| `/` | → Redirige a `/login` |
| `/login` (sin sesión) | Muestra formulario |
| `/login` (con sesión) | → Redirige a `/reservas` |
| `/[business]/reservas` | Módulo principal |

---

## 🚨 Impacto Importante

### Landing Page NO se Muestra
- ❌ El landing page público ya **NO es accesible**
- ❌ Visitantes nuevos van directo a login
- ⚠️ **Consideración SEO**: Si necesitas landing para marketing/captación:
  - Opción 1: Crear ruta `/marketing` o `/info` con landing
  - Opción 2: Usar dominio/subdomain separado para marketing
  - Opción 3: Agregar lógica condicional (ej: `?landing=true`)

### Ventajas
- ✅ Acceso más rápido para usuarios conocidos
- ✅ Aplicación enfocada en producto (SaaS puro)
- ✅ Sin distracción de marketing

### Desventajas
- ⚠️ Sin página de presentación pública
- ⚠️ SEO limitado (solo login visible)
- ⚠️ Nuevos prospectos necesitan invitación/registro directo

---

## 🔧 Si Necesitas Restaurar Landing Page

### Opción A: Revertir cambio
```typescript
// src/app/page.tsx
export default function HomePage() {
  const router = useRouter();

  // Auto-redirigir SOLO si está logueado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          const businessSlug = userData.user.business?.slug || userData.user.business?.subdomain;
          
          if (businessSlug) {
            router.push(`/${businessSlug}/reservas`);
          }
        }
      } catch {
        // Mostrar landing page
      }
    };
    checkAuth();
  }, [router]);

  return (
    // ... contenido del landing page ...
  );
}
```

### Opción B: Landing condicional
```typescript
// src/app/page.tsx
export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showLanding = searchParams?.get('view') === 'landing';

  useEffect(() => {
    if (showLanding) return; // Mostrar landing si ?view=landing
    
    console.log('🔄 Redirigiendo a /login...');
    router.push('/login');
  }, [router, showLanding]);

  if (showLanding) {
    return (/* Landing page */);
  }

  return null;
}
```

Uso: `lealta.app?view=landing` → Muestra landing

---

## ✅ Validación

### Prueba el flujo completo:

1. **Abre lealta.app en incógnito**
   - ✅ Debe redirigir inmediatamente a `/login`
   - ❌ NO debe ver landing page

2. **Cierra todas las cookies**
   ```
   DevTools → Application → Cookies → Clear all
   ```

3. **Abre lealta.app**
   - ✅ Redirige a `/login`
   - ✅ Muestra formulario de inicio de sesión

4. **Inicia sesión**
   - ✅ Redirige a `/[business]/reservas`

5. **Abre lealta.app de nuevo (con sesión activa)**
   - ✅ Pasa por `/login` (imperceptible)
   - ✅ Termina en `/reservas`

---

**✅ Cambio implementado exitosamente**
