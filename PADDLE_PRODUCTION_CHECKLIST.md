# ✅ PADDLE PRODUCTION CHECKLIST

**Objetivo:** Activar Paddle en producción de forma segura  
**Deadline sugerido:** Esta semana  
**Tiempo estimado:** 1-2 días

---

## 🔴 PASO 1: FIXES CRÍTICOS (3 horas)

### 1.1 Implementar PaymentHistory Model
- [ ] Abrir `prisma/schema.prisma`
- [ ] Agregar modelo `PaymentHistory` (ver `PADDLE_FIXES_CRITICOS.md`)
- [ ] Agregar relación en modelo `Business`
- [ ] Ejecutar: `npx prisma format`
- [ ] Ejecutar: `npx prisma generate`
- [ ] Ejecutar: `npx prisma migrate dev --name add-payment-history`
- [ ] Verificar en database que la tabla se creó correctamente

### 1.2 Actualizar Webhook Transaction Handler
- [ ] Abrir `src/app/api/webhooks/paddle/route.ts`
- [ ] Reemplazar función `handleTransactionCompleted()` 
- [ ] Agregar funciones `handlePaymentFailed()`, `handleSubscriptionPastDue()`, `handleSubscriptionPaused()`
- [ ] Actualizar switch statement con nuevos eventos
- [ ] Guardar archivo

### 1.3 Validar Variables de Entorno
- [ ] Abrir `src/lib/paddle.ts`
- [ ] Agregar validación de env vars (ver `PADDLE_FIXES_CRITICOS.md`)
- [ ] Guardar archivo
- [ ] Reiniciar servidor y verificar que no haya errores

### 1.4 Actualizar Handlers con Trial Support
- [ ] Modificar `handleSubscriptionCreated()` para incluir `trialEndsAt`
- [ ] Modificar `handleSubscriptionUpdated()` para incluir `trialEndsAt`
- [ ] Guardar archivo

### 1.5 Mejorar Error Handling
- [ ] Abrir `src/app/api/billing/checkout/route.ts`
- [ ] Reemplazar bloque catch con nuevo código
- [ ] Agregar manejo de errores específicos de Paddle
- [ ] Guardar archivo

### 1.6 Limpiar Código Muerto
- [ ] Abrir `src/lib/paddle.ts`
- [ ] Eliminar o deprecar `paddleUtils.verifyWebhook()`
- [ ] Agregar comentario explicando dónde está la implementación real
- [ ] Guardar archivo

**✅ Checkpoint:** Código actualizado y servidor corriendo sin errores

---

## 🟡 PASO 2: CONFIGURACIÓN DE PADDLE (2 horas)

### 2.1 Crear Cuenta de Producción
- [ ] Ir a https://paddle.com
- [ ] Si ya tienes cuenta, verificar que esté en modo Production
- [ ] Completar información de negocio (tax info, bank details)
- [ ] Obtener aprobación de cuenta (puede tomar 1-2 días)

### 2.2 Crear Plan Enterprise en Dashboard
- [ ] Ir a **Catalog** > **Products**
- [ ] Crear nuevo producto: "Lealta Enterprise"
- [ ] Configurar precio: $250 USD/mes
- [ ] Habilitar billing recurrente (monthly)
- [ ] Opcional: Agregar plan anual ($2,500/año con descuento)
- [ ] Copiar el **Price ID** (formato: `pri_xxxxxxxxxxxxx`)

### 2.3 Obtener Credenciales API
- [ ] Ir a **Developer Tools** > **Authentication**
- [ ] Crear nuevo API Key con permisos de lectura/escritura
- [ ] Copiar `PADDLE_API_KEY`
- [ ] Copiar `PADDLE_CLIENT_TOKEN`
- [ ] Copiar `PADDLE_VENDOR_ID`

### 2.4 Configurar Webhook
- [ ] Ir a **Developer Tools** > **Notifications** > **Webhooks**
- [ ] Click **"Create Webhook"**
- [ ] URL: `https://tudominio.com/api/webhooks/paddle`
- [ ] Seleccionar eventos:
  - [x] subscription.created
  - [x] subscription.updated
  - [x] subscription.canceled
  - [x] transaction.completed
  - [x] transaction.payment_failed
  - [x] subscription.past_due
  - [x] subscription.paused
- [ ] Copiar `PADDLE_WEBHOOK_SECRET` (formato: `pdl_whsec_xxxxx`)

**✅ Checkpoint:** Credenciales obtenidas

---

## 🟢 PASO 3: CONFIGURAR VARIABLES DE ENTORNO (30 min)

