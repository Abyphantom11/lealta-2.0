'use client';
import { useState, useEffect, useCallback } from 'react';
import { useBranding } from './branding/BrandingProvider';
import { CedulaForm } from './auth/CedulaForm';
import { RegisterForm } from './auth/RegisterForm';
import Dashboard from './Dashboard';
import MenuDrawer from './MenuDrawer';
import { clientSession, levelStorage, mobileStorage } from '@/utils/mobileStorage';
import { logger } from '@/utils/logger';
import { runBrowserDiagnostic } from '@/utils/browserDiagnostic';
import { setupOperaFallback } from '@/utils/operaFallback';
import { 
  BeforeInstallPromptEvent, 
  installApp, 
  handleBeforeInstallPrompt 
} from '../utils/pwaUtils';
import { isHigherLevel } from '../utils/loyaltyCalculations';
import { AuthStep, ClienteData, MenuCategory, MenuItem, FormData } from './types';
import { browserNotifications } from '@/services/browserNotifications';
import { Bell, IdCard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthHandler() {
  const { brandingConfig } = useBranding();
  
  // Estados principales de autenticación - EXTRAÍDOS DEL ORIGINAL
  // Estado local
  const [step, setStep] = useState<AuthStep>('presentation');
  const [cedula, setCedula] = useState('');
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados de formulario - EXTRAÍDOS DEL ORIGINAL
  const [formData, setFormData] = useState<FormData>({
    cedula: '',
    nombre: '',
    telefono: '',
    email: ''
  });

  // Estados PWA - EXTRAÍDOS DEL ORIGINAL
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Estados del menú - EXTRAÍDOS DEL ORIGINAL
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState<'categories' | 'products'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [allCategories, setAllCategories] = useState<MenuCategory[]>([]); // Todas las categorías incluyendo subcategorías
  const [menuProducts, setMenuProducts] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Estados de gestos del menú - EXTRAÍDOS DEL ORIGINAL
  const [isDragging, setIsDragging] = useState(false);

  // Estados del dashboard - EXTRAÍDOS DEL ORIGINAL
  const [showTarjeta, setShowTarjeta] = useState(false);
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [oldLevel, setOldLevel] = useState('');
  const [newLevel, setNewLevel] = useState('');

  // Estados del buscador - EXTRAÍDOS DEL ORIGINAL
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<MenuItem[]>([]);

  // Estado para configuración del portal - EXTRAÍDO DEL ORIGINAL
  const [portalConfig, setPortalConfig] = useState<any>({
    nombreEmpresa: 'LEALTA 2.0',
    tarjetas: []
  });

  // Estados del carrusel - EXTRAÍDOS DEL ORIGINAL
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Imágenes del carrusel (obtenidas desde branding config, con fallback a imágenes por defecto)
  const carouselImages = brandingConfig.carouselImages?.length > 0 
    ? brandingConfig.carouselImages 
    : [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=250&fit=crop',
      ];

  // useEffect para marcar cuando el componente está montado en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función para cerrar sesión - EXTRAÍDA DEL ORIGINAL
  const handleLogout = () => {
    logger.log('🚪 Cerrando sesión...');
    
    // Limpiar almacenamiento usando las nuevas utilidades
    clientSession.clear();
    if (clienteData) {
      levelStorage.clear(clienteData.cedula);
    }
    
    // Resetear estados
    setClienteData(null);
    setCedula('');
    setFormData({
      cedula: '',
      nombre: '',
      telefono: '',
      email: ''
    });
    setError('');
    setStep('presentation');
    
    logger.log('✅ Sesión cerrada exitosamente');
  };

  // Verificar sesión guardada al cargar - EXTRAÍDA DEL ORIGINAL
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        // Configurar fallback para Opera si es necesario
        const operaFallback = setupOperaFallback();
        if (operaFallback) {
          logger.warn('🔧 Sistema de fallback de Opera activado');
        }
        
        // Ejecutar diagnóstico del navegador (especialmente útil para Opera)
        logger.log('🔍 Ejecutando diagnóstico de navegador...');
        await runBrowserDiagnostic();
        
        // Obtener información del entorno
        const envInfo = mobileStorage.getEnvironmentInfo();
        logger.log('🔍 Información del entorno:', envInfo);
        
        const savedSession = clientSession.load() as { cedula: string; timestamp: number } | null;
        if (savedSession) {
          const { cedula: savedCedula, timestamp } = savedSession;
          
          // Verificar si la sesión no ha expirado (30 días)
          const now = Date.now();
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          
          if (now - timestamp < thirtyDays) {
            logger.log('✅ Sesión válida encontrada, verificando cliente...');
            
            // Sesión válida, verificar que el cliente aún existe
            const response = await fetch('/api/cliente/verificar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cedula: savedCedula })
            });
            
            const data = await response.json();
            if (response.ok && data.existe) {
              // Cliente existe, restaurar sesión
              logger.log('🎉 Sesión restaurada exitosamente para:', savedCedula);
              console.log('🐛 AuthHandler - Datos del cliente restaurado:', data.cliente);
              console.log('🐛 AuthHandler - TarjetaLealtad:', data.cliente?.tarjetaLealtad);
              setClienteData(data.cliente);
              setCedula(savedCedula);
              setStep('dashboard');
              // No establecer isInitialLoading a false aquí - se hace al final
            } else {
              // Cliente no existe, limpiar sesión
              logger.warn('⚠️ Cliente no existe, limpiando sesión');
              clientSession.clear();
              setStep('presentation'); // Asegurar que va a presentation si no hay sesión válida
            }
          } else {
            // Sesión expirada, limpiar
            logger.log('⏰ Sesión expirada, limpiando');
            clientSession.clear();
            setStep('presentation'); // Asegurar que va a presentation si la sesión expiró
          }
        } else {
          logger.log('ℹ️ No hay sesión guardada');
          setStep('presentation'); // Asegurar que va a presentation si no hay sesión
        }
      } catch (error) {
        logger.error('❌ Error verificando sesión guardada:', error);
        // En caso de error, limpiar cualquier sesión corrupta
        clientSession.clear();
        setStep('presentation'); // En caso de error, ir a presentation
      } finally {
        // Siempre establecer isInitialLoading a false al final
        setIsInitialLoading(false);
      }
    };

    checkSavedSession();
  }, []);

  // Función simplificada para el fondo (sin SVG dinámico para evitar hidratación)
  const getBackgroundStyle = () => {
    if (!isClient) return { backgroundColor: '#1a1a1a' }; // Fondo simple en el servidor
    
    return {
      backgroundColor: '#1a1a1a',
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(74, 74, 74, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(74, 74, 74, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(74, 74, 74, 0.1) 0%, transparent 50%)
      `
    };
  };

  // useEffect para el carrusel de imágenes (rotación automática cada 6 segundos para mejor sincronización)
  useEffect(() => {
    const carouselInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % carouselImages.length
      );
    }, 6000); // Cambia cada 6 segundos para dar tiempo a la animación de 1.5s
    return () => clearInterval(carouselInterval);
  }, [carouselImages.length]);

  // Efectos para bloquear scroll - EXTRAÍDOS DEL ORIGINAL
  useEffect(() => {
    if (showTarjeta) {
      // Guardar la posición actual del scroll
      const scrollY = window.scrollY;
      // Bloquear el scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Recuperar la posición del scroll cuando se cierra el modal
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY.replace('-', '')) || 0);
      }
    }
  }, [showTarjeta]);

  useEffect(() => {
    if (isMenuDrawerOpen) {
      // Guardar la posición actual del scroll
      const scrollY = window.scrollY;
      // Bloquear el scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Recuperar la posición del scroll cuando se cierra el modal
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY.replace('-', '')) || 0);
      }
    }
  }, [isMenuDrawerOpen]);

  // Event listener PWA - EXTRAÍDO DEL ORIGINAL
  useEffect(() => {
    const pwaHandler = (e: BeforeInstallPromptEvent) => 
      handleBeforeInstallPrompt(e, setDeferredPrompt);
    
    window.addEventListener('beforeinstallprompt', pwaHandler as EventListener);
    return () => {
      window.removeEventListener('beforeinstallprompt', pwaHandler as EventListener);
    };
  }, []);

  // Función de instalación PWA - EXTRAÍDA DEL ORIGINAL
  const handleInstallApp = () => {
    installApp(deferredPrompt, setDeferredPrompt, setError);
  };

  // Función para cargar categorías del menú
  const loadMenuCategories = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const response = await fetch('/api/menu/categorias');
      if (response.ok) {
        const data = await response.json();
        const mainCategories = data.filter((cat: any) => !cat.parentId);
        setMenuCategories(mainCategories);
        setAllCategories(data);
        setActiveMenuSection('categories');
      }
    } catch (error) {
      console.error('Error cargando categorías del menú:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  // Función para cargar productos de una categoría
  const loadCategoryProducts = useCallback(async (categoryId: string) => {
    setIsLoadingMenu(true);
    try {
      // Buscar la categoría seleccionada
      const category = allCategories.find(cat => cat.id === categoryId);
      setSelectedCategory(category || null);
      
      // Verificar si tiene subcategorías
      const subcategorias = allCategories.filter(cat => cat.parentId === categoryId);
      
      if (subcategorias.length > 0) {
        // Mostrar subcategorías
        setMenuCategories(subcategorias);
        setActiveMenuSection('categories');
      } else {
        // Cargar productos de la categoría
        const response = await fetch(`/api/menu/productos?categoriaId=${categoryId}`);
        if (response.ok) {
          const data = await response.json();
          setMenuProducts(data);
          setActiveMenuSection('products');
        }
      }
    } catch (error) {
      console.error('Error cargando productos de categoría:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  }, [allCategories]);

  // Verificar sesión inicial
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = clientSession.load();
        if (sessionData?.cedula) {
          logger.log('📱 Sesión encontrada:', sessionData.cedula);
          setCedula(sessionData.cedula);
          
          // Verificar cliente en la base de datos
          const response = await fetch('/api/cliente/verificar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula: sessionData.cedula })
          });
          
          const data = await response.json();
          if (response.ok && data.existe) {
            setClienteData(data.cliente);
            setStep('dashboard');
          } else {
            clientSession.clear();
            setStep('presentation');
          }
        }
      } catch (error) {
        logger.error('Error verificando sesión:', error);
        setStep('presentation');
      } finally {
        setIsInitialLoading(false);
      }
    };

    checkSession();
  }, []);

  // Hook para cargar datos cuando se entra al dashboard
  useEffect(() => {
    if (step === 'dashboard') {
      loadMenuCategories();
    }
  }, [step, loadMenuCategories]);

  // Actualización periódica de datos del cliente para mantener la tarjeta actualizada
  useEffect(() => {
    // Solo si estamos en la vista del dashboard y tenemos datos del cliente
    if (step === 'dashboard' && clienteData?.id) {
      const fetchClienteActualizado = async () => {
        try {
          const response = await fetch('/api/cliente/verificar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula: clienteData.cedula })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.existe) {
              // Debug: Verificar datos actualizados
              console.log('🐛 AuthHandler - Actualización periódica:', data.cliente);
              console.log('🐛 AuthHandler - TarjetaLealtad actualizada:', data.cliente?.tarjetaLealtad);
              
              // Actualizar los datos del cliente
              setClienteData(data.cliente);
              
              // Verificar si hubo un cambio de nivel
              const clientLevel = data.cliente.tarjetaLealtad?.nivel || 'Bronce';
              
              // Intentar recuperar el último nivel conocido del localStorage
              const storedLevel = localStorage.getItem(`lastLevel_${data.cliente.cedula}`);
              
              if (storedLevel && clientLevel !== storedLevel && isHigherLevel(clientLevel, storedLevel)) {
                // Hay un ascenso de nivel, mostrar animación
                setOldLevel(storedLevel);
                setNewLevel(clientLevel);
                setShowLevelUpAnimation(true);
              }
              
              // Guardar el nivel actual en localStorage
              localStorage.setItem(`lastLevel_${data.cliente.cedula}`, clientLevel);
            }
          }
        } catch (error) {
          console.error('Error actualizando datos del cliente:', error);
        }
      };
      
      // Actualizar inmediatamente al entrar
      fetchClienteActualizado();
      
      // Actualizar cada 15 segundos
      const updateInterval = setInterval(fetchClienteActualizado, 15000);
      
      return () => clearInterval(updateInterval);
    }
  }, [step, clienteData?.id, clienteData?.cedula]);

  // Mostrar loading inicial mientras se carga el branding
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {step === 'presentation' && !clienteData && (
        <div className="min-h-screen bg-black text-white">
          {/* Header */}
          <header className="flex items-center justify-between p-4 relative z-10">
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold text-lg">{brandingConfig.businessName}</span>
            </div>
            
            {/* Botón de notificaciones */}
            <button
              onClick={() => browserNotifications.requestPermission()}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition-colors"
              title="Activar notificaciones push"
            >
              <Bell className="w-5 h-5" />
            </button>
          </header>
          {/* Hero Section */}
          <div className="relative min-h-[400px] overflow-visible pb-20 pt-8">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={getBackgroundStyle()}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 pt-16">
              <motion.h1 
                className="text-3xl md:text-4xl font-bold text-white mb-8 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Descubre Nuestro Menú
              </motion.h1>
              {/* Carrusel de imágenes */}
              <motion.div 
                className="mb-12 w-full max-w-sm mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="relative h-[200px] overflow-hidden">
                  <div className="flex items-center justify-center h-full relative z-0">
                    {/* Contenedor de las imágenes con desplazamiento */}
                    <div className="relative w-64 h-32 flex items-center justify-center">
                      {/* Track de imágenes que se desplaza */}
                      <div 
                        className="flex items-center absolute transition-transform duration-1500 ease-out"
                        style={{
                          transform: `translateX(${-currentImageIndex * 120}px)`,
                          left: '50%',
                          marginLeft: '-60px' // Centrar el track
                        }}
                      >
                        {carouselImages.map((imageUrl: string, index: number) => {
                          const isCurrent = index === currentImageIndex;
                          const isAdjacent = Math.abs(index - currentImageIndex) === 1;
                          
                          let opacity = 0;
                          if (isCurrent) opacity = 1;
                          else if (isAdjacent) opacity = 0.6;
                          
                          return (
                            <div
                              key={`carousel-img-${index}-${imageUrl.split('?')[0].split('/').pop()}`}
                              className="flex-shrink-0 mx-4 transition-all duration-1500 ease-out"
                              style={{
                                transform: isCurrent ? 'scale(1)' : 'scale(0.75)',
                                opacity: opacity,
                                zIndex: isCurrent ? 5 : 1
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt={`Imagen ${index + 1}`}
                                className={`object-cover rounded-lg ${
                                  isCurrent 
                                    ? 'w-32 h-32' 
                                    : 'w-20 h-20'
                                }`}
                                style={isCurrent ? { 
                                  boxShadow: `0 8px 20px ${brandingConfig.primaryColor}33`
                                } : {}}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Indicadores de puntos */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {carouselImages.map((imageUrl: string, index: number) => (
                      <div
                        key={`carousel-dot-${index}-${imageUrl.split('?')[0].split('/').pop()}`}
                        className={`w-2 h-2 rounded-full transition-all duration-700 ease-in-out ${
                          index === currentImageIndex
                            ? 'opacity-100 scale-125'
                            : 'bg-white opacity-40 scale-100'
                        }`}
                        style={{
                          backgroundColor: index === currentImageIndex ? brandingConfig.primaryColor : undefined
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
              {/* botón centrado debajo del carrusel */}
              <div className="flex justify-center mt-8">
                <motion.button 
                  onClick={() => setStep('cedula')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-lg"
                  style={{ 
                    backgroundColor: brandingConfig.primaryColor,
                    boxShadow: `0 4px 15px 0 ${brandingConfig.primaryColor}33`
                  }}
                  whileHover={{ 
                    filter: 'brightness(1.1)',
                    scale: 1.02 
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1 }}
                >
                  <IdCard className="w-5 h-5" />
                  <span>Acceder con Cédula</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {step === 'cedula' && (
        <CedulaForm
          setStep={setStep}
          cedula={cedula}
          setCedula={setCedula}
          setClienteData={setClienteData}
        />
      )}
      
      {step === 'register' && (
        <RegisterForm
          setStep={setStep}
          cedula={cedula}
          formData={formData}
          setFormData={setFormData}
          setClienteData={setClienteData}
        />
      )}
      
      {step === 'dashboard' && (
        <>
          <Dashboard
            clienteData={clienteData}
            cedula={cedula}
            showLevelUpAnimation={showLevelUpAnimation}
            setShowLevelUpAnimation={setShowLevelUpAnimation}
            oldLevel={oldLevel}
            newLevel={newLevel}
            onMenuOpen={() => setIsMenuDrawerOpen(true)}
            brandingConfig={brandingConfig}
            handleLogout={handleLogout}
            showTarjeta={showTarjeta}
            setShowTarjeta={setShowTarjeta}
            portalConfig={portalConfig}
          />
          
          <MenuDrawer
            isMenuDrawerOpen={isMenuDrawerOpen}
            setIsMenuDrawerOpen={setIsMenuDrawerOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeMenuSection={activeMenuSection}
            setActiveMenuSection={setActiveMenuSection}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filteredProducts={filteredProducts}
            setFilteredProducts={setFilteredProducts}
            menuCategories={menuCategories}
            setMenuCategories={setMenuCategories}
            menuProducts={menuProducts}
            allCategories={allCategories}
            isLoadingMenu={isLoadingMenu}
            loadCategoryProducts={loadCategoryProducts}
          />
        </>
      )}
    </div>
  );
}
