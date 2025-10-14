import { test, expect } from '@playwright/test';

/**
 * 🧪 TESTS E2E CRÍTICOS - FLUJO DE AUTENTICACIÓN
 * Estos tests validan los flujos más importantes del sistema
 */

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar storage antes de cada test
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('Admin Login Flow - Should access admin dashboard', async ({ page }) => {
    // 1. Ir a login
    await page.goto('/');
    
    // 2. Completar formulario de login
    await page.fill('[data-testid="email-input"]', 'admin@cafedani.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // 3. Verificar redirección a dashboard
    await expect(page).toHaveURL(/\/cafedani\/admin/);
    
    // 4. Verificar elementos del dashboard
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(page.locator('text=Dashboard Admin')).toBeVisible();
    
    // 5. Verificar métricas se cargan
    await expect(page.locator('[data-testid="metrics-card"]')).toBeVisible();
  });

  test('Staff Login Flow - Should access staff POS', async ({ page }) => {
    // 1. Login como staff
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'staff@cafedani.com');
    await page.fill('[data-testid="password-input"]', 'staff123');
    await page.click('[data-testid="login-button"]');
    
    // 2. Verificar acceso a staff
    await expect(page).toHaveURL(/\/cafedani\/staff/);
    await expect(page.locator('[data-testid="pos-interface"]')).toBeVisible();
    
    // 3. Verificar funcionalidades básicas
    await expect(page.locator('text=Sistema POS')).toBeVisible();
    await expect(page.locator('[data-testid="client-search"]')).toBeVisible();
  });

  test('Business Isolation - Should prevent cross-business access', async ({ page }) => {
    // 1. Login en cafedani
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'admin@cafedani.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // 2. Intentar acceder a otro business
    await page.goto('/arepa/admin');
    
    // 3. Debe ser bloqueado
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=business-mismatch')).toBeVisible();
  });

  test('Client Registration Flow - Should complete full signup', async ({ page }) => {
    // 1. Ir a registro de cliente
    await page.goto('/cafedani/cliente');
    
    // 2. Click en registrarse
    await page.click('[data-testid="register-button"]');
    
    // 3. Completar formulario
    await page.fill('[data-testid="nombre-input"]', 'Juan Test');
    await page.fill('[data-testid="cedula-input"]', '12345678');
    await page.fill('[data-testid="telefono-input"]', '3001234567');
    await page.click('[data-testid="submit-registration"]');
    
    // 4. Verificar cliente creado
    await expect(page.locator('text=Cliente registrado exitosamente')).toBeVisible();
    
    // 5. Verificar dashboard del cliente
    await expect(page.locator('[data-testid="client-dashboard"]')).toBeVisible();
    await expect(page.locator('text=Juan Test')).toBeVisible();
  });
});

test.describe('Core Business Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login como admin para tests de negocio
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'admin@cafedani.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/cafedani\/admin/);
  });

  test('Points System - Should award and track points', async ({ page }) => {
    // 1. Ir a gestión de clientes
    await page.click('[data-testid="nav-clientes"]');
    
    // 2. Buscar cliente existente
    await page.fill('[data-testid="client-search"]', 'Juan');
    await page.click('[data-testid="search-button"]');
    
    // 3. Seleccionar cliente
    await page.click('[data-testid="client-item"]');
    
    // 4. Agregar consumo
    await page.click('[data-testid="add-consumo"]');
    await page.fill('[data-testid="monto-input"]', '15000');
    await page.click('[data-testid="confirm-consumo"]');
    
    // 5. Verificar puntos actualizados
    await expect(page.locator('[data-testid="client-points"]')).toContainText('4'); // 15000/4000 = 3.75 → 4 puntos
  });

  test('Menu Management - Should create and edit products', async ({ page }) => {
    // 1. Ir a gestión de menú
    await page.click('[data-testid="nav-menu"]');
    
    // 2. Crear nuevo producto
    await page.click('[data-testid="add-product"]');
    await page.fill('[data-testid="product-name"]', 'Café Test E2E');
    await page.fill('[data-testid="product-price"]', '8000');
    await page.selectOption('[data-testid="product-category"]', 'Bebidas');
    await page.click('[data-testid="save-product"]');
    
    // 3. Verificar producto creado
    await expect(page.locator('text=Café Test E2E')).toBeVisible();
    await expect(page.locator('text=$8,000')).toBeVisible();
  });

  test('Reservations System - Should create and manage reservations', async ({ page }) => {
    // 1. Ir a módulo de reservas
    await page.click('[data-testid="nav-reservas"]');
    
    // 2. Crear nueva reserva
    await page.click('[data-testid="create-reserva"]');
    await page.fill('[data-testid="client-name"]', 'Cliente Reserva Test');
    await page.fill('[data-testid="phone"]', '3009876543');
    await page.selectOption('[data-testid="mesa-select"]', '5');
    
    // 3. Seleccionar fecha (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="fecha-input"]', dateString);
    
    // 4. Confirmar reserva
    await page.click('[data-testid="confirm-reserva"]');
    
    // 5. Verificar reserva creada
    await expect(page.locator('text=Reserva creada exitosamente')).toBeVisible();
    await expect(page.locator('text=Cliente Reserva Test')).toBeVisible();
  });
});

test.describe('Mobile Experience', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE size
  });

  test('Mobile Client Portal - Should work on mobile devices', async ({ page }) => {
    // 1. Ir al portal cliente en móvil
    await page.goto('/cafedani/cliente');
    
    // 2. Verificar responsive design
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // 3. Verificar funcionalidades móviles
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // 4. Probar registro móvil
    await page.click('[data-testid="mobile-register"]');
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();
  });

  test('PWA Installation - Should offer app installation', async ({ page }) => {
    // 1. Ir a la app
    await page.goto('/cafedani/cliente');
    
    // 2. Verificar service worker
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistered).toBe(true);
    
    // 3. Verificar manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
  });
});

test.describe('Performance & Reliability', () => {
  test('Page Load Performance - Should load quickly', async ({ page }) => {
    // 1. Medir tiempo de carga
    const startTime = Date.now();
    await page.goto('/cafedani/admin');
    const loadTime = Date.now() - startTime;
    
    // 2. Verificar tiempo de carga < 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    // 3. Verificar First Contentful Paint
    const fcpMetric = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
            }
          }
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    expect(fcpMetric).toBeLessThan(1500); // < 1.5s FCP
  });

  test('Error Handling - Should gracefully handle errors', async ({ page }) => {
    // 1. Simular error de red
    await page.route('**/api/admin/dashboard', route => route.abort());
    
    // 2. Ir a dashboard
    await page.goto('/cafedani/admin');
    
    // 3. Verificar manejo de error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Error de conexión')).toBeVisible();
    
    // 4. Verificar botón de reintentar
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
});
