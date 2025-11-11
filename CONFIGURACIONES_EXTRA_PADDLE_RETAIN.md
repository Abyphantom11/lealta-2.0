# 🔧 CONFIGURACIONES EXTRA DE PADDLE RETAIN

## 📊 Estado Actual

**Fecha:** 10 de noviembre, 2025  
**Estado Retain:** ✅ Activado  
**Paddle.js:** ✅ Validado e instalado

---

## ⚠️ Configuraciones Pendientes que ves en el Dashboard

### 1. 🔐 DKIM y Return-Path (IMPORTANTE)

**¿Qué es esto?**
- DKIM y Return-Path son registros DNS que verifican que los emails vienen de tu dominio
- Sin esto, los emails de Paddle Retain pueden ir a spam
- Es especialmente importante para emails de:
  - Recuperación de pagos fallidos
  - Recordatorios de tarjetas vencidas
  - Notificaciones de suscripción

**¿Cómo configurarlo?**

#### Paso 1: Obtener los registros DNS de Paddle

1. En la pantalla donde estás (Retain → Configuración)
2. Click en el botón **"Verificar"** de la alerta azul
3. Paddle te mostrará los registros DNS que necesitas agregar

Los registros se verán algo así:

```
Tipo: TXT
Nombre: paddle._domainkey.lealta.app
Valor: v=DKIM1; k=rsa; p=MIGfMA0GCS....(string largo)

Tipo: CNAME
Nombre: paddle-return-path.lealta.app
Valor: return.paddle.com
```

#### Paso 2: Agregar registros en tu proveedor de DNS

**Si usas Cloudflare:**
1. Ve a: https://dash.cloudflare.com/
2. Selecciona tu dominio: `lealta.app`
3. Ve a: **DNS → Records**
4. Click en **"Add record"**
5. Agrega cada registro que Paddle te dio:
   - **Tipo:** TXT o CNAME (según Paddle indique)
   - **Name:** El nombre que Paddle te dio (ej: `paddle._domainkey`)
   - **Content:** El valor que Paddle te dio
   - **TTL:** Auto
   - **Proxy status:** DNS only (nube gris) ☁️
6. Click **"Save"**

**Si usas otro proveedor (GoDaddy, Namecheap, etc):**
- El proceso es similar, busca la sección de "DNS Management"
- Agrega los registros TXT y CNAME que Paddle te dé

#### Paso 3: Verificar en Paddle

1. Espera 10-30 minutos para que los DNS se propaguen
2. Regresa a Paddle → Retain → Configuración
3. Click en **"Verificar"** de nuevo
4. Si todo está bien, verás ✅ "Verificado"

**⏰ Nota:** Los cambios DNS pueden tardar hasta 48 horas en propagarse completamente, pero usualmente es mucho más rápido (10-30 minutos).

---

### 2. 📄 Fragmentos/Snippets (IGNORAR - Ya está hecho)

**¿Qué dice Paddle?**
- "Paddle.js no está instalado"
- "Instale Paddle.js en su sitio web..."

**✅ ESTO ES FALSO - Ya está instalado**

Paddle ya validó tu instalación (viste el mensaje "Paddle.js installation successfully validated"). 

**¿Por qué muestra esto entonces?**
- Es una interfaz confusa de Paddle
- Esa sección es para sitios web de marketing (landing pages)
- Tu app es una aplicación web (SPA/Next.js), no una página de marketing estática
- Paddle no detecta el snippet en páginas que requieren autenticación

**✅ PUEDES IGNORAR ESTA SECCIÓN COMPLETAMENTE**

Si quieres, puedes hacer click en "Editar" y cerrar el modal, pero NO es necesario hacer nada aquí.

---

### 3. 📧 Otras pestañas de Retain

En la parte superior ves 4 pestañas:

#### A) **Configuración** (donde estás ahora)
- DKIM/Return-Path → ⚠️ CONFIGURAR (ver arriba)
- Fragmentos → ✅ IGNORAR (ya está)

#### B) **Recuperación de pagos**
Aquí puedes configurar:
- **Cuándo enviar emails de recuperación**
  - Sugerido: 3 días después del fallo, 7 días después, 14 días después
- **Personalizar los emails**
  - Usar tu logo
  - Personalizar el texto

**¿Necesitas configurarlo ahora?**
- No urgente, Paddle usa configuración por defecto
- Puedes personalizarlo después cuando tengas clientes reales

#### C) **Flujos de cancelación**
Aquí puedes configurar:
- **Encuestas de cancelación** - Preguntar por qué cancelan
- **Ofertas de retención** - Descuentos para evitar cancelaciones
- **Pausar suscripción** - Opción de pausar en vez de cancelar

**¿Necesitas configurarlo ahora?**
- No urgente
- Útil cuando tengas más clientes y quieras reducir churn

#### D) **Optimización de términos**
- Análisis de datos de cancelación
- Solo útil cuando tengas historial de datos

---

## ✅ Checklist de Configuración Retain

### Mínimo Necesario (Para empezar)
- [x] ✅ Retain activado
- [x] ✅ Paddle.js instalado y validado
- [ ] ⚠️ **DKIM y Return-Path configurados** ← HACER ESTO

### Opcional (Mejorar después)
- [ ] Personalizar emails de recuperación
- [ ] Configurar flujo de cancelación
- [ ] Agregar encuestas de cancelación

---

## 🎯 Próximos Pasos AHORA

### 1. Configurar DKIM (15 minutos)

```
1. En Paddle → Retain → Configuración
2. Click "Verificar" en la alerta azul
3. Copiar los registros DNS que te muestre
4. Ir a tu proveedor DNS (Cloudflare, etc)
5. Agregar los registros DNS
6. Esperar 10-30 minutos
7. Regresar a Paddle y verificar
```

### 2. Después del DKIM, configurar tus productos

Necesitarás:
- Crear productos en Paddle
- Obtener los Price IDs
- Configurarlos en tu `.env.local`

---

## 🆘 ¿Necesitas ayuda?

**Para DKIM:**
- Si no sabes cuál es tu proveedor DNS, dime tu dominio y te ayudo
- Si tienes problemas agregando los registros, comparte pantalla

**Para Products/Prices:**
- Te puedo guiar en crear productos en Paddle
- Te ayudo a configurar los Price IDs en tu app

---

## 📚 Recursos

- **Guía de DKIM de Paddle:** https://developer.paddle.com/concepts/sell/retain-email-authentication
- **DNS de Cloudflare:** https://dash.cloudflare.com/
- **Verificar DNS:** https://mxtoolbox.com/SuperTool.aspx (herramienta para verificar propagación)

---

**¿En qué configuración necesitas ayuda específicamente?**
