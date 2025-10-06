# 🍎 SOLUCIÓN PWA PARA IPHONE - Módulo Cliente

## 📱 PROBLEMA IDENTIFICADO

### Android (Funciona ✅)
- Usa manifest dinámico
- `start_url`: `/{businessSlug}/cliente`
- Instala PWA con `beforeinstallprompt`
- Respeta scope y start_url

### iPhone (No funciona ❌)
- **iOS Safari ignora manifest dinámico**
- **No soporta `beforeinstallprompt`**
- **Requiere "Add to Home Screen" manual**
- **Abre en la URL actual, NO en start_url**
- **Necesita meta tags específicos de Apple**

---

## ✅ SOLUCIÓN: Meta Tags Dinámicos + Guía iOS

### 1. 🏗️ Layout Dinámico para Cliente

Crear `/src/app/[businessId]/cliente/layout.tsx`:

```tsx
import { Metadata } from 'next';
import { headers } from 'next/headers';

interface ClienteLayoutProps {
  children: React.ReactNode;
  params: { businessId: string };
}

export async function generateMetadata({ params }: { params: { businessId: string } }): Promise<Metadata> {
  const businessSlug = params.businessId;
  const businessName = businessSlug.charAt(0).toUpperCase() + businessSlug.slice(1);
  
  // URL base para este business
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';
  const clienteUrl = `${baseUrl}/${businessSlug}/cliente`;
  
  return {
    title: `${businessName} - Mi Tarjeta`,
    description: `Portal de cliente para ${businessName}`,
    applicationName: businessName,
    
    // ✅ CRITICAL: Apple Web App Meta Tags
    appleWebApp: {
      capable: true,
      title: businessName,
      statusBarStyle: 'black-translucent',
      startupImage: [
        {
          url: '/icons/apple-splash-2048-2732.png',
          media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/icons/apple-splash-1668-2388.png',
          media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/icons/apple-splash-1536-2048.png',
          media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/icons/apple-splash-1284-2778.png',
          media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
        },
        {
          url: '/icons/apple-splash-1170-2532.png',
          media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
        },
        {
          url: '/icons/apple-splash-1125-2436.png',
          media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
        },
        {
          url: '/icons/apple-splash-750-1334.png',
          media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
        }
      ],
    },
    
    // Manifest dinámico
    manifest: `/api/manifest?business=${businessSlug}`,
    
    // Icons específicos
    icons: {
      icon: '/icons/icon-192.png',
      shortcut: '/icons/icon-192.png',
      apple: '/icons/apple-touch-icon.png',
    },
    
    // Open Graph para compartir
    openGraph: {
      title: `${businessName} - Mi Tarjeta`,
      description: `Accede a tu tarjeta de fidelidad de ${businessName}`,
      url: clienteUrl,
      siteName: businessName,
      images: [
        {
          url: '/icons/icon-512.png',
          width: 512,
          height: 512,
        },
      ],
      locale: 'es_ES',
      type: 'website',
    },
  };
}

export default function ClienteLayout({ children, params }: ClienteLayoutProps) {
  const businessSlug = params.businessId;
  const businessName = businessSlug.charAt(0).toUpperCase() + businessSlug.slice(1);
  
  return (
    <>
      <head>
        {/* ✅ CRITICAL: Meta tags adicionales para iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={businessName} />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Theme color dinámico */}
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="msapplication-TileColor" content="#1a1a1a" />
        
        {/* Viewport optimizado para iOS */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" 
        />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/icon-114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72.png" />
        
        {/* Manifest dinámico */}
        <link rel="manifest" href={`/api/manifest?business=${businessSlug}`} />
        
        {/* ✅ CRITICAL: Preload para mejorar primera carga */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_APP_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_APP_URL} />
      </head>
      {children}
    </>
  );
}
```

---

### 2. 🎯 Componente de Instrucciones iOS

