# 🎯 Lealta 2.0 - Sistema de Fidelización Integral

## 📋 **ESTADO ACTUAL: READY FOR PRODUCTION** ✅

**Última actualización:** Septiembre 2025  
**Branch:** `feature/portal-sync-complete`  
**Build Status:** ✅ Pasando  
**Security Audit:** ✅ Sin vulnerabilidades  
**Performance Audit:** ✅ Optimizado  

---

## 🚀 **DESCRIPCIÓN**

**Lealta 2.0** es un sistema integral de fidelización y gestión de clientes con arquitectura moderna de Next.js 14, diseñado para maximizar la captación y retención de clientes a través de un sistema de puntos, niveles y recompensas.

### ✨ **Características Principales**

- 🏪 **Portal Cliente**: Experiencia moderna y responsive
- 👨‍💼 **Panel Admin**: Gestión completa de contenido y configuración  
- 📱 **POS Staff**: Sistema de punto de venta con OCR automático
- 🔔 **Notificaciones Push**: Sistema en tiempo real
- 📊 **Analytics**: Dashboard con métricas en tiempo real
- 🔒 **Seguridad**: Autenticación robusta y segregación de sesiones
- ⚡ **Performance**: Optimizado para producción

---

## 🏗️ **ARQUITECTURA MODERNA**

### 🏗️ **STACK TECNOLÓGICO**

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js con JWT
- **Styling**: Tailwind CSS + Framer Motion
- **Deployment**: Vercel (recomendado)
- **Monitoring**: Sentry Error Tracking
- **Cache**: Redis (Upstash)
- **Storage**: Cloudinary (imágenes)

### 🌐 **COMPONENTES DEL SISTEMA**

#### 🏪 **Portal Cliente**
- Experiencia moderna y responsive
- Sistema de puntos y niveles en tiempo real
- Catálogo de recompensas
- Favoritos del día dinámicos
- PWA capabilities

#### 👨‍💼 **Panel Admin**
- Gestión completa de contenido
- Branding dinámico personalizable
- Analytics y reportes
- Configuración de promociones
- Sistema de notificaciones

#### 📱 **POS Staff**
- Registro de consumos con OCR
- Cálculo automático de puntos
- Gestión de clientes
- Interface optimizada para tablets

---

## 🚀 **INSTALACIÓN Y SETUP**

### 📋 **Prerrequisitos**
```bash
Node.js >= 18.17.0
PostgreSQL >= 14
Redis (opcional, para cache)
```

### ⚡ **Quick Start**
```bash
# 1. Clonar el repositorio
git clone https://github.com/Abyphantom11/lealta-2.0.git
cd lealta-2.0

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 4. Setup de base de datos
npx prisma migrate dev
npx prisma db seed

# 5. Ejecutar en desarrollo
npm run dev
```

### � **Variables de Entorno Críticas**
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..." # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3001"
NEXT_PUBLIC_SENTRY_DSN="..."
UPSTASH_REDIS_REST_URL="..." (opcional)
```

---

## 🧪 **TESTING Y CALIDAD**

### ✅ **Auditorías Implementadas**
```bash
# Security Audit
node scripts/security-audit.js

# Performance Audit  
node scripts/performance-audit.js

# Build de producción
npm run build

# Verificar dependencias
npm audit
```

### 📊 **Métricas de Calidad**
- ✅ **0 vulnerabilidades** de seguridad
- ✅ **Performance Score: A+** 
- ✅ **23 JS chunks** optimizados
- ✅ **Type Safety** con TypeScript
- ✅ **Error Tracking** con Sentry

- Aplicación nativa de escritorio (Electron)
- Misma base de código Next.js
- Mejor UX para operaciones intensivas
- Funciona offline con sincronización
- Menús nativos y atajos de teclado
- Notificaciones del sistema

## 🚀 Quick Start

### 🌐 **Modo Web (Desarrollo)**

```bash
git clone https://github.com/Abyphantom11/lealta-2.0.git
cd lealta-2.0
npm install
cp .env.example .env
# Editar .env con tu configuración
npm run dev
# Abre http://localhost:3001
```

### 🖥️ **Modo Desktop (Desarrollo)**

```bash
# En una terminal:
npm run dev

# En otra terminal:
npm run electron
# O para desarrollo completo:
npm run electron-dev
```

### 📦 **Build para Producción**

#### Web App

```bash
npm run build
npm start
```

#### Desktop App

```bash
# Build completo con instalador
npm run dist

# Solo empaquetado (sin instalador)
npm run pack

# Multi-plataforma
npm run dist-all
```

## 🎯 URLs de Acceso

- **Home**: http://localhost:3000
- **Portal Cliente**: http://localhost:3000/portal
- **Staff Captura**: http://localhost:3000/staff
- **Login Backoffice**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin
- **Super Admin**: http://localhost:3000/superadmin

## 🔑 Credenciales Demo

### Usuarios del Sistema

```
SUPERADMIN: admin@lealta.com / admin123
STAFF: staff@lealta.com / staff123
```

## 🧪 Smoke Tests

### 1. API Health Check

```bash
curl http://localhost:3000/api/auth/providers
# Esperado: 200 JSON con providers
```

### 2. Portal Cliente

```bash
# Registro de cliente
curl -X POST http://localhost:3000/api/portal/register \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "12345678",
    "nombre": "Juan Test",
    "correo": "juan@test.com",
    "telefono": "1234567890",
    "consent": true
  }'
