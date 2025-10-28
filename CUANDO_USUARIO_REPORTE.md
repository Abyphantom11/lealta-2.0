# 🚨 Protocolo: Usuario Reporta Problema de Hora/Fecha

## 📋 Checklist Inmediato

Cuando un usuario reporte que las reservas tienen hora/fecha incorrecta:

### 1️⃣ Recopilar Información del Usuario (2 minutos)

**Pregúntale por WhatsApp/Chat:**

```
Hola! Para ayudarte con el problema de la hora, necesito que me envíes:

1. Screenshot de la reserva que se guardó incorrectamente
2. Abre la app, presiona F12 (o mantén presionado la pantalla y "Inspeccionar")
3. Ve a la pestaña "Console"
4. Busca líneas que empiecen con 🔥📱 o 🌍
5. Toma screenshot de esos logs
6. ¿Qué navegador usas? (Chrome, Safari, Firefox, etc)
7. ¿Qué hora ingresaste vs qué hora se guardó?
```

### 2️⃣ Revisar Logs del Servidor (1 minuto)

**En Vercel Dashboard:**
1. Ve a https://vercel.com/dashboard
2. Proyecto `lealta-2.0` → "Logs"
3. Busca el timestamp aproximado cuando el usuario hizo la reserva
4. Busca emojis: `🔥🕐` `🔥📅` `🔥✅`

**Logs Críticos a Buscar:**

```javascript
// 1. Al cambiar HORA:
🔥🕐 DEBUG HORA - INICIO: {
  horaRecibida: "14:00",  // ⚠️ Qué hora recibió el backend
  reservedAtActual: "...", // ⚠️ Qué tenía antes
}

🔥🕐 DEBUG HORA - Componentes fecha UTC extraídos: {
  year: 2025,
  month: 9,   // ⚠️ JavaScript months (0-11), 9 = Octubre
  day: 28,    // ⚠️ El día cambió?
}

🔥🕐 DEBUG HORA - Resultado final: {
  fechaGuardada: "2025-10-28T19:00:00.000Z",  // ⚠️ UTC
  horaEcuadorInput: "14:00",                   // ⚠️ Lo que ingresó
  horaUTCGuardada: "19:00",                    // ⚠️ Debe ser input+5
  horaFormateadaParaMostrar: "14:00"           // ⚠️ Lo que debe mostrar
}

// 2. Después de guardar:
🔥✅ SERVIDOR - Reserva GUARDADA EN BD: {
  componentes: {
    yearUTC: 2025,
    monthUTC: 10,   // ⚠️ El mes cambió?
    dayUTC: 28,     // ⚠️ El día cambió?
    hourUTC: 19,    // ⚠️ Es horaInput + 5?
    minuteUTC: 0,
    horaEcuador: "14:00"  // ⚠️ Debe coincidir con input
  }
}
```

### 3️⃣ Comparar: Frontend vs Backend (30 segundos)

**Del screenshot del usuario (Console):**
```javascript
🔥📱 FRONTEND - DATOS A ENVIAR AL API: {
  horaQueSeEnvia: "14:00"  // ← QUÉ ENVIÓ EL NAVEGADOR
}

🌍 INFO NAVEGADOR/TIMEZONE: {
  timezone: "America/New_York",  // ⚠️ SI NO ES "America/Guayaquil" PUEDE SER EL PROBLEMA
  offsetMinutos: 300             // ⚠️ Debería ser 300 (UTC-5)
}
```

**De Vercel Logs:**
```javascript
🔥🕐 DEBUG HORA - INICIO: {
  horaRecibida: "14:00"  // ← QUÉ RECIBIÓ EL SERVIDOR
}
```

**✅ SI COINCIDEN:** El problema está en el servidor
**❌ SI NO COINCIDEN:** El problema está en el navegador/frontend

### 4️⃣ Diagnóstico Rápido

#### Escenario A: Timezone del Navegador Diferente
```javascript
// Usuario tiene:
timezone: "America/New_York"  // ❌ MAL
offsetMinutos: 300

// Debería ser:
timezone: "America/Guayaquil"  // ✅ BIEN
offsetMinutos: 300
```

**Solución:** El usuario debe cambiar timezone de su dispositivo

