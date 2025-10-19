# Script para restaurar configuración local
# Uso: .\restore-local.ps1

Write-Host "🏠 Restaurando configuración local..." -ForegroundColor Cyan

# Leer .env.local actual
$envContent = Get-Content .env.local -Raw

# Restaurar NEXTAUTH_URL a localhost
$envContent = $envContent -replace 'NEXTAUTH_URL="[^"]*"', 'NEXTAUTH_URL="http://localhost:3001"'

# Cambiar NODE_ENV a development
$envContent = $envContent -replace 'NODE_ENV="[^"]*"', 'NODE_ENV="development"'

# Guardar cambios
$envContent | Set-Content .env.local

Write-Host "✅ Configuración restaurada:" -ForegroundColor Green
Write-Host "   NEXTAUTH_URL=http://localhost:3001" -ForegroundColor Yellow
Write-Host "   NODE_ENV=development" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Reinicia el servidor para aplicar cambios" -ForegroundColor Cyan