### 3.1 Actualizar .env en Servidor de Producción
```bash
# Paddle Production Credentials
PADDLE_VENDOR_ID="tu_vendor_id_aqui"
PADDLE_CLIENT_TOKEN="tu_client_token_aqui"
PADDLE_API_KEY="tu_api_key_aqui"
PADDLE_WEBHOOK_SECRET="pdl_whsec_tu_secret_aqui"

# Cambiar a production
NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"

# Price ID del plan enterprise creado
PADDLE_PLAN_ENTERPRISE_ID="pri_tu_price_id_aqui"

# URL de tu app en producción
NEXT_PUBLIC_APP_URL="https://tudominio.com"
```

### 3.2 Verificar Variables
- [ ] Variables configuradas en Vercel/Railway/tu_hosting
- [ ] Redeploy de la aplicación
- [ ] Verificar logs: no debe haber warnings sobre env vars faltantes

**✅ Checkpoint:** Variables de entorno configuradas

---

## 🧪 PASO 4: TESTING EN SANDBOX (2 horas)

### 4.1 Probar Checkout Flow
- [ ] Ir a `/pricing` en tu app
- [ ] Click en "Contratar Solución Enterprise"
- [ ] Verificar que se cree el checkout correctamente
- [ ] Usar tarjeta de prueba de Paddle para completar pago
- [ ] Verificar redirect a `/billing/success`

### 4.2 Verificar Database Updates
- [ ] Abrir database tool (Prisma Studio o pgAdmin)
- [ ] Verificar que `Business` tenga:
  - `subscriptionId` poblado
  - `subscriptionStatus` = "active"
  - `planId` correcto
- [ ] Verificar que exista registro en `PaymentHistory`

### 4.3 Probar Webhooks
- [ ] Ir a Paddle Dashboard > Webhooks
- [ ] Ver si los webhooks se enviaron correctamente
- [ ] Verificar logs de tu app: debe mostrar "✅ Webhook recibido"
- [ ] Simular eventos desde Paddle Testing Tool

### 4.4 Probar Cancelación
- [ ] Desde Paddle Dashboard, cancelar la suscripción de prueba
- [ ] Verificar que se actualice el status en database
- [ ] Verificar que el webhook se procese correctamente

**✅ Checkpoint:** Todo funciona en sandbox

---

## 🚀 PASO 5: DEPLOY A PRODUCCIÓN (1 hora)

### 5.1 Pre-Deploy Checklist
- [ ] Código actualizado en main branch
- [ ] Todos los tests pasando (si tienes)
- [ ] Variables de entorno configuradas
- [ ] Migración de database aplicada
- [ ] Backup de database tomado

### 5.2 Deploy
- [ ] Push código a producción
- [ ] Esperar a que deploy complete
- [ ] Verificar que app esté up: `https://tudominio.com`
- [ ] Verificar logs: no debe haber errores

### 5.3 Smoke Test en Producción
- [ ] Ir a `/pricing`
- [ ] Verificar que muestre el plan correcto
- [ ] NO hacer checkout todavía (siguiente paso)

**✅ Checkpoint:** App deployada

---

## 💳 PASO 6: PRIMER PAGO DE PRUEBA (30 min)

### 6.1 Hacer Test con Tarjeta Real (TUYA)
- [ ] Ir a `/pricing` en producción
- [ ] Click "Contratar Solución Enterprise"
- [ ] Usar TU tarjeta de crédito real
- [ ] Completar pago ($250)
- [ ] Verificar redirect a success page

### 6.2 Verificar Todo Funciona
- [ ] Check email: debe llegar recibo de Paddle
- [ ] Check database: subscription creada
- [ ] Check Paddle Dashboard: transacción visible
- [ ] Check logs: webhooks procesados

### 6.3 Opcional: Cancelar Suscripción de Prueba
- [ ] Desde Paddle Dashboard, cancelar tu suscripción
- [ ] O dejarla activa para testing continuo

**✅ Checkpoint:** Primer pago exitoso

---

## 📊 PASO 7: MONITORING Y ALERTAS (1 hora)

### 7.1 Configurar Alertas Básicas
- [ ] Email cuando un pago falla
- [ ] Email cuando se cancela suscripción
- [ ] Email cuando webhook falla 3+ veces
- [ ] Dashboard de métricas de Paddle

### 7.2 Crear Dashboard Interno
Opcional pero recomendado:
- [ ] Página `/admin/billing` con métricas
- [ ] Total MRR (Monthly Recurring Revenue)
- [ ] Suscripciones activas
- [ ] Tasa de churn
- [ ] Últimos pagos