Crear `/src/components/ios/IOSInstallGuide.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IOSInstallGuideProps {
  businessName: string;
  showAutomatically?: boolean;
}

export default function IOSInstallGuide({ businessName, showAutomatically = true }: IOSInstallGuideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandalone, setIsInStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Detectar si ya está instalado (standalone mode)
    const standalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    setIsInStandalone(standalone);
    
    // Verificar si ya mostró las instrucciones
    const hasSeenGuide = localStorage.getItem(`ios-install-guide-${businessName}`);
    
    // Mostrar automáticamente si es iOS, no está instalado y no ha visto la guía
    if (iOS && !standalone && !hasSeenGuide && showAutomatically) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, [businessName, showAutomatically]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`ios-install-guide-${businessName}`, 'seen');
  };

  // No mostrar si no es iOS o ya está instalado
  if (!isIOS || isInStandalone) return null;

  return (
    <>
      {/* Botón flotante para abrir la guía */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
          aria-label="Instrucciones de instalación"
        >
          <Home className="w-6 h-6" />
        </button>
      )}

      {/* Modal con instrucciones */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-blue-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    🍎
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Instalar {businessName}</h3>
                    <p className="text-sm text-gray-400">En tu iPhone</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Instrucciones paso a paso */}
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Toca el botón de Compartir</p>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <Share className="w-4 h-4" />
                        <span>En la parte inferior de Safari</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Selecciona "Añadir a inicio"</p>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <Plus className="w-4 h-4" />
                        <span>Desplázate y busca esta opción</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Confirma en "Añadir"</p>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <Home className="w-4 h-4" />
                        <span>Aparecerá en tu pantalla de inicio</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <p className="text-center text-sm text-gray-400">
                  ✨ Accede más rápido a tu tarjeta de fidelidad
                </p>
                <button
                  onClick={handleDismiss}
                  className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

### 3. 🔗 Integración en el Módulo Cliente

Modificar `/src/app/[businessId]/cliente/page.tsx`:

```tsx
// Agregar el componente iOS
import IOSInstallGuide from '@/components/ios/IOSInstallGuide';

export default function BusinessClientePage() {
  // ... código existente ...
  
  return (
    <BrandingProvider businessId={businessData.id}>
      <DynamicManifest businessSlug={businessSlug} />
      <IOSInstallGuide businessName={businessData.name} showAutomatically={true} />
      <AuthHandler businessId={businessData.id} />
    </BrandingProvider>
  );
}
```

---

### 4. 📱 Splash Screens para iOS

Crear los splash screens en `/public/icons/`:

```bash
# Tamaños requeridos para iOS:
apple-splash-2048-2732.png  # iPad Pro 12.9"
apple-splash-1668-2388.png  # iPad Pro 11"
apple-splash-1536-2048.png  # iPad
apple-splash-1284-2778.png  # iPhone 14 Pro Max
apple-splash-1170-2532.png  # iPhone 14 Pro
apple-splash-1125-2436.png  # iPhone 13 Pro
apple-splash-750-1334.png   # iPhone SE
```

---

### 5. 🎨 Apple Touch Icon

Crear `/public/icons/apple-touch-icon.png`:
- **Tamaño:** 180x180px
- **Formato:** PNG
- **Fondo:** Opaco (iOS no soporta transparencia)

---

## ✅ RESULTADO ESPERADO

### Comportamiento en iPhone:

1. **Usuario accede a:** `https://yourdomain.com/golom/cliente`
2. **Ve guía de instalación** con instrucciones claras
3. **Toca Share → "Añadir a inicio"**
4. **iOS detecta meta tags de Apple** y usa el nombre/icono correcto
5. **App se abre en:** `https://yourdomain.com/golom/cliente` (la URL actual)
6. **Sesión persiste** porque está en la misma URL

### Ventajas:

✅ **URL correcta desde el inicio**
✅ **Sesión preservada**
✅ **Nombre e icono personalizados**
✅ **Splash screens nativos**
✅ **Guía visual para el usuario**

---

## 🔧 DIFERENCIAS ANDROID VS IOS

| Característica | Android/Chrome | iOS Safari |
|---|---|---|
| **Instalación** | Automática con prompt | Manual desde Share |
| **start_url** | ✅ Respeta manifest | ❌ Usa URL actual |
| **scope** | ✅ Respeta manifest | ⚠️ Limitado |
| **Manifest** | ✅ Soporte completo | ⚠️ Soporte parcial |
| **Meta tags** | Opcionales | ✅ REQUERIDOS |
| **Splash screens** | Opcionales | ✅ REQUERIDOS |
| **Detección** | `beforeinstallprompt` | ❌ No disponible |

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Crear layout dinámico con meta tags de Apple
2. ✅ Crear componente IOSInstallGuide
3. ✅ Generar splash screens iOS
4. ✅ Crear apple-touch-icon.png
5. ✅ Integrar en página de cliente
6. ✅ Probar en iPhone real

---

## 📚 RECURSOS

- [Apple Web App Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html)
- [iOS PWA Best Practices](https://web.dev/learn/pwa/installation-prompt/)
- [Splash Screen Generator](https://www.appicon.co/)
