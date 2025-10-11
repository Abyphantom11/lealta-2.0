# 🤝 Guía de Contribución - Lealta 2.0

## 🎯 **Bienvenido/a al Proyecto**

¡Gracias por tu interés en contribuir a Lealta 2.0! Esta guía te ayudará a entender cómo participar efectivamente en el desarrollo del proyecto.

---

## 📋 **Tabla de Contenidos**

1. [Código de Conducta](#código-de-conducta)
2. [Cómo Contribuir](#cómo-contribuir)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Flujo de Trabajo](#flujo-de-trabajo)
5. [Estándares de Código](#estándares-de-código)
6. [Testing](#testing)
7. [Documentación](#documentación)
8. [Proceso de Review](#proceso-de-review)

---

## 📜 **Código de Conducta**

### **Nuestros Valores**
- **Respeto:** Trata a todos con dignidad y profesionalismo
- **Colaboración:** Trabaja en equipo para lograr objetivos comunes
- **Transparencia:** Comunica abierta y honestamente
- **Calidad:** Mantén altos estándares en todo el trabajo
- **Aprendizaje:** Acepta feedback y busca mejora continua

### **Comportamientos Esperados**
- ✅ Usar lenguaje inclusivo y profesional
- ✅ Respetar diferentes perspectivas y experiencias
- ✅ Dar y recibir feedback constructivo
- ✅ Enfocarse en lo que es mejor para el proyecto
- ✅ Mostrar empatía hacia otros miembros del equipo

### **Comportamientos No Aceptados**
- ❌ Lenguaje ofensivo o comentarios despectivos
- ❌ Ataques personales o políticos
- ❌ Acoso público o privado
- ❌ Compartir información privada sin permiso
- ❌ Cualquier comportamiento inapropiado en contexto profesional

---

## 🚀 **Cómo Contribuir**

### **Tipos de Contribuciones**

#### 🐛 **Reporte de Bugs**
- Usa el template de issue para bugs
- Incluye pasos para reproducir
- Especifica entorno (OS, browser, versión)
- Adjunta screenshots si es visual

#### ✨ **Nuevas Características**
- Discute la idea primero en un issue
- Asegúrate de que alinee con la visión del producto
- Considera el impacto en performance y UX
- Incluye tests y documentación

#### 📝 **Mejoras de Documentación**
- Correcciones de typos
- Clarificación de instrucciones
- Adición de ejemplos
- Traducción a otros idiomas

#### 🔧 **Refactoring y Optimizaciones**
- Mejoras de performance
- Limpieza de código legacy
- Actualización de dependencias
- Optimizaciones de build

---

## ⚙️ **Configuración del Entorno**

### **Prerequisitos**
```bash
# Versiones requeridas
node --version    # >= 18.0.0
npm --version     # >= 9.0.0
git --version     # >= 2.30.0
```

### **Setup Inicial**
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
npx prisma generate
npx prisma db push

# 5. Verificar que todo funciona
npm run dev
npm run test
npm run lint
```

### **Variables de Entorno para Desarrollo**
```env
# Base de datos local
DATABASE_URL="postgresql://localhost:5432/lealta_dev"

# Auth (puedes usar valores de desarrollo)
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="development-secret-key"

# APIs externas (opcionales para desarrollo)
GEMINI_API_KEY="tu-api-key-de-gemini"
```

---

## 🔄 **Flujo de Trabajo**

### **Branch Strategy**

```
main                 ← Producción (protegida)
  ├── staging        ← Pre-producción
  ├── develop        ← Desarrollo principal
  └── feature/*      ← Nuevas características
      ├── bugfix/*   ← Corrección de bugs
      └── hotfix/*   ← Fixes urgentes para producción
```

### **Proceso de Desarrollo**

#### **1. Crear Feature Branch**
```bash
# Desde develop
git checkout develop
git pull origin develop

# Crear nueva branch
git checkout -b feature/nombre-descriptivo
# Ejemplos:
# feature/api-reservas-qr
# feature/dashboard-metricas
# bugfix/login-error-handling
```

#### **2. Desarrollo**
```bash
# Hacer commits frecuentes y descriptivos
git add .
git commit -m "feat: agregar endpoint para generar QR de reserva"

# Push regular para backup
git push origin feature/nombre-descriptivo
```

#### **3. Testing**
```bash
# Antes de crear PR, verificar que todo pase
npm run ci:quality-gates

# Esto ejecuta:
# - npm run lint
# - npm run typecheck  
# - npm run test
```

#### **4. Pull Request**
- Crear PR hacia `develop`
- Usar template de PR
- Asignar reviewers apropiados
- Incluir capturas de pantalla si aplica
- Referenciar issues relacionados

#### **5. Code Review**
- Responder a comentarios constructivamente
- Hacer cambios solicitados
- Re-request review después de cambios
- No hacer merge sin aprobación

#### **6. Merge**
```bash
# Squash and merge (preferido)
# O merge commit si hay múltiples contributors
```

---

## 📝 **Estándares de Código**

### **Convenciones de Naming**

#### **Archivos y Directorios**
```
components/staff/StaffDashboard.tsx     # PascalCase para componentes
lib/auth/session-utils.ts               # kebab-case para utilities
app/api/reservas/route.ts              # kebab-case para rutas
types/api-responses.ts                 # kebab-case para types
```

#### **Variables y Funciones**
```typescript
// camelCase para variables y funciones
const userName = 'juan';
const fetchUserData = async () => {};

// PascalCase para componentes y clases
const StaffDashboard = () => {};
class ReservationService {}

// UPPER_SNAKE_CASE para constantes
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.lealta.com';
```

### **Estructura de Componentes**
```typescript
// 1. Imports (externos primero, luego internos)
import React, { useState, useEffect } from 'react';
import { NextResponse } from 'next/server';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// 2. Types/Interfaces
interface StaffDashboardProps {
  businessId: string;
  initialData?: StaffData;
}

// 3. Componente principal
export default function StaffDashboard({ 
  businessId, 
  initialData 
}: StaffDashboardProps) {
  // 4. State y hooks
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 5. Effects
  useEffect(() => {
    // logic here
  }, []);

  // 6. Event handlers
  const handleSubmit = async () => {
    // logic here
  };

  // 7. Render
  return (
    <div className="staff-dashboard">
      {/* JSX here */}
    </div>
  );
}
```

### **Estándares de API**
```typescript
// Estructura consistente para API routes
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticación/autorización
    const auth = await requireAuth(request);
    
    // 2. Validación de parámetros
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // 3. Lógica de negocio
    const data = await fetchBusinessData(businessId);

    // 4. Respuesta exitosa
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    // 5. Manejo de errores
    console.error('Error in GET /api/business:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### **Convenciones de Commit**

#### **Formato**
```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]

[footer opcional]
```

#### **Tipos**
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formateo, punto y coma, etc.
- `refactor`: Refactoring de código
- `test`: Agregar o modificar tests
- `chore`: Mantenimiento, deps, etc.

#### **Ejemplos**
```bash
feat(auth): agregar login con Google OAuth
fix(reservas): corregir validación de fecha en QR
docs(api): actualizar documentación de endpoints
refactor(components): extraer lógica común a hook
test(staff): agregar tests para dashboard
chore(deps): actualizar Next.js a v14.2.32
```

---

## 🧪 **Testing**

### **Tipos de Tests**

#### **Unit Tests**
```typescript
// tests/unit/auth/session.test.ts
import { describe, it, expect, vi } from 'vitest';
import { validateSession } from '@/lib/auth/session';

describe('validateSession', () => {
  it('should return true for valid session', () => {
    const mockSession = {
      user: { id: '1', email: 'test@test.com' },
      expires: '2025-12-31'
    };
    
    expect(validateSession(mockSession)).toBe(true);
  });

  it('should return false for expired session', () => {
    const mockSession = {
      user: { id: '1', email: 'test@test.com' },
      expires: '2020-01-01'
    };
    
    expect(validateSession(mockSession)).toBe(false);
  });
});
```

#### **Integration Tests**
```typescript
// tests/integration/api/reservas.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/reservas/route';

describe('/api/reservas', () => {
  it('should create new reservation', async () => {
    const request = new Request('http://localhost:3001/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: '1',
        fecha: '2025-12-25',
        personas: 4
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
  });
});
```

#### **E2E Tests**
```typescript
// tests/e2e/staff-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('staff can register new client', async ({ page }) => {
  await page.goto('/cmfnkcc1f0000eyj0dq0lcjji/staff');
  
  // Login
  await page.fill('[data-testid="email"]', 'staff@test.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  // Register new client
  await page.click('[data-testid="new-client-button"]');
  await page.fill('[data-testid="client-name"]', 'Juan Pérez');
  await page.fill('[data-testid="client-cedula"]', '12345678');
  await page.click('[data-testid="save-client"]');

  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### **Ejecutar Tests**
```bash
# Unit tests
npm run test

# Integration tests
npm run test:staff

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### **Testing Guidelines**
- ✅ Escribe tests para nueva funcionalidad
- ✅ Mantén coverage > 70%
- ✅ Usa mocks para APIs externas
- ✅ Tests descriptivos y legibles
- ✅ Incluye casos edge y errores

---

## 📚 **Documentación**

### **Documentar Componentes**
```typescript
/**
 * Dashboard principal para el personal del restaurante
 * 
 * @param businessId - ID único del negocio
 * @param initialData - Datos iniciales (opcional, para SSR)
 * 
 * @example
 * ```tsx
 * <StaffDashboard 
 *   businessId="cmf123" 
 *   initialData={staffData} 
 * />
 * ```
 */
export default function StaffDashboard({
  businessId,
  initialData
}: StaffDashboardProps) {
  // ...
}
```

### **Documentar APIs**
```typescript
/**
 * GET /api/reservas
 * 
 * Obtiene lista de reservas para un negocio específico
 * 
 * @param businessId - ID del negocio (query param)
 * @param fecha - Fecha específica en formato YYYY-MM-DD (opcional)
 * @param status - Estado de reserva: PENDING|CONFIRMED|CANCELLED (opcional)
 * 
 * @returns {Object} Lista de reservas con metadata de paginación
 * 
 * @example
 * GET /api/reservas?businessId=cmf123&fecha=2025-10-11&status=CONFIRMED
 */
export async function GET(request: NextRequest) {
  // ...
}
```

### **README de Features**
Cada feature importante debe tener documentación:
```markdown
# Sistema de Reservas QR

## Descripción
Sistema que permite generar códigos QR únicos para cada reserva...

## Uso
1. Cliente hace reserva
2. Sistema genera QR único
3. Staff escanea QR para validar asistencia

## APIs Relacionadas
- `POST /api/reservas` - Crear reserva
- `GET /api/reservas/[id]/qr` - Generar QR
- `POST /api/reservas/scan-qr` - Validar QR

## Componentes
- `QRGenerator` - Genera códigos QR
- `QRScanner` - Escanea códigos QR
```

---

## 👀 **Proceso de Review**

### **Como Reviewer**

#### **Qué Revisar**
- ✅ **Funcionalidad:** ¿Cumple con los requirements?
- ✅ **Código:** ¿Sigue estándares y buenas prácticas?
- ✅ **Performance:** ¿Hay optimizaciones necesarias?
- ✅ **Seguridad:** ¿Maneja auth y validación correctamente?
- ✅ **Tests:** ¿Incluye tests apropiados?
- ✅ **Documentación:** ¿Está bien documentado?

#### **Cómo Dar Feedback**
```markdown
# ✅ Buen feedback
- "Considera usar useMemo aquí para optimizar re-renders"
- "Falta validación de input en línea 45"
- "Podrías extraer esta lógica a un custom hook"

# ❌ Feedback no constructivo  
- "Esto está mal"
- "No me gusta este approach"
- "Cambia todo"
```

#### **Tipos de Comentarios**
- **❗ Crítico:** Debe ser corregido antes de merge
- **💡 Sugerencia:** Mejora recomendada
- **❓ Pregunta:** Necesita clarificación
- **👍 Elogio:** Reconoce buen trabajo

### **Como Author**

#### **Antes de Crear PR**
```bash
# Self-review checklist
npm run ci:quality-gates  # ✅ All checks pass
npm run test:e2e:critical # ✅ Critical flows work
# ✅ Manual testing completed
# ✅ Documentation updated
# ✅ Screenshots included (if UI changes)
```

#### **Responder a Reviews**
- 📝 Responde a todos los comentarios
- 🔄 Haz cambios solicitados promptamente
- 💬 Explica decisiones cuando sea necesario
- 🙏 Agradece el feedback constructivo
- 🔄 Re-request review después de cambios

---

## 🚨 **Situaciones Especiales**

### **Hotfixes**
```bash
# Para bugs críticos en producción
git checkout main
git checkout -b hotfix/fix-critical-bug
# Fix the bug
git commit -m "hotfix: corregir error crítico en login"
# Create PR directly to main
# After merge, sync back to develop
```

### **Dependencies Updates**
```bash
# Actualizar deps regularmente
npm update
npm audit fix

# Para major updates, crear PR separado
npm install next@latest
# Test thoroughly
# Update code if needed
```

### **Breaking Changes**
- 📢 Comunicar con antelación
- 📝 Documentar migration path
- 🔄 Incluir backwards compatibility cuando sea posible
- 📧 Notificar a stakeholders

---

## 📞 **Contacto y Soporte**

### **Equipo de Desarrollo**
- **Lead Developer:** @abyphantom11
- **Frontend Team:** #frontend-team
- **Backend Team:** #backend-team
- **DevOps:** #devops-team

### **Canales de Comunicación**
- **Slack:** #lealta-development
- **Issues:** GitHub Issues para bugs y features
- **Discussions:** GitHub Discussions para preguntas generales
- **Email:** dev@lealta.com para asuntos urgentes

### **Reuniones Regulares**
- **Daily Standup:** 9:00 AM (Lun-Vie)
- **Sprint Planning:** Lunes 2:00 PM
- **Retrospective:** Viernes 4:00 PM
- **Code Review Sessions:** Martes/Jueves 3:00 PM

---

## 🎉 **Reconocimientos**

¡Agradecemos a todos los contributors que hacen posible Lealta 2.0!

### **Top Contributors**
- [@abyphantom11](https://github.com/Abyphantom11) - Project Lead & Core Developer

### **Cómo Ser Reconocido**
- 🏆 Contribuciones consistentes y de calidad
- 🤝 Ayudar a otros developers
- 📝 Mejorar documentación
- 🐛 Reportar y fixear bugs
- 💡 Proponer mejoras innovadoras

---

¡Gracias por contribuir a Lealta 2.0! Tu trabajo ayuda a crear una mejor experiencia para restaurantes y sus clientes. 🚀
