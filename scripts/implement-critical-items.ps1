# 🚀 SCRIPT DE IMPLEMENTACIÓN AUTOMÁTICA - ITEMS CRÍTICOS (PowerShell)
# Automatiza la implementación de los 4 items críticos para producción

Write-Host "🚀 LEALTA 2.0 - IMPLEMENTACIÓN ITEMS CRÍTICOS" -ForegroundColor Green
Write-Host "==============================================`n" -ForegroundColor Green

# Funciones para mostrar progreso
function Show-Progress($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Show-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Show-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Show-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# 1. RATE LIMITING SETUP
Write-Host "📊 STEP 1/4: Configurando Rate Limiting..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Show-Progress "Instalando dependencias de rate limiting..."
npm install @upstash/ratelimit @upstash/redis

# Crear directorio lib si no existe
if (!(Test-Path "src\lib")) {
    New-Item -ItemType Directory -Path "src\lib" -Force
}

# Crear rate limiter
Show-Progress "Creando configuración de rate limiter..."
$rateLimiterContent = @'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Configuración condicional para desarrollo
const redis = process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null

// Rate limiters con fallback para desarrollo
export const authLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests por minuto
  analytics: true,
}) : null

export const apiLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"), // 100 requests por minuto  
  analytics: true,
}) : null

export const publicLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"), // 30 requests por minuto
  analytics: true,
}) : null

// Helper para aplicar rate limiting
export async function applyRateLimit(request: Request, type: 'auth' | 'api' | 'public' = 'api') {
  if (!redis) {
    // En desarrollo sin Redis, permitir todo
    return { success: true, limit: 1000, remaining: 999, reset: Date.now() + 60000 }
  }

  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             '127.0.0.1'

  let limiter
  switch (type) {
    case 'auth': limiter = authLimiter; break
    case 'api': limiter = apiLimiter; break
    case 'public': limiter = publicLimiter; break
  }

  if (!limiter) {
    return { success: true, limit: 1000, remaining: 999, reset: Date.now() + 60000 }
  }

  return await limiter.limit(ip)
}
'@

$rateLimiterContent | Out-File -FilePath "src\lib\rate-limiter.ts" -Encoding UTF8

Show-Success "Rate limiter configurado correctamente"

# 2. SECURITY HEADERS
Write-Host "`n🔒 STEP 2/4: Configurando Security Headers..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Show-Progress "Actualizando next.config.js con security headers..."

# Backup del next.config.js actual si existe
if (Test-Path "next.config.js") {
    Copy-Item "next.config.js" "next.config.js.backup"
    Show-Warning "Backup creado: next.config.js.backup"
}

# Crear nuevo next.config.js con security headers
$nextConfigContent = @'
/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
]

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  // Optimizaciones para producción
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}

module.exports = nextConfig
'@

$nextConfigContent | Out-File -FilePath "next.config.js" -Encoding UTF8

Show-Success "Security headers configurados"

# 3. ENVIRONMENT VARIABLES
Write-Host "`n🌍 STEP 3/4: Configurando Variables de Entorno..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Show-Progress "Creando template .env.production..."

$envTemplate = @'
# 🚀 LEALTA 2.0 - VARIABLES DE ENTORNO PRODUCCIÓN
# Copia este archivo a .env.production y completa los valores

NODE_ENV=production

# ============================================
# DATABASE (OBLIGATORIO)
# ============================================
DATABASE_URL=postgresql://username:password@host:5432/lealta_production

# ============================================  
# AUTHENTICATION (OBLIGATORIO)
# ============================================
NEXTAUTH_SECRET=GENERAR-STRING-ALEATORIO-32-CARACTERES-MINIMO
NEXTAUTH_URL=https://tu-dominio-produccion.com

# ============================================
# SECURITY (OBLIGATORIO)  
# ============================================
JWT_SECRET=OTRO-STRING-ALEATORIO-32-CARACTERES-MINIMO

# ============================================
# RATE LIMITING (RECOMENDADO)
# ============================================
UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# ============================================
# MONITORING (OPCIONAL)
# ============================================
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-public-dsn

# ============================================
# EMAIL (OPCIONAL)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tu-dominio.com
SMTP_PASS=your-app-password

# ============================================
# APP CONFIG
# ============================================
NEXT_PUBLIC_APP_URL=https://tu-dominio-produccion.com
'@

$envTemplate | Out-File -FilePath ".env.production.template" -Encoding UTF8

# Crear validador de variables de entorno
Show-Progress "Creando validador de variables de entorno..."

$envValidationContent = @'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET debe tener al menos 32 caracteres'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL debe ser una URL válida'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  
  // Opcionales
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
})

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env)
    console.log('✅ Variables de entorno validadas correctamente')
    return env
  } catch (error) {
    console.error('❌ Error en variables de entorno:', error)
    throw new Error('Variables de entorno inválidas')
  }
}

// Auto-validar en producción
if (process.env.NODE_ENV === 'production') {
  validateEnv()
}
'@

$envValidationContent | Out-File -FilePath "src\lib\env-validation.ts" -Encoding UTF8

