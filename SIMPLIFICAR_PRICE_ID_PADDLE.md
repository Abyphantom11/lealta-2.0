# ✅ Simplificación de Price ID de Paddle

## 📅 Fecha: 10 de noviembre, 2025

## 🎯 Cambio Realizado

Se **eliminó la variable duplicada** `NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID` y se centralizó el Price ID en una sola constante exportada desde `src/lib/paddle.ts`.

## ❌ Antes (Variables Duplicadas)

```bash
# .env.local
PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"
```

### Problemas:
- ❌ Dos variables con el mismo valor
- ❌ Confusión sobre cuál usar
- ❌ Necesidad de actualizar dos lugares en Vercel
- ❌ Riesgo de inconsistencias

## ✅ Ahora (Constante Centralizada)

### 1. Variable de Entorno (Solo Backend)
```bash
# .env.local
PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"
```

### 2. Constante Exportada (Frontend + Backend)
```typescript
// src/lib/paddle.ts
export const PADDLE_PRICE_ID_ENTERPRISE = 'pri_01k9d95qvht02dqzvkw0h5876p';
```

### Ventajas:
- ✅ Una sola fuente de verdad en el código
- ✅ Funciona en cliente y servidor
- ✅ No depende de variables de entorno en el cliente
- ✅ Más simple de mantener
- ✅ Solo una variable en Vercel (backend API)

## 📝 Archivos Modificados

### 1. `.env.local`
```diff
# Plan Enterprise - SANDBOX (USD 250/mes)
PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"
- NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"
```

### 2. `src/lib/paddle.ts`
```typescript
// Nueva constante exportada
export const PADDLE_PRICE_ID_ENTERPRISE = 'pri_01k9d95qvht02dqzvkw0h5876p';
```

### 3. `src/app/pricing/PricingClient.tsx`
```diff
+ import { PADDLE_PRICE_ID_ENTERPRISE } from '@/lib/paddle';

  await createCheckout({
-   priceId: process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID || 'pri_lealta_enterprise_plan',
+   priceId: PADDLE_PRICE_ID_ENTERPRISE,
    businessId: targetBusinessId || 'temp_business_id',
```

### 4. `src/app/[businessId]/admin/configuracion/suscripcion/page.tsx`
```diff
+ import { PADDLE_PRICE_ID_ENTERPRISE } from '@/lib/paddle';

- const priceId = process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID;
+ const priceId = PADDLE_PRICE_ID_ENTERPRISE;
  console.log('Price ID:', priceId);
  
- if (!priceId || priceId === 'pri_lealta_enterprise') {
-   alert('⚠️ Paddle aún no está configurado...');
-   return;
- }
```

### 5. `src/app/billing/page.tsx`
```diff
+ import { PADDLE_PRICE_ID_ENTERPRISE } from '@/lib/paddle';

  await createCheckout({
-   priceId: process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID || 'pri_lealta_enterprise',
+   priceId: PADDLE_PRICE_ID_ENTERPRISE,
    businessId: session.user.businessId || '',
```

## 🚀 Actualización en Vercel

### ❌ ELIMINAR (Ya no se usa)
```
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID
```

### ✅ MANTENER (Solo esta)
```
Nombre: PADDLE_PLAN_ENTERPRISE_ID
Valor: pri_01k9d95qvht02dqzvkw0h5876p
Entornos: Production + Preview
```

## 📋 Pasos para Actualizar Vercel

1. **Ve a Vercel Dashboard** → tu proyecto → Settings → Environment Variables

2. **Busca y ELIMINA:**
   - `NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID` (ya no se usa en el código)

3. **Verifica que exista:**
   - `PADDLE_PLAN_ENTERPRISE_ID` = `pri_01k9d95qvht02dqzvkw0h5876p`
   - Marcada para: ✅ Production ✅ Preview

4. **Redeploy:**
   - Deployments → ... → Redeploy
   - O push un commit a GitHub

## 🎯 Price ID Correcto

El Price ID que debe estar configurado es el de **SANDBOX**:

```
pri_01k9d95qvht02dqzvkw0h5876p
```

### ❌ NO usar (era el anterior)
```
pri_01k9rf1r9jv9aa3fsjnzf34zkp  ← INCORRECTO
```

## ✅ Checklist Final

- [x] Actualizado `.env.local` con Price ID correcto
- [x] Creada constante `PADDLE_PRICE_ID_ENTERPRISE` en `paddle.ts`
- [x] Actualizado `PricingClient.tsx`
- [x] Actualizado `suscripcion/page.tsx`
- [x] Actualizado `billing/page.tsx`
- [ ] Eliminar `NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID` de Vercel
- [ ] Verificar `PADDLE_PLAN_ENTERPRISE_ID` en Vercel
- [ ] Redeploy en Vercel
- [ ] Probar checkout en producción

## 🔍 Verificación

Después del deploy, verifica en las DevTools del navegador:

```javascript
// Esto debe mostrar el Price ID correcto
console.log(PADDLE_PRICE_ID_ENTERPRISE);
// Debe imprimir: pri_01k9d95qvht02dqzvkw0h5876p
```

## 📚 Documentos Relacionados

- `PADDLE_SANDBOX_CONFIGURADO.md` - Configuración inicial
- `DEPLOY_PADDLE_VERCEL.md` - Guía de deployment
- `ACTUALIZAR_PRICE_ID_VERCEL.md` - Actualización de Price IDs

---

**Resultado:** Código más simple, menos variables de entorno, y una sola fuente de verdad para el Price ID. 🎉
