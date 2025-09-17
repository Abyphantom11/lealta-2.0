# 🗄️ Configuración PostgreSQL para Lealta 2.0

## 📋 Variables de Entorno

### **Desarrollo Local**
```bash
# .env.local
DATABASE_URL="postgresql://lealta_user:lealta_dev_pass@localhost:5432/lealta_dev"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### **Producción Railway**
```bash
# .env.production
DATABASE_URL="postgresql://postgres:password@viaduct.proxy.rlwy.net:12345/railway"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secure-secret-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

### **Producción Neon**
```bash
# .env.production
DATABASE_URL="postgresql://username:password@ep-example.us-east-1.aws.neon.tech/lealta?sslmode=require"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secure-secret-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

---

## 🐳 Docker Setup (Desarrollo)

### **Opción A: Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: lealta_dev
      POSTGRES_USER: lealta_user
      POSTGRES_PASSWORD: lealta_dev_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

### **Opción B: Docker Run Simple**
```bash
# Windows PowerShell
docker run --name lealta-postgres `
  -e POSTGRES_PASSWORD=lealta_dev_pass `
  -e POSTGRES_USER=lealta_user `
  -e POSTGRES_DB=lealta_dev `
  -p 5432:5432 `
  -d postgres:15

# Verificar que está ejecutándose
docker ps
```

---

## 🔧 Setup Manual PostgreSQL

### **Windows**
```powershell
# 1. Descargar e instalar PostgreSQL 15+
# https://www.postgresql.org/download/windows/

# 2. Crear usuario y database
psql -U postgres
CREATE USER lealta_user WITH PASSWORD 'lealta_dev_pass';
CREATE DATABASE lealta_dev OWNER lealta_user;
GRANT ALL PRIVILEGES ON DATABASE lealta_dev TO lealta_user;
\q
```

### **macOS (Homebrew)**
```bash
# 1. Instalar PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# 2. Crear usuario y database
createuser -s lealta_user
createdb lealta_dev -O lealta_user
psql lealta_dev -c "ALTER USER lealta_user WITH PASSWORD 'lealta_dev_pass';"
```

### **Ubuntu/Debian**
```bash
# 1. Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 2. Crear usuario y database
sudo -u postgres psql
CREATE USER lealta_user WITH PASSWORD 'lealta_dev_pass';
CREATE DATABASE lealta_dev OWNER lealta_user;
GRANT ALL PRIVILEGES ON DATABASE lealta_dev TO lealta_user;
\q
```

---

## 🌍 Opciones de Hosting Producción

### **1. Railway (Recomendado - Fácil)**
- **URL**: https://railway.app/
- **Pros**: Setup automático, scaling fácil, gratis hasta $5/mes
- **Pricing**: $0.01/GB RAM/hora, $0.000463/GB storage/hora
- **Setup**:
  1. Crear cuenta en Railway
  2. New Project → Deploy PostgreSQL
  3. Copiar DATABASE_URL
  4. Deploy app desde GitHub

### **2. Neon (Serverless)**
- **URL**: https://neon.tech/
- **Pros**: Serverless, branching de DB, autoscaling
- **Pricing**: Gratis hasta 512MB, $19/mes pro
- **Setup**:
  1. Crear cuenta en Neon
  2. Crear database
  3. Copiar connection string
  4. Deploy app en Vercel

### **3. PlanetScale (MySQL compatible)**
- **URL**: https://planetscale.com/
- **Pros**: Branching, schema migrations sin downtime
- **Nota**: Requiere cambio de SQLite → MySQL (no PostgreSQL)

### **4. AWS RDS (Enterprise)**
- **Pros**: Control total, alta disponibilidad
- **Cons**: Más complejo, más caro
- **Pricing**: Desde $15/mes mínimo

---

## ⚡ Optimizaciones PostgreSQL

### **Configuración Prisma Optimizada**
```javascript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Configuración para producción
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (
        process.env.NODE_ENV === 'production' 
          ? '?connection_limit=5&pool_timeout=20&sslmode=require'
          : ''
      )
    }
  },
  
  // Logging
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  
  // Error formatting
  errorFormat: 'minimal'
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### **Indexes Importantes**
```sql
-- Ejecutar después de migración
CREATE INDEX CONCURRENTLY idx_cliente_business_cedula 
ON "Cliente" ("businessId", "cedula");

CREATE INDEX CONCURRENTLY idx_consumo_cliente_date 
ON "Consumo" ("clienteId", "registeredAt" DESC);

CREATE INDEX CONCURRENTLY idx_user_business_email 
ON "User" ("businessId", "email");

CREATE INDEX CONCURRENTLY idx_tarjeta_cliente 
ON "TarjetaLealtad" ("clienteId");

CREATE INDEX CONCURRENTLY idx_historial_cliente_fecha 
ON "HistorialCanje" ("clienteId", "fechaCanje" DESC);
```

### **Connection Pooling Avanzado**
```javascript
// Para aplicaciones de alto tráfico
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=30'
    }
  }
})

// Con PgBouncer (para Railway/Neon)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"
```

---

## 🔍 Monitoring y Troubleshooting

### **Queries de Diagnóstico**
```sql
-- Ver conexiones activas
SELECT count(*) FROM pg_stat_activity;

-- Ver queries lentas
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Ver tamaño de tablas
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### **Health Check Script**
```javascript
// scripts/postgres-health.js
const { PrismaClient } = require('@prisma/client');

async function healthCheck() {
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    
    // Test basic query
    const count = await prisma.business.count();
    
    // Test performance
    const start = Date.now();
    await prisma.cliente.findMany({ take: 10 });
    const time = Date.now() - start;
    
    console.log(`✅ PostgreSQL healthy: ${count} businesses, query time: ${time}ms`);
    
  } catch (error) {
    console.error('❌ PostgreSQL health check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck();
```

---

## 🎯 Checklist Final

### **Antes de Migración**
- [ ] PostgreSQL instalado y funcionando
- [ ] DATABASE_URL configurada correctamente
- [ ] Backup de SQLite realizado
- [ ] Scripts de migración probados en desarrollo

### **Durante Migración**
- [ ] Exportar datos de SQLite
- [ ] Actualizar schema.prisma
- [ ] Ejecutar migraciones Prisma
- [ ] Importar datos a PostgreSQL
- [ ] Validar integridad de datos

### **Después de Migración**
- [ ] Tests funcionando
- [ ] Performance aceptable
- [ ] Monitoring configurado
- [ ] Backup strategy implementada
- [ ] Rollback plan documentado

**¡Listo para migrar a PostgreSQL! 🚀**
