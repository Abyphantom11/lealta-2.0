import { test, expect } from '@playwright/test';

test('Test básico de conectividad', async ({ page }) => {
  console.log('🚀 Iniciando test básico...');
  
  try {
    await page.goto('http://localhost:3001');
    console.log('✅ Navegación exitosa');
    
    // Esperar a que la página cargue
    await page.waitForTimeout(2000);
    
    // Verificar que algo se cargó
    const title = await page.title();
    console.log(`📄 Título de la página: ${title}`);
    
    expect(title).toBeTruthy();
    console.log('✅ Test completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
    throw error;
  }
});
