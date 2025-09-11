# Script para crear túnel local
Write-Host "Iniciando túnel local..." -ForegroundColor Green
Write-Host "Asegúrate de que tu servidor esté corriendo en el puerto 3000" -ForegroundColor Yellow
Write-Host ""
lt --port 3000
