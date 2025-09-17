# 🗄️ MIGRACIÓN SQLite → PostgreSQL - Lealta 2.0

## 📊 ANÁLISIS DEL ESTADO ACTUAL

### **Base de Datos Actual**
- **Engine**: SQLite (`file:./dev.db`)
- **ORM**: Prisma 6.15.0
- **Tamaño estimado**: ~5-10MB (SQLite file)
- **Migraciones existentes**: 4 migraciones aplicadas
- **Última migración**: `20250915095210_add_trial_users`

### **Esquema Prisma Actual**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### **Modelos Principales Identificados**
1. **Business** - Multi-tenant core
2. **User** - Sistema de autenticación
3. **Cliente** - Clientes del negocio
4. **TarjetaLealtad** - Sistema de fidelización
5. **Consumo** - Transacciones
6. **MenuCategory** & **MenuItem** - Gestión de menú
7. **HistorialCanje** - Historial de recompensas
8. **Visitas** - Tracking de visitas
9. **Location** - Ubicaciones de negocios

---

## 🎯 PLAN DE MIGRACIÓN DETALLADO

### **FASE 1: PREPARACIÓN (Día 1)**

#### 1.1. **Backup Completo de Datos Actuales**
```bash
# 1. Backup SQLite database
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# 2. Export data as SQL dump
sqlite3 prisma/dev.db .dump > backup-data-$(date +%Y%m%d).sql

# 3. Export data as JSON (para verificación)
npm run export-data-json  # Script a crear
```

#### 1.2. **Inventario de Datos Críticos**
```bash
# Verificar contenido actual
npm run data-audit  # Script a crear que mostrará:
# - Número de businesses
# - Número de usuarios por business
# - Número de clientes
# - Transacciones recientes
# - Integridad referencial
```

#### 1.3. **Setup PostgreSQL de Desarrollo**
```bash
# Opción A: Docker (Recomendado para testing)
docker run --name lealta-postgres \
  -e POSTGRES_PASSWORD=lealta_dev_pass \
  -e POSTGRES_USER=lealta_user \
  -e POSTGRES_DB=lealta_dev \
  -p 5432:5432 \
  -d postgres:15

# Opción B: PostgreSQL local
# - Instalar PostgreSQL 15+
# - Crear database: createdb lealta_dev
# - Crear usuario: createuser lealta_user
```

---

### **FASE 2: CONFIGURACIÓN (Día 1-2)**

#### 2.1. **Actualizar Configuración Prisma**

**File: `prisma/schema.prisma`**
```prisma
// ANTES
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// DESPUÉS
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 2.2. **Nuevas Variables de Entorno**

**File: `.env.local` (development)**
```bash
# PostgreSQL Development
DATABASE_URL="postgresql://lealta_user:lealta_dev_pass@localhost:5432/lealta_dev"
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**File: `.env.production` (crear nuevo)**
```bash
# PostgreSQL Production (Railway/Neon/AWS RDS)
DATABASE_URL="postgresql://user:pass@host:5432/lealta_production"
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_SECRET="production-secure-secret-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

#### 2.3. **Ajustes de Schema Específicos para PostgreSQL**

**Cambios necesarios en modelos:**

```prisma
// 1. Todos los IDs - cambiar de @default(cuid()) si hay problemas
model Business {
  id String @id @default(cuid())  // ✅ Funciona en PostgreSQL
  // ...resto del modelo
}

// 2. JSON fields - verificar sintaxis
model Business {
  settings Json? // ✅ Compatible con PostgreSQL
}

// 3. DateTime fields - verificar timezone
model Business {
  createdAt DateTime @default(now()) // ✅ Compatible
  updatedAt DateTime @updatedAt      // ✅ Compatible
}

// 4. Enums - verificar que estén bien definidos
enum Role {
  SUPERADMIN
  ADMIN  
  STAFF
} // ✅ Compatible con PostgreSQL

// 5. Unique constraints - verificar compuestos
@@unique([businessId, cedula]) // Para Cliente model
```

#### 2.4. **Scripts de Migración Personalizados**

**File: `scripts/migrate-to-postgres.js`**
```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function migrateData() {
  console.log('🗄️ Starting PostgreSQL migration...');
  
  // 1. Verificar conexión PostgreSQL
  const newPrisma = new PrismaClient({
    datasources: { db: { url: process.env.POSTGRES_URL } }
  });
  
  // 2. Leer datos desde backup JSON
  const backupData = JSON.parse(fs.readFileSync('backup-data.json'));
  
  // 3. Migrar datos por orden de dependencias
  await migrateBusinesses(newPrisma, backupData.businesses);
  await migrateUsers(newPrisma, backupData.users);
  await migrateClientes(newPrisma, backupData.clientes);
  // ... etc
  
  console.log('✅ Migration completed!');
}
```

---

### **FASE 3: MIGRACIÓN DE DATOS (Día 2)**

#### 3.1. **Reset y Recreación del Schema**
```bash
# 1. Reset migraciones (conservar historial)
npx prisma migrate reset --force

