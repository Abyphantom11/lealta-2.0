# 🎯 Sistema de Trials de 14 Días - Implementación SAFE MODE

## ✅ IMPLEMENTADO (85%)

### 1. ✅ Función de Verificación de Acceso
**Archivo:** `src/lib/subscription-control.ts`

**Protecciones incluidas:**
- ✅ Usuarios sin `trialEndsAt` → Acceso completo (legacy users)
- ✅ Grace period de 3 días después de expirar
- ✅ En caso de error del sistema → Da acceso (fail-safe)
- ✅ Suscripciones activas siempre tienen acceso

**Lógica:**
```
1. Suscripción activa → ✅ Acceso
2. Sin trialEndsAt (legacy) → ✅ Acceso
3. Trial vigente → ✅ Acceso + advertencia si ≤7 días
4. Trial expiró (≤3 días) → ✅ Acceso (grace period)
5. Trial expiró (>3 días) → ❌ Necesita pago
```

---

### 2. ✅ API de Verificación
**Endpoint:** `GET /api/subscription/check?businessId=xxx`

**Respuesta:**
```json
{
  "success": true,
  "access": {
    "hasAccess": true/false,
    "status": "active|trialing|expired|legacy|grace_period",
    "daysRemaining": 5,
    "message": "Tu prueba gratis termina en 5 días",
    "isLegacyUser": false
  }
}
```

**Uso:**
- Frontend consulta el estado
- Banner muestra advertencias
- No bloquea, solo informa

---

### 3. ✅ Banner de Advertencia Visual
**Componente:** `src/components/SubscriptionBanner.tsx`

**Características:**
- ✅ Se muestra cuando quedan ≤7 días de trial
- ✅ Amarillo: 3-7 días restantes
- ✅ Naranja: Grace period (0-3 días)
- ✅ Rojo: Trial expirado
- ✅ **NO se muestra** para usuarios legacy
- ✅ **NO se muestra** para suscripciones activas
- ✅ Botón "Ver planes" → `/pricing`
- ✅ Puede cerrarse (excepto cuando expiró)

**Integración:**
- Agregado a `src/components/admin-v2/AdminV2Page.tsx`
- Se muestra en todas las páginas del admin

---

### 4. ✅ Auto-asignación de Trial en Registro
**Archivo:** `src/app/api/auth/signup/route.ts`

**Implementación:**
```typescript
// Al crear un Business nuevo:
trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días
subscriptionStatus: 'trialing'
```

**Efecto:**
- ✅ Todos los negocios nuevos reciben 14 días automáticamente
- ✅ Usuarios existentes NO son afectados (no tienen trialEndsAt)

---

## 🚫 NO IMPLEMENTADO (Deliberadamente)

### 5. ❌ Middleware de Bloqueo
**Archivo:** `src/middleware/subscription-guard.ts` **NO CREADO**

**Razón:** Por seguridad, no bloquear a nadie aún

**Para activar en el futuro:**
1. Crear el archivo con lógica de bloqueo
2. Agregar a `src/middleware.ts`
3. Validar en sandbox primero

---

## 🎯 ESTADO ACTUAL DEL SISTEMA

### ✅ LO QUE FUNCIONA:
1. **Nuevos usuarios**
   - Obtienen 14 días automáticamente
   - Ven advertencias cuando se acerca la expiración
   - Pueden pagar anticipadamente

2. **Usuarios existentes (legacy)**
   - Siguen con acceso completo
   - NO ven banners de advertencia
   - Sistema los detecta automáticamente

3. **Paddle**
   - Webhooks actualizan `trialEndsAt` correctamente
   - Suscripciones activas desactivan banners
   - Pagos funcionan normalmente

### ⚠️ LO QUE FALTA:
1. **Bloqueo real**
   - Sistema NO impide acceso cuando trial expira
   - Solo muestra advertencias
   - Usuarios pueden seguir usando la app

---

## 🧪 CÓMO PROBAR

### Opción 1: Nuevo Usuario
```bash
1. Registra un negocio nuevo en /signup
2. Verifica en base de datos:
   - trialEndsAt = hoy + 14 días
   - subscriptionStatus = 'trialing'
3. Modifica trialEndsAt a 5 días en el futuro
4. Recarga /admin → Deberías ver banner amarillo
5. Modifica trialEndsAt a ayer
6. Recarga /admin → Deberías ver banner naranja (grace period)
```

