# 🔐 CONFIGURAR DKIM PARA PADDLE RETAIN

## 📋 Registros DNS que debes agregar

### REGISTRO 1: DKIM (TXT)

```
Nombre/Host: 20251110110916pm._domainkey.lealta.app
Tipo: TXT
Valor: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCj7bGVmc59n
TTL: Auto (o 3600)
```

**⚠️ IMPORTANTE:** Puede que haya más contenido en el valor (el texto es largo). Asegúrate de copiar TODO el contenido.

---

## 🚀 PASOS PARA CONFIGURAR

### ¿Dónde está tu DNS?

Tu dominio es: **lealta.app**

Necesitas saber dónde está configurado tu DNS. Las opciones más comunes:

1. **Cloudflare** - https://dash.cloudflare.com/
2. **Vercel** - Si compraste el dominio en Vercel
3. **GoDaddy, Namecheap, etc** - Si compraste el dominio ahí

---

## 📝 INSTRUCCIONES POR PROVEEDOR

### A) Si usas CLOUDFLARE:

1. **Ve a Cloudflare Dashboard:**
   ```
   https://dash.cloudflare.com/
   ```

2. **Selecciona tu dominio:** `lealta.app`

3. **Ve a la sección DNS:**
   - En el menú lateral: **DNS → Records**

4. **Agregar el registro DKIM:**
   - Click en **"Add record"**
   - **Type:** Selecciona `TXT`
   - **Name:** Escribe `20251110110916pm._domainkey`
     - ⚠️ NO escribas `.lealta.app` al final, Cloudflare lo agrega automáticamente
     - Si Cloudflare muestra un dropdown, pon solo: `20251110110916pm._domainkey`
   - **Content:** Pega el valor completo que te dio Paddle:
     ```
     k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCj7bGVmc59n
     ```
     ⚠️ Asegúrate de copiar TODO (puede ser un texto MUY largo)
   - **TTL:** Deja en `Auto`
   - **Proxy status:** 🔴 **DNS only** (nube gris, NO naranja)
   - Click **"Save"**

5. **Scroll en el modal de Paddle:**
   - Puede haber más registros (Return-Path)
   - Si hay un segundo registro, repite el proceso

6. **Espera 5-30 minutos** para que se propague

7. **Verifica en Paddle:**
   - Regresa al modal de Paddle
   - Click en **"Verificar"**

---

### B) Si usas VERCEL DNS:

1. **Ve a Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Ve a tu proyecto Lealta**

3. **Settings → Domains**

4. **Click en tu dominio:** `lealta.app`

5. **Agregar el registro:**
   - En la sección de DNS records
   - **Type:** `TXT`
   - **Name:** `20251110110916pm._domainkey`
   - **Value:** El valor completo de Paddle
   - **Save**

---

### C) Si usas OTRO PROVEEDOR (GoDaddy, Namecheap, etc):

1. **Inicia sesión** en donde compraste el dominio

2. **Busca "DNS Management"** o "DNS Settings"

3. **Agregar registro TXT:**
   - **Host/Name:** `20251110110916pm._domainkey.lealta.app`
     - Algunos proveedores requieren el dominio completo
     - Otros solo el subdominio
   - **Type:** `TXT`
   - **Value:** El valor completo de Paddle
   - **TTL:** 3600 (o default)

4. **Guarda los cambios**

---

## 🔍 VERIFICAR QUE SE AGREGÓ CORRECTAMENTE

### Opción 1: Desde la terminal

```powershell
# En PowerShell
nslookup -type=TXT 20251110110916pm._domainkey.lealta.app
```

Si está configurado, verás el valor `k=rsa; p=...`

### Opción 2: Herramienta online

Ve a: https://mxtoolbox.com/SuperTool.aspx

Busca:
```
20251110110916pm._domainkey.lealta.app
```

---

## ⏰ TIEMPO DE PROPAGACIÓN

- **Mínimo:** 5-10 minutos
- **Normal:** 30 minutos - 1 hora
- **Máximo:** Hasta 48 horas (raro)

**Tip:** Cloudflare suele ser el más rápido (5-15 minutos)

---

## ❓ PREGUNTAS FRECUENTES

### ¿Debo agregar el dominio completo en el "Name"?

**Depende del proveedor:**
- **Cloudflare:** Solo `20251110110916pm._domainkey` (sin .lealta.app)
- **Vercel:** Solo `20251110110916pm._domainkey`
- **Otros:** Puede que necesites el dominio completo

**Regla general:** Si el campo ya muestra tu dominio al lado, NO lo incluyas.

### ¿Qué es el "Proxy status" en Cloudflare?

- **DNS only (nube gris):** ✅ Usa este para registros TXT
- **Proxied (nube naranja):** ❌ NO usar para DNS records de email

### ¿Y el Return-Path?

En el modal de Paddle, **haz scroll hacia abajo**. Puede haber un segundo registro para Return-Path (generalmente es un CNAME).

Si lo hay:
```
Nombre: paddle-return-path (o similar)
Tipo: CNAME
Valor: return.paddle.com (o similar)
```

Agrega ese registro también.

---

## 🆘 SI TIENES PROBLEMAS

### Error: "Record already exists"

- Ya existe un registro con ese nombre
- Edita el registro existente en vez de crear uno nuevo

### Error: "Invalid value"

- Asegúrate de copiar TODO el valor (puede ser muy largo)
- Verifica que NO haya espacios extra al inicio o final
- Verifica que incluya `k=rsa; p=` al inicio

### No estoy seguro de mi proveedor DNS

Ejecuta en la terminal:

```powershell
nslookup -type=NS lealta.app
```

Esto te dirá quién maneja tu DNS.

---

## ✅ SIGUIENTE PASO

Una vez agregados los registros DNS:

1. **Espera 10-30 minutos**
2. **Regresa al modal de Paddle**
3. **Click en "Verificar"**
4. **Si da error, espera un poco más y reintenta**

Cuando se verifique exitosamente:
- ✅ Verás un mensaje de éxito
- ✅ La alerta azul en Paddle Retain desaparecerá
- ✅ Los emails de Retain NO irán a spam

---

## 🎯 DESPUÉS DE DKIM

Una vez configurado DKIM, el siguiente paso es:
- **Configurar tus productos en Paddle**
- **Obtener los Price IDs**
- **Probar un checkout**

---

**¿Necesitas ayuda agregando los registros?** Dime qué proveedor de DNS usas y te guío específicamente.
