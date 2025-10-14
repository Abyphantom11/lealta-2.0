import { test, expect } from '@playwright/test';

test('🎯 TEST SIMPLE - Verificar que Playwright funciona', async ({ page }) => {
  // Ir a Google como test básico
  await page.goto('https://www.google.com');
  
  // Verificar que cargó
  await expect(page).toHaveTitle(/Google/);
  
  console.log('✅ ¡Playwright funciona correctamente!');
  console.log('🚀 El Enhanced Testing Framework está listo para usar');
});
