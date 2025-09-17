# 🗄️ Script de Migración PostgreSQL - Lealta 2.0
# Ejecutar: .\migrate-to-postgres.ps1

param(
    [switch]$TestConnection,
    [switch]$ExportOnly,
    [switch]$ImportOnly,
    [switch]$ValidateOnly,
    [switch]$FullMigration,
    [switch]$SetupDocker,
    [string]$PostgresUrl = ""
)

# Colores para output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor Cyan }
function Write-Step { param($Message) Write-Host "🔄 $Message" -ForegroundColor Blue }

# Banner
Write-Host @"
🗄️ MIGRACIÓN POSTGRESQL - LEALTA 2.0
=====================================
"@ -ForegroundColor Magenta

# Verificar dependencias
function Test-Dependencies {
    Write-Step "Verificando dependencias..."
    
    # Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js: $nodeVersion"
    } catch {
        Write-Error "Node.js no encontrado. Instalar desde https://nodejs.org/"
        exit 1
    }
    
    # npm packages
    if (!(Test-Path "node_modules")) {
        Write-Step "Instalando dependencias npm..."
        npm install
    }
    
    # Prisma CLI
    try {
        npx prisma --version | Out-Null
        Write-Success "Prisma CLI disponible"
    } catch {
        Write-Error "Prisma CLI no disponible"
        exit 1
    }
    
    # SQLite database
    if (!(Test-Path "prisma/dev.db")) {
        Write-Error "No se encuentra prisma/dev.db. ¿Has ejecutado migraciones?"
        exit 1
    }
    
    Write-Success "Todas las dependencias verificadas"
}

# Setup Docker PostgreSQL
function Setup-DockerPostgreSQL {
    Write-Step "Configurando PostgreSQL con Docker..."
    
    # Verificar Docker
    try {
        docker --version | Out-Null
        Write-Success "Docker disponible"
    } catch {
        Write-Error "Docker no encontrado. Instalar Docker Desktop."
        exit 1
    }
    
    # Detener container existente si existe
    docker stop lealta-postgres 2>$null
    docker rm lealta-postgres 2>$null
    
    # Crear nuevo container
    Write-Step "Creando container PostgreSQL..."
    $dockerCmd = @(
        "run", "--name", "lealta-postgres",
        "-e", "POSTGRES_PASSWORD=lealta_dev_pass",
        "-e", "POSTGRES_USER=lealta_user", 
        "-e", "POSTGRES_DB=lealta_dev",
        "-p", "5432:5432",
        "-d", "postgres:15"
    )
    
    docker @dockerCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PostgreSQL container iniciado"
        Write-Info "Esperando a que PostgreSQL esté listo..."
        Start-Sleep -Seconds 10
        
        # Verificar conexión
        $testConnection = docker exec lealta-postgres pg_isready -U lealta_user -d lealta_dev
        if ($testConnection -match "accepting connections") {
            Write-Success "PostgreSQL listo para conexiones"
            return $true
        }
    }
    
    Write-Error "Error configurando Docker PostgreSQL"
    return $false
}

# Configurar variables de entorno
function Set-PostgreSQLEnvironment {
    param($Url)
    
    if ($Url) {
        $env:DATABASE_URL = $Url
    } else {
        $env:DATABASE_URL = "postgresql://lealta_user:lealta_dev_pass@localhost:5432/lealta_dev"
    }
    
    Write-Info "DATABASE_URL configurada: $($env:DATABASE_URL -replace 'password[^@]*', 'password:***')"
}

# Test de conexión PostgreSQL
function Test-PostgreSQLConnection {
    Write-Step "Probando conexión PostgreSQL..."
    
    $result = npm run migrate:test-connection
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Conexión PostgreSQL exitosa"
        return $true
    } else {
        Write-Error "Error de conexión PostgreSQL"
        Write-Warning "Verifica:"
        Write-Host "  • PostgreSQL está ejecutándose"
        Write-Host "  • DATABASE_URL es correcta"
        Write-Host "  • Credenciales son válidas"
        return $false
    }
}

# Exportar datos de SQLite
function Export-SQLiteData {
    Write-Step "Exportando datos de SQLite..."
    
    $result = npm run migrate:export
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Datos SQLite exportados exitosamente"
        
        # Buscar archivo de backup
        $backupFiles = Get-ChildItem -Name "backup-data-*.json" | Sort-Object -Descending
        if ($backupFiles.Count -gt 0) {
            Write-Info "Archivo de backup: $($backupFiles[0])"
            return $true
        }
    }
    
    Write-Error "Error exportando datos SQLite"
    return $false
}

# Actualizar schema Prisma
function Update-PrismaSchema {
    Write-Step "Actualizando schema Prisma para PostgreSQL..."
    
    $schemaPath = "prisma/schema.prisma"
    $schemaContent = Get-Content $schemaPath -Raw
    
    # Backup del schema original
    $backupPath = "prisma/schema.prisma.sqlite.backup"
    Copy-Item $schemaPath $backupPath
    Write-Info "Backup del schema: $backupPath"
    
    # Reemplazar provider
    $newContent = $schemaContent -replace 'provider = "sqlite"', 'provider = "postgresql"'
    
    if ($newContent -ne $schemaContent) {
        Set-Content $schemaPath $newContent
        Write-Success "Schema actualizado a PostgreSQL"
        return $true
    } else {
        Write-Warning "Schema ya configurado para PostgreSQL"
        return $true
    }
}

