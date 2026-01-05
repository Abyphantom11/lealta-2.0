# 🔒 Pantalla de Bloqueo Temporal - Módulo Reservas

## ¿Qué es esto?

Una "cortina" temporal para bloquear el acceso al módulo de reservas mientras realizas modificaciones.

## 📍 Archivos Involucrados

1. **`src/app/reservas/config/bloqueo.ts`** - Configuración del bloqueo
2. **`src/app/reservas/components/PantallaBloqueo.tsx`** - Componente visual
3. **`src/app/reservas/page.tsx`** - Página principal (modificada)

## 🔧 Cómo Usar

### ✅ Para ACTIVAR el bloqueo:

Abre `src/app/reservas/config/bloqueo.ts` y asegúrate que esté:

```typescript
export const RESERVAS_BLOQUEADO = true;
```

### ❌ Para DESACTIVAR el bloqueo:

Abre `src/app/reservas/config/bloqueo.ts` y cambia a:

```typescript
export const RESERVAS_BLOQUEADO = false;
```

### 🎨 Personalizar Mensajes:

En `src/app/reservas/config/bloqueo.ts`:

```typescript
export const MENSAJE_BLOQUEO = "Tu mensaje aquí";
export const SUBMENSAJE_BLOQUEO = "Tu submensaje aquí";
```

## 📝 Pasos Completos

1. Edita `src/app/reservas/config/bloqueo.ts`
2. Cambia `RESERVAS_BLOQUEADO` a `true` o `false`
3. Guarda el archivo
4. Haz commit: `git commit -am "feat: Activar/Desactivar bloqueo reservas"`
5. Haz push: `git push origin main`
6. Vercel desplegará automáticamente

## ⚠️ Importante

- El bloqueo es **solo visual** - no afecta la base de datos
- Los usuarios verán un mensaje amigable
- Es fácil de activar/desactivar con un solo cambio
- Perfecto para mantenimiento temporal

## 🎯 Estado Actual

**ACTIVO** ✅ - El módulo está bloqueado
