# Script de Remediación de Seguridad
# Ejecutar en PowerShell como Administrador

Write-Host "🚨 INICIANDO REMEDIACIÓN DE SEGURIDAD..." -ForegroundColor Red

# PASO 1: Backup de archivos sensibles (solo local)
Write-Host "`n📦 PASO 1: Creando backup local de archivos..." -ForegroundColor Yellow
Copy-Item .env.vercel -Destination .env.vercel.backup.local -ErrorAction SilentlyContinue
Copy-Item .env.vercel.production -Destination .env.vercel.production.backup.local -ErrorAction SilentlyContinue
Write-Host "✅ Backup creado (.env.vercel.backup.local)" -ForegroundColor Green

# PASO 2: Actualizar .gitignore
Write-Host "`n📝 PASO 2: Actualizando .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"

# ⚠️ SEGURIDAD: NUNCA commitear archivos con credenciales reales
.env.vercel
.env.vercel.*
.env.*.backup.local
*.backup.local
"@

Add-Content -Path .gitignore -Value $gitignoreContent
Write-Host "✅ .gitignore actualizado" -ForegroundColor Green

# PASO 3: Eliminar archivos del tracking de git
Write-Host "`n🗑️ PASO 3: Eliminando archivos del tracking de git..." -ForegroundColor Yellow
git rm --cached .env.vercel
git rm --cached .env.vercel.production
Write-Host "✅ Archivos eliminados del tracking" -ForegroundColor Green

# PASO 4: Verificar estado
Write-Host "`n🔍 PASO 4: Verificando estado actual..." -ForegroundColor Yellow
Write-Host "Archivos que serán commiteados:" -ForegroundColor Cyan
git status --short

# PASO 5: Commit de seguridad
Write-Host "`n💾 PASO 5: ¿Deseas hacer commit de estos cambios? (S/N)" -ForegroundColor Yellow
$respuesta = Read-Host
if ($respuesta -eq "S" -or $respuesta -eq "s") {
    git commit -m "security: Remove .env files with leaked API keys from git tracking

🚨 SECURITY INCIDENT RESOLUTION:
- Removed .env.vercel and .env.vercel.production from git
- Added these files to .gitignore
- API keys will be managed via Vercel Dashboard only
- See SECURITY_LEAK_FIX.md for full remediation steps

BREAKING: Old API keys must be revoked manually in Google Console"
    
    Write-Host "✅ Commit creado" -ForegroundColor Green
    
    Write-Host "`n🚀 ¿Deseas hacer push ahora? (S/N)" -ForegroundColor Yellow
    $push = Read-Host
    if ($push -eq "S" -or $push -eq "s") {
        git push origin main
        Write-Host "✅ Cambios pusheados" -ForegroundColor Green
    }
} else {
    Write-Host "⏸️ Commit cancelado. Ejecuta manualmente cuando estés listo." -ForegroundColor Yellow
}

# PASO 6: Instrucciones finales
Write-Host "`n`n🎯 PRÓXIMOS PASOS CRÍTICOS:" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Host "1️⃣  Ve a Google Console y REVOCA las API keys antiguas:" -ForegroundColor Yellow
Write-Host "    https://console.cloud.google.com/apis/credentials" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣  Crea una NUEVA API key con restricciones:" -ForegroundColor Yellow
Write-Host "    ✓ Application restrictions: HTTP referrers" -ForegroundColor White
Write-Host "    ✓ Agrega: https://lealta.app/*" -ForegroundColor White
Write-Host "    ✓ API restrictions: Solo Gemini API" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Agrega la nueva key a Vercel (NO a archivos locales):" -ForegroundColor Yellow
Write-Host "    Opción A: Dashboard → https://vercel.com/tu-proyecto/settings/environment-variables" -ForegroundColor Cyan
Write-Host "    Opción B: CLI → npx vercel env add GOOGLE_GEMINI_API_KEY production" -ForegroundColor Cyan
Write-Host ""
Write-Host "4️⃣  Para desarrollo local, crea .env.local (ya está en .gitignore):" -ForegroundColor Yellow
Write-Host "    echo 'GOOGLE_GEMINI_API_KEY=tu-key-local' > .env.local" -ForegroundColor Cyan
Write-Host ""
Write-Host "5️⃣  OPCIONAL: Elimina los archivos locales (ya no los necesitas):" -ForegroundColor Yellow
Write-Host "    Remove-Item .env.vercel, .env.vercel.production" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Host "📖 Lee SECURITY_LEAK_FIX.md para más detalles" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ Remediación básica completada!" -ForegroundColor Green
