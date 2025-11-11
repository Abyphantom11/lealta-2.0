# ✅ SOLUCIÓN: transaction_default_checkout_url_not_set

## 🔴 El Error
```json
{
    "errors": [
        {
            "status": 400,
            "code": "validation",
            "details": "transaction_default_checkout_url_not_set"
        }
    ]
}
```

## 🎯 Causa
Paddle Billing requiere que configures una **Default Checkout URL** en tu cuenta para procesar pagos. Esta URL es donde Paddle redirige después de un pago exitoso o cancelado.

## ✅ Solución - Configurar Default Checkout URL

### Paso 1: Ve a Paddle Checkout Settings

```
https://sandbox-vendors.paddle.com/settings/checkout
```

### Paso 2: Configura las URLs

En la sección **"Default Checkout URLs"**, configura:

#### **Success URL (Requerido):**
```
http://localhost:3001/billing/success
```
O si ya está en producción:
```
https://tudominio.com/billing/success
```

#### **Cancel URL (Opcional pero recomendado):**
```
http://localhost:3001/pricing
```

### Paso 3: Guardar cambios

1. Haz clic en **"Save"** o **"Update"**
2. Espera la confirmación

### Paso 4: Reiniciar y probar

1. Recarga tu página: `http://localhost:3001/pricing`
2. Prueba el checkout nuevamente
3. Ahora debería funcionar ✅

---

## 🔧 Alternativa: Pasar las URLs en el código

Si no quieres configurarlo en el Dashboard, puedes pasar las URLs directamente en el código (ya lo tenemos implementado, pero Paddle requiere que al menos una vez se configure en el Dashboard):

```typescript
Paddle.Checkout.open({
  items: [{ priceId: 'pri_...', quantity: 1 }],
  settings: {
    successUrl: 'http://localhost:3001/billing/success',
    cancelUrl: 'http://localhost:3001/pricing'
  }
});
```

Pero **aún así necesitas configurar las URLs por defecto en el Dashboard la primera vez**.

---

## 📝 Resumen

✅ **Ve a:** https://sandbox-vendors.paddle.com/settings/checkout
✅ **Configura:**
   - Success URL: `http://localhost:3001/billing/success`
   - Cancel URL: `http://localhost:3001/pricing`
✅ **Guarda los cambios**
✅ **Recarga tu página y prueba de nuevo**

---

**¡Este era el problema!** Una vez que configures esto, el checkout debería funcionar perfectamente 🚀
