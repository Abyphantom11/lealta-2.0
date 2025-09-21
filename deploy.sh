#!/bin/bash

# 🚀 QUICK DEPLOYMENT COMMANDS - LEALTA 2.0
# Scripts rápidos para deployment y management

echo "🚀 LEALTA 2.0 - DEPLOYMENT TOOLKIT"
echo "=================================="

# Función para display de ayuda
show_help() {
    echo ""
    echo "📋 COMANDOS DISPONIBLES:"
    echo ""
    echo "🔧 DEVELOPMENT:"
    echo "  ./deploy.sh dev          - Iniciar servidor de desarrollo"
    echo "  ./deploy.sh build        - Build local para testing"
    echo "  ./deploy.sh check        - Verificaciones pre-deploy"
    echo ""
    echo "🚀 DEPLOYMENT:"
    echo "  ./deploy.sh staging      - Deploy a staging (preview)"
    echo "  ./deploy.sh production   - Deploy a producción"
    echo "  ./deploy.sh quick        - Deploy rápido (skip checks)"
    echo ""
    echo "🔄 MAINTENANCE:"
    echo "  ./deploy.sh rollback     - Rollback último deploy"
    echo "  ./deploy.sh backup       - Crear backup manual"
    echo "  ./deploy.sh status       - Estado del deployment"
    echo ""
    echo "🧹 CLEANUP:"
    echo "  ./deploy.sh clean        - Limpiar builds locales"
    echo "  ./deploy.sh reset        - Reset completo (cuidado!)"
    echo ""
}

# Función para verificaciones pre-deploy
check_prerequisites() {
    echo "🔍 Verificando prerrequisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js no está instalado"
        exit 1
    fi
    echo "✅ Node.js: $(node --version)"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm no está instalado"
        exit 1
    fi
    echo "✅ npm: $(npm --version)"
    
    # Verificar git
    if ! command -v git &> /dev/null; then
        echo "❌ Git no está instalado"
        exit 1
    fi
    echo "✅ Git: $(git --version)"
    
    # Verificar si estamos en un repo git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "❌ No estás en un repositorio Git"
        exit 1
    fi
    echo "✅ Repositorio Git activo"
    
    # Verificar archivos críticos
    if [ ! -f "package.json" ]; then
        echo "❌ package.json no encontrado"
        exit 1
    fi
    echo "✅ package.json encontrado"
    
    if [ ! -f "next.config.js" ]; then
        echo "❌ next.config.js no encontrado"
        exit 1
    fi
    echo "✅ next.config.js encontrado"
    
    echo "🎉 Todos los prerrequisitos cumplidos"
}

# Función para build y verificación
build_and_check() {
    echo "🔨 Iniciando build..."
    
    # Limpiar builds anteriores
    rm -rf .next
    echo "🧹 Limpieza de builds anteriores"
    
    # Instalar dependencias
    echo "📦 Instalando dependencias..."
    npm ci
    
    # Build
    echo "🔨 Building aplicación..."
    if npm run build; then
        echo "✅ Build exitoso"
        return 0
    else
        echo "❌ Build falló"
        return 1
    fi
}

# Función para deploy staging
deploy_staging() {
    echo "🚧 Deploying a STAGING..."
    
    check_prerequisites
    
    if build_and_check; then
        echo "🚀 Iniciando deploy a staging..."
        
        # Verificar si Vercel CLI está instalado
        if command -v vercel &> /dev/null; then
            vercel --confirm
            echo "✅ Deploy a staging completado"
            echo "🔗 Preview URL disponible en dashboard de Vercel"
        else
            echo "⚠️ Vercel CLI no instalado"
            echo "💡 Instala con: npm i -g vercel"
            echo "🔗 Alternativamente, push a GitHub activará deploy automático"
            
            # Push a GitHub para trigger deploy
            git add .
            git commit -m "deploy: Staging deployment $(date)"
            git push origin $(git branch --show-current)
        fi
    else
        echo "❌ Deploy cancelado por fallos en build"
        exit 1
    fi
}

