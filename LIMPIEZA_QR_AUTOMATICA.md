# 🧹 Sistema de Limpieza Automática de QR Codes

## 📋 Resumen

Sistema automático para eliminar QR codes de reservas del **mes anterior**, evitando que la base de datos se llene de datos innecesarios.

## ✅ ¿Por qué es necesario?

- **Problema**: Por c5. **Índices optimizados** - El campo `reservedAt` tiene índice para búsquedas rápidas
6. **⚠️ CRÍTICO**: La limpieza se basa en `Reservation.reservedAt`, NO en `QRCode.createdAt`
   - Esto evita eliminar QRs de reservas del mes actual que fueron creadas en el mes anterior
   - Ejemplo seguro: Reserva creada el 28 de oct para el 5 de nov → QR se mantiene todo noviembre
7. **📅 LIMPIEZA MENSUAL**: Los QRs se eliminan por mes completo, no por días
   - En noviembre: se eliminan todos los QRs de octubre y anteriores
   - En diciembre: se eliminan todos los QRs de noviembre y anterioresreserva se genera un QR code que se mantiene indefinidamente
- **Impacto**: Base de datos llena de QRs de reservas pasadas sin utilidad
- **Solución**: Limpieza automática mensual de QRs del mes anterior
- **Criterio**: Se eliminan QRs de **reservas del mes anterior** (no por fecha de creación del QR)
  - ✅ **SEGURO**: Un QR creado en octubre para una reserva de noviembre NO se elimina
  - ✅ **EFECTIVO**: Los QRs de reservas de octubre se eliminan cuando llegue noviembre
  - 📅 **MENSUAL**: En noviembre se eliminan QRs de octubre, en diciembre se eliminan de noviembre, etc.

## 🎯 Características

### 1. **Limpieza Automática Diaria**
- Se ejecuta todos los días a las 2:00 AM (hora del servidor)
- Elimina QRs de **reservas del mes anterior**
- **Ejemplo**: En noviembre, elimina QRs de octubre y anteriores
- **Importante**: Se basa en la fecha de la RESERVA, no en la fecha de creación del QR
- No requiere intervención manual

### 2. **Seguridad**
- Solo elimina QRs de reservas del mes anterior o anteriores
- Mantiene todos los QRs del mes actual, incluso si el QR fue creado antes
- Ejemplo: QR creado en octubre para reserva de noviembre → NO se elimina en noviembre
- Logs detallados de cada limpieza
- Modo dry-run para pruebas

### 3. **Estadísticas**
- Contador de QRs eliminados
- Reportes por negocio
- Tracking de fechas
- Verificación antes/después

## 📁 Archivos Creados

```
src/lib/qr-cleanup.ts              # Lógica de limpieza
src/app/api/cron/qr-cleanup/route.ts  # Endpoint API
scripts/qr-cleanup-manual.ts       # Script manual
vercel.json                        # Configuración del cron
```

## 🚀 Uso

### Automático (Recomendado)

El sistema se ejecuta automáticamente cada día a las 2:00 AM gracias al cron job de Vercel.

```json
{
  "crons": [{
    "path": "/api/cron/qr-cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

### Manual (Testing)

#### 1. **Dry Run** (ver qué se eliminaría sin eliminar nada)
```bash
npx tsx scripts/qr-cleanup-manual.ts --dry-run
```

#### 2. **Ejecución Real**
```bash
npx tsx scripts/qr-cleanup-manual.ts
```

#### 3. **Vía API** (requiere token de autenticación)
```bash
curl -X GET "https://tu-dominio.com/api/cron/qr-cleanup?token=TU_CRON_SECRET"
```

## 🔐 Configuración

### Variables de Entorno

Añade a tu `.env`:

```env
# Token secreto para proteger el endpoint de limpieza
CRON_SECRET=tu_token_secreto_aqui_cambialo
```

### Generar Token Secreto

```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O en PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 📊 Ejemplo de Salida

### Dry Run
```
═════════════════════════════════════════════════════
🧹 LIMPIEZA DE QR CODES - RESERVAS ANTIGUAS
═════════════════════════════════════════════════════

📊 Estadísticas actuales de QR codes:
─────────────────────────────────────────────────────
📅 Mes actual: noviembre de 2025
Total de QR codes: 70
├─ QRs del mes actual: 70
├─ QRs de meses anteriores: 0 🗑️
├─ Activos: 70
├─ Usados: 0
└─ Expirados: 0

Límite de antigüedad: 2025-11-01T00:00:00.000Z
─────────────────────────────────────────────────────

✅ No hay QR codes de meses anteriores para eliminar

🔍 MODO DRY RUN - No se eliminará nada

📋 RESUMEN DE LIMPIEZA
═════════════════════════════════════════════════════
QR codes a eliminar: 1,156
Fecha más antigua: 2025-08-15T10:30:00.000Z
Fecha más reciente: 2025-10-31T01:59:59.000Z
Negocios afectados: 15

Por negocio:
  business-123: 342 QRs
  business-456: 215 QRs
  business-789: 189 QRs
  ...
═════════════════════════════════════════════════════

💡 Para ejecutar la limpieza real, ejecuta:
   npx tsx scripts/qr-cleanup-manual.ts
```

