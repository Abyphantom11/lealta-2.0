# ✅ FIX: Error "PADDLE_API_KEY faltante" en el cliente

**Fecha**: 7 de noviembre de 2025  
**Estado**: ✅ **RESUELTO**

---

## 🐛 Problema

El navegador (cliente) estaba mostrando un error crítico:

```
❌ Variable de entorno requerida faltante: PADDLE_API_KEY
Error: Missing required environment variable: PADDLE_API_KEY
```

### Causa raíz

El archivo `src/lib/paddle.ts` estaba **validando variables de entorno del servidor** (como `PADDLE_API_KEY` y `PADDLE_WEBHOOK_SECRET`) al momento de importarse, incluso cuando se importaba desde el cliente (navegador).

**Código problemático** (líneas 14-27):

```typescript
// ❌ PROBLEMA: Esto se ejecuta en el cliente también
const requiredEnvVars = {
  PADDLE_API_KEY: process.env.PADDLE_API_KEY,  // ❌ Variable del servidor
  PADDLE_CLIENT_TOKEN: process.env.PADDLE_CLIENT_TOKEN,  // ❌ Variable del servidor
  PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,  // ❌ Variable del servidor
  NEXT_PUBLIC_PADDLE_ENVIRONMENT: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
};

// ❌ Este código se ejecutaba en el cliente y lanzaba error
if (process.env.NODE_ENV === 'production') {
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      console.error(`❌ Variable de entorno requerida faltante: ${key}`);
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
}
```

### ¿Por qué fallaba?

1. **Variables del servidor NO están disponibles en el cliente**: Next.js solo expone variables que empiezan con `NEXT_PUBLIC_*` al navegador
2. **`PADDLE_API_KEY` es confidencial**: Es una clave secreta del servidor que NUNCA debe exponerse al cliente
3. **Validación prematura**: La validación ocurría al importar el módulo, incluso cuando no se usaba

---

## ✅ Solución implementada

### 1. Eliminada validación de variables del servidor en el módulo principal

Ahora el archivo `paddle.ts` **NO valida** variables del servidor al cargarse.

### 2. Implementado patrón "lazy loading" para `paddleClient`

El cliente de Paddle ahora se inicializa **solo cuando se usa** y **solo en el servidor**:

```typescript
// ✅ SOLUCIÓN: Validación lazy (solo cuando se usa)
let paddleClientInstance: Paddle | null = null;

function getPaddleClient(): Paddle {
  if (!paddleClientInstance) {
    // Solo validar en servidor cuando se intenta usar
    if (typeof window === 'undefined') {
      const apiKey = process.env.PADDLE_API_KEY;
      if (!apiKey) {
        throw new Error('PADDLE_API_KEY no está configurada. Configúrala en las variables de entorno.');
      }
      paddleClientInstance = new Paddle(apiKey, {
        environment: paddleEnvironment,
      });
    } else {
      throw new Error('paddleClient solo puede usarse en el servidor, no en el cliente');
    }
  }
  return paddleClientInstance;
}

// Export como getter para validación lazy
export const paddleClient = new Proxy({} as Paddle, {
  get: (target, prop) => {
    const client = getPaddleClient();
    return (client as any)[prop];
  }
});
```

**Ventajas**:
- ✅ No se ejecuta en el cliente
- ✅ Solo valida cuando realmente se usa `paddleClient`
- ✅ Error claro si se intenta usar desde el cliente
- ✅ Cero impacto en rendimiento

### 3. Validación mejorada para variables del cliente

Ahora solo valida variables públicas (`NEXT_PUBLIC_*`) y solo en el cliente:

```typescript
// ✅ CONFIGURACIÓN DEL CLIENTE (FRONTEND)
// Solo usa variables NEXT_PUBLIC_* que son seguras para el cliente
const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const clientEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';

// Validar solo en el cliente
if (typeof window !== 'undefined') {
  if (!clientToken) {
    console.warn('⚠️ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN no está configurada. El checkout de Paddle no funcionará.');
  }
  console.log('🏗️ Paddle configurado en modo:', clientEnvironment);
}

export const paddleConfig = {
  environment: clientEnvironment,
  token: clientToken || '',
  eventCallback: (data: any) => {
    console.log('🎯 Paddle Event:', data);
  },
};
```

### 4. Eliminada función deprecada `verifyWebhook`

Removida función que no se usaba y causaba warnings de linting.

---

## 📋 Archivos modificados

- ✅ `src/lib/paddle.ts` - Refactorizado completamente
  - Líneas 14-27: Eliminada validación prematura
  - Líneas 22-44: Implementado lazy loading de `paddleClient`
  - Líneas 50-64: Mejorada configuración del cliente
  - Líneas 159-164: Eliminada función deprecada

---

## 🔒 Seguridad mejorada

### Antes ❌
- Intentaba acceder a variables del servidor desde el cliente
- Validación prematura al cargar el módulo
- Código confuso con función deprecada

### Después ✅
- Separación clara: servidor vs cliente
- Variables del servidor solo en servidor
- Variables públicas solo en cliente
- Validación lazy (solo cuando se usa)
- Error explícito si se intenta usar `paddleClient` en el cliente

---

## 🧪 Verificación

```bash
# Build exitoso sin errores
npm run build
✅ Build completado exitosamente!

# Ya no aparece el error en el navegador
# ✅ Sin errores de PADDLE_API_KEY
# ✅ Sin warnings de variables faltantes
```

---

## 📝 Variables de entorno requeridas

### Servidor (API Routes)
```env
PADDLE_API_KEY=your_api_key_here
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here
```

### Cliente (Navegador)
```env
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_client_token_here
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  # o 'production'
```

---

## 💡 Lecciones aprendidas

1. **Nunca validar variables del servidor al cargar un módulo** que puede importarse desde el cliente
2. **Usar `typeof window === 'undefined'`** para detectar si estás en servidor o cliente
3. **Lazy loading** es mejor que eager loading para recursos del servidor
4. **Proxy pattern** es útil para validación lazy de objetos complejos

---

## 🎯 Resultado

✅ **Error completamente resuelto**  
✅ **Build exitoso**  
✅ **Separación clara cliente/servidor**  
✅ **Mejor seguridad**  
✅ **Código más limpio**

---

## 🔗 Documentación relacionada

- `ANALISIS_PADDLE_INTEGRACION.md` - Análisis completo de la integración
- `PADDLE_FIXES_CRITICOS.md` - Otros fixes pendientes
- `VERCEL_ENV_VARS.md` - Variables de entorno para deployment

---

**Próximo paso**: Configurar variables de entorno en Vercel para producción.
