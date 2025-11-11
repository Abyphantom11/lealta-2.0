# 🔧 Solución: Error 400 en Paddle Checkout

## 🔴 El Error

Cuando intentas abrir el checkout de Paddle, ves:
- **"Something went wrong"** (modal de Paddle)
- **Error 400** en la consola: `sandbox-checkout-service.paddle.com/transaction-checkout`

## ✅ Causas Comunes

### 1. **Producto no publicado en Paddle**
El Price ID existe pero el producto puede no estar activo o publicado en Paddle.

**Solución:**
1. Ve a: https://sandbox-vendors.paddle.com/catalog/products
2. Busca tu producto: `pro_01k9rf0j585bk5s8nh1fjjvvd4`
3. Asegúrate de que esté **"Active"** o **"Published"**
4. Si dice "Draft", haz clic en "Publish"

### 2. **Precio no configurado correctamente**
El precio puede no estar asociado correctamente al producto.

**Solución:**
1. Ve a: https://sandbox-vendors.paddle.com/catalog/prices
2. Busca: `pri_01k9rf1r9jv9aa3fsjnzf34zkp`
3. Verifica que:
   - Status: **Active**
   - Billing cycle: **Configurado** (mensual, anual, etc.)
   - Unit price: **Configurado** (ej: $250.00)

### 3. **Datos inválidos en customData**
Paddle es muy estricto con el formato de `customData`.

**Ya solucionado en el código** ✅ - Simplifiqué el formato para usar solo lo necesario.

### 4. **Email inválido**
Si el email no tiene formato válido, Paddle rechaza la petición.

**Ya solucionado en el código** ✅ - Ahora validamos que el email contenga '@'.

## 🧪 Pasos para Solucionar

### Paso 1: Verificar el Producto en Paddle Dashboard

```bash
# 1. Abre el dashboard de sandbox
https://sandbox-vendors.paddle.com/catalog/products

# 2. Busca tu producto
Product ID: pro_01k9rf0j585bk5s8nh1fjjvvd4

# 3. Asegúrate de que:
✅ Status: Active
✅ Name: (debe tener un nombre)
✅ Description: (debe tener descripción)
✅ Tax category: (debe estar configurado)
```

### Paso 2: Verificar el Precio

```bash
# 1. Ve a precios
https://sandbox-vendors.paddle.com/catalog/prices

# 2. Busca tu precio
Price ID: pri_01k9rf1r9jv9aa3fsjnzf34zkp

# 3. Verifica:
✅ Status: Active (no Draft)
✅ Product: Asociado al producto correcto
✅ Billing cycle: Configurado
✅ Unit price: $250.00 o el monto que quieras
```

### Paso 3: Reiniciar el Servidor

```powershell
# Si ya está corriendo, detenerlo (Ctrl+C)
# Luego reiniciar
npm run dev
```

### Paso 4: Limpiar Caché del Navegador

```
1. Abre DevTools (F12)
2. Pestaña "Network"
3. Checkbox: "Disable cache"
4. Recarga la página (Ctrl+Shift+R)
```

### Paso 5: Probar con Script Directo

Abre la consola del navegador (F12) y pega esto:

```javascript
// Copiar y pegar en la consola del navegador
Paddle.Checkout.open({
  items: [{ priceId: 'pri_01k9rf1r9jv9aa3fsjnzf34zkp', quantity: 1 }],
  customer: { email: 'test@example.com' }
});
```

Si esto funciona, el problema está en tu código. Si no funciona, el problema está en Paddle Dashboard.

## 🔍 Debugging Avanzado

### Ver el error completo en la consola:

```javascript
// En la consola del navegador
Paddle.Initialize({
  environment: 'sandbox',
  token: 'test_e7baca7d5de4072f974fbe36dce',
  eventCallback: (event) => {
    console.log('📡 Evento:', event);
    if (event.name === 'checkout.error') {
      console.error('❌ Error checkout:', event.data);
    }
  }
});
```

### Verificar la respuesta del servidor:

```
1. F12 → Network tab
2. Filtra por "transaction-checkout"
3. Haz clic en la request
4. Ve a "Response" para ver el mensaje de error completo
```

## 📝 Checklist de Verificación

- [ ] El producto está **Active** en Paddle Dashboard
- [ ] El precio está **Active** (no Draft)
- [ ] El precio tiene un billing cycle configurado
- [ ] El código actualizado se desplegó (reiniciaste `npm run dev`)
- [ ] Limpiaste el caché del navegador
- [ ] Probaste el script directo en la consola

## 🎯 Si Nada Funciona

Crea un nuevo precio en Paddle:

1. Ve a: https://sandbox-vendors.paddle.com/catalog/prices
2. Clic en "New Price"
3. Configura:
   - **Product:** Selecciona tu producto
   - **Billing cycle:** Monthly
   - **Price:** $250.00 USD
   - **Status:** Active
4. Copia el nuevo Price ID
5. Actualiza `.env.local`:
   ```bash
   PADDLE_PLAN_ENTERPRISE_ID="pri_NUEVO_ID_AQUI"
   NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_NUEVO_ID_AQUI"
   ```
6. Reinicia el servidor

---

**¿Sigue sin funcionar?** Comparte el mensaje de error completo de la pestaña "Response" en Network.