### 7.3 Documentar Procedimientos
- [ ] Cómo hacer refund
- [ ] Cómo investigar pago fallido
- [ ] Contacto de soporte de Paddle
- [ ] Runbook para el equipo

**✅ Checkpoint:** Monitoring activo

---

## 🎉 PASO 8: ACTIVACIÓN COMPLETA (30 min)

### 8.1 Comunicación a Usuarios
- [ ] Email announcement: "Ahora aceptamos pagos"
- [ ] Banner en dashboard
- [ ] Post en redes sociales (opcional)

### 8.2 Invitar Beta Testers
- [ ] Enviar invitaciones a 2-3 clientes de confianza
- [ ] Ofrecer descuento (10-20% primer mes)
- [ ] Recopilar feedback

### 8.3 Monitorear Primeras 24 Horas
- [ ] Revisar logs cada 2-4 horas
- [ ] Responder rápido a issues
- [ ] Estar disponible para soporte

**✅ Checkpoint:** Sistema en producción activa

---

## 📈 PASO 9: OPTIMIZACIÓN POST-LAUNCH (ongoing)

### Semana 1-2
- [ ] Analizar tasa de conversión en `/pricing`
- [ ] Identificar puntos de fricción en checkout
- [ ] Optimizar copy y diseño si es necesario
- [ ] Recopilar feedback de usuarios

### Mes 1
- [ ] Analizar métricas de churn
- [ ] Implementar automatización de emails
- [ ] Crear proceso de onboarding para nuevos pagadores
- [ ] A/B test de precios (opcional)

### Ongoing
- [ ] Revisar Paddle Dashboard semanalmente
- [ ] Reconciliar pagos con contabilidad mensualmente
- [ ] Actualizar documentación según feedback
- [ ] Iterar basado en datos

---

## 🆘 PLAN DE CONTINGENCIA

### Si algo falla:

**Problema:** Checkout no se crea
- Verificar credenciales de API
- Revisar logs: `/api/billing/checkout`
- Verificar Price ID es correcto
- Contactar soporte de Paddle

**Problema:** Webhooks no llegan
- Verificar URL del webhook es accesible públicamente
- Verificar que no esté bloqueado por firewall
- Probar webhook con Testing Tool de Paddle
- Verificar logs del servidor

**Problema:** Pago no se refleja en database
- Revisar logs de webhooks
- Verificar que `PADDLE_WEBHOOK_SECRET` sea correcto
- Manualmente procesar el webhook desde Paddle Dashboard
- Revisar que modelo PaymentHistory exista

**Problema:** Cliente reporta problema
1. Ir a Paddle Dashboard > Customers
2. Buscar por email del cliente
3. Ver historial de transacciones
4. Verificar status de suscripción
5. Ofrecer refund si es necesario

---

## 📞 CONTACTOS IMPORTANTES

- **Paddle Support:** support@paddle.com
- **Paddle Docs:** https://developer.paddle.com/
- **Paddle Status:** https://status.paddle.com/
- **Community Slack:** https://paddle-community.slack.com/

---

## 📊 MÉTRICAS DE ÉXITO

Al final de la primera semana:
- [ ] Al menos 1 pago exitoso (el tuyo)
- [ ] 0 errores críticos en producción
- [ ] 0 webhooks fallidos
- [ ] 2-3 beta testers onboardeados

Al final del primer mes:
- [ ] 5+ suscripciones activas
- [ ] < 5% tasa de churn
- [ ] 95%+ uptime del sistema
- [ ] Feedback positivo de clientes

---

## 🎯 NEXT STEPS DESPUÉS DE PRODUCCIÓN

1. **Implementar testing automatizado** (Playwright/Cypress)
2. **Agregar más planes** (Starter, Professional)
3. **Sistema de referidos** con descuentos
4. **Analytics avanzados** de conversión
5. **A/B testing** de pricing page
6. **Integración con CRM** (HubSpot, Salesforce)
7. **Automatización de emails** (onboarding, churn prevention)

---

## ✅ RESUMEN

**Total tiempo estimado:** 8-10 horas de trabajo  
**Deadline recomendado:** Viernes de esta semana  
**Riesgo:** Bajo (tienes sandbox para probar primero)  
**Reward:** Sistema de billing production-ready 💰

---

**¿Listo para empezar?** 

Comienza con PASO 1 (Fixes Críticos) y ve marcando las casillas.  
¡Mucho éxito con el launch! 🚀
