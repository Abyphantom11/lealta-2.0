## 🔧 FIXES APLICADOS

### 1. **Timezone corregido** ✅
- **Problema**: Vercel usa UTC, calculaba día incorrecto
- **Solución**: Ahora usa `America/Guayaquil` (hora de Ecuador)
- **Resultado**: A las 2:56 AM calcula correctamente "lunes" (no "martes")
- **Archivo**: `src/lib/business-day-utils.ts`

### 2. **Favorito del día arreglado** ✅
- **Problema**: Hook esperaba array pero API devolvía objeto
- **Solución**: `getFavoritoDelDia()` ahora maneja objeto correctamente
- **Archivo**: `src/hooks/useAutoRefreshPortalConfig.ts`

### 3. **Logs de debug agregados** 🔍
- Agregados logs detallados en `config-v2` API
- Muestra día comercial calculado
- Muestra filtrado por día y activo
- **Archivo**: `src/app/api/portal/config-v2/route.ts`

## 📦 ARCHIVOS MODIFICADOS
- src/lib/business-day-utils.ts (timezone Ecuador)
- src/hooks/useAutoRefreshPortalConfig.ts (favorito fix)
- src/app/api/portal/config-v2/route.ts (debug logs)
