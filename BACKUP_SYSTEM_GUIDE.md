# 🔐 SISTEMA DE BACKUPS - NEON POSTGRESQL

## 📊 Estado Actual de tu Base de Datos

**Proveedor**: Neon PostgreSQL (Serverless)
**Endpoint**: ep-floral-morning-ad47ojau-pooler.c-2.us-east-1.aws.neon.tech
**Región**: us-east-1 (Virginia, USA)

## 🔄 Backups Automáticos de Neon

### ✅ Backups Incluidos por Defecto

Neon proporciona **backups automáticos** según tu plan:

#### **Free Tier** (Plan Gratuito):
- ⏰ **Retención**: 7 días de historia
- 🔄 **Point-in-Time Recovery (PITR)**: Últimos 7 días
- 📸 **Snapshots automáticos**: Cada 24 horas
- 🚫 **Backups manuales**: No disponibles

#### **Pro Plan** ($19/mes):
- ⏰ **Retención**: 14 días de historia
- 🔄 **Point-in-Time Recovery**: Últimos 14 días
- 📸 **Snapshots**: Múltiples por día
- ✅ **Backups manuales**: Disponibles

#### **Business Plan** ($700/mes):
- ⏰ **Retención**: 30 días de historia
- 🔄 **Point-in-Time Recovery**: Últimos 30 días
- 📸 **Snapshots**: Continuos
- ✅ **Backups manuales**: Ilimitados

## 🛠️ Cómo Restaurar desde Backup en Neon

### Opción 1: Restauración desde la Consola Web

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Selecciona tu proyecto
3. Ve a la pestaña "Branches"
4. Crea un nuevo branch desde un punto en el tiempo:
   - Click en "Create Branch"
   - Selecciona "Point in time"
   - Elige la fecha/hora deseada (últimos 7 días en Free tier)
5. Conéctate al nuevo branch para verificar los datos

### Opción 2: Usando la CLI de Neon

```bash
# Instalar Neon CLI
npm install -g neonctl

# Crear branch desde punto en el tiempo
neonctl branches create --name backup-restore --from main --timestamp 2025-10-07T10:00:00Z
```

## 💾 Backups Manuales Recomendados

Como complemento a los backups de Neon, recomiendo crear tus propios backups:

### Script 1: Backup SQL Dump (pg_dump)

```bash
# Backup completo
pg_dump "postgresql://user:password@host/dbname" > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup solo schema
pg_dump --schema-only "postgresql://..." > schema_backup.sql

# Backup solo datos
pg_dump --data-only "postgresql://..." > data_backup.sql
```

### Script 2: Backup JSON (datos importantes)

El script que voy a crear te permite hacer backups en formato JSON de:
- Businesses
- Clientes
- Reservas
- Consumos
- Promotores

## ⚠️ Lo que Pasó en tu Caso

**El problema NO fue pérdida de datos**, sino:
1. **Drift del Schema**: El schema de Prisma tenía el campo `tableNumber` pero la base de datos no
2. **Causa**: Probablemente se editó el schema sin ejecutar `prisma migrate` o `prisma db push`
3. **Solución**: `prisma db push` sincronizó el schema

### ❌ NO se perdieron datos porque:
- ✅ Todos los 5 businesses siguen ahí
- ✅ Los 21 clientes están intactos
- ✅ Los 337 consumos se mantuvieron
- ✅ Las 133 reservas están completas

## 📋 Recomendaciones

### 1. **Configurar Backups Automáticos Locales**
```bash
# Cron job diario (Linux/Mac)
0 2 * * * pg_dump "$DATABASE_URL" > /backups/lealta_$(date +\%Y\%m\%d).sql

# PowerShell Task (Windows)
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
```

### 2. **Usar Branches de Neon para Desarrollo**
- `main` → Producción (nunca hacer cambios directos)
- `development` → Desarrollo y pruebas
- `staging` → Pre-producción

### 3. **Antes de Cambios en Schema**
```bash
# 1. Crear backup branch
neonctl branches create --name backup-before-migration --from main

# 2. Aplicar cambios
prisma migrate dev

# 3. Si algo falla, restaurar desde el branch
```

### 4. **Monitoreo**
- Configurar alertas en Neon Console
- Revisar logs regularmente
- Verificar integridad de datos semanalmente

## 🚀 Scripts Útiles

Voy a crear scripts para:
1. ✅ Backup JSON manual de datos críticos
2. ✅ Restauración de datos desde JSON
3. ✅ Verificación de integridad
4. ✅ Comparación de schemas

¿Quieres que genere estos scripts ahora?
