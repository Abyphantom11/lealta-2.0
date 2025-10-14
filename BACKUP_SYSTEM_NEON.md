# 🐘 Sistema de Backup para Neon PostgreSQL

Sistema completo de backups para tu aplicación Lealta usando Neon PostgreSQL. Incluye backups SQL (pg_dump) y JSON (Prisma) con automatización y subida a la nube.

## 📁 Archivos del Sistema

- `create-backup-neon.js` - Script principal de backup con soporte para SQL y JSON
- `automated-backup.ps1` - Script de PowerShell para automatización en Windows
- `install-postgresql-tools.ps1` - Instalador automático de PostgreSQL tools
- `create-backup.js` - Script original (JSON básico)

## 🚀 Instalación Rápida

### 1. Instalar PostgreSQL Tools (Opcional pero Recomendado)

```powershell
# Opción A: Usando el script automático
.\install-postgresql-tools.ps1

# Opción B: Manual con Chocolatey
choco install postgresql

# Opción C: Solo usar backup JSON (sin pg_dump)
# No requiere instalación adicional
```

### 2. Configurar Variables de Entorno

Asegúrate de que tu `.env` tenga la `DATABASE_URL` de Neon:

```bash
DATABASE_URL="postgresql://usuario:password@ep-xxx.neon.tech/lealta?sslmode=require"
```

## 💻 Uso

### Backup Manual

```bash
# Backup completo (SQL + JSON)
node create-backup-neon.js

# Solo backup JSON (más rápido, no requiere pg_dump)
node create-backup-neon.js --json-only
```

### Backup Automatizado con PowerShell

```powershell
# Backup simple
.\automated-backup.ps1

# Solo JSON
.\automated-backup.ps1 -JsonOnly

# Programar backup diario automático
.\automated-backup.ps1 -ScheduleDaily

# Backup con subida automática a AWS S3
.\automated-backup.ps1 -Upload -CloudPath "s3://mi-bucket/backups/"

# Combinado: diario + subida a nube
.\automated-backup.ps1 -ScheduleDaily -Upload -CloudPath "s3://lealta-backups/"
```

## 📊 Tipos de Backup

### 1. Backup SQL (pg_dump) 🐘
- **Archivo**: `backup_sql_YYYY-MM-DD-HH-mm-ss.sql`
- **Ventajas**: 
  - Backup completo con esquema
  - Formato estándar PostgreSQL
  - Restauración directa con `psql`
  - Incluye índices, constraints, etc.
- **Requisitos**: PostgreSQL client tools instalados

### 2. Backup JSON (Prisma) 📋
- **Archivo**: `backup_json_YYYY-MM-DD-HH-mm-ss.json(.gz)`
- **Ventajas**:
  - No requiere herramientas adicionales
  - Datos estructurados y legibles
  - Incluye metadata detallada
  - Versión comprimida automática
- **Limitaciones**: Solo datos, no esquema completo

## 📦 Estructura del Backup JSON

```json
{
  "metadata": {
    "timestamp": "2025-10-08T12:30:45.000Z",
    "version": "2.0.0",
    "source": "Neon PostgreSQL",
    "backupType": "JSON",
    "totalRecords": {
      "businesses": 5,
      "clientes": 150,
      "reservations": 80,
      "consumos": 1200,
      "promotores": 10,
      "services": 15,
      "slots": 300,
      "hostTrackings": 45
    }
  },
  "data": {
    "businesses": [...],
    "clientes": [...],
    // ... resto de datos
  }
}
```

## ☁️ Subida a la Nube

### AWS S3
```powershell
# Instalar AWS CLI primero
# https://aws.amazon.com/cli/

.\automated-backup.ps1 -Upload -CloudPath "s3://mi-bucket/backups/"
```

### Google Drive (con rclone)
```powershell
# Instalar y configurar rclone primero
# https://rclone.org/

.\automated-backup.ps1 -Upload -CloudPath "gdrive:Backups/Lealta/"
```

## ⏰ Automatización

### Backup Diario Automático

El script puede programar un backup diario automático usando el Programador de Tareas de Windows:

```powershell
# Programar backup diario a las 2:00 AM
.\automated-backup.ps1 -ScheduleDaily

# Verificar en: Administrador de Tareas > Biblioteca del Programador de tareas > "Lealta-Daily-Backup"
```

### Personalizar Horario

Para modificar el horario, edita el script `automated-backup.ps1` en la línea:
```powershell
$trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"
```

## 🔧 Configuración Avanzada

### Aumentar Límites de Registros

En `create-backup-neon.js`, modifica los límites:

```javascript
const consumos = await prisma.consumo.findMany({
  take: 10000, // Cambiar de 5000 a 10000
  orderBy: { registeredAt: 'desc' }
});
```

### Agregar Nuevas Tablas

```javascript
// En la función createJSONBackup()
const nuevaTabla = await prisma.nuevaTabla.findMany();

// Agregar a backup.data
backup.data.nuevaTabla = nuevaTabla;
```

## 🆘 Solución de Problemas

### Error: "pg_dump not found"
```powershell
# Instalar PostgreSQL tools
.\install-postgresql-tools.ps1

# O usar solo JSON
node create-backup-neon.js --json-only
```

### Error: "DATABASE_URL not found"
```bash
# Verificar archivo .env
cat .env | grep DATABASE_URL

# O configurar manualmente
export DATABASE_URL="postgresql://..."
```

### Error: "Permission denied"
```powershell
# Ejecutar PowerShell como Administrador para scheduled tasks
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Archivos de Backup Muy Grandes
- Usar `--json-only` para skip pg_dump
- Reducir límites en `take:` para tablas grandes
- Los archivos .gz son automáticamente comprimidos

## 📈 Monitoreo y Mantenimiento

### Verificar Backups Automáticos
```powershell
# Ver logs del Task Scheduler
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-TaskScheduler/Operational'}

# Verificar archivos recientes
Get-ChildItem -Path "backups" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

### Limpiar Backups Antiguos
```powershell
# Eliminar backups mayores a 30 días
Get-ChildItem -Path "backups" -Filter "backup_*" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

## 🔐 Seguridad

- **Nunca** incluyas archivos de backup en el control de versiones
- Agrega `backups/` a tu `.gitignore`
- Encripta backups sensibles antes de subirlos a la nube
- Usa variables de entorno para credenciales de cloud storage

## 📝 Logs y Auditoría

Los scripts generan logs detallados:
- ✅ Operaciones exitosas
- ⚠️ Advertencias
- ❌ Errores
- 📊 Estadísticas de backup

## 🤝 Contribución

Para mejorar el sistema de backups:
1. Modifica `create-backup-neon.js` para funcionalidad core
2. Actualiza `automated-backup.ps1` para automatización
3. Prueba con `node create-backup-neon.js --json-only` primero
4. Documenta cambios en este README
