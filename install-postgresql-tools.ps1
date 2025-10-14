# Script para instalar PostgreSQL Client Tools en Windows
# Para usar con el backup de Neon

Write-Host "🐘 Instalador de PostgreSQL Client Tools para Neon Backup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Verificar si pg_dump ya está disponible
try {
    $pgVersion = & pg_dump --version 2>$null
    if ($pgVersion) {
        Write-Host "✅ PostgreSQL tools ya están instalados:" -ForegroundColor Green
        Write-Host "   $pgVersion" -ForegroundColor Gray
        exit 0
    }
} catch {
    Write-Host "🔧 PostgreSQL tools no encontradas. Procediendo con instalación..." -ForegroundColor Yellow
}

# Verificar si Chocolatey está disponible
try {
    $chocoVersion = & choco --version 2>$null
    $chocoAvailable = $true
} catch {
    $chocoAvailable = $false
}

if ($chocoAvailable) {
    Write-Host "📦 Chocolatey detectado. Instalando PostgreSQL..." -ForegroundColor Green
    
    # Instalar PostgreSQL via Chocolatey
    try {
        Write-Host "⏳ Instalando PostgreSQL (esto puede tomar varios minutos)..." -ForegroundColor Yellow
        & choco install postgresql --params="/Password:lealta123" -y
        
        # Agregar al PATH si no está
        $pgPath = "C:\Program Files\PostgreSQL\*\bin"
        $existingPaths = $env:PATH -split ";"
        $pgBinPath = Get-ChildItem -Path $pgPath -Directory | Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName
        
        if ($pgBinPath -and $existingPaths -notcontains $pgBinPath) {
            Write-Host "🔧 Agregando PostgreSQL al PATH del sistema..." -ForegroundColor Yellow
            [Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";$pgBinPath", [EnvironmentVariableTarget]::Machine)
        }
        
        Write-Host "✅ PostgreSQL instalado exitosamente!" -ForegroundColor Green
        Write-Host "🔄 Reinicia tu terminal para usar pg_dump" -ForegroundColor Cyan
        
    } catch {
        Write-Host "❌ Error instalando PostgreSQL via Chocolatey: $_" -ForegroundColor Red
        $chocoAvailable = $false
    }
}

if (-not $chocoAvailable) {
    Write-Host "📋 INSTALACIÓN MANUAL REQUERIDA:" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Visita: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Descarga 'Windows x86-64' para tu versión de Windows" -ForegroundColor White
    Write-Host "3. Durante la instalación:" -ForegroundColor White
    Write-Host "   ✓ Asegúrate de marcar 'Command Line Tools'" -ForegroundColor Gray
    Write-Host "   ✓ Puedes desmarcar 'PostgreSQL Server' si no lo necesitas" -ForegroundColor Gray
    Write-Host "   ✓ Anota la contraseña que elijas" -ForegroundColor Gray
    Write-Host "4. Después de la instalación:" -ForegroundColor White
    Write-Host "   ✓ Reinicia tu terminal" -ForegroundColor Gray
    Write-Host "   ✓ Ejecuta 'pg_dump --version' para verificar" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Alternativa rápida con Chocolatey:" -ForegroundColor Cyan
    Write-Host "   1. Instala Chocolatey: https://chocolatey.org/install" -ForegroundColor Gray
    Write-Host "   2. Ejecuta: choco install postgresql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🚫 Si no quieres instalar PostgreSQL, usa:" -ForegroundColor Yellow
    Write-Host "   node create-backup-neon.js --json-only" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📝 SIGUIENTE PASO:" -ForegroundColor Cyan
Write-Host "   Después de instalar, ejecuta: node create-backup-neon.js" -ForegroundColor White
