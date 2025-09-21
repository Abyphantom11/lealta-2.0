# 🎯 CONFIGURACIÓN INICIAL - LEALTA 2.0
# Script para configurar todo por primera vez

param(
    [switch]$Quick = $false
)

Write-Host "🎯 LEALTA 2.0 - CONFIGURACIÓN INICIAL" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Función para verificar si comando existe
function Test-Command {
    param($CommandName)
    try {
        Get-Command $CommandName -ErrorAction Stop > $null
        return $true
    }
    catch {
        return $false
    }
}

Write-Host ""
Write-Host "📋 CHECKLIST DE CONFIGURACIÓN INICIAL:" -ForegroundColor Yellow
Write-Host ""

# 1. Verificar Node.js
Write-Host "1️⃣ Verificando Node.js..." -ForegroundColor Blue
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
    
    # Verificar versión mínima
    $version = [version]($nodeVersion -replace 'v', '')
    if ($version.Major -ge 18) {
        Write-Host "   ✅ Versión compatible (>=18)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Versión antigua. Recomendado: Node 18+" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Node.js NO instalado" -ForegroundColor Red
    Write-Host "   💡 Descarga desde: https://nodejs.org" -ForegroundColor Cyan
    if (!$Quick) {
        Read-Host "   Presiona Enter después de instalar Node.js"
    }
}

# 2. Verificar Git
Write-Host ""
Write-Host "2️⃣ Verificando Git..." -ForegroundColor Blue
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host "   ✅ Git instalado: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Git NO instalado" -ForegroundColor Red
    Write-Host "   💡 Descarga desde: https://git-scm.com" -ForegroundColor Cyan
    if (!$Quick) {
        Read-Host "   Presiona Enter después de instalar Git"
    }
}

# 3. Verificar configuración Git
Write-Host ""
Write-Host "3️⃣ Verificando configuración Git..." -ForegroundColor Blue
try {
    $gitUser = git config --global user.name
    $gitEmail = git config --global user.email
    
    if ($gitUser -and $gitEmail) {
        Write-Host "   ✅ Git configurado:" -ForegroundColor Green
        Write-Host "      Usuario: $gitUser" -ForegroundColor Gray
        Write-Host "      Email: $gitEmail" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️ Git no configurado completamente" -ForegroundColor Yellow
        if (!$Quick) {
            Write-Host "   🔧 Configurando Git..." -ForegroundColor Yellow
            $userName = Read-Host "   Ingresa tu nombre"
            $userEmail = Read-Host "   Ingresa tu email"
            git config --global user.name $userName
            git config --global user.email $userEmail
            Write-Host "   ✅ Git configurado" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ❌ Error verificando configuración Git" -ForegroundColor Red
}

# 4. Instalar dependencias
Write-Host ""
Write-Host "4️⃣ Instalando dependencias..." -ForegroundColor Blue
if (Test-Path "package.json") {
    Write-Host "   📦 Instalando dependencias npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error instalando dependencias" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ package.json no encontrado" -ForegroundColor Red
}

# 5. Verificar Vercel CLI
Write-Host ""
Write-Host "5️⃣ Verificando Vercel CLI..." -ForegroundColor Blue
if (Test-Command "vercel") {
    Write-Host "   ✅ Vercel CLI instalado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Vercel CLI no instalado" -ForegroundColor Yellow
    if (!$Quick) {
        $installVercel = Read-Host "   ¿Instalar Vercel CLI? (y/N)"
        if ($installVercel -match '^[Yy]$') {
            npm install -g vercel
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Vercel CLI instalado" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Error instalando Vercel CLI" -ForegroundColor Red
            }
        }
    }
}

# 6. Configurar variables de entorno
Write-Host ""
Write-Host "6️⃣ Verificando variables de entorno..." -ForegroundColor Blue
if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local encontrado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ .env.local no encontrado" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "   📋 Encontrado .env.example" -ForegroundColor Cyan
        if (!$Quick) {
            $createEnv = Read-Host "   ¿Crear .env.local desde ejemplo? (y/N)"
            if ($createEnv -match '^[Yy]$') {
                Copy-Item ".env.example" ".env.local"
                Write-Host "   ✅ .env.local creado" -ForegroundColor Green
                Write-Host "   📝 IMPORTANTE: Edita .env.local con tus valores reales" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   📝 Necesitas crear .env.local manualmente" -ForegroundColor Yellow
    }
}

# 7. Verificar base de datos
Write-Host ""
Write-Host "7️⃣ Verificando configuración de base de datos..." -ForegroundColor Blue
if (Test-Path "prisma/schema.prisma") {
    Write-Host "   ✅ Schema de Prisma encontrado" -ForegroundColor Green
    
    # Verificar si hay migraciones
    if (Test-Path "prisma/migrations") {
        $migrations = Get-ChildItem "prisma/migrations" -Directory
        Write-Host "   📊 Migraciones encontradas: $($migrations.Count)" -ForegroundColor Cyan
    }
    
    if (!$Quick) {
        $runMigrations = Read-Host "   ¿Ejecutar migraciones de DB? (y/N)"
        if ($runMigrations -match '^[Yy]$') {
            Write-Host "   🔄 Ejecutando migraciones..." -ForegroundColor Yellow
            npx prisma migrate dev
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Migraciones completadas" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️ Revisa la configuración de DB en .env.local" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "   ❌ Schema de Prisma no encontrado" -ForegroundColor Red
}

# 8. Build de prueba
Write-Host ""
Write-Host "8️⃣ Build de prueba..." -ForegroundColor Blue
if (!$Quick) {
    $testBuild = Read-Host "   ¿Hacer build de prueba? (y/N)"
    if ($testBuild -match '^[Yy]$') {
        Write-Host "   🔨 Building aplicación..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Build exitoso" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Build falló - revisa errores arriba" -ForegroundColor Red
        }
    }
}

# Resumen final
Write-Host ""
Write-Host "🎉 CONFIGURACIÓN INICIAL COMPLETADA" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 DESARROLLO:" -ForegroundColor Cyan
Write-Host "   .\deploy.ps1 dev          - Iniciar servidor de desarrollo"
Write-Host "   .\deploy.ps1 check        - Verificar que todo funciona"
Write-Host ""
Write-Host "🚀 DEPLOYMENT:" -ForegroundColor Blue
Write-Host "   .\deploy.ps1 staging      - Deploy de prueba"
Write-Host "   .\deploy.ps1 production   - Deploy a producción"
Write-Host ""
Write-Host "📚 DOCUMENTACIÓN:" -ForegroundColor Magenta
Write-Host "   📄 README.md              - Documentación del proyecto"
Write-Host "   📄 DEPLOYMENT_STRATEGY.md - Guía de deployment"
Write-Host ""
Write-Host "🔗 RECURSOS ÚTILES:" -ForegroundColor Yellow
Write-Host "   🌐 Dashboard Vercel: https://vercel.com/dashboard"
Write-Host "   📊 Sentry Dashboard: https://sentry.io"
Write-Host "   📖 Docs Next.js: https://nextjs.org/docs"
Write-Host ""

if (!$Quick) {
    Write-Host "💡 TIP: Ejecuta '.\deploy.ps1 dev' para empezar a desarrollar" -ForegroundColor Green
    Read-Host "Presiona Enter para continuar"
}