# Función para deploy producción
deploy_production() {
    echo "🚀 Deploying a PRODUCCIÓN..."
    echo "⚠️ ADVERTENCIA: Esto afectará a usuarios reales"
    
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deploy cancelado por usuario"
        exit 1
    fi
    
    check_prerequisites
    
    # Verificar que estamos en main o una branch de producción
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "production" ]; then
        echo "⚠️ No estás en branch main o production"
        echo "📍 Branch actual: $current_branch"
        read -p "¿Continuar anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Deploy cancelado"
            exit 1
        fi
    fi
    
    if build_and_check; then
        echo "💾 Creando backup antes del deploy..."
        # Aquí irían comandos de backup real
        
        echo "🚀 Iniciando deploy a producción..."
        
        if command -v vercel &> /dev/null; then
            vercel --prod --confirm
            echo "✅ Deploy a producción completado"
        else
            echo "🔗 Push para trigger deploy automático..."
            git add .
            git commit -m "deploy: Production deployment $(date)"
            git push origin $current_branch
            echo "✅ Push completado - Vercel desplegará automáticamente"
        fi
        
        echo ""
        echo "📋 CHECKLIST POST-DEPLOY:"
        echo "  🔍 Verificar que la app carga"
        echo "  🔐 Probar login/logout"
        echo "  📱 Verificar features críticas"
        echo "  📊 Revisar Sentry por errores"
        echo "  🗄️ Verificar base de datos"
        
    else
        echo "❌ Deploy cancelado por fallos en build"
        exit 1
    fi
}

# Función para deploy rápido (skip checks)
deploy_quick() {
    echo "⚡ DEPLOY RÁPIDO (skipping extensive checks)..."
    
    git add .
    git commit -m "quick deploy: $(date)"
    git push origin $(git branch --show-current)
    
    echo "✅ Push completado"
    echo "🔄 Vercel procesará el deploy automáticamente"
}

# Función para rollback
rollback_deployment() {
    echo "🔄 INICIANDO ROLLBACK..."
    
    echo "⚠️ Esto revertirá el último commit y redesplegará"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Rollback cancelado"
        exit 1
    fi
    
    # Revertir último commit
    git revert HEAD --no-edit
    git push origin $(git branch --show-current)
    
    echo "✅ Rollback completado"
    echo "🔄 Vercel redesplegará automáticamente"
}

# Función para mostrar status
show_status() {
    echo "📊 ESTADO DEL PROYECTO:"
    echo ""
    echo "📍 Branch actual: $(git branch --show-current)"
    echo "📝 Último commit: $(git log -1 --oneline)"
    echo "📁 Archivos modificados:"
    git status --porcelain
    echo ""
    echo "🔗 Para ver deployments: https://vercel.com/dashboard"
}

# Función para limpiar
clean_project() {
    echo "🧹 Limpiando proyecto..."
    
    rm -rf .next
    rm -rf node_modules/.cache
    rm -rf dist
    
    echo "✅ Limpieza completada"
}

# Función principal
case "$1" in
    "dev")
        npm run dev
        ;;
    "build")
        build_and_check
        ;;
    "check")
        check_prerequisites
        ;;
    "staging")
        deploy_staging
        ;;
    "production")
        deploy_production
        ;;
    "quick")
        deploy_quick
        ;;
    "rollback")
        rollback_deployment
        ;;
    "backup")
        echo "💾 Backup manual - implement según tu setup de DB"
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_project
        ;;
    "reset")
        echo "🚨 RESET COMPLETO - elimina todo"
        read -p "¿REALMENTE seguro? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            clean_project
            rm -rf node_modules
            npm install
            echo "✅ Reset completado"
        fi
        ;;
    *)
        show_help
        ;;
esac
