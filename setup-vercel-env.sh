#!/bin/bash
# Script para configurar variables de entorno en Vercel

echo "🚀 Configurando variables de entorno en Vercel..."

# Database
npx vercel env add DATABASE_URL production
npx vercel env add DATABASE_URL preview

# Authentication
npx vercel env add NEXTAUTH_SECRET production
npx vercel env add NEXTAUTH_SECRET preview
npx vercel env add AUTH_SECRET production
npx vercel env add AUTH_SECRET preview
npx vercel env add NEXTAUTH_URL production
npx vercel env add NEXTAUTH_URL preview

# Rate Limiting
npx vercel env add UPSTASH_REDIS_REST_URL production
npx vercel env add UPSTASH_REDIS_REST_URL preview
npx vercel env add UPSTASH_REDIS_REST_TOKEN production
npx vercel env add UPSTASH_REDIS_REST_TOKEN preview

# Monitoring
npx vercel env add NEXT_PUBLIC_SENTRY_DSN production
npx vercel env add NEXT_PUBLIC_SENTRY_DSN preview

# Stack Auth
npx vercel env add NEXT_PUBLIC_STACK_PROJECT_ID production
npx vercel env add NEXT_PUBLIC_STACK_PROJECT_ID preview
npx vercel env add NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY production
npx vercel env add NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY preview
npx vercel env add STACK_SECRET_SERVER_KEY production
npx vercel env add STACK_SECRET_SERVER_KEY preview

# App Configuration
npx vercel env add NEXT_PUBLIC_APP_NAME production
npx vercel env add NEXT_PUBLIC_APP_NAME preview
npx vercel env add NEXT_PUBLIC_APP_URL production
npx vercel env add NEXT_PUBLIC_APP_URL preview

# Google Gemini AI
npx vercel env add GOOGLE_GEMINI_API_KEY production
npx vercel env add GOOGLE_GEMINI_API_KEY preview

# Additional Configuration
npx vercel env add OCR_PROVIDER production
npx vercel env add OCR_PROVIDER preview
npx vercel env add RESEND_FROM_EMAIL production
npx vercel env add RESEND_FROM_EMAIL preview
npx vercel env add RESEND_NO_REPLY_EMAIL production
npx vercel env add RESEND_NO_REPLY_EMAIL preview
npx vercel env add RESEND_TRIALS_EMAIL production
npx vercel env add RESEND_TRIALS_EMAIL preview

# Environment
npx vercel env add NODE_ENV production
npx vercel env add NODE_ENV preview

echo "✅ Variables de entorno configuradas!"
