# Script para regenerar el cliente de Prisma correctamente
Write-Host "🔧 Regenerando cliente de Prisma..." -ForegroundColor Cyan

# Detener el servidor de desarrollo si está corriendo
Write-Host "⏹️  Deteniendo servidor de desarrollo..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Esperar un momento
Start-Sleep -Seconds 2

# Limpiar la carpeta de Prisma client
Write-Host "🧹 Limpiando carpeta de cliente de Prisma..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
}

# Generar el cliente de Prisma
Write-Host "⚡ Generando cliente de Prisma..." -ForegroundColor Green
npx prisma generate

Write-Host "✅ Cliente de Prisma regenerado exitosamente!" -ForegroundColor Green
Write-Host "📝 Ahora puedes ejecutar: npm run dev" -ForegroundColor Cyan
