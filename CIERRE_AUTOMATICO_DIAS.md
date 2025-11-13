# 🕐 Cierre Automático de Días

## ¿Qué hace?

Todos los días a las **4:00 AM** (hora Ecuador), el sistema automáticamente:

1. Busca todas las reservas con estado `PENDING` o `CONFIRMED`
2. Si la reserva es de antes de las 4 AM, la cambia a `NO_SHOW`
3. Listo! ✅

## ¿Por qué a las 4 AM?

Porque los días comerciales de nightclubs terminan a las 4 AM:
- Una reserva del lunes 10 PM es válida hasta martes 4 AM
- A las 4:01 AM del martes, si sigue `PENDING` → pasa a `NO_SHOW`

## Configuración

### 1. Archivo `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-close-days",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Nota:** `0 9 * * *` = 9 AM UTC = 4 AM Ecuador (UTC-5)

### 2. Endpoint en `/api/cron/auto-close-days/route.ts`
- Método: `GET` (Vercel Cron usa GET por defecto)
- Sin autenticación necesaria
- Procesa TODOS los negocios automáticamente

## ¿Cómo activarlo?

1. **Hacer deploy a Vercel:**
   ```bash
   git add .
   git commit -m "feat: cierre automático de días"
   git push
   ```

2. **Vercel detecta automáticamente** el cron job en `vercel.json`

3. **Listo!** Se ejecuta solo todos los días a las 4 AM

## Verificar que funciona

Puedes ver los logs en Vercel:
1. Ir a tu proyecto en Vercel
2. Clic en "Logs"
3. Buscar "Cerrando días comerciales automáticamente"

## Reportes

Los reportes mensuales **ya NO incluyen** reservas `PENDING` o `CONFIRMED`:
- ✅ Solo muestran estados finales: `CHECKED_IN`, `NO_SHOW`, `CANCELLED`, `COMPLETED`
- ✅ Esto asegura datos precisos y limpios

## Resumen

- ✅ **Simple:** Solo 3 archivos necesarios
- ✅ **Automático:** Se ejecuta solo todos los días
- ✅ **Sin configuración extra:** No necesita secrets ni autenticación
- ✅ **Seguro:** Solo Vercel puede ejecutar `/api/cron/*`
