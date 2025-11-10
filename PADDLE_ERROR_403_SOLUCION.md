# 🚨 ERROR 403 DE PADDLE - SOLUCIÓN

## Problema Detectado

```
checkout-service.paddle.com/transaction-checkout:1  
Failed to load resource: the server responded with a status of 403 ()
```

**Causa:** Estás en modo **production** pero:
- El Price ID puede no existir en tu cuenta de producción
- O no tienes permisos configurados correctamente

---

## ✅ SOLUCIÓN RÁPIDA: Cambiar a Sandbox

### Paso 1: Actualizar `.env`

```env
# Cambiar de production a sandbox
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"

# Usar token de sandbox (empieza con test_)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxx"

# Price ID de sandbox
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxxxxxxxxxx"
```

### Paso 2: Obtener Credenciales de Sandbox

1. **Ve a Paddle Sandbox:**
   ```
   https://sandbox-vendors.paddle.com/
   ```

2. **Client Token (Frontend):**
   - Developer Tools > Authentication
   - Create new client-side token
   - Copia el token (empieza con `test_`)

3. **Crear Price de Prueba:**
   - Catalog > Products > Create Product
   - Nombre: "Lealta Enterprise - Test"
   - Add Price: $250 USD/month (recurring)
   - Copia el Price ID (formato: `pri_01xxxxx`)

4. **Actualizar `.env`:**
   ```env
   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_abc123def456..."
   NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01abc123def456..."
   ```

### Paso 3: Reiniciar Servidor

```powershell
# Detener servidor (Ctrl+C)
npm run dev
```

### Paso 4: Probar con Tarjeta de Prueba

```
Número: 4242 4242 4242 4242
Fecha: 12/26 (cualquier fecha futura)
CVV: 123
```

---

## 🔧 OPCIÓN 2: Activar Producción (Para facturar de verdad)

Si quieres usar **production** (pagos reales):

### 1. Verificar Account Status en Paddle

```
https://vendors.paddle.com/settings/account
```

- ✅ Cuenta debe estar **aprobada**
- ✅ Tax info completa
- ✅ Bank details configurados

### 2. Crear Price de Producción

```
https://vendors.paddle.com/catalog/prices
```

1. Create Product: "Lealta Enterprise"
2. Add Price: $250 USD/month
3. Billing: **Recurring** (Monthly)
4. Copia el nuevo Price ID

### 3. Actualizar `.env`

```env
NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="live_36ddf9a4003f105fc2730fae735"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_NUEVO_ID_DE_PRODUCCION"
```

### 4. ⚠️ IMPORTANTE: Verificar que el Price ID sea correcto

El Price ID `pri_01k9d95qvht02dqzvkw0h5876p` debe existir en:
```
https://vendors.paddle.com/catalog/prices
```

Si no existe, crea uno nuevo y actualiza la variable.

---

## 🧪 RECOMENDACIÓN: USA SANDBOX PRIMERO

Para evitar cargos reales mientras pruebas:

1. ✅ Cambia a modo sandbox
2. ✅ Prueba todo el flujo
3. ✅ Verifica que funcione correctamente
4. ✅ LUEGO cambia a production

---

## 📝 Checklist de Sandbox

```bash
# 1. Crear cuenta en Paddle Sandbox
https://sandbox-vendors.paddle.com/

# 2. Obtener Client Token
Developer Tools > Authentication > Create client-side token

# 3. Crear Price de Prueba
Catalog > Products > Create Product
Add Price: $250 USD/month recurring

# 4. Copiar IDs
Client Token: test_xxxxx
Price ID: pri_01xxxxx

# 5. Actualizar .env
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxx"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxx"

# 6. Reiniciar servidor
npm run dev
```

---

## 🐛 Otros Errores Comunes

### Error: Invalid client token
- Verifica que el token sea de **sandbox** si estás en modo sandbox
- O de **production** si estás en modo production
- Los tokens de sandbox empiezan con `test_`
- Los tokens de production empiezan con `live_`

### Error: Price not found
- El Price ID no existe en el ambiente actual
- Verifica en: Catalog > Prices
- Copia el ID exacto (case-sensitive)

### Error: Account not approved
- Tu cuenta de production no está aprobada
- Completa la información de tax y bank details
- Espera aprobación de Paddle (1-2 días)

---

## ✅ Una vez que funcione en Sandbox

Cuando todo funcione en sandbox:
1. Completa la configuración de producción en Paddle
2. Crea el Price de producción
3. Actualiza las variables a production
4. Haz una prueba con tu propia tarjeta
5. ¡Empieza a facturar! 💰

---

**¿Qué prefieres hacer ahora?**
- 🧪 Sandbox (testing seguro, sin pagos reales)
- 💰 Production (necesitas cuenta aprobada y Price IDs correctos)
