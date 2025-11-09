# 💳 Guía Rápida: Cómo los Clientes Existentes Pueden Pagar

## 🚀 FORMAS DE ACCESO INMEDIATO

### **Opción 1: Enviar Link Directo (RECOMENDADO)**

Envía este mensaje a tus clientes:

```
¡Hola! 👋

Gracias por usar Lealta. Para continuar disfrutando del servicio, 
puedes activar tu suscripción en:

🔗 https://lealta.app/pricing

Una vez que completes el pago con Paddle, tu acceso se activará 
automáticamente.

Precio: $250 USD/mes por negocio

¿Tienes dudas? Escríbeme y te ayudo.

Saludos,
[Tu nombre]
```

---

### **Opción 2: Agregar Botón en el Admin**

Ya implementado en el banner que creamos. Cuando vean la advertencia:
- ✅ Botón "Ver planes" → Redirige a `/pricing`
- ✅ Visible cuando el trial está por expirar

---

### **Opción 3: Crear Página de Billing**

Voy a crear una página personalizada para gestionar suscripción.

---

## 📋 CHECKLIST PARA ACTIVAR PAGOS HOY

### 1. ✅ Verificar Paddle está configurado
```bash
# En .env o .env.local:
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx  # Sandbox
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_xxx

# O producción:
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_xxx
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_xxx
```

### 2. ✅ Verificar webhook funciona
```bash
# En Paddle Dashboard > Notifications:
URL: https://lealta.app/api/webhooks/paddle
Status: Active ✅
```

### 3. ✅ Precio configurado en Paddle
```
Dashboard > Catalog > Prices
Plan: Enterprise
Precio: $250 USD/mes
ID: pri_xxx (copiar esto)
```

---

## 🎨 CREAR PÁGINA DE GESTIÓN DE SUSCRIPCIÓN

¿Quieres que cree una página `/billing` donde los clientes puedan:
- Ver estado actual de suscripción
- Cambiar tarjeta
- Ver facturas
- Cancelar suscripción

**Código en 5 minutos** ✨

---

## 📞 ATENCIÓN INMEDIATA A CLIENTES

### Para clientes que ya pagaron pero ven advertencias:

1. **Verificar en Paddle Dashboard:**
   - ¿Apareció el pago?
   - ¿Estado de suscripción = "Active"?

2. **Si el webhook no actualizó:**
```sql
-- Manual fix en base de datos:
UPDATE "Business" 
SET 
  "subscriptionStatus" = 'active',
  "subscriptionId" = 'sub_xxx', -- ID de Paddle
  "trialEndsAt" = NULL
WHERE id = 'business_id_del_cliente';
```

3. **Forzar webhook manualmente:**
   - Paddle Dashboard > Event > Replay webhook

---

## 🆘 SOPORTE RÁPIDO

### Cliente dice: "No puedo pagar"

**Checklist:**
- [ ] ¿Tiene cuenta creada? → Enviar link de login
- [ ] ¿Está en /pricing? → Verificar que vea el botón
- [ ] ¿Error en Paddle? → Revisar console del navegador (F12)
- [ ] ¿Tarjeta rechazada? → Paddle envía email con razón

### Cliente dice: "Ya pagué pero no tengo acceso"

**Solución:**
1. Verifica email de confirmación de Paddle
2. Busca subscription ID en Paddle Dashboard
3. Verifica webhook llegó a tu servidor
4. Si no llegó, replica webhook o actualiza manualmente

---

## 💡 MEJORA: Sistema de Invitaciones

Si quieres ser proactivo, crea invitaciones personalizadas:

```typescript
// Crear link único con descuento:
https://lealta.app/pricing?customer=cliente123&discount=FIRST50
```

---

## ⚡ ACCIÓN INMEDIATA

### Para retener clientes HOY:

**Email/WhatsApp urgente:**

```
Hola [Nombre] 👋

Veo que tu cuenta está por expirar. 

Para no interrumpir tu servicio, activa tu suscripción aquí:
🔗 https://lealta.app/pricing

Es instantáneo y puedes seguir usando Lealta sin interrupciones.

Si necesitas ayuda, responde este mensaje.
```

---

## 🎁 OPCIÓN: Dar más tiempo

Si necesitas dar más días mientras deciden:

```sql
-- Extender trial 7 días más:
UPDATE "Business" 
SET "trialEndsAt" = NOW() + INTERVAL '7 days'
WHERE id = 'business_id';
```

---

¿Quieres que cree la página `/billing` completa para gestión de suscripciones?