# 2. Generar nueva migración base para PostgreSQL
npx prisma migrate dev --name init_postgresql

# 3. Verificar schema generado
npx prisma generate
```

#### 3.2. **Exportar Datos de SQLite**

**Script: `scripts/export-sqlite-data.js`**
```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function exportSQLiteData() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:./dev.db' } }
  });

  console.log('📤 Exporting SQLite data...');

  const data = {
    businesses: await prisma.business.findMany({
      include: { users: true, clientes: true }
    }),
    clientes: await prisma.cliente.findMany({
      include: { tarjetaLealtad: true, consumos: true }
    }),
    consumos: await prisma.consumo.findMany(),
    menuCategories: await prisma.menuCategory.findMany({
      include: { items: true }
    }),
    // ... otros modelos
  };

  fs.writeFileSync('backup-data.json', JSON.stringify(data, null, 2));
  console.log('✅ Data exported to backup-data.json');
}
```

#### 3.3. **Importar Datos a PostgreSQL**

**Script: `scripts/import-to-postgres.js`**
```javascript
async function importToPostgreSQL() {
  const data = JSON.parse(fs.readFileSync('backup-data.json'));
  const prisma = new PrismaClient(); // Nueva conexión PostgreSQL

  console.log('📥 Importing data to PostgreSQL...');

  // Importar en orden correcto (respetando foreign keys)
  
  // 1. Businesses primero (no tienen dependencias)
  for (const business of data.businesses) {
    await prisma.business.create({
      data: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        subdomain: business.subdomain,
        // ... otros campos
      }
    });
  }

  // 2. Users (dependen de Business)
  for (const user of data.users) {
    await prisma.user.create({
      data: {
        id: user.id,
        businessId: user.businessId,
        email: user.email,
        // ... otros campos
      }
    });
  }

  // 3. Clientes (dependen de Business)
  // 4. TarjetaLealtad (dependen de Cliente)
  // 5. Consumos (dependen de Cliente)
  // ... etc

  console.log('✅ Data imported successfully!');
}
```

---

### **FASE 4: VALIDACIÓN (Día 2-3)**

#### 4.1. **Scripts de Validación**

**File: `scripts/validate-migration.js`**
```javascript
async function validateMigration() {
  const sqliteData = JSON.parse(fs.readFileSync('backup-data.json'));
  const pgPrisma = new PrismaClient(); // PostgreSQL

  console.log('🔍 Validating migration...');

  // Contar registros
  const validations = [
    {
      model: 'business',
      sqlite: sqliteData.businesses.length,
      postgres: await pgPrisma.business.count()
    },
    {
      model: 'cliente',
      sqlite: sqliteData.clientes.length,
      postgres: await pgPrisma.cliente.count()
    },
    // ... otros modelos
  ];

  validations.forEach(v => {
    const status = v.sqlite === v.postgres ? '✅' : '❌';
    console.log(`${status} ${v.model}: SQLite(${v.sqlite}) vs PostgreSQL(${v.postgres})`);
  });

  // Validar integridad referencial
  await validateBusinessUserRelations(pgPrisma);
  await validateClienteBusinessRelations(pgPrisma);
  // ... otras validaciones
}
```

#### 4.2. **Testing Funcional**
```bash
# 1. Ejecutar tests de integración
npm run test

# 2. Verificar autenticación
npm run test:auth

# 3. Verificar multi-tenant isolation
npm run test:business-isolation

# 4. Verificar funcionalidades críticas
npm run test:critical-path
```

#### 4.3. **Performance Testing**
```bash
# 1. Benchmark queries principales
npm run benchmark:queries

# 2. Load testing básico
npm run load-test:basic

# 3. Memory usage monitoring
npm run monitor:memory
```

---

### **FASE 5: DEPLOYMENT PREPARATION (Día 3)**

#### 5.1. **Configuración de Producción**

**Opciones de PostgreSQL en Producción:**

**Opción A: Railway (Recomendado - Fácil)**
```bash
# 1. Crear cuenta en Railway.app
# 2. New Project → Deploy PostgreSQL
# 3. Copiar CONNECTION_URL
# 4. Deploy app conectada a PostgreSQL
```

**Opción B: Neon (Serverless PostgreSQL)**
```bash
# 1. Crear cuenta en Neon.tech
# 2. Crear database
# 3. Obtener connection string
# 4. Configurar en Vercel/hosting
```

**Opción C: AWS RDS (Enterprise)**
```bash
# 1. Crear RDS PostgreSQL instance
# 2. Configurar security groups
# 3. Setup connection pooling (PgBouncer)
# 4. Configure automated backups
```

#### 5.2. **Scripts de Deployment**

**File: `scripts/deploy-postgres.sh`**
```bash
#!/bin/bash
echo "🚀 Deploying to PostgreSQL production..."

