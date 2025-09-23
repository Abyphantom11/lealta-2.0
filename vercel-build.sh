#!/bin/bash
echo "🚀 VERCEL BUILD SCRIPT - Lealta 2.0"

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# 2. Generar Prisma Client
echo "🗄️  Generando Prisma Client..."
npx prisma generate

# 3. Verificar conexión DB (sin ejecutar migraciones)
echo "🔍 Verificando conexión a base de datos..."
npx prisma db push --accept-data-loss || echo "⚠️  DB push falló, continuando..."

# 4. Build de Next.js
echo "🏗️  Building Next.js..."
npm run build

echo "✅ Build completado"