# Ejecutar migraciones Prisma
function Run-PrismaMigrations {
    Write-Step "Ejecutando migraciones Prisma..."
    
    # Reset y crear nueva migración
    npx prisma migrate reset --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Migraciones ejecutadas exitosamente"
        
        # Generar cliente
        npx prisma generate
        Write-Success "Cliente Prisma generado"
        return $true
    }
    
    Write-Error "Error ejecutando migraciones Prisma"
    return $false
}

# Importar datos a PostgreSQL
function Import-PostgreSQLData {
    Write-Step "Importando datos a PostgreSQL..."
    
    $result = npm run migrate:import
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Datos importados exitosamente"
        return $true
    }
    
    Write-Error "Error importando datos a PostgreSQL"
    return $false
}

# Validar migración
function Validate-Migration {
    Write-Step "Validando migración..."
    
    $result = npm run migrate:validate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Validación completada exitosamente"
        return $true
    }
    
    Write-Error "Validación falló"
    return $false
}

# Rollback en caso de error
function Invoke-Rollback {
    Write-Warning "Iniciando rollback..."
    
    # Restaurar schema SQLite
    $backupSchema = "prisma/schema.prisma.sqlite.backup"
    if (Test-Path $backupSchema) {
        Copy-Item $backupSchema "prisma/schema.prisma"
        Write-Success "Schema restaurado a SQLite"
    }
    
    # Regenerar cliente
    npx prisma generate
    
    Write-Info "Rollback completado. Sistema restaurado a SQLite."
}

# Función principal
function Start-Migration {
    try {
        Test-Dependencies
        
        if ($SetupDocker) {
            if (!(Setup-DockerPostgreSQL)) {
                exit 1
            }
        }
        
        Set-PostgreSQLEnvironment -Url $PostgresUrl
        
        if ($TestConnection -or $FullMigration) {
            if (!(Test-PostgreSQLConnection)) {
                exit 1
            }
        }
        
        if ($ExportOnly -or $FullMigration) {
            if (!(Export-SQLiteData)) {
                exit 1
            }
        }
        
        if ($ValidateOnly) {
            Validate-Migration
            exit 0
        }
        
        if ($ImportOnly -or $FullMigration) {
            if (!(Update-PrismaSchema)) {
                Invoke-Rollback
                exit 1
            }
            
            if (!(Run-PrismaMigrations)) {
                Invoke-Rollback
                exit 1
            }
            
            if (!(Import-PostgreSQLData)) {
                Invoke-Rollback
                exit 1
            }
            
            if (!(Validate-Migration)) {
                Write-Warning "Migración completada pero validación falló"
            }
        }
        
        Write-Success "¡Migración completada exitosamente! 🎉"
        Write-Info "Próximos pasos:"
        Write-Host "  • Ejecutar tests: npm test"
        Write-Host "  • Verificar funcionalidades críticas"
        Write-Host "  • Configurar monitoring de producción"
        
    } catch {
        Write-Error "Error inesperado: $($_.Exception.Message)"
        Write-Warning "Ejecutando rollback automático..."
        Invoke-Rollback
        exit 1
    }
}

# Mostrar ayuda
function Show-Help {
    Write-Host @"
🗄️ MIGRACIÓN POSTGRESQL - OPCIONES DISPONIBLES

COMANDOS:
  .\migrate-to-postgres.ps1 -FullMigration        # Migración completa automática
  .\migrate-to-postgres.ps1 -SetupDocker          # Setup Docker PostgreSQL + migración
  .\migrate-to-postgres.ps1 -TestConnection       # Solo probar conexión
  .\migrate-to-postgres.ps1 -ExportOnly           # Solo exportar datos SQLite
  .\migrate-to-postgres.ps1 -ImportOnly           # Solo importar datos
  .\migrate-to-postgres.ps1 -ValidateOnly         # Solo validar migración

PARÁMETROS:
  -PostgresUrl "postgresql://..."                 # URL personalizada de PostgreSQL

EJEMPLOS:
  # Migración completa con Docker
  .\migrate-to-postgres.ps1 -SetupDocker

  # Migración a servidor externo
  .\migrate-to-postgres.ps1 -FullMigration -PostgresUrl "postgresql://user:pass@host:5432/db"

  # Solo validar migración existente
  .\migrate-to-postgres.ps1 -ValidateOnly
"@ -ForegroundColor Cyan
}

# Ejecución principal
if ($args.Count -eq 0 -and !$TestConnection -and !$ExportOnly -and !$ImportOnly -and !$ValidateOnly -and !$FullMigration -and !$SetupDocker) {
    Show-Help
} else {
    Start-Migration
}