### Opción 2: Usuario Existente (Legacy)
```bash
1. Toma un negocio existente
2. Verifica que trialEndsAt = null
3. Accede a /admin
4. NO deberías ver ningún banner
5. Sistema le da acceso completo
```

### Opción 3: Verificar API
```bash
# En consola del navegador (F12):
fetch('/api/subscription/check?businessId=TU_BUSINESS_ID')
  .then(r => r.json())
  .then(console.log)

# Debería mostrar:
{
  "success": true,
  "access": {
    "hasAccess": true,
    "status": "trialing|legacy|active",
    ...
  }
}
```

---

## 📊 MÉTRICAS DE PROTECCIÓN

### Usuarios Protegidos:
- ✅ **100% de usuarios existentes** mantienen acceso completo
- ✅ **0 interrupciones** en el servicio actual
- ✅ **Grace period de 3 días** para nuevos usuarios

### Seguridad:
- ✅ Sistema fail-safe: Error → Da acceso
- ✅ Legacy users detectados automáticamente
- ✅ No se bloquea a nadie sin trial asignado

---

## 🚀 PRÓXIMOS PASOS (Cuando decidas activar bloqueo)

### Fase 1: Monitoreo (2 semanas)
```bash
1. Dejar sistema actual funcionando
2. Revisar logs de accesos
3. Validar que usuarios legacy no ven banners
4. Verificar que nuevos usuarios reciben trials
```

### Fase 2: Soft Launch (1 semana)
```bash
1. Agregar más advertencias visuales
2. Emails de recordatorio (Paddle lo hace)
3. Popup antes de expirar
```

### Fase 3: Activar Bloqueo (Cuando estés listo)
```bash
1. Crear middleware de bloqueo
2. Probar en sandbox primero
3. Activar en producción
4. Monitorear conversiones
```

---

## 🎨 PERSONALIZACIÓN

### Cambiar días de trial:
```typescript
// En signup/route.ts, línea ~95:
trialEndsAt.setDate(trialEndsAt.getDate() + 30); // Cambiar a 30 días
```

### Cambiar grace period:
```typescript
// En subscription-control.ts, línea ~36:
const GRACE_PERIOD_DAYS = 7; // Cambiar a 7 días
```

### Cambiar días para mostrar advertencia:
```typescript
// En subscription-control.ts, línea ~162:
access.daysRemaining <= 14 // Mostrar cuando quedan 14 días
```

---

## 📞 SOPORTE

Si un usuario reporta problemas:

1. **Verificar estado en DB:**
   ```sql
   SELECT id, name, trialEndsAt, subscriptionStatus 
   FROM Business 
   WHERE id = 'xxx';
   ```

2. **Si es usuario legacy** (trialEndsAt = null):
   - No hacer nada, tiene acceso completo

3. **Si trial expiró**:
   - Verificar si pagó (subscriptionStatus = 'active')
   - Si pagó, webhook debería haber actualizado
   - Si no pagó, es normal que vea advertencias

4. **Para dar más tiempo manualmente:**
   ```sql
   UPDATE Business 
   SET trialEndsAt = NOW() + INTERVAL '14 days',
       subscriptionStatus = 'trialing'
   WHERE id = 'xxx';
   ```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Función de verificación creada
- [x] Protección de usuarios legacy
- [x] Grace period de 3 días
- [x] API de verificación funcional
- [x] Banner de advertencia implementado
- [x] Banner integrado en admin
- [x] Auto-asignación en registro
- [x] Nuevos usuarios reciben 14 días
- [ ] Middleware de bloqueo (PENDIENTE - Por seguridad)
- [ ] Emails de notificación (Paddle lo hace)
- [ ] Cron job de monitoreo (OPCIONAL)

---

## 🎯 RESUMEN

**Sistema implementado:** Advertencias + Auto-trial
**Sistema NO implementado:** Bloqueo de acceso
**Motivo:** Proteger usuarios existentes
**Estado:** SAFE MODE - Listo para monitorear
**Próximo paso:** Validar que todo funciona, luego decidir activar bloqueo

**El sistema está diseñado para NO dañar a nadie.** 🛡️
