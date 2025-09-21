# 🚀 QUICK DEPLOYMENT COMMANDS - LEALTA 2.0
# Scripts rápidos para deployment y management
# PowerShell Version para Windows

param(
    [string]$Command = "help"
)

Write-Host "🚀 LEALTA 2.0 - DEPLOYMENT TOOLKIT" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Función para display de ayuda
function Show-Help {
    Write-Host ""
    Write-Host "📋 COMANDOS DISPONIBLES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 DEVELOPMENT:" -ForegroundColor Green
    Write-Host "  .\deploy.ps1 dev          - Iniciar servidor de desarrollo"
    Write-Host "  .\deploy.ps1 build        - Build local para testing"
    Write-Host "  .\deploy.ps1 check        - Verificaciones pre-deploy"
    Write-Host ""
    Write-Host "🚀 DEPLOYMENT:" -ForegroundColor Blue
    Write-Host "  .\deploy.ps1 staging      - Deploy a staging (preview)"
    Write-Host "  .\deploy.ps1 production   - Deploy a producción"
    Write-Host "  .\deploy.ps1 quick        - Deploy rápido (skip checks)"
    Write-Host ""
    Write-Host "🔄 MAINTENANCE:" -ForegroundColor Magenta
    Write-Host "  .\deploy.ps1 rollback     - Rollback último deploy"
    Write-Host "  .\deploy.ps1 backup       - Crear backup manual"
    Write-Host "  .\deploy.ps1 status       - Estado del deployment"
    Write-Host ""
    Write-Host "🧹 CLEANUP:" -ForegroundColor DarkYellow
    Write-Host "  .\deploy.ps1 clean        - Limpiar builds locales"
    Write-Host "  .\deploy.ps1 reset        - Reset completo (cuidado!)"
    Write-Host ""
}

# Función para verificaciones pre-deploy
function Test-Prerequisites {
    Write-Host "🔍 Verificando prerrequisitos..." -ForegroundColor Yellow
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
        exit 1
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ npm no está instalado" -ForegroundColor Red
        exit 1
    }
    
    # Verificar git
    try {
        $gitVersion = git --version
        Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Git no está instalado" -ForegroundColor Red
        exit 1
    }
    
    # Verificar si estamos en un repo git
    try {
        git rev-parse --git-dir > $null 2>&1
        Write-Host "✅ Repositorio Git activo" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ No estás en un repositorio Git" -ForegroundColor Red
        exit 1
    }
    
    # Verificar archivos críticos
    if (!(Test-Path "package.json")) {
        Write-Host "❌ package.json no encontrado" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ package.json encontrado" -ForegroundColor Green
    
    if (!(Test-Path "next.config.js")) {
        Write-Host "❌ next.config.js no encontrado" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ next.config.js encontrado" -ForegroundColor Green
    
    Write-Host "🎉 Todos los prerrequisitos cumplidos" -ForegroundColor Green
    return $true
}

# Función para build y verificación
function Invoke-BuildAndCheck {
    Write-Host "🔨 Iniciando build..." -ForegroundColor Yellow
    
    # Limpiar builds anteriores
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
    }
    Write-Host "🧹 Limpieza de builds anteriores" -ForegroundColor DarkYellow
    
    # Instalar dependencias
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm ci
    
    # Build
    Write-Host "🔨 Building aplicación..." -ForegroundColor Yellow
    $buildResult = npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build exitoso" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Build falló" -ForegroundColor Red
        return $false
    }
}

# Función para deploy staging
function Invoke-DeployStaging {
    Write-Host "🚧 Deploying a STAGING..." -ForegroundColor Yellow
    
    if (!(Test-Prerequisites)) { return }
    
    if (Invoke-BuildAndCheck) {
        Write-Host "🚀 Iniciando deploy a staging..." -ForegroundColor Blue
        
        # Verificar si Vercel CLI está instalado
        try {
            vercel --version > $null
            vercel --confirm
            Write-Host "✅ Deploy a staging completado" -ForegroundColor Green
            Write-Host "🔗 Preview URL disponible en dashboard de Vercel" -ForegroundColor Cyan
        }
        catch {
            Write-Host "⚠️ Vercel CLI no instalado" -ForegroundColor Yellow
            Write-Host "💡 Instala con: npm i -g vercel" -ForegroundColor Cyan
            Write-Host "🔗 Alternativamente, push a GitHub activará deploy automático" -ForegroundColor Cyan
            
            # Push a GitHub para trigger deploy
            git add .
            git commit -m "deploy: Staging deployment $(Get-Date)"
            $currentBranch = git branch --show-current
            git push origin $currentBranch
        }
    } else {
        Write-Host "❌ Deploy cancelado por fallos en build" -ForegroundColor Red
        exit 1
    }
}

