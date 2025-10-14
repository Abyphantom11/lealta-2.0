import { test, expect } from '@playwright/test';

test.describe('🧪 Tests Básicos de Playwright', () => {
  test('✅ Verificar que Playwright funciona - Test externo', async ({ page }) => {
    // Test básico que no depende del servidor local
    await page.goto('https://www.google.com');
    await expect(page).toHaveTitle(/Google/);
    console.log('✅ Playwright funciona correctamente!');
  });

  test('🌐 Test de conectividad básica', async ({ page }) => {
    // Otro test simple
    await page.goto('https://httpbin.org/get');
    const content = await page.textContent('body');
    expect(content).toContain('origin');
    console.log('✅ Test de conectividad exitoso!');
  });
});
