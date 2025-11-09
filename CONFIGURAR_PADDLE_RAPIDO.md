# 🚀 CONFIGURACIÓN RÁPIDA: Paddle para Pagos

## ⚠️ ERROR: "Paddle aún no está configurado"

Si ves este error al hacer click en "Suscribirme Ahora", necesitas configurar las variables de entorno de Paddle.

---

## ✅ SOLUCIÓN EN 3 PASOS:

### **Paso 1: Obtener credenciales de Paddle**

#### **Opción A: Modo Sandbox (Pruebas)** 🧪
```
1. Ve a: https://sandbox-vendors.paddle.com/
2. Login con tu cuenta de Paddle
3. Ve a: Developer Tools > Authentication
4. Copia el "Client-side token"
   Ejemplo: test_1234567890abcdef
5. Ve a: Catalog > Prices
6. Copia el ID del precio Enterprise
   Ejemplo: pri_01hsfxxx...
```

#### **Opción B: Modo Producción (Real)** 💰
```
1. Ve a: https://vendors.paddle.com/
2. Login con tu cuenta de Paddle
3. Ve a: Developer Tools > Authentication
4. Copia el "Client-side token"
   Ejemplo: live_1234567890abcdef
5. Ve a: Catalog > Prices
6. Copia el ID del precio Enterprise
   Ejemplo: pri_01hsfxxx...
```

---

### **Paso 2: Configurar variables de entorno**

#### **Archivo: `.env.local` (en la raíz del proyecto)**

```bash
# ====================================
# 🔐 PADDLE CONFIGURATION
# ====================================

# Modo Sandbox (Pruebas)
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_1234567890abcdef
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01hsfxxx...

# O modo Producción (descomentar cuando esté listo)
# NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
# NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_1234567890abcdef
# NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01hsfxxx...

# Webhook Secret (para verificar webhooks)
PADDLE_WEBHOOK_SECRET=tu_webhook_secret_aqui
```

**⚠️ IMPORTANTE:**
- El archivo `.env.local` debe estar en la raíz (mismo nivel que `package.json`)
- NO subir este archivo a Git (ya está en `.gitignore`)
- Reemplazar los valores de ejemplo con tus credenciales reales

---

### **Paso 3: Reiniciar servidor**

```bash
# Detener el servidor actual (Ctrl + C)
# Luego reiniciar:
npm run dev
```

---

## 🧪 PROBAR EN MODO SANDBOX

### **Tarjetas de prueba:**

```
Tarjeta exitosa:
Número: 4242 4242 4242 4242
Fecha: Cualquier fecha futura (ej: 12/25)
CVV: Cualquier 3 dígitos (ej: 123)
Código postal: Cualquier código

Tarjeta rechazada:
Número: 4000 0000 0000 0002
```

---

## ✅ VERIFICAR QUE FUNCIONÓ

### **1. Consola del navegador (F12)**

Al hacer click en "Suscribirme Ahora", deberías ver:
```
🔵 Iniciando suscripción...
Session: {user: {...}}
BusinessId: cmxxx...
Price ID: pri_01hsfxxx... (NO debe ser "pri_lealta_enterprise")
🟢 Creando checkout con Paddle...
```

### **2. Checkout de Paddle**

Debería abrirse un overlay de Paddle con:
- Logo de Paddle
- Formulario de pago
- Precio: $250 USD/mes

---

## 🆘 PROBLEMAS COMUNES

### **"Price ID: undefined"**
```bash
# Solución: Agregar variable en .env.local
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01hsfxxx...

# Reiniciar servidor
npm run dev
```

### **"Paddle is not initialized"**
```bash
# Solución: Agregar token en .env.local
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_1234567890abcdef

# Reiniciar servidor
npm run dev
```

### **"Invalid price ID"**
```
Solución:
1. Ve a Paddle Dashboard > Catalog > Prices
2. Verifica que el precio existe
3. Copia el ID completo (empieza con "pri_")
4. Actualiza .env.local
5. Reinicia servidor
```

---

## 📋 CHECKLIST COMPLETO

- [ ] Cuenta de Paddle creada
- [ ] Token obtenido (test_xxx o live_xxx)
- [ ] Precio Enterprise creado en Paddle ($250/mes)
- [ ] Price ID copiado (pri_xxx)
- [ ] Archivo `.env.local` creado en raíz
- [ ] Variables configuradas correctamente
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Navegador recargado (Ctrl+Shift+R)
- [ ] Click en "Suscribirme Ahora"
- [ ] Checkout de Paddle abre correctamente
- [ ] Prueba con tarjeta de test

---

## 🎯 SIGUIENTE PASO

Una vez configurado:

1. **Probar en Sandbox:**
   ```
   - Hacer pago de prueba
   - Verificar que webhook llega
   - Confirmar que actualiza DB
   ```

2. **Activar Producción:**
   ```
   - Cambiar a modo production
   - Usar token live_xxx
   - Usar price ID de producción
   - Reiniciar servidor
   ```

3. **Contactar Clientes:**
   ```
   - Enviar links de /pricing
   - Guiarlos a Configuración > Suscripción
   - Soporte durante primeros pagos
   ```

---

## 📞 SOPORTE

Si tienes problemas:

1. **Revisa la consola (F12)**
   - Busca errores en rojo
   - Copia el mensaje completo

2. **Verifica variables:**
   ```bash
   # En consola del navegador:
   console.log(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN)
   console.log(process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID)
   ```

3. **Documentación:**
   - `PADDLE_TESTING_GUIDE.md` - Guía completa
   - `PADDLE_INTEGRATION_CHECKLIST.md` - Checklist
   - Paddle Docs: https://developer.paddle.com

---

## ✅ TODO LISTO

Cuando veas el checkout de Paddle, ¡estás listo para recibir pagos! 🎉