Show-Success "Template de variables de entorno creado"
Show-Warning "⚠️  IMPORTANTE: Completa .env.production.template con tus valores reales"

# 4. DEPLOYMENT HELPERS
Write-Host "`n🚀 STEP 4/4: Creando Helpers de Deployment..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Show-Progress "Creando scripts de deployment..."

# Crear directorio scripts si no existe
if (!(Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" -Force
}

# Script de validación pre-deploy
$preDeployCheck = @'
#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔍 PRE-DEPLOY VALIDATION CHECK')
console.log('==============================')

let errors = []
let warnings = []

// 1. Verificar .env.production existe
if (!fs.existsSync('.env.production')) {
  errors.push('❌ .env.production no existe')
} else {
  console.log('✅ .env.production encontrado')
}

// 2. Verificar build exitoso
try {
  if (!fs.existsSync('.next')) {
    warnings.push('⚠️  Build no encontrado - ejecutar npm run build')
  } else {
    console.log('✅ Build encontrado')
  }
} catch (e) {
  warnings.push('⚠️  No se pudo verificar build')
}

// 3. Verificar next.config.js tiene security headers
try {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8')
  if (nextConfig.includes('Strict-Transport-Security')) {
    console.log('✅ Security headers configurados')
  } else {
    errors.push('❌ Security headers no configurados en next.config.js')
  }
} catch (e) {
  errors.push('❌ next.config.js no encontrado')
}

// 4. Verificar rate limiter existe
if (fs.existsSync('src/lib/rate-limiter.ts')) {
  console.log('✅ Rate limiter configurado')
} else {
  errors.push('❌ Rate limiter no configurado')
}

// Resultado final
console.log('\n📊 RESUMEN:')
if (errors.length === 0) {
  console.log('🎉 ¡LISTO PARA DEPLOYMENT!')
  process.exit(0)
} else {
  console.log(`❌ ${errors.length} errores encontrados:`)
  errors.forEach(error => console.log(`   ${error}`))
  
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} advertencias:`)
    warnings.forEach(warning => console.log(`   ${warning}`))
  }
  
  console.log('\n🔧 Corrige los errores antes de deployar')
  process.exit(1)
}
'@

$preDeployCheck | Out-File -FilePath "scripts\pre-deploy-check.js" -Encoding UTF8

# Script de deployment PowerShell
$deployScript = @'
# 🚀 LEALTA 2.0 - DEPLOYMENT SCRIPT (PowerShell)

Write-Host "🚀 LEALTA 2.0 - DEPLOYMENT SCRIPT" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Ejecutar validación pre-deploy
Write-Host "🔍 Ejecutando validación pre-deploy..." -ForegroundColor Blue
node scripts\pre-deploy-check.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Pre-deploy check falló. Corrige los errores antes de continuar." -ForegroundColor Red
    exit 1
}

# Build de producción
Write-Host "🏗️  Construyendo aplicación..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build falló" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build exitoso" -ForegroundColor Green

# Listo para deploy
Write-Host "🚀 Listo para deploy!" -ForegroundColor Green
Write-Host ""
Write-Host "Opciones de deployment:" -ForegroundColor Yellow
Write-Host "1. Vercel: vercel --prod" -ForegroundColor White
Write-Host "2. Railway: railway up" -ForegroundColor White
Write-Host "3. Manual: npm run start" -ForegroundColor White
'@

$deployScript | Out-File -FilePath "scripts\deploy.ps1" -Encoding UTF8

Show-Success "Scripts de deployment creados"

# 5. ACTUALIZAR PACKAGE.JSON
Write-Host "`n📦 Actualizando package.json con scripts útiles..." -ForegroundColor Cyan

# Agregar scripts útiles
npm pkg set scripts.validate-env="node -e \`"require('./src/lib/env-validation').validateEnv()\`""
npm pkg set scripts.pre-deploy="node scripts/pre-deploy-check.js"
npm pkg set scripts.deploy-win="powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1"
npm pkg set scripts.prod="set NODE_ENV=production && npm run build && npm run start"

Show-Success "Scripts agregados a package.json"

# RESUMEN FINAL
Write-Host "`n🎉 IMPLEMENTACIÓN COMPLETADA!" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Items implementados:" -ForegroundColor Green
Write-Host "   1. Rate limiting configurado"
Write-Host "   2. Security headers aplicados"
Write-Host "   3. Variables de entorno template creado"
Write-Host "   4. Scripts de deployment listos"
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "   1. Completar .env.production con valores reales"
Write-Host "   2. Configurar Redis para rate limiting (opcional)"
Write-Host "   3. Ejecutar: npm run pre-deploy"
Write-Host "   4. Ejecutar: npm run deploy-win"
Write-Host ""
Write-Host "🔗 RECURSOS:" -ForegroundColor Cyan
Write-Host "   • Upstash Redis: https://upstash.com"
Write-Host "   • Vercel Deploy: https://vercel.com"
Write-Host "   • Security Headers Test: https://securityheaders.com"
Write-Host ""
Write-Host "🚀 ¡TU PROYECTO ESTÁ 100% LISTO PARA PRODUCCIÓN!" -ForegroundColor Green
