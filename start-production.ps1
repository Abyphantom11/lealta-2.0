# 🚀 LEALTA 2.0 - SCRIPT DE INICIO RÁPIDO (PowerShell)

Write-Host "🚀 Iniciando Lealta 2.0..." -ForegroundColor Green
Write-Host "📊 Estado: PRODUCTION READY" -ForegroundColor Cyan
Write-Host ""

# Verificar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
npm install --legacy-peer-deps

# Generar cliente Prisma
Write-Host "🗄️ Generando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate

# Sincronizar base de datos
Write-Host "🔄 Sincronizando base de datos..." -ForegroundColor Yellow
npx prisma db push

# Build de producción
Write-Host "🏗️ Construyendo aplicación..." -ForegroundColor Yellow
npm run build

# Iniciar aplicación
Write-Host "🎯 Iniciando en modo producción..." -ForegroundColor Green
Write-Host ""
Write-Host "✅ URLs disponibles:" -ForegroundColor Green
Write-Host "🏠 Home: http://localhost:3001/" -ForegroundColor White
Write-Host "👑 Admin: http://localhost:3001/demo/admin" -ForegroundColor White
Write-Host "🛠️ Staff: http://localhost:3001/demo/staff" -ForegroundColor White
Write-Host "👥 Cliente: http://localhost:3001/demo/cliente" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Credenciales:" -ForegroundColor Cyan
Write-Host "ADMIN: admin@lealta.com / admin123" -ForegroundColor White
Write-Host "STAFF: staff@lealta.com / staff123" -ForegroundColor White
Write-Host ""

npm start
