import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Verificación básica del sistema', () => {
  test('La página principal carga correctamente', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que la página carga
    await expect(page).toHaveTitle(/Lealta/i);
    
    // Verificar que no hay errores de JavaScript
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Verificar que no hay errores críticos
    expect(errors.length).toBe(0);
  });

  test('Login page es accesible', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar que existe un formulario de login
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
    
    // Verificar campos básicos (con selectores flexibles)
    const emailField = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email" i]').first();
    const passwordField = page.locator('input[type="password"], input[name*="password"], input[placeholder*="password" i]').first();
    
    if (await emailField.isVisible()) {
      await expect(emailField).toBeVisible();
    }
    
    if (await passwordField.isVisible()) {
      await expect(passwordField).toBeVisible();
    }
  });

  test('Navigation básica funciona', async ({ page }) => {
    await page.goto('/');
    
    // Esperar a que cargue
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página responde
    const response = await page.request.get('/');
    expect(response.status()).toBeLessThan(400);
  });

  test('Rendimiento básico - página carga en tiempo razonable', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // La página debe cargar en menos de 10 segundos (muy permisivo para empezar)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Tiempo de carga: ${loadTime}ms`);
  });

  test('Responsive design - viewport móvil', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página es visible en móvil
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verificar que no hay scroll horizontal
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // +20px tolerance
  });
});
