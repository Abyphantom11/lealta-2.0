# 🔧 AGREGAR REGISTROS DNS EN VERCEL - PASO A PASO

## 📋 REGISTROS QUE DEBES AGREGAR

Paddle Retain requiere 2 registros DNS:

### REGISTRO 1: DKIM (TXT)
```
Nombre: 20251110110916pm._domainkey
Tipo: TXT
Valor: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCj7bGVmc59n
```
*(El valor completo es más largo, asegúrate de copiarlo todo)*

### REGISTRO 2: Return-Path (CNAME)
```
Nombre: pm-bounces
Tipo: CNAME
Valor: pm.mtasy.net
```

---

## 🎯 INSTRUCCIONES PARA VERCEL

### PASO 1: Ir a Vercel Domains

1. Ve a: **https://vercel.com/dashboard**

2. Busca tu proyecto **Lealta** (o el proyecto que tiene lealta.app)

3. Click en el proyecto

4. En el menú lateral izquierdo, ve a: **Settings**

5. En el submenú, ve a: **Domains**

### PASO 2: Acceder a DNS Records

1. Busca tu dominio: **lealta.app** en la lista

2. Puede que veas un botón o link que dice:
   - **"Manage DNS"**
   - **"DNS Records"**
   - O simplemente click en el dominio

3. Deberías ver una interfaz para agregar registros DNS

### PASO 3: Agregar el registro DKIM (TXT)

1. Click en **"Add"** o **"Add Record"**

2. Completa el formulario:
   ```
   Type: TXT
   Name: 20251110110916pm._domainkey
   Value: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCj7bGVmc59n
   TTL: (dejar default o Auto)
   ```

3. **⚠️ IMPORTANTE:** El valor del DKIM es MUY LARGO. Asegúrate de:
   - Copiar TODO el valor desde Paddle
   - Incluir `k=rsa; p=` al inicio
   - Verificar que no falte nada al final

4. Click **"Save"** o **"Add"**

### PASO 4: Agregar el registro Return-Path (CNAME)

1. Click en **"Add"** o **"Add Record"** nuevamente

2. Completa el formulario:
   ```
   Type: CNAME
   Name: pm-bounces
   Value: pm.mtasy.net
   TTL: (dejar default o Auto)
   ```

3. Click **"Save"** o **"Add"**

---

## 🔍 VERIFICAR QUE SE AGREGARON CORRECTAMENTE

Después de agregar ambos registros, deberías ver algo como:

```
📋 DNS Records

Type    Name                              Value
─────   ─────────────────────────────     ──────────────────
TXT     20251110110916pm._domainkey       k=rsa; p=MIGfM...
CNAME   pm-bounces                        pm.mtasy.net
```

---

## ⏰ ESPERAR PROPAGACIÓN

1. **Tiempo estimado:** 10-30 minutos (Vercel es rápido)

2. **Mientras esperas**, puedes:
   - Configurar productos en Paddle
   - Preparar tu checkout
   - Tomar un café ☕

3. **Después de 10-30 minutos:**
   - Regresa al modal de Paddle
   - Click en **"Verificar"**
   - Si aún da error, espera 10 minutos más y reintenta

---

## ✅ CUANDO SE VERIFIQUE EXITOSAMENTE

Verás:
- ✅ Mensaje de éxito en Paddle
- ✅ La alerta azul en Retain Settings desaparecerá
- ✅ Los emails de recuperación de pagos NO irán a spam

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### "No encuentro la opción de DNS Records en Vercel"

**Opción A: El dominio es externo**
- Si compraste el dominio fuera de Vercel (GoDaddy, Namecheap, etc)
- Los DNS records se manejan en el proveedor donde compraste el dominio
- Ve a ese proveedor y agrega los registros ahí

**Opción B: Usar Vercel CLI**
Puedes agregar registros vía CLI:
```powershell
vercel dns add lealta.app '20251110110916pm._domainkey' TXT 'k=rsa; p=...'
vercel dns add lealta.app pm-bounces CNAME pm.mtasy.net
```

### "Error al agregar el registro CNAME"

Algunos proveedores DNS no permiten CNAME en el dominio raíz. Si `pm-bounces` no funciona:
- Intenta con: `pm-bounces.lealta.app` (dominio completo)
- O contacta a soporte de Vercel

### "Verification failed" después de 30 minutos

1. Verifica que los registros estén bien escritos
2. Usa esta herramienta online para verificar propagación:
   ```
   https://dnschecker.org/
   ```
3. Busca:
   - `20251110110916pm._domainkey.lealta.app` (TXT)
   - `pm-bounces.lealta.app` (CNAME)

4. Si no aparecen después de 1 hora, revisa que estén agregados en el lugar correcto

---

## 🎯 PRÓXIMOS PASOS

Una vez verificado el DKIM y Return-Path:

### 1. Configurar Productos en Paddle
- Crear productos
- Obtener Price IDs
- Actualizar `.env.local`

### 2. Probar Checkout
- Iniciar tu app
- Probar un checkout de prueba
- Verificar que todo funcione

### 3. Configurar Webhooks
- Ya tienes el webhook secret configurado
- Asegúrate de que la URL esté bien en Paddle

---

## 📚 RECURSOS

- **Vercel DNS Docs:** https://vercel.com/docs/projects/domains/working-with-domains
- **Paddle DKIM Docs:** https://developer.paddle.com/concepts/sell/retain-email-authentication
- **DNS Checker:** https://dnschecker.org/

---

**¿Lograste agregar los registros?** Avísame cuando termines y verificamos juntos. 😊