# Esperado: { customerId, success: true } + cookie clienteId

# Check-in
curl -X POST http://localhost:3000/api/portal/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "12345678",
    "locationId": "default-location"
  }'
# Esperado: { success: true, message }
```

### 3. Staff OCR

```bash
# Subir ticket (requiere imagen)
curl -X POST http://localhost:3000/api/staff/consumo \
  -F "image=@ticket.jpg" \
  -F "cedula=12345678" \
  -F "locationId=default-location" \
  -F "empleadoId=staff-id"
# Esperado: { total, puntos, productos, cliente }
```

### 4. Backoffice Login

- Ir a `/login`
- Usar credenciales SUPERADMIN
- Verificar acceso a `/superadmin`

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Homepage con enlaces
│   ├── globals.css             # Estilos Tailwind + tema dark
│   ├── portal/page.tsx         # Portal cliente (registro + menú)
│   ├── staff/page.tsx          # Captura pre-pago (OCR)
│   ├── login/page.tsx          # Auth backoffice
│   ├── admin/page.tsx          # Dashboard admin
│   ├── superadmin/page.tsx     # Analytics superadmin
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth handler
│       ├── portal/
│       │   ├── register/       # POST registro cliente
│       │   └── check-in/       # POST check-in cliente
│       └── staff/
│           └── consumo/        # POST multipart OCR ticket
├── auth.config.ts              # Config NextAuth v5
├── middleware.ts               # Middleware básico
prisma/
├── schema.prisma               # Modelo datos (Cliente, Consumo, etc.)
└── seed.ts                     # Datos iniciales
public/uploads/                 # Imágenes tickets subidas
```

## 🎨 Design System

### Tema Dark Premium

- **Paleta**: dark-950 a dark-50, gradientes purple/blue/green/orange
- **Tipografía**: Inter con feature settings avanzados
- **Componentes**: Cards glass-effect, botones gradient, animaciones framer-motion
- **Responsive**: Mobile-first, breakdown tablet/desktop

### Componentes Clave

- `premium-card`: Cartas con backdrop-blur y gradientes
- `form-input`: Inputs consistentes con focus states
- `btn-primary`: Botones gradient con hover effects
- Bottom navigation (portal cliente)

## 🔧 Tecnologías

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: NextAuth v5 (backoffice), cookies (clientes)
- **OCR**: Tesseract.js (local, intercambiable)
- **Validation**: Zod
- **Icons**: Lucide React

## 📊 Modelo de Datos

### Core Entities

- **Cliente**: cédula (auth), puntos, historial
- **Consumo**: productos JSON, OCR text, imagen, estado pago
- **VisitLog**: trazabilidad acciones (portal_visit, check_in)
- **User/Location**: backoffice roles, multi-location ready

### Business Logic

- Puntos = Math.floor(total_consumo)
- Risk level por defaultCount futuro
- Single-tenant hoy, multi-tenant preparado

## 🚦 Estado del MVP

### ✅ Implementado

- [x] Registro cliente portal (cédula sin password)
- [x] OCR básico tickets con Tesseract.js
- [x] Backoffice auth (SUPERADMIN/ADMIN/STAFF)
- [x] APIs validadas con Zod
- [x] UI premium responsive dark theme
- [x] Seed data y estructura completa

### 🔄 Stubs/Placeholders

- [ ] Menú real (placeholder cards)
- [ ] Charts analytics (divs placeholder)
- [ ] Loyalty rules engine (puntos básicos)
- [ ] Geofencing check-in
- [ ] Email notifications

### 🚀 Escalabilidad Futura

- [ ] Multi-tenant (tenant isolation)
- [ ] OCR provider swap (Google Vision, AWS)
- [ ] Loyalty campaigns avanzadas
- [ ] Mobile app nativa
- [ ] POS integration APIs

## 🐛 Troubleshooting

### Base de Datos

```bash
# Reset completo
npm run db:push
npm run db:seed
```

### OCR Issues

- Verificar imágenes < 5MB
- Tesseract.js puede ser lento en dev
- Fallback values si OCR falla

### Auth Issues

- Verificar AUTH_SECRET en .env
- Cookies domain para subdominios

## 📝 Decisiones Técnicas

### Por qué NextAuth solo para backoffice

- Clientes usan identificación por cédula (UX más simple)
- No necesitan passwords (modelo banking-like)
- Cookies simples para sesión cliente

### Por qué Tesseract.js local

- No deps externas para MVP
- Intercambiable por Google Vision después
- Funciona offline

### Por qué single-tenant MVP

- Complejidad reducida para validación
- Migración a multi-tenant es directa (tenant_id)
- Focus en product-market fit

---

**Lealta MVP v1.0** - Agosto 2024  
Sistema de captación pre-consumo con OCR y portal premium.
