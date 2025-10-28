# 🔍 Guía de Debugging en Producción - Problema Timezone

## 📊 Cómo Ver Logs en Producción

### Opción 1: Vercel Dashboard (Recomendado)
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto `lealta-2.0`
3. Click en "Logs" o "Runtime Logs"
4. Busca los emojis de debug:
   - 🔥📱 FRONTEND
   - 🔥🕐 DEBUG HORA
   - 🔥📅 DEBUG FECHA
   - 🔥✅ SERVIDOR

### Opción 2: Vercel CLI (Tiempo Real)
```bash
npm i -g vercel
vercel login
vercel logs --follow
```

### Opción 3: Console del Navegador
Los logs del frontend (🔥📱) aparecen en la consola del navegador del usuario.

## 🎯 Qué Buscar en los Logs

### Cuando el usuario reporta el problema:

1. **Pide al usuario que abra Console (F12)**
   - Chrome/Edge: F12 → Console
   - Safari: Cmd+Option+C
   - Firefox: F12 → Console

2. **Busca estos logs específicos:**
   ```
   🔥📱 FRONTEND - DATOS A ENVIAR AL API
   🔥🌐 HOOK - ENVIANDO FETCH AL API
   ```

3. **En Vercel Logs busca:**
   ```
   🔥🕐 DEBUG HORA - INICIO
   🔥🕐 DEBUG HORA - Componentes fecha UTC extraídos
   🔥🕐 DEBUG HORA - Resultado final
   🔥✅ SERVIDOR - Reserva GUARDADA EN BD
   ```

## 🚨 Información Crítica a Recopilar

### Del Usuario:
- Navegador y versión (ej: Chrome 120, Safari 17)
- Timezone del dispositivo (Settings → Date & Time)
- Hora que ingresó vs hora que se guardó
- Screenshot de la reserva antes y después

### De los Logs del Servidor:
```
🔥🕐 DEBUG HORA - Componentes fecha UTC extraídos: {
  year: X,
  month: X,
  day: X,
  fechaUTCCompleta: 'YYYY-MM-DD'
}

🔥✅ SERVIDOR - Reserva GUARDADA EN BD: {
  reservedAtGuardado: 'FECHA_UTC',
  componentes: {
    yearUTC: X,
    dayUTC: X,  // ⚠️ CRÍTICO: Este cambió de día?
    hourUTC: X,  // ⚠️ CRÍTICO: Esta es +5 de la hora ingresada?
  }
}
```

## 🔧 Debugging Remoto

### Crear Reserva de Prueba con Logging Específico
```javascript
// Agregar en ReservationEditModal.tsx
useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    console.log('🌍 PRODUCCIÓN - Info del navegador:', {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
      userAgent: navigator.userAgent,
      fechaLocal: new Date().toLocaleString(),
      fechaUTC: new Date().toISOString()
    });
  }
}, []);
```

## 🎬 Video/Screenshot del Usuario

Pídele al usuario que grabe un video corto (30 seg) mostrando:
1. Abrir DevTools (F12)
2. Ir a Console
3. Editar la reserva
4. Mostrar los logs que aparecen
5. Mostrar la reserva guardada

## 📱 Si el Usuario está en Móvil

### Android Chrome:
1. Conectar el teléfono a PC via USB
2. En Chrome PC: chrome://inspect
3. Ver logs en tiempo real

### iOS Safari:
1. Conectar iPhone a Mac
2. Safari Mac → Develop → [iPhone]
3. Ver console

### Alternativa: Remote Debugging Tool
Instalar Eruda (solo para debug):
```javascript
// Temporal en producción
if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/eruda';
  document.body.appendChild(script);
  script.onload = () => window.eruda.init();
}
```

Luego el usuario abre: `https://tu-app.com?debug=true`

## 🔐 Logging Seguro en Producción

Los logs actuales NO exponen datos sensibles:
- ✅ Solo muestran IDs, fechas, horas
- ✅ No muestran emails, teléfonos, nombres completos
- ✅ Safe para producción

## 📊 Alternativa: Sentry o LogRocket

Si el problema persiste, considera instalar:

### Sentry (Errores)
```bash
npm install @sentry/nextjs
```

### LogRocket (Session Replay)
```bash
npm install logrocket
```

Ambos permiten ver exactamente qué hizo el usuario.

## 🎯 Plan de Acción

1. **Inmediato:** Hacer deploy con los logs actuales
2. **Cuando reporte:** Pedirle screenshot/video + console logs
3. **Analizar:** Comparar logs de frontend vs backend
4. **Identificar:** Dónde exactamente se corrompe la fecha/hora
5. **Fix:** Aplicar corrección específica

## 🚀 Deploy Actual con Logs

```bash
git add -A
git commit -m "🐛 DEBUG: Logs exhaustivos timezone para producción"
git push origin main
```

Vercel auto-deployará en ~2 minutos.
