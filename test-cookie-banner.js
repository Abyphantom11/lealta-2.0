// Script para probar que el banner de cookies no aparece en rutas de cliente
const testCookieBannerVisibility = () => {
  console.log('🍪 === TEST DE VISIBILIDAD DEL BANNER DE COOKIES ===');
  
  const currentUrl = window.location.href;
  console.log('📍 URL actual:', currentUrl);
  
  // Verificar si estamos en una ruta de cliente
  const isClientRoute = window.location.pathname?.includes('/cliente') || 
                        window.location.pathname?.endsWith('/cliente');
  
  console.log('🔍 ¿Es ruta de cliente?:', isClientRoute);
  
  // Buscar el banner de cookies en el DOM
  setTimeout(() => {
    const cookieBanner = document.querySelector('[class*="cookie"]') || 
                        document.querySelector('[class*="Cookie"]') ||
                        document.querySelector('div[class*="z-50"]');
    
    console.log('🎯 Banner de cookies encontrado:', !!cookieBanner);
    
    if (cookieBanner) {
      console.log('📋 Elemento del banner:', cookieBanner);
      console.log('👁️ ¿Es visible?:', !cookieBanner.hidden && cookieBanner.style.display !== 'none');
    } else {
      console.log('✅ No se encontró banner de cookies (correcto para rutas de cliente)');
    }
    
    // Verificar si hay algún elemento con texto relacionado a cookies
    const cookieText = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent?.toLowerCase().includes('cookies') || 
      el.textContent?.toLowerCase().includes('aceptar')
    );
    
    if (cookieText && isClientRoute) {
      console.log('⚠️ PROBLEMA: Se encontró texto de cookies en ruta de cliente:', cookieText.textContent);
    } else if (!cookieText && isClientRoute) {
      console.log('✅ CORRECTO: No hay texto de cookies en ruta de cliente');
    }
    
  }, 1000);
};

// Ejecutar test cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testCookieBannerVisibility);
} else {
  testCookieBannerVisibility();
}

console.log('🍪 Test de banner de cookies iniciado. Resultados en 1 segundo...');
