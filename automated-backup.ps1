# Script automatizado para crear backups de Neon PostgreSQL
# Combina pg_dump (SQL) y Prisma (JSON) para máxima compatibilidad

param(
    [switch]$JsonOnly,
    [switch]$ScheduleDaily,
    [switch]$Upload,
    [string]$CloudPath = ""
)

Write-Host "🚀 Lealta Backup System - Neon PostgreSQL" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

# Función para verificar si Node.js está disponible
function Test-NodeJS {
    try {
        $nodeVersion = & node --version 2>$null
        return $true
    } catch {
        Write-Host "❌ Node.js no encontrado. Instala Node.js primero." -ForegroundColor Red
        return $false
    }
}

# Función para verificar si el proyecto está configurado
function Test-ProjectSetup {
    if (-not (Test-Path "package.json")) {
        Write-Host "❌ package.json no encontrado. Ejecuta desde la raíz del proyecto." -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path "prisma/schema.prisma")) {
        Write-Host "❌ schema.prisma no encontrado. Verifica configuración de Prisma." -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path ".env") -and -not $env:DATABASE_URL) {
        Write-Host "❌ .env no encontrado y DATABASE_URL no configurada." -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Función para instalar dependencias si es necesario
function Install-Dependencies {
    Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
    
    # Verificar si node_modules existe
    if (-not (Test-Path "node_modules")) {
        Write-Host "📥 Instalando dependencias de Node.js..." -ForegroundColor Yellow
        npm install
    }
    
    # Verificar dependencias específicas para backup
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $dependencies = $packageJson.dependencies
    
    if (-not $dependencies."@prisma/client") {
        Write-Host "📥 Instalando Prisma Client..." -ForegroundColor Yellow
        npm install @prisma/client
    }
}

# Función para programar backup diario
function Set-DailyBackup {
    Write-Host "⏰ Configurando backup automático diario..." -ForegroundColor Yellow
    
    $scriptPath = $PSScriptRoot
    $taskName = "Lealta-Daily-Backup"
    
    # Crear acción del Task Scheduler
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$scriptPath\automated-backup.ps1`""
    
    # Crear trigger (todos los días a las 2:00 AM)
    $trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"
    
    # Crear configuración
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    try {
        # Registrar tarea
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Backup diario automático de Lealta usando Neon PostgreSQL" -Force
        
        Write-Host "✅ Backup diario programado exitosamente!" -ForegroundColor Green
        Write-Host "   📅 Se ejecutará todos los días a las 2:00 AM" -ForegroundColor Gray
        Write-Host "   🔧 Para modificar: Administrador de Tareas > $taskName" -ForegroundColor Gray
        
    } catch {
        Write-Host "❌ Error programando backup diario: $_" -ForegroundColor Red
    }
}

# Función para subir backup a la nube (ejemplo AWS S3)
function Upload-ToCloud {
    param([string]$BackupPath, [string]$CloudDestination)
    
    if (-not $CloudDestination) {
        Write-Host "⚠️  CloudPath no especificado. Saltando subida a nube." -ForegroundColor Yellow
        return
    }
    
    Write-Host "☁️  Subiendo backup a la nube..." -ForegroundColor Cyan
    
    # Ejemplo para AWS S3 (requiere AWS CLI)
    if ($CloudDestination.StartsWith("s3://")) {
        try {
            & aws s3 cp $BackupPath $CloudDestination
            Write-Host "✅ Backup subido a AWS S3: $CloudDestination" -ForegroundColor Green
        } catch {
            Write-Host "❌ Error subiendo a AWS S3: $_" -ForegroundColor Red
        }
    }
    
    # Ejemplo para Google Drive (requiere rclone)
    elseif ($CloudDestination.StartsWith("gdrive:")) {
        try {
            & rclone copy $BackupPath $CloudDestination
            Write-Host "✅ Backup subido a Google Drive: $CloudDestination" -ForegroundColor Green
        } catch {
            Write-Host "❌ Error subiendo a Google Drive: $_" -ForegroundColor Red
        }
    }
    
    else {
        Write-Host "⚠️  Formato de CloudPath no reconocido. Soportado: s3://, gdrive:" -ForegroundColor Yellow
    }
}

# Función principal
function Start-Backup {
    Write-Host "🔍 Verificando configuración del sistema..." -ForegroundColor Yellow
    
    # Verificaciones previas
    if (-not (Test-NodeJS)) { exit 1 }
    if (-not (Test-ProjectSetup)) { exit 1 }
    
    # Instalar dependencias
    Install-Dependencies
    
    # Preparar argumentos para el script de Node.js
    $nodeArgs = @("create-backup-neon.js")
    if ($JsonOnly) {
        $nodeArgs += "--json-only"
    }
    
    Write-Host "🎯 Ejecutando backup..." -ForegroundColor Green
    
    try {
        # Ejecutar backup
        $result = & node @nodeArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backup completado exitosamente!" -ForegroundColor Green
            
            # Subir a nube si se especificó
            if ($Upload -and $CloudPath) {
                $backupFiles = Get-ChildItem -Path "backups" -Name "backup_*" | Sort-Object LastWriteTime -Descending | Select-Object -First 2
                foreach ($file in $backupFiles) {
                    Upload-ToCloud -BackupPath "backups\$file" -CloudDestination $CloudPath
                }
            }
            
        } else {
            Write-Host "❌ Error durante el backup (código: $LASTEXITCODE)" -ForegroundColor Red
            exit $LASTEXITCODE
        }
        
    } catch {
        Write-Host "❌ Error ejecutando backup: $_" -ForegroundColor Red
        exit 1
    }
}

# Función para mostrar ayuda
function Show-Help {
    Write-Host ""
    Write-Host "🔧 USO:" -ForegroundColor Cyan
    Write-Host "   .\automated-backup.ps1                    # Backup completo (SQL + JSON)"
    Write-Host "   .\automated-backup.ps1 -JsonOnly          # Solo backup JSON"
    Write-Host "   .\automated-backup.ps1 -ScheduleDaily     # Programar backup diario"
    Write-Host "   .\automated-backup.ps1 -Upload -CloudPath s3://bucket/backups  # Subir a AWS S3"
    Write-Host ""
    Write-Host "📋 PARÁMETROS:" -ForegroundColor Cyan
    Write-Host "   -JsonOnly      : Solo crear backup JSON (no requiere pg_dump)"
    Write-Host "   -ScheduleDaily : Programar ejecución diaria automática"
    Write-Host "   -Upload        : Subir backup a la nube"
    Write-Host "   -CloudPath     : Destino en la nube (ej: s3://bucket, gdrive:folder)"
    Write-Host ""
    Write-Host "💡 EJEMPLOS:" -ForegroundColor Cyan
    Write-Host "   .\automated-backup.ps1 -ScheduleDaily -Upload -CloudPath 's3://lealta-backups/'"
    Write-Host "   .\automated-backup.ps1 -JsonOnly"
    Write-Host ""
}

# Ejecución principal
if ($args -contains "-h" -or $args -contains "--help" -or $args -contains "help") {
    Show-Help
    exit 0
}

if ($ScheduleDaily) {
    Set-DailyBackup
}

Start-Backup

Write-Host ""
Write-Host "🎉 Proceso completado!" -ForegroundColor Green
Write-Host "📁 Revisa la carpeta 'backups' para ver los archivos generados" -ForegroundColor Gray
