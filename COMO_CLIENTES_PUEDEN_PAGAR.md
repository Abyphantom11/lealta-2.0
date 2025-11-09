# 💳 RESUMEN: Cómo Tus Clientes Pueden Pagar AHORA

## ✅ TODO LISTO - 3 FORMAS DE ACCESO

### **1. Link Directo a Pricing** 🔗
```
https://lealta.app/pricing
```

**Envía este mensaje por WhatsApp/Email:**
```
¡Hola! 👋

Para continuar usando Lealta sin interrupciones, 
activa tu suscripción aquí:

🔗 https://lealta.app/pricing

✅ Pago seguro con Paddle
✅ Activación inmediata
✅ $250 USD/mes

¿Dudas? Responde este mensaje.
```

---

### **2. Desde el Admin** 💼

Tus clientes verán:

**A) Banner de advertencia** (cuando queden ≤7 días):
- Banner amarillo/naranja en la parte superior
- Botón "Ver planes" → Redirige a /pricing
- ✅ **Ya implementado**

**B) Botón "Suscripción" en el header:**
- Morado, siempre visible
- Icono de tarjeta de crédito
- Click → Va a /billing
- ✅ **Ya implementado**

---

### **3. Página de Gestión /billing** 📊

**URL:** `https://lealta.app/billing`

**Qué verán:**
- ✅ Estado actual de suscripción
- ✅ Días restantes de trial
- ✅ Botón grande "Suscribirme Ahora"
- ✅ Información del plan ($250/mes)
- ✅ Acceso a facturas (si ya pagaron)

**✅ Ya creada y funcional**

---

## 📋 CHECKLIST ANTES DE CONTACTAR CLIENTES

### 1. Verificar Paddle está configurado
```bash
# En .env.local o variables de entorno:
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx  # O live_xxx para producción
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_xxx
```

**¿Dónde conseguir esto?**
- Paddle Dashboard > Developer Tools > Authentication
- Paddle Dashboard > Catalog > Prices → Copiar ID del plan

---

### 2. Probar el flujo completo
```bash
1. Ve a https://lealta.app/pricing
2. Click en "Suscribirme"
3. Debería abrir checkout de Paddle
4. Completa con tarjeta de prueba (modo sandbox)
5. Verifica que redirige a /billing/success
6. Verifica que webhook actualiza la DB
```

**Tarjeta de prueba Paddle (Sandbox):**
```
Número: 4242 4242 4242 4242
Fecha: Cualquier fecha futura
CVV: Cualquier 3 dígitos
```

---

### 3. Verificar Webhook funciona
```bash
# En Paddle Dashboard > Notifications:
URL: https://lealta.app/api/webhooks/paddle
Status: ✅ Active
Events: 19 configurados

# Probar manualmente:
1. Hacer un pago de prueba
2. Ver en Paddle Dashboard > Events
3. Verificar que llegó a tu servidor
4. Verificar que actualizó la DB
```

---

## 🚀 SCRIPT DE CONTACTO PARA CLIENTES

### **Email Template:**

```
Asunto: [IMPORTANTE] Activa tu suscripción de Lealta

Hola [NOMBRE],

Espero que estés disfrutando de Lealta. 

Te escribo porque tu periodo de prueba está por terminar pronto. 
Para continuar usando el sistema sin interrupciones, necesitas 
activar tu suscripción.

🔗 Activa tu suscripción aquí: https://lealta.app/pricing

📋 PLAN ENTERPRISE - $250 USD/mes
✅ Reservas ilimitadas
✅ Staff ilimitado  
✅ QR personalizado
✅ Sistema de fidelización
✅ Soporte prioritario

El proceso toma solo 2 minutos y tu acceso se activa 
automáticamente.

¿Tienes dudas o necesitas ayuda? Responde este email 
o llámame al [TU TELÉFONO].

Saludos,
[TU NOMBRE]

---

PD: También puedes gestionar tu suscripción desde el 
admin de Lealta haciendo click en "Suscripción" (botón 
morado en la esquina superior derecha).
```

---

### **WhatsApp Template:**

```
Hola [NOMBRE]! 👋

Tu periodo de prueba de Lealta está por terminar.

Para seguir usando el sistema, activa tu suscripción:
🔗 https://lealta.app/pricing

💰 $250 USD/mes - Todo incluido
⚡ Activación instantánea

¿Dudas? Escríbeme aquí mismo 😊
```

