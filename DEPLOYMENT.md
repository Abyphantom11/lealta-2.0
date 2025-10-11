# 🚀 Guía de Deployment - Lealta 2.0

## 📋 Prerequisitos

### ⚙️ **Requisitos del Sistema**
- **Node.js:** ≥ 18.0.0
- **PostgreSQL:** ≥ 14.0 (Neon DB recomendado)
- **Vercel CLI:** Para deployment automático
- **Git:** Para control de versiones

### 🔑 **Variables de Entorno Requeridas**

#### **Base de Datos**
```env
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"
```

#### **Autenticación**
```env
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

#### **APIs Externas**
```env
GEMINI_API_KEY="your-gemini-api-key"
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

#### **Almacenamiento (Opcional)**
```env
BLOB_READ_WRITE_TOKEN="your-blob-token"
```

---

## 🏗️ **Proceso de Deployment**

### 1. **Preparación Local**

#### **Verificar Estado del Proyecto**
```bash
# Verificar tests
npm run ci:quality-gates

# Verificar build
npm run build

# Verificar tipos
npm run typecheck

# Verificar lint
npm run lint
```

#### **Verificar Base de Datos**
```bash
# Generar cliente Prisma
npx prisma generate

# Verificar conexión
npx prisma db push --preview-feature

# Verificar migraciones
npx prisma migrate status
```

### 2. **Deployment en Vercel**

#### **Setup Inicial**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login a Vercel
vercel login

# Configurar proyecto
vercel --prod
```

#### **Variables de Entorno en Vercel**
```bash
# Configurar variables una por una
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add GEMINI_API_KEY
# ... etc
```

#### **Deploy Automático**
```bash
# Push a main branch para auto-deploy
git push origin main

# O deploy manual
vercel --prod
```

### 3. **Post-Deployment**

#### **Verificar Health Check**
```bash
curl https://your-domain.com/api/health
```

#### **Verificar Funcionalidades Críticas**
- ✅ Login de usuarios
- ✅ Creación de reservas
- ✅ Sistema de QR codes
- ✅ Panel de staff
- ✅ Panel de admin

---

## 🌍 **Ambientes de Deployment**

### 🧪 **Development**
```bash
# Local development
npm run dev

# Variables en .env.local
DATABASE_URL="postgresql://localhost:5432/lealta_dev"
NEXTAUTH_URL="http://localhost:3001"
```

### 🔬 **Staging**
```bash
# Branch: staging
# Auto-deploy en Vercel Preview

# Variables específicas de staging
DATABASE_URL="postgresql://staging-db-url"
NEXTAUTH_URL="https://staging.lealta.com"
```

### 🚀 **Production**
```bash
# Branch: main
# Auto-deploy en Vercel Production

# Variables de producción
DATABASE_URL="postgresql://production-db-url"
NEXTAUTH_URL="https://lealta.com"
```

---

## 🗄️ **Gestión de Base de Datos**

### **Neon DB (Recomendado)**

#### **Setup Inicial**
1. Crear cuenta en [Neon](https://neon.tech)
2. Crear nueva base de datos
3. Copiar connection string
4. Configurar en variables de entorno

#### **Migraciones**
```bash
# Aplicar migraciones en producción
npx prisma migrate deploy

# Reset database (SOLO EN DESARROLLO)
npx prisma migrate reset --force
```

#### **Backup Automático**
```bash
# Ejecutar backup (ya configurado en el proyecto)
node scripts/create-backup-neon.js
```

### **Local PostgreSQL**

#### **Setup con Docker**
```bash
# Levantar PostgreSQL local
docker run --name lealta-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=lealta \
  -p 5432:5432 \
  -d postgres:14
```

---

## ⚡ **Optimizaciones de Performance**

### **Build Optimizations**
```javascript
// next.config.cjs
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };
    return config;
  },
};
```

### **Database Optimizations**
```bash
# Connection pooling ya configurado en Prisma
# Ver prisma/schema.prisma para configuración
```

### **Vercel Optimizations**
```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate=300"
        }
      ]
    }
  ]
}
```

---

## 🔒 **Seguridad en Producción**

### **Headers de Seguridad**
```javascript
// Ya configurado en middleware.ts
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options  
- Referrer-Policy
```

### **Rate Limiting**
```javascript
// Implementado en APIs críticas
- Login: 5 intentos por IP por hora
- APIs públicas: 100 requests por IP por minuto
```

### **Monitoreo**
```bash
# Sentry ya configurado para error tracking
# Health check endpoint disponible en /api/health
```

---

## 📊 **Monitoreo Post-Deployment**

### **Health Checks**
```bash
# Verificar estado general
curl https://your-domain.com/api/health

# Verificar base de datos
curl https://your-domain.com/api/health?check=database

# Verificar Redis
curl https://your-domain.com/api/health?check=redis
```

### **Logs**
```bash
# Ver logs en Vercel
vercel logs --follow

# Ver logs específicos
vercel logs --since 1h
```

### **Métricas**
- **Vercel Analytics:** Automático
- **Error Tracking:** Sentry integrado
- **Performance:** Core Web Vitals en Vercel

---

## 🆘 **Troubleshooting**

### **Errores Comunes**

#### **Database Connection Issues**
```bash
# Verificar variables de entorno
echo $DATABASE_URL

# Test conexión
npx prisma db push --preview-feature
```

#### **Build Failures**
```bash
# Limpiar cache
rm -rf .next node_modules
npm install
npm run build
```

#### **API Errors**
```bash
# Verificar logs
vercel logs --follow

# Check health endpoint
curl https://your-domain.com/api/health
```

### **Rollback Procedure**
```bash
# Revertir a deployment anterior en Vercel UI
# O hacer rollback de código
git revert HEAD
git push origin main
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions (Opcional)**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run ci:quality-gates
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### **Quality Gates**
```bash
# Pre-deployment checks automáticos
npm run lint          # ✅ ESLint verificación
npm run typecheck     # ✅ TypeScript verificación  
npm run test          # ✅ Unit tests
npm run build         # ✅ Build verification
```

---

## 📚 **Resources**

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Neon Docs:** [neon.tech/docs](https://neon.tech/docs)
- **Prisma Docs:** [prisma.io/docs](https://prisma.io/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)

---

## 📞 **Soporte de Deployment**

**Equipo:** Desarrollo Lealta  
**Email:** dev@lealta.com  
**Slack:** #lealta-deployment  

**Para emergencias de producción:**
1. Verificar [status.vercel.com](https://status.vercel.com)
2. Revisar logs con `vercel logs`
3. Contactar equipo de desarrollo
4. Usar rollback si es necesario
