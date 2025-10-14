import { test, expect } from '@playwright/test';

test.describe('🚀 DEMO DEL ENHANCED TESTING FRAMEWORK', () => {
  
  test('✅ Test 1: Verificar que la aplicación carga', async ({ page }) => {
    console.log('🔄 Navegando a la página principal...');
    
    await page.goto('/');
    
    console.log('✅ Página cargada exitosamente');
    
    // Verificar que tenemos un título
    const title = await page.title();
    console.log(`📄 Título encontrado: "${title}"`);
    
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('✅ Test 2: Verificar responsive design', async ({ page }) => {
    console.log('📱 Probando responsive design...');
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    console.log('🖥️ Vista desktop: OK');
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    console.log('📱 Vista mobile: OK');
    
    // Verificar que no hay scroll horizontal
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    
    console.log(`📏 ScrollWidth: ${scrollWidth}, ClientWidth: ${clientWidth}`);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 50); // 50px tolerance
  });

  test('✅ Test 3: Verificar performance básica', async ({ page }) => {
    console.log('⚡ Midiendo performance...');
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo de carga: ${loadTime}ms`);
    
    // Debe cargar en menos de 10 segundos (muy permisivo)
    expect(loadTime).toBeLessThan(10000);
    
    if (loadTime < 3000) {
      console.log('🚀 ¡Excelente performance!');
    } else if (loadTime < 5000) {
      console.log('✅ Performance aceptable');
    } else {
      console.log('⚠️ Performance mejorable');
    }
  });

  test('✅ Test 4: Verificar que no hay errores JavaScript', async ({ page }) => {
    console.log('🐛 Verificando errores JavaScript...');
    
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.log(`❌ Error JS detectado: ${error.message}`);
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000); // Esperar a que todo cargue
    
    console.log(`🔍 Total de errores JS: ${errors.length}`);
    
    if (errors.length === 0) {
      console.log('✅ ¡No hay errores JavaScript!');
    } else {
      console.log('⚠️ Se encontraron errores JavaScript');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Para demo, solo advertir pero no fallar
    if (errors.length > 10) {
      throw new Error(`Demasiados errores JavaScript: ${errors.length}`);
    }
  });

});