#### Escenario B: Hora se Suma Doble
```javascript
// Input: 14:00
// Guardado: 2025-10-28T24:00:00.000Z  // ❌ +10 horas (doble +5)

🔥🕐 DEBUG HORA - Resultado final: {
  horaUTCGuardada: "24:00"  // ❌ Debería ser "19:00"
}
```

**Solución:** Bug en el código, estamos sumando +5 dos veces

#### Escenario C: Día Cambia Incorrectamente
```javascript
// Input: 28 Oct, 14:00
// Guardado: 29 Oct, 19:00  // ❌ Día cambió

🔥🕐 DEBUG HORA - Componentes fecha UTC extraídos: {
  day: 29  // ❌ Debería ser 28
}
```

**Solución:** Bug en extracción de componentes UTC

### 5️⃣ Respuesta al Usuario (Inmediata)

**Si es problema del usuario (timezone):**
```
He revisado los logs y el problema es que tu dispositivo está 
configurado en timezone diferente. Por favor:

1. Ve a Configuración → Fecha y Hora
2. Activa "Usar timezone automático" o selecciona "Quito/Guayaquil"
3. Recarga la app y vuelve a intentar

¡Avísame cuando lo hayas hecho!
```

**Si es bug del código:**
```
Gracias por reportar! He identificado el problema en los logs:
[explicación breve]

Estoy trabajando en la solución ahora mismo. Te aviso cuando 
esté corregido (en ~10-15 minutos).

Mientras tanto, las reservas existentes están seguras.
```

### 6️⃣ Fix Rápido si es Bug del Código

**Abrir archivo correspondiente:**
- Si el problema está en `componentes fecha UTC extraídos`: `src/app/api/reservas/[id]/route.ts`
- Si el problema está en `horaUTCGuardada`: `src/app/api/reservas/[id]/route.ts`
- Si el problema está en frontend: `src/app/reservas/components/ReservationEditModal.tsx`

**Hacer cambio, commit y push:**
```bash
# Fix rápido
git add archivo_corregido.ts
git commit -m "🔥 HOTFIX: [descripción del problema específico]"
git push origin main

# Vercel auto-deploy en ~2 minutos
```

### 7️⃣ Verificar Fix en Producción (2 minutos)

1. Espera deploy de Vercel (notificación o check en dashboard)
2. Crea reserva de prueba en producción
3. Edita la hora
4. Verifica en Vercel Logs que los componentes sean correctos
5. Notifica al usuario

---

## 🎯 Quick Reference: Valores Esperados

### Hora Ecuador → Hora UTC
```
Input: 00:00 → UTC: 05:00 ✅
Input: 09:00 → UTC: 14:00 ✅
Input: 14:00 → UTC: 19:00 ✅
Input: 18:00 → UTC: 23:00 ✅
Input: 23:00 → UTC: 04:00 (día+1) ✅
```

### Componentes UTC
```javascript
// Si input es: 2025-10-28 14:00 Ecuador
{
  yearUTC: 2025,     ✅
  monthUTC: 10,      ✅ (Octubre)
  dayUTC: 28,        ✅ (mismo día porque 14+5=19 < 24)
  hourUTC: 19,       ✅ (14 + 5)
  minuteUTC: 0,      ✅
  horaEcuador: "14:00"  ✅
}
```

### Cambio de Día
```javascript
// Si input es: 2025-10-28 22:00 Ecuador
{
  yearUTC: 2025,     ✅
  monthUTC: 10,      ✅
  dayUTC: 29,        ✅ (día+1 porque 22+5=27 pero se representa como 03:00 del día siguiente)
  hourUTC: 3,        ✅ (22 + 5 = 27, que es 03:00 del día siguiente)
  horaEcuador: "22:00"  ✅
}
```

---

## 📞 Contactos de Emergencia

- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/Abyphantom11/lealta-2.0
- **Logs Command:** `vercel logs --follow`

---

## 🔧 Herramientas de Debug Adicionales

Si necesitas debug más profundo, puedes hacer que el usuario abra:
```
https://tu-app.com?debug=true
```

Esto activará logs adicionales (si implementas Eruda como sugiere DEBUG_PRODUCTION.md)