---

## 🎯 ACCIONES INMEDIATAS

### **Para clientes que ya quieren pagar:**
1. ✅ Enviar link de /pricing
2. ✅ Están listos para pagar ahora mismo
3. ✅ Recibirán email de confirmación de Paddle
4. ✅ Acceso se activa automáticamente vía webhook

---

### **Para clientes que necesitan más tiempo:**
```sql
-- Dar 7 días extra mientras deciden:
UPDATE "Business" 
SET "trialEndsAt" = NOW() + INTERVAL '7 days'
WHERE id = 'business_id';
```

---

### **Para clientes legacy (sin trialEndsAt):**
- ✅ No hacer nada
- ✅ Ya tienen acceso completo
- ✅ Puedes contactarlos cuando decidas aplicar trials

---

## 🔥 PROMOCIÓN OPCIONAL

Si quieres incentivar pagos inmediatos:

### **Descuento por pago anticipado:**
```
"🎁 OFERTA ESPECIAL

Activa tu suscripción hoy y obtén:
✅ Primer mes a $199 USD (ahorra $51)
✅ Desarrollo de feature personalizada
✅ Onboarding dedicado 1-a-1

Válido solo por 48 horas.
Link: https://lealta.app/pricing?promo=FIRST199
```

**Para implementar descuento:**
1. Crear precio especial en Paddle ($199)
2. Usar ese priceId en el checkout
3. Actualizar después al precio normal

---

## 📊 MONITOREO

### **Saber quién está por expirar:**
```sql
-- Clientes que expiran en los próximos 7 días:
SELECT 
  b.id,
  b.name,
  b."trialEndsAt",
  DATE_PART('day', b."trialEndsAt" - NOW()) as dias_restantes,
  u.email as admin_email,
  u.name as admin_name
FROM "Business" b
LEFT JOIN "User" u ON u."businessId" = b.id AND u.role = 'SUPERADMIN'
WHERE b."trialEndsAt" IS NOT NULL
  AND b."subscriptionStatus" != 'active'
  AND b."trialEndsAt" > NOW()
  AND b."trialEndsAt" < NOW() + INTERVAL '7 days'
ORDER BY b."trialEndsAt" ASC;
```

---

### **Saber quién ya expiró:**
```sql
SELECT 
  b.id,
  b.name,
  b."trialEndsAt",
  DATE_PART('day', NOW() - b."trialEndsAt") as dias_expirados,
  u.email as admin_email
FROM "Business" b
LEFT JOIN "User" u ON u."businessId" = b.id AND u.role = 'SUPERADMIN'
WHERE b."trialEndsAt" IS NOT NULL
  AND b."subscriptionStatus" != 'active'
  AND b."trialEndsAt" < NOW()
ORDER BY b."trialEndsAt" ASC;
```

---

## ✅ RESUMEN EJECUTIVO

**LO QUE TIENES:**
- ✅ Página de pricing funcional (/pricing)
- ✅ Página de gestión (/billing)
- ✅ Banner de advertencia en admin
- ✅ Botón de suscripción siempre visible
- ✅ Página de éxito después del pago
- ✅ Integración completa con Paddle

**LO QUE FALTA:**
- ⚠️ Verificar variables de entorno de Paddle
- ⚠️ Probar flujo completo en desarrollo
- ⚠️ Contactar a clientes con el mensaje

**TIEMPO ESTIMADO PARA ACTIVAR:**
- ✅ Sistema: **LISTO**
- ⏱️ Pruebas: **15 minutos**
- 📧 Contactar clientes: **Ahora mismo**

---

## 🆘 SOPORTE RÁPIDO

### Cliente no puede pagar:
1. Verificar que /pricing carga
2. Ver consola del navegador (F12) para errores
3. Verificar variables de Paddle están configuradas

### Cliente pagó pero no tiene acceso:
1. Verificar pago en Paddle Dashboard
2. Verificar webhook llegó (Events en Paddle)
3. Si no llegó, reenviar webhook manualmente
4. O actualizar DB manualmente

### ¿Preguntas?
Checa los archivos:
- `GUIA_CLIENTES_PAGAR.md` - Esta guía
- `IMPLEMENTACION_TRIALS_SAFE.md` - Documentación técnica
- `ACTIVACION_PADDLE_TRIAL_14_DIAS.md` - Plan completo

---

**🚀 ESTÁS LISTO PARA RETENER CLIENTES** 💪
