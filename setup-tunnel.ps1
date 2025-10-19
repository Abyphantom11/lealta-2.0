# Script para configurar túnel de Cloudflare
# Uso: .\setup-tunnel.ps1 "https://tu-url-tunnel.trycloudflare.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$TunnelUrl
)

Write-Host "🚇 Configurando túnel de Cloudflare..." -ForegroundColor Cyan

# Leer .env.local actual
$envContent = Get-Content .env.local -Raw

# Reemplazar NEXTAUTH_URL
$envContent = $envContent -replace 'NEXTAUTH_URL="[^"]*"', "NEXTAUTH_URL=`"$TunnelUrl`""

# Agregar AUTH_TRUST_HOST si no existe
if ($envContent -notmatch 'AUTH_TRUST_HOST') {
    $envContent = $envContent -replace '(NEXTAUTH_SECRET="[^"]*")', "`$1`nAUTH_TRUST_HOST=`"true`""
}

# Cambiar NODE_ENV a development
$envContent = $envContent -replace 'NODE_ENV="[^"]*"', 'NODE_ENV="development"'

# Guardar cambios
$envContent | Set-Content .env.local

Write-Host "✅ Configuración actualizada:" -ForegroundColor Green
Write-Host "   NEXTAUTH_URL=$TunnelUrl" -ForegroundColor Yellow
Write-Host "   AUTH_TRUST_HOST=true" -ForegroundColor Yellow
Write-Host "" 
Write-Host "🚀 Ahora reinicia el servidor:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