# 1. Verificar variables de entorno
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

# 2. Ejecutar migraciones
npx prisma migrate deploy

# 3. Verificar conexión
npx prisma db pull --print

# 4. Generar cliente
npx prisma generate

# 5. Health check
npm run health-check

echo "✅ Deployment completed!"
```

#### 5.3. **Monitoring Setup**
```bash
# Variables adicionales para monitoring
POSTGRES_MONITOR_URL="connection-string-for-monitoring"
SENTRY_DSN="https://your-sentry-dsn"
LOG_LEVEL="info"
```

---

## 🧪 TESTING CHECKLIST

### **Pre-Migration Testing**
- [ ] Backup completo realizado
- [ ] PostgreSQL development setup funcionando
- [ ] Scripts de migración probados localmente
- [ ] Validación de datos exitosa

### **Post-Migration Testing**
- [ ] Autenticación multi-role funciona
- [ ] Business isolation mantiene segregación
- [ ] Portal del cliente carga correctamente
- [ ] Panel de admin funcional
- [ ] Staff puede procesar consumos
- [ ] Búsqueda de clientes funciona
- [ ] Sistema de puntos calcula correctamente
- [ ] Migraciones futuras pueden aplicarse

### **Performance Testing**
- [ ] Queries principales <100ms
- [ ] Login <2s
- [ ] Dashboard del cliente <3s
- [ ] Búsqueda de clientes <1s
- [ ] Procesamiento de consumos <2s

---

## 🚨 PLAN DE ROLLBACK

### **Si algo falla durante la migración:**

1. **Detener deployment inmediatamente**
2. **Restaurar SQLite database**:
   ```bash
   cp prisma/backup-YYYYMMDD.db prisma/dev.db
   ```
3. **Revertir schema.prisma**:
   ```bash
   git checkout HEAD~1 prisma/schema.prisma
   ```
4. **Regenerar cliente Prisma**:
   ```bash
   npx prisma generate
   ```
5. **Verificar funcionalidad**:
   ```bash
   npm run test
   ```

### **Plan de comunicación:**
- Notificar a stakeholders inmediatamente
- Documentar issue encontrado
- Estimar tiempo de resolución
- Ejecutar rollback si es crítico

---

## 💡 TIPS Y CONSIDERACIONES ESPECIALES

### **Diferencias SQLite vs PostgreSQL:**

1. **Data Types:**
   ```sql
   -- SQLite es más flexible, PostgreSQL más estricto
   -- JSON fields: mismo syntax, mejor performance en PG
   -- UUIDs: SQLite guarda como TEXT, PostgreSQL como UUID
   ```

2. **Concurrency:**
   ```sql
   -- SQLite: file locking
   -- PostgreSQL: row-level locking (mejor para producción)
   ```

3. **Performance:**
   ```sql
   -- SQLite: bueno para reads, limitado en writes concurrentes
   -- PostgreSQL: excelente para reads y writes concurrentes
   ```

### **Optimizaciones Post-Migración:**

1. **Indexes importantes:**
   ```sql
   CREATE INDEX idx_cliente_business_cedula ON "Cliente" ("businessId", "cedula");
   CREATE INDEX idx_consumo_cliente_date ON "Consumo" ("clienteId", "registeredAt");
   CREATE INDEX idx_user_business_email ON "User" ("businessId", "email");
   ```

2. **Connection Pooling:**
   ```javascript
   // En producción, usar connection pooling
   new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL + "?connection_limit=5&pool_timeout=20"
       }
     }
   });
   ```

---

## 🎯 SUCCESS CRITERIA

### **Migración exitosa cuando:**
- [ ] **Todos los datos migrados** (100% integridad)
- [ ] **Zero downtime** durante migración (para desarrollo)
- [ ] **Performance igual o mejor** que SQLite
- [ ] **Todas las funcionalidades operativas**
- [ ] **Tests pasando al 100%**
- [ ] **Ready para deployment a producción**

### **KPIs a monitorear post-migración:**
- Database connection time: <50ms
- Query response time: <100ms promedio
- Error rate: <0.1%
- Memory usage: estable
- CPU usage: <20% promedio

---

**¿Te parece completo este roadmap? ¿Hay algún aspecto específico que quieres que profundice más?** 🗄️
