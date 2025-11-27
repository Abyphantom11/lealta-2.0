# 📱 Guía: Pasar WhatsApp a Producción

## Tu Situación Actual

| Elemento | Estado | Nota |
|----------|--------|------|
| Número aprobado por Meta | ✅ | Listo |
| Template en aprobación | ⏳ | Esperando Meta |
| Modo actual | 🧪 Sandbox | Solo números verificados |

## ❓ ¿Puedo enviar a mi base de datos?

### En Sandbox (Ahora):
❌ **NO** - Solo puedes enviar a números que hayan enviado "join" a tu sandbox.

### En Producción (Después de aprobar template):
✅ **SÍ** - Podrás enviar a cualquier número usando templates aprobados.

---

## 🚀 Pasos para Activar Producción

### Paso 1: Esperar Aprobación del Template
Meta puede tardar entre 24 horas y varios días en aprobar templates.

**Para verificar estado:**
1. Ve a [Twilio Console](https://console.twilio.com)
2. Messaging > Content Template Builder
3. Busca tu template y verifica el estado

### Paso 2: Obtener tu Número de WhatsApp Business
Una vez aprobado, tu número de producción será diferente al sandbox.

**Formato:**
```
whatsapp:+593XXXXXXXXX  (tu número aprobado)
```

### Paso 3: Actualizar Variables de Entorno

Edita tu archivo `.env.local`:

```bash
# ⚠️ CAMBIAR ESTAS LÍNEAS:

# De Sandbox:
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
TWILIO_WHATSAPP_SANDBOX="true"

# A Producción:
TWILIO_WHATSAPP_NUMBER="whatsapp:+593TU_NUMERO_APROBADO"
TWILIO_WHATSAPP_SANDBOX="false"

# Eliminar esta línea (ya no necesaria):
# TWILIO_VERIFIED_NUMBERS="..."
```

### Paso 4: Configurar Template SID

Agrega el SID de tu template aprobado:

```bash
# En .env.local agregar:
TWILIO_TEMPLATE_SID="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 📝 Tipos de Mensajes Permitidos

### 1. Mensajes de Template (Sin restricción de 24h)
- ✅ Pueden enviarse a CUALQUIER número
- ✅ Deben usar un template aprobado por Meta
- ✅ Ideal para: promociones, recordatorios, campañas

### 2. Mensajes de Sesión (Ventana de 24h)
- ⚠️ Solo si el usuario te escribió en las últimas 24 horas
- ✅ Puedes enviar texto libre
- ✅ Ideal para: respuestas, soporte, conversaciones

---

## 🔧 Configuración del Template en Código

Una vez aprobado, actualiza `src/lib/whatsapp.ts`:

```typescript
// Templates de WhatsApp aprobados por Meta
const WHATSAPP_TEMPLATES = {
  tu_template_nombre: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Tu nuevo template
  estamos_abiertos: 'HX2e1e6f8cea11d2c18c1761ac48c0ca29',
};
```

---

## 📊 Límites de Mensajes

| Tier | Mensajes/24h | Cómo desbloquear |
|------|--------------|------------------|
| Tier 1 | 1,000 | Al iniciar |
| Tier 2 | 10,000 | Después de 7 días con buena calidad |
| Tier 3 | 100,000 | Después de 30 días con buena calidad |
| Ilimitado | Sin límite | Excelente historial |

---

## ⚠️ Importante: Calidad de Mensajes

Meta monitorea la calidad de tus mensajes:

| Indicador | Bueno | Malo |
|-----------|-------|------|
| Tasa de bloqueo | < 2% | > 5% |
| Tasa de reportes | < 0.1% | > 1% |
| Respuestas | > 10% | < 1% |

**Consecuencias de mala calidad:**
- 🟡 Advertencia
- 🟠 Límite reducido
- 🔴 Suspensión del número

---

## ✅ Checklist Final

Antes de enviar campañas masivas:

- [ ] Template aprobado por Meta
- [ ] Número de producción configurado
- [ ] `TWILIO_WHATSAPP_SANDBOX="false"`
- [ ] Template SID agregado al código
- [ ] Prueba con 1 número antes de envío masivo
- [ ] Base de datos con opt-in (consentimiento)

---

## 🆘 ¿Problemas?

### Error: "Number not in whitelist"
→ Estás en sandbox y el número no ha hecho "join"

### Error: "Template not approved"
→ Tu template aún no fue aprobado por Meta

### Error: "Rate limit exceeded"
→ Excediste el límite de tu tier, espera 24h

---

## 📞 Próximos Pasos

1. **Ahora:** Esperar aprobación del template
2. **Cuando esté aprobado:** Actualizar `.env.local`
3. **Probar:** Enviar mensaje a 1 número de prueba
4. **Si funciona:** Comenzar envíos a la base de datos

¿Necesitas ayuda con algún paso? 🚀