### Ejecución Real
```
🗑️  Iniciando limpieza de QR codes de reservas anteriores a: 2025-11-01T00:00:00.000Z
📅 Mes actual: noviembre de 2025
📊 Se eliminarán 191 QR codes:
   Reserva más antigua: 2025-09-01T05:00:00.000Z
   Reserva más reciente: 2025-10-31T04:30:00.000Z
   Negocios afectados: 2
✅ Eliminados 191 QR codes exitosamente

✅ Limpieza completada exitosamente
```

## 🔄 Frecuencia del Cron

Actualmente configurado para ejecutarse **diariamente a las 2:00 AM**:

```
"0 2 * * *"
│ │ │ │ │
│ │ │ │ └─── Día de la semana (0-7, donde 0 y 7 = Domingo)
│ │ │ └───── Mes (1-12)
│ │ └─────── Día del mes (1-31)
│ └───────── Hora (0-23)
└─────────── Minuto (0-59)
```

Puedes modificarlo en `vercel.json`:
- `"0 2 * * *"` = Diario a las 2:00 AM
- `"0 */6 * * *"` = Cada 6 horas
- `"0 0 * * 0"` = Semanal (domingos a medianoche)

## 📈 Monitoreo

### Ver logs en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Pestaña "Logs"
3. Filtra por "qr-cleanup"
4. Verás la ejecución y resultados de cada limpieza

### Estadísticas vía API

```typescript
import { getQRStats } from '@/lib/qr-cleanup';

const stats = await getQRStats();
console.log('QRs antiguos:', stats.old);
console.log('QRs recientes:', stats.recent);
```

## 🛡️ Seguridad

### Protección del Endpoint

El endpoint `/api/cron/qr-cleanup` está protegido con:

1. **Token secreto** (`CRON_SECRET`) en variable de entorno
2. Verificación en header `Authorization: Bearer TOKEN`
3. O vía query param `?token=TOKEN`

### En Vercel

Vercel automáticamente incluye un header especial en los cron jobs, pero puedes añadir verificación adicional.

## ⚙️ Personalización

### Cambiar el período de retención

En `src/lib/qr-cleanup.ts`, línea 20:

```typescript
// Cambiar de 3 días a otro valor
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // ← Cambiar este número
```

### Añadir condiciones adicionales

```typescript
const qrsToDelete = await prisma.reservationQRCode.findMany({
  where: {
    AND: [
      { createdAt: { lt: threeDaysAgo } },
      { status: 'USED' }, // Solo eliminar los usados
      // Añadir más condiciones aquí
    ]
  }
});
```

## 🧪 Testing

### 1. Prueba con Dry Run
```bash
npx tsx scripts/qr-cleanup-manual.ts --dry-run
```

### 2. Verifica las estadísticas
```bash
node check-qr-manager-db.js
```

### 3. Ejecuta limpieza real en test
```bash
npx tsx scripts/qr-cleanup-manual.ts
```

### 4. Verifica que se eliminaron
```bash
node check-qr-manager-db.js
```

## 📝 Notas Importantes

1. **Los QRs se eliminan permanentemente** - No hay forma de recuperarlos
2. **Solo afecta QRs de reservas**, no otros tipos de QR
3. **Relación CASCADE** - El schema ya tiene `onDelete: Cascade`, así que es seguro
4. **No afecta las reservas** - Solo elimina los QRs, las reservas permanecen intactas
5. **Índices optimizados** - El campo `reservedAt` tiene índice para búsquedas rápidas
6. **⚠️ CRÍTICO**: La limpieza se basa en `Reservation.reservedAt`, NO en `QRCode.createdAt`
   - Esto evita eliminar QRs de reservas futuras que fueron creadas con anticipación
   - Ejemplo seguro: Reserva creada el 20 de oct para el 10 de nov → QR se mantiene hasta el 13 de nov

## 🎯 Próximos Pasos

1. **Desplegar a producción**:
   ```bash
   git add .
   git commit -m "feat: sistema de limpieza automática de QR codes"
   git push
   ```

2. **Configurar `CRON_SECRET`** en Vercel:
   - Dashboard → Settings → Environment Variables
   - Añadir `CRON_SECRET` con un valor secreto

3. **Verificar primera ejecución**:
   - Esperar a las 2:00 AM del día siguiente
   - O ejecutar manualmente vía API

4. **Monitorear durante una semana**:
   - Revisar logs diarios
   - Verificar que no haya errores
   - Confirmar que el espacio se libera

## 💡 Beneficios

- ✅ **Base de datos más limpia** y eficiente
- ✅ **Mejor rendimiento** en queries
- ✅ **Menor costo** de almacenamiento
- ✅ **Mantenimiento automático** sin intervención
- ✅ **Logs y estadísticas** detalladas
- ✅ **Seguro y controlado** con dry-run

## 🆘 Troubleshooting

### El cron no se ejecuta
- Verifica que `vercel.json` esté en la raíz
- Confirma que el proyecto esté desplegado
- Revisa los logs en Vercel Dashboard

### Error de autenticación
- Verifica que `CRON_SECRET` esté configurado
- Usa el mismo token en la llamada API

### No se eliminan QRs
- Verifica que realmente haya QRs antiguos con `--dry-run`
- Revisa los logs para ver si hay errores
- Confirma que la fecha/hora del servidor es correcta

---

**Creado**: 3 de noviembre de 2025  
**Versión**: 1.0  
**Mantenimiento**: Automático 🚀
