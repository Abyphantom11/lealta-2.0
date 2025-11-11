## 🔍 INSTRUCCIONES: Ver el Error Completo de Paddle

Para diagnosticar el error 400, necesitamos ver el mensaje de error completo que Paddle está devolviendo.

### 📋 Pasos:

1. **Abre las DevTools** (ya lo tienes abierto ✅)

2. **Ve a la pestaña "Network"** (en DevTools)

3. **Busca la petición que dice:**
   ```
   transaction-checkout    400 (Bad Request)
   ```

4. **Haz clic en esa petición**

5. **Ve a la pestaña "Response"** o "Preview"

6. **Copia TODO el contenido** que aparece ahí

### 📸 O manda un screenshot de:
- La pestaña "Response" de esa petición
- O la pestaña "Payload" (para ver qué datos se enviaron)

### ⚡ Mientras tanto, prueba esto:

Abre la **consola del navegador** (pestaña "Console") y pega este código:

```javascript
// Probar Paddle directamente
Paddle.Checkout.open({
  items: [{ 
    priceId: 'pri_01k9rf1r9jv9aa3fsjnzf34zkp', 
    quantity: 1 
  }]
  // SIN customer, SIN customData
});
```

Si esto funciona → el problema son los datos adicionales (email, customData)
Si esto NO funciona → el problema es el producto/precio en Paddle Dashboard

---

**Espero tu respuesta para continuar el diagnóstico** 🔍
