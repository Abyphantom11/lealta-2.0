#!/bin/bash

# 🚀 LEALTA 2.0 - SCRIPT DE INICIO RÁPIDO

echo "🚀 Iniciando Lealta 2.0..."
echo "📊 Estado: PRODUCTION READY"
echo ""

# Verificar dependencias
echo "📦 Verificando dependencias..."
npm install --legacy-peer-deps

# Generar cliente Prisma
echo "🗄️ Generando cliente Prisma..."
npx prisma generate

# Sincronizar base de datos
echo "🔄 Sincronizando base de datos..."
npx prisma db push

# Build de producción
echo "🏗️ Construyendo aplicación..."
npm run build

# Iniciar aplicación
echo "🎯 Iniciando en modo producción..."
echo ""
echo "✅ URLs disponibles:"
echo "🏠 Home: http://localhost:3001/"
echo "👑 Admin: http://localhost:3001/demo/admin"
echo "🛠️ Staff: http://localhost:3001/demo/staff"
echo "👥 Cliente: http://localhost:3001/demo/cliente"
echo ""
echo "🔑 Credenciales:"
echo "ADMIN: admin@lealta.com / admin123"
echo "STAFF: staff@lealta.com / staff123"
echo ""

npm start
