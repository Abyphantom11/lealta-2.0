# 🔧 Fix: Configuración de Puntos en Producción

## 🐛 Problema Resuelto

**Error en producción**:
```
❌ AdminV2: No se pudo resolver el ID del negocio
/api/admin/puntos: 500 Internal Server Error
❌ Error guardando configuración: Error interno del servidor
```

**Causa Raíz**:
- API usaba archivos JSON locales (`config/portal/portal-config-*.json`)
- Estos archivos NO existen en Vercel (filesystem efímero)
- GET/POST fallaban al intentar leer/escribir archivos

---

## ✅ Solución Implementada

### 1. **Nuevo Modelo en Base de Datos**

Agregado modelo `PuntosConfig` en Prisma:

```prisma
model PuntosConfig {
  id                String   @id @default(cuid())
  businessId        String   @unique
  puntosPorDolar    Int      @default(2)
  bonusPorRegistro  Int      @default(100)
  maxPuntosPorDolar Int      @default(10)
  maxBonusRegistro  Int      @default(1000)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  business          Business @relation("BusinessPuntosConfig", ...)
}
```

### 2. **API Actualizada**

**Antes (Archivos JSON)**:
```typescript
const configPath = getPortalConfigPath(session.businessId);
const configContent = await fs.readFile(configPath, 'utf-8');
const config = JSON.parse(configContent);
```

**Ahora (Base de Datos)**:
```typescript
let puntosConfig = await prisma.puntosConfig.findUnique({
  where: { businessId: session.businessId }
});

// Auto-provisioning si no existe
if (!puntosConfig) {
  puntosConfig = await prisma.puntosConfig.create({ ... });
}
```

---

## 🚀 Deployment a Producción

### Opción A: Auto-Migración (Recomendada)

Vercel aplica migraciones automáticamente si tienes configurado:

1. **En Vercel Dashboard**: Settings → General → Build Command
   ```bash
   npm run build && npx prisma migrate deploy
   ```

2. **Hacer redeploy**:
   - Ve a Vercel Dashboard
   - Deployments → Latest
   - Click "Redeploy"
   
3. **Verificar logs**:
   ```
   ✓ Applying migration `20251008165132_add_puntos_config`
   ✓ Migration completed successfully
   ```

### Opción B: Manual (Si auto-migración falla)

1. **Conectar a DB de producción**:
   ```bash
   # Obtener DATABASE_URL de Vercel
   vercel env pull .env.production
   
   # Aplicar migración
   DATABASE_URL="postgres://..." npx prisma migrate deploy
   ```

2. **Verificar**:
   ```bash
   DATABASE_URL="postgres://..." npx prisma studio
   # Ver tabla PuntosConfig
   ```

---

## 🧪 Testing en Producción

### 1. **Verificar API funciona**

```bash
# GET - Obtener configuración
curl https://tu-dominio.vercel.app/api/admin/puntos \
  -H "Cookie: session=..."
  
# Respuesta esperada:
{
  "success": true,
  "data": {
    "puntosPorDolar": 2,
    "bonusPorRegistro": 100,
    "limites": {
      "maxPuntosPorDolar": 10,
      "maxBonusRegistro": 1000
    }
  }
}
```

### 2. **Actualizar configuración**

```bash
# POST - Actualizar puntos
curl -X POST https://tu-dominio.vercel.app/api/admin/puntos \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{"puntosPorDolar": 5, "bonusPorRegistro": 200}'
  
# Respuesta esperada:
{
  "success": true,
  "message": "Configuración de puntos actualizada exitosamente",
  "data": { ... },
  "updatedBy": "user_id",
  "businessId": "business_id"
}
```

### 3. **Verificar en Admin UI**

1. Ir a: `https://tu-dominio.vercel.app/admin/configuracion/puntos`
2. Cambiar "Puntos por dólar" a `5`
3. Cambiar "Bonus de registro" a `200`
4. Click "Guardar"
5. ✅ Debería guardar sin errores

---

## 📊 Migración de Datos Existentes (Opcional)

Si tenías configuraciones en archivos JSON y quieres migrarlas:

```javascript
// scripts/migrate-puntos-to-db.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migratePointsConfig() {
  const configDir = path.join(__dirname, '../config/portal');
  const files = fs.readdirSync(configDir);
  
  for (const file of files) {
    if (!file.startsWith('portal-config-')) continue;
    
    const businessId = file.replace('portal-config-', '').replace('.json', '');
    const configPath = path.join(configDir, file);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    if (config.configuracionPuntos) {
      await prisma.puntosConfig.upsert({
        where: { businessId },
        update: {
          puntosPorDolar: config.configuracionPuntos.puntosPorDolar,
          bonusPorRegistro: config.configuracionPuntos.bonusPorRegistro
        },
        create: {
          businessId,
          puntosPorDolar: config.configuracionPuntos.puntosPorDolar || 2,
          bonusPorRegistro: config.configuracionPuntos.bonusPorRegistro || 100
        }
      });
      
      console.log(`✅ Migrated config for business: ${businessId}`);
    }
  }
  
  await prisma.$disconnect();
}

migratePointsConfig();
```

```bash
node scripts/migrate-puntos-to-db.js
```

---

## 🎯 Beneficios de la Nueva Implementación

### 1. **Funciona en Producción** ✅
- No depende de filesystem local
- Compatible con Vercel/serverless

### 2. **Multi-Tenant Seguro** 🔒
- `businessId` único por configuración
- Aislamiento completo entre negocios

### 3. **Auditoría** 📝
- `createdAt`: Cuándo se creó la config
- `updatedAt`: Última modificación
- Rastreable en logs

### 4. **Auto-Provisioning** ⚡
- Crea config automáticamente si no existe
- No requiere setup manual

### 5. **Validación Consistente** ✅
- Límites en la base de datos
- Validación en API

---

## 🔍 Troubleshooting

### Error: "Property 'puntosConfig' does not exist"

**Causa**: Prisma Client no se regeneró.

**Solución**:
```bash
npx prisma generate
# Restart dev server
```

### Error: "Table PuntosConfig doesn't exist"

**Causa**: Migración no aplicada.

**Solución**:
```bash
# Desarrollo
npx prisma migrate dev

# Producción
npx prisma migrate deploy
```

### Error: "Unique constraint failed on businessId"

**Causa**: Ya existe config para ese business.

**Solución**: Normal, el endpoint usa `upsert` para actualizar.

---

## 📋 Checklist de Deployment

- [x] Modelo PuntosConfig agregado a schema.prisma
- [x] Migración creada localmente
- [x] API actualizada para usar Prisma
- [x] Imports corregidos (`{ prisma }`)
- [x] Código pusheado a GitHub
- [ ] **Migración aplicada en producción**
- [ ] **Testing en producción completado**
- [ ] Datos migrados (si es necesario)
- [ ] Archivos JSON antiguos eliminados

---

## 🚨 Próximos Pasos URGENTES

1. **Aplicar migración en producción**:
   ```bash
   # Opción 1: Redeploy en Vercel
   # Opción 2: Manual con DATABASE_URL
   ```

2. **Verificar endpoint funciona**:
   ```
   GET /api/admin/puntos → 200 OK
   POST /api/admin/puntos → 200 OK
   ```

3. **Probar en UI**:
   - Admin → Configuración → Puntos
   - Cambiar valores
   - Guardar ✅

---

**Commit**: `4da3541`  
**Estado**: ✅ Código listo - ⚠️ Requiere migración en producción  
**Fecha**: 8 de Octubre, 2025 - 04:00 AM
