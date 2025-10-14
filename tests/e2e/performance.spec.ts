import { test, expect } from '@playwright/test';

/**
 * 🚀 PERFORMANCE TESTS - SEGÚN ROADMAP REQUIREMENTS
 * Target: First Contentful Paint < 1.5s, Page Load < 3s
 */

const PERFORMANCE_THRESHOLDS = {
  pageLoadTime: 3000,
  firstContentfulPaint: 1500,
  apiResponseTime: 1000
};

const TEST_URLS = {
  adminDashboard: (businessId: string) => `/${businessId}/admin`,
  clientPortal: (businessId: string) => `/${businessId}/cliente`
};

/**
 * 🚀 PERFORMANCE TESTS - SEGÚN ROADMAP REQUIREMENTS
 * Target: First Contentful Paint < 1.5s, Page Load < 3s
 */

test.describe('Performance Optimization Tests', () => {
  test('Page Load Performance - Should load quickly', async ({ page }) => {
    // 1. Medir tiempo de carga total
    const startTime = Date.now();
    await page.goto(TEST_URLS.adminDashboard('cafedani'));
    await page.waitForLoadState('networkidle');
    const totalLoadTime = Date.now() - startTime;

    // 2. Verificar que la página carga rápido
    expect(totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime);
    
    console.log('📊 Page Load Time:', `${totalLoadTime}ms`);
  });

  test('Bundle Size Analysis - Should maintain optimal bundle size', async ({ page }) => {
    // 1. Interceptar recursos JavaScript
    let totalJsSize = 0;
    const jsResources: string[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.includes('javascript') || url.includes('.js')) {
        try {
          const buffer = await response.body();
          totalJsSize += buffer.length;
          jsResources.push(url.split('/').pop() || url);
        } catch {
          // Ignore failed requests
        }
      }
    });

    // 2. Cargar página
    await page.goto(TEST_URLS.adminDashboard('cafedani'));
    await page.waitForLoadState('networkidle');

    // 3. Verificar tamaño del bundle
    console.log('📦 Bundle Analysis:', {
      totalJavaScript: `${(totalJsSize / 1024).toFixed(2)} KB`,
      resourceCount: jsResources.length
    });

    // 4. Verificar que no sea excesivamente grande
    expect(totalJsSize).toBeLessThan(2 * 1024 * 1024); // 2MB máximo
  });

  test('No JavaScript Errors - Should run without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // 1. Capturar errores de consola
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 2. Cargar y navegar por la app
    await page.goto(TEST_URLS.adminDashboard('cafedani'));
    await page.waitForLoadState('networkidle');

    // 3. Verificar que no hay errores críticos
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('DevTools') &&
      !error.includes('Extension')
    );

    console.log('� Console Errors:', criticalErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('Progressive Web App Features - Should have PWA capabilities', async ({ page }) => {
    // 1. Cargar la app
    await page.goto(TEST_URLS.clientPortal('cafedani'));
    
    // 2. Verificar service worker
    const swSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swSupported).toBe(true);

    // 3. Verificar manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');

    // 4. Verificar meta tags básicos
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content');
    await expect(page.locator('title')).not.toBeEmpty();
  });
});

/**
 * 🔬 LIGHTHOUSE INTEGRATION TESTS
 */
test.describe('Lighthouse Performance Audits', () => {
  test('Lighthouse Core Web Vitals', async ({ page }) => {
    // Este test se expandirá cuando se implemente Lighthouse CI
    await page.goto(TEST_URLS.adminDashboard('cafedani'));
    
    // Por ahora, verificar elementos básicos que afectan Lighthouse
    await expect(page.locator('html')).toHaveAttribute('lang');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content');
    await expect(page.locator('title')).not.toBeEmpty();
    
    // Verificar que no hay errores de consola que afecten el score
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // No debería haber errores críticos de JavaScript
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('DevTools') &&
      !error.includes('Extension')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