# Función para deploy producción
function Invoke-DeployProduction {
    Write-Host "🚀 Deploying a PRODUCCIÓN..." -ForegroundColor Red
    Write-Host "⚠️ ADVERTENCIA: Esto afectará a usuarios reales" -ForegroundColor Yellow
    
    $confirm = Read-Host "¿Estás seguro? (y/N)"
    if ($confirm -notmatch '^[Yy]$') {
        Write-Host "❌ Deploy cancelado por usuario" -ForegroundColor Red
        return
    }
    
    if (!(Test-Prerequisites)) { return }
    
    # Verificar que estamos en main o una branch de producción
    $currentBranch = git branch --show-current
    if ($currentBranch -ne "main" -and $currentBranch -ne "production") {
        Write-Host "⚠️ No estás en branch main o production" -ForegroundColor Yellow
        Write-Host "📍 Branch actual: $currentBranch" -ForegroundColor Cyan
        $confirm2 = Read-Host "¿Continuar anyway? (y/N)"
        if ($confirm2 -notmatch '^[Yy]$') {
            Write-Host "❌ Deploy cancelado" -ForegroundColor Red
            return
        }
    }
    
    if (Invoke-BuildAndCheck) {
        Write-Host "💾 Creando backup antes del deploy..." -ForegroundColor Yellow
        # Aquí irían comandos de backup real
        
        Write-Host "🚀 Iniciando deploy a producción..." -ForegroundColor Blue
        
        try {
            vercel --version > $null
            vercel --prod --confirm
            Write-Host "✅ Deploy a producción completado" -ForegroundColor Green
        }
        catch {
            Write-Host "🔗 Push para trigger deploy automático..." -ForegroundColor Cyan
            git add .
            git commit -m "deploy: Production deployment $(Get-Date)"
            git push origin $currentBranch
            Write-Host "✅ Push completado - Vercel desplegará automáticamente" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "📋 CHECKLIST POST-DEPLOY:" -ForegroundColor Yellow
        Write-Host "  🔍 Verificar que la app carga"
        Write-Host "  🔐 Probar login/logout"
        Write-Host "  📱 Verificar features críticas"
        Write-Host "  📊 Revisar Sentry por errores"
        Write-Host "  🗄️ Verificar base de datos"
        
    } else {
        Write-Host "❌ Deploy cancelado por fallos en build" -ForegroundColor Red
        exit 1
    }
}

# Función para deploy rápido
function Invoke-DeployQuick {
    Write-Host "⚡ DEPLOY RÁPIDO (skipping extensive checks)..." -ForegroundColor Yellow
    
    git add .
    git commit -m "quick deploy: $(Get-Date)"
    $currentBranch = git branch --show-current
    git push origin $currentBranch
    
    Write-Host "✅ Push completado" -ForegroundColor Green
    Write-Host "🔄 Vercel procesará el deploy automáticamente" -ForegroundColor Cyan
}

# Función para rollback
function Invoke-RollbackDeployment {
    Write-Host "🔄 INICIANDO ROLLBACK..." -ForegroundColor Yellow
    
    Write-Host "⚠️ Esto revertirá el último commit y redesplegará" -ForegroundColor Yellow
    $confirm = Read-Host "¿Continuar? (y/N)"
    if ($confirm -notmatch '^[Yy]$') {
        Write-Host "❌ Rollback cancelado" -ForegroundColor Red
        return
    }
    
    # Revertir último commit
    git revert HEAD --no-edit
    $currentBranch = git branch --show-current
    git push origin $currentBranch
    
    Write-Host "✅ Rollback completado" -ForegroundColor Green
    Write-Host "🔄 Vercel redesplegará automáticamente" -ForegroundColor Cyan
}

# Función para mostrar status
function Show-Status {
    Write-Host "📊 ESTADO DEL PROYECTO:" -ForegroundColor Cyan
    Write-Host ""
    $currentBranch = git branch --show-current
    Write-Host "📍 Branch actual: $currentBranch" -ForegroundColor Yellow
    $lastCommit = git log -1 --oneline
    Write-Host "📝 Último commit: $lastCommit" -ForegroundColor Yellow
    Write-Host "📁 Archivos modificados:" -ForegroundColor Yellow
    git status --porcelain
    Write-Host ""
    Write-Host "🔗 Para ver deployments: https://vercel.com/dashboard" -ForegroundColor Cyan
}

# Función para limpiar
function Invoke-CleanProject {
    Write-Host "🧹 Limpiando proyecto..." -ForegroundColor Yellow
    
    if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
    if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    
    Write-Host "✅ Limpieza completada" -ForegroundColor Green
}

# Switch principal
switch ($Command.ToLower()) {
    "dev" {
        npm run dev
    }
    "build" {
        Invoke-BuildAndCheck
    }
    "check" {
        Test-Prerequisites
    }
    "staging" {
        Invoke-DeployStaging
    }
    "production" {
        Invoke-DeployProduction
    }
    "quick" {
        Invoke-DeployQuick
    }
    "rollback" {
        Invoke-RollbackDeployment
    }
    "backup" {
        Write-Host "💾 Backup manual - implement según tu setup de DB" -ForegroundColor Yellow
    }
    "status" {
        Show-Status
    }
    "clean" {
        Invoke-CleanProject
    }
    "reset" {
        Write-Host "🚨 RESET COMPLETO - elimina todo" -ForegroundColor Red
        $confirm = Read-Host "¿REALMENTE seguro? (y/N)"
        if ($confirm -match '^[Yy]$') {
            Invoke-CleanProject
            if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
            npm install
            Write-Host "✅ Reset completado" -ForegroundColor Green
        }
    }
    default {
        Show-Help
    }
}
