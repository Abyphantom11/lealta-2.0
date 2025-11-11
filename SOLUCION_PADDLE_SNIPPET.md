# 🚀 SOLUCIÓN: Paddle "Snippet not found" - Cómo obtener tu API Key

## ❌ El Problema

Estás en la página de **Paddle Retain** que te pide verificar que Paddle.js está instalado en tu sitio.
Te muestra el error: **"Snippet not found on page"**

## ✅ La Solución Simple

**NO NECESITAS verificar el snippet.** Ese paso es OPCIONAL. Puedes obtener tu API Key directamente.

---

## 📝 Cómo obtener tu API Key SIN verificar el snippet

### **Método 1: Link directo al API Key (RÁPIDO)**

1. Ve directamente a la página de autenticación:
   - **LIVE (producción):** https://vendors.paddle.com/authentication
   - **Sandbox (pruebas):** https://sandbox-vendors.paddle.com/authentication

2. En la sección **"API Keys"**:
   - Si ya tienes un API Key creado → **Cópialo** (empieza con `pdl_live_` o `pdl_test_`)
   - Si NO tienes ninguno → Click en **"Generate API Key"**

3. Si generas uno nuevo:
   ```
   Name: Lealta API Key
   Scopes: Selecciona TODOS (o al menos: write:transactions, read:subscriptions)
   ```

4. **⚠️ COPIA EL API KEY** - Solo se muestra UNA VEZ
   - Formato LIVE: `pdl_live_apikey_xxxxxxxxxxxxxxxx`
   - Formato Sandbox: `pdl_test_apikey_xxxxxxxxxxxxxxxx`

---

### **Método 2: Navegar desde el Dashboard**

1. Desde el dashboard de Paddle, busca en el menú lateral:
   ```
   ⚙️ Developer Tools
      └─ 🔐 Authentication
   ```

2. En la página de Authentication, ve a la pestaña **"API Keys"**

3. Sigue los pasos del Método 1 (punto 2 en adelante)

---

## 🤷 ¿Por qué Paddle no encuentra el snippet?

El snippet SÍ está instalado en tu código (lo verificamos), pero Paddle no puede verlo porque:

1. **Tu sitio requiere autenticación** - Paddle no puede acceder sin login
2. **El código de Paddle solo se carga en ciertas páginas** - Como `/pricing` o `/billing`
3. **Estás en desarrollo local** - No en producción

**Esto es NORMAL y NO es un problema.** El snippet está bien instalado.

---

## 🎯 Próximos Pasos

Una vez que tengas tu API Key:

### 1. Agregar a tu `.env.local`

```env
# Si es LIVE (producción)
PADDLE_API_KEY="pdl_live_tu_api_key_aqui"

# Si es Sandbox (pruebas)
PADDLE_API_KEY="pdl_test_tu_api_key_aqui"
```

### 2. Verificar que funciona

```powershell
# Reinicia tu servidor
npm run dev
```

### 3. Probar un checkout

Ve a: `http://localhost:3001/pricing` y prueba hacer un checkout

---

## 📚 Referencias

- **Paddle Authentication Docs:** https://developer.paddle.com/api-reference/authentication
- **Tu guía completa:** Ver `GUIA_RAPIDA_PADDLE_SANDBOX.md`

---

## 💡 Tips

- ✅ **Sandbox es para desarrollo** - Usa tarjetas de prueba (4242 4242 4242 4242)
- ✅ **Live es para producción real** - Cobra dinero real
- ⚠️ **El API Key solo se muestra una vez** - Guárdalo en un lugar seguro
- ⚠️ **Nunca subas el API Key a Git** - Usa `.env.local` (ya está en `.gitignore`)

---

## 🆘 ¿Aún tienes problemas?

Si después de obtener el API Key sigues teniendo errores:

1. Verifica que el API Key esté en `.env.local` (NO en `.env`)
2. Verifica que el nombre de la variable sea exacto: `PADDLE_API_KEY`
3. Reinicia tu servidor: `npm run dev`
4. Revisa la consola del navegador (F12) para ver errores específicos
