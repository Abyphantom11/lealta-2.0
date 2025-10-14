# Script simplificado para instalar PostgreSQL Client Tools
Write-Host "PostgreSQL Client Tools Installer" -ForegroundColor Cyan

# Verificar si pg_dump ya esta disponible
try {
    $pgVersion = & pg_dump --version 2>$null
    if ($pgVersion) {
        Write-Host "PostgreSQL tools ya estan instalados: $pgVersion" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "PostgreSQL tools no encontradas. Procediendo con instalacion..." -ForegroundColor Yellow
}

# Verificar si Chocolatey esta disponible
try {
    $chocoVersion = & choco --version 2>$null
    $chocoAvailable = $true
    Write-Host "Chocolatey detectado: $chocoVersion" -ForegroundColor Green
} catch {
    $chocoAvailable = $false
    Write-Host "Chocolatey no encontrado" -ForegroundColor Yellow
}

if ($chocoAvailable) {
    Write-Host "Instalando PostgreSQL via Chocolatey..." -ForegroundColor Green
    try {
        & choco install postgresql --params="/Password:lealta123" -y
        Write-Host "PostgreSQL instalado exitosamente!" -ForegroundColor Green
        Write-Host "Reinicia tu terminal para usar pg_dump" -ForegroundColor Cyan
    } catch {
        Write-Host "Error instalando PostgreSQL via Chocolatey: $_" -ForegroundColor Red
        $chocoAvailable = $false
    }
}

if (-not $chocoAvailable) {
    Write-Host ""
    Write-Host "INSTALACION MANUAL REQUERIDA:" -ForegroundColor Yellow
    Write-Host "1. Visita: https://www.postgresql.org/download/windows/"
    Write-Host "2. Descarga 'Windows x86-64' para tu version de Windows"
    Write-Host "3. Durante la instalacion:"
    Write-Host "   - Asegurate de marcar 'Command Line Tools'"
    Write-Host "   - Puedes desmarcar 'PostgreSQL Server' si no lo necesitas"
    Write-Host "4. Despues de la instalacion, reinicia tu terminal"
    Write-Host ""
    Write-Host "Alternativa: Si no quieres instalar PostgreSQL, usa:"
    Write-Host "node create-backup-neon.js --json-only" -ForegroundColor Gray
}

Write-Host ""
Write-Host "SIGUIENTE PASO:"
Write-Host "Despues de instalar, ejecuta: node create-backup-neon.js" -ForegroundColor White
