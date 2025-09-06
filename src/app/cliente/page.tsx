'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from '../../components/motion';
import { 
  Bell,
  User,
  UtensilsCrossed, 
  Coffee, 
  IdCard, 
  UserPlus, 
  ArrowRight,
  Eye,
  Gift,
  Search,
  Percent,
  Menu,
  Trophy,
  Smartphone,
  X,
  LogOut
} from 'lucide-react';
import { Cliente, MenuItem, MenuCategory } from '@/types/admin';
import { browserNotifications } from '../../services/browserNotifications';
import { clientSession, levelStorage, mobileStorage } from '@/utils/mobileStorage';
import { logger } from '@/utils/logger';
import { runBrowserDiagnostic } from '@/utils/browserDiagnostic';
import { setupOperaFallback } from '@/utils/operaFallback';
// Definir la interfaz para el evento de instalación PWA
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
}
// Interfaces para el portal del cliente
interface Banner {
  id: string;
  titulo: string;
  descripcion?: string;
  imagen: string;
  imagenUrl?: string; // Añadido campo alternativo para mantener compatibilidad
  activo: boolean;
}
interface Promocion {
  id: string;
  titulo: string;
  descripcion?: string;
  imagen?: string;
  imagenUrl?: string; // Añadido campo alternativo para mantener compatibilidad
  descuento: number;
  activo: boolean;
  dia?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
}
interface Recompensa {
  id: string;
  titulo: string;
  nombre: string; // Añadido campo nombre
  descripcion?: string;
  puntosRequeridos: number;
  imagen?: string;
  imagenUrl?: string; // Añadido campo alternativo para mantener compatibilidad
  activo: boolean;
  stock?: number; // Añadido campo stock
}
interface FavoritoDelDia {
  id: string;
  titulo: string;
  descripcion?: string;
  imagenUrl: string;
  activo: boolean;
}
// Función para comparar niveles de tarjeta
const isHigherLevel = (newLevel: string, oldLevel: string): boolean => {
  const levels = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  return levels.indexOf(newLevel) > levels.indexOf(oldLevel);
};

// Helper para calcular datos de nivel de lealtad
const calculateLoyaltyLevel = (portalConfig: any, clienteData: Cliente | null) => {
  const nivelesOrdenados = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  const puntosRequeridos = {
    'Bronce': 0,
    'Plata': 100,
    'Oro': 500,
    'Diamante': 1500,
    'Platino': 3000
  };
  
  // Actualizar con configuración del admin si existe
  portalConfig.tarjetas?.forEach((tarjeta: any) => {
    if (tarjeta.condiciones?.puntosMinimos) {
      puntosRequeridos[tarjeta.nivel as keyof typeof puntosRequeridos] = tarjeta.condiciones.puntosMinimos;
    }
  });
  
  const maxPuntos = Math.max(...Object.values(puntosRequeridos));
  const puntosActuales = clienteData?.puntos || 100;
  
  return {
    nivelesOrdenados,
    puntosRequeridos,
    maxPuntos,
    puntosActuales
  };
};

// Nota: Las animaciones de confeti se han eliminado ya que no se utilizan actualmente
export default function ClientePortalPage() {
  const [step, setStep] = useState<'initial' | 'cedula' | 'register' | 'dashboard'>('initial');
  const [cedula, setCedula] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [clienteData, setClienteData] = useState<Cliente | null>(null);
  
  // Estado de carga inicial
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Estado para mostrar u ocultar la tarjeta
  const [showTarjeta, setShowTarjeta] = useState(false);
  
  // Estados para animaciones de ascenso de nivel
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [oldLevel, setOldLevel] = useState<string | null>(null);
  const [newLevel, setNewLevel] = useState<string | null>(null);
  
  // Estado para la opción de agregar al escritorio
  const [showAddToHomeScreen, setShowAddToHomeScreen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Verificar sesión guardada al cargar la página
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
              setClienteData(data.cliente);
              setCedula(savedCedula);
              setStep('dashboard');
            } else {
              // Cliente no existe, limpiar sesión
              logger.warn('⚠️ Cliente no existe, limpiando sesión');
              clientSession.clear();
            }
          } else {
            // Sesión expirada, limpiar
            logger.log('⏰ Sesión expirada, limpiando');
            clientSession.clear();
          }
        } else {
          logger.log('ℹ️ No hay sesión guardada');
        }
      } catch (error) {
        logger.error('❌ Error verificando sesión guardada:', error);
        // En caso de error, limpiar cualquier sesión corrupta
        clientSession.clear();
      } finally {
        setIsInitialLoading(false);
      }
    };

    checkSavedSession();
  }, []);

  // Función para cerrar sesión
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
      nombre: '',
      telefono: '',
      correo: ''
    });
    setError('');
    setStep('initial');
    
    logger.log('✅ Sesión cerrada exitosamente');
  };
  
  // Estados del Menú drawer
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState<'categories' | 'products'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]); // Todas las categorías incluyendo subcategorías
  const [menuProducts, setMenuProducts] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Estados para gestos del menú
  const [isDragging, setIsDragging] = useState(false);
  
  // Efecto para bloquear el scroll cuando se muestra la tarjeta
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

  // Efecto para bloquear el scroll cuando se muestra el menú
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
  
  // Escuchar el evento beforeinstallprompt para PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevenir que Chrome muestre el diálogo automáticamente
      e.preventDefault();
      // Guardar el evento para usarlo más tarde
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);
  
  // Función para instalar la aplicación y mostrarla en la pantalla de inicio
  const installApp = () => {
    try {
      // Mostrar el diálogo de instalación si está disponible mediante PWA
      if (deferredPrompt) {
        deferredPrompt.prompt();
        
        // Usar then para manejar la promesa de userChoice
        deferredPrompt.userChoice
          .then((choiceResult: {outcome: string}) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('El usuario aceptó instalar la app');
              logger.log('✅ PWA instalada exitosamente');
              // Limpiar el prompt guardado después de usarlo
              setDeferredPrompt(null);
            } else {
              console.log('El usuario rechazó instalar la app');
              logger.log('❌ Instalación PWA cancelada');
            }
            // Limpiar el prompt guardado
            setDeferredPrompt(null);
          })
          .catch((error: Error) => {
            console.error('Error al instalar la app:', error);
            setError('No se pudo instalar la app. Intenta nuevamente más tarde.');
            setTimeout(() => setError(''), 3000);
          });
      } else {
        attemptManualInstall();
      }
    } catch (error) {
      console.error('Error al instalar la app:', error);
      setError('Hubo un problema al instalar la app. Intenta más tarde.');
      setTimeout(() => setError(''), 3000);
    }
  };
  // Función para intentar instalación manual con las APIs nativas del navegador
  const attemptManualInstall = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    try {
      // Para Safari en iOS
      if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
        // Usar Web Share API si está disponible
        if (navigator.share) {
          navigator.share({
            title: 'Lealta 2.0',
            text: 'Agregar Lealta 2.0 a tu pantalla de inicio',
            url: window.location.href
          })
          .then(() => {
            logger.log('✅ Contenido compartido exitosamente');
          })
          .catch((error: Error) => {
            console.error('Error al compartir:', error);
            showInstallInstructions();
          });
        } else {
          showInstallInstructions();
        }
      } else {
        showInstallInstructions();
      }
    } catch (error) {
      console.error('Error en instalación manual:', error);
      showInstallInstructions();
    }
  };
  // Función para mostrar instrucciones según el dispositivo
  const showInstallInstructions = () => {
    let message = '';
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      message = 'En Safari, toca el botón "Compartir" y luego "Añadir a pantalla de inicio"';
    } else if (userAgent.includes('android') && userAgent.includes('chrome')) {
      message = 'Toca el botón de Menú (tres puntos) y selecciona "Añadir a pantalla de inicio" o "Instalar aplicación"';
    } else if (userAgent.includes('opera')) {
      message = 'Toca el botón + en la barra de dirección para agregar esta app a tu pantalla de inicio';
    } else {
      message = 'Toca el botón de opciones de tu navegador y selecciona "Añadir a pantalla de inicio" o "Instalar aplicación"';
    }
    
    // Mostrar las instrucciones en un mensaje
    setError(message);
    setTimeout(() => setError(''), 6000);
  };
  
  // Estados del branding (se pueden cargar desde el admin o localStorage)
  const [brandingConfig, setBrandingConfig] = useState(() => {
    // Intentar cargar desde localStorage primero para evitar el flash
    if (typeof window !== 'undefined') {
      try {
        const savedBranding = localStorage.getItem('portalBranding');
        if (savedBranding) {
          const parsed = JSON.parse(savedBranding);
          return {
            businessName: parsed.businessName || 'LEALTA',
            primaryColor: parsed.primaryColor || '#2563EB',
            carouselImages: [] as string[] // Las imágenes se cargarán después desde la API
          };
        }
      } catch (error) {
        console.warn('Error al cargar branding inicial desde localStorage:', error);
      }
    }
    // Fallback por defecto
    return {
      businessName: 'LEALTA',
      primaryColor: '#2563EB',
      carouselImages: [] as string[]
    };
  });
  
  // Estados del buscador
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  // Estado para configuración del portal (tarjetas y empresa)
  const [portalConfig, setPortalConfig] = useState<any>({
    nombreEmpresa: 'LEALTA 2.0',
    tarjetas: []
  });
  
  // Estados del carrusel de imágenes
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Imágenes del carrusel (obtenidas desde branding config, con fallback a imágenes por defecto)
  const carouselImages = brandingConfig.carouselImages?.length > 0 
    ? brandingConfig.carouselImages 
    : [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=250&fit=crop',
        'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=250&fit=crop'
      ];
  // Cargar branding desde la API al montar el componente
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await fetch('/api/branding', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const branding = await response.json();
          console.log('Cliente: Branding cargado desde API:', branding.carouselImages?.length || 0, 'imágenes');
          setBrandingConfig(branding);
          // Guardar versión ligera en localStorage como backup
          try {
            const lightConfig = {
              ...branding,
              carouselImages: branding.carouselImages?.length || 0 // Solo guardar la cantidad
            };
            localStorage.setItem('portalBranding', JSON.stringify(lightConfig));
          } catch (storageError) {
            console.warn('No se pudo guardar branding en localStorage del cliente:', storageError);
          }
        } else {
          // Fallback a localStorage
          const savedBranding = localStorage.getItem('portalBranding');
          if (savedBranding) {
            const parsed = JSON.parse(savedBranding);
            setBrandingConfig(parsed);
          }
        }
      } catch (error) {
        // Si la API falla, usar localStorage como fallback
        console.warn('API branding no disponible, usando localStorage como fallback:', error);
        handleLocalStorageFallback();
      } finally {
        // Quitar el estado de loading después de la primera carga
        setIsInitialLoading(false);
      }
    };
    // Función auxiliar para manejar fallback de localStorage
    const handleLocalStorageFallback = () => {
      const savedBranding = localStorage.getItem('portalBranding');
      if (savedBranding) {
        try {
          const parsed = JSON.parse(savedBranding);
          setBrandingConfig(parsed);
        } catch (parseError) {
          // Si también falla el parsing de localStorage, mantener configuración por defecto
          console.warn('Error parsing localStorage branding, usando configuración por defecto:', parseError);
          // La configuración por defecto ya está establecida en el estado inicial
        }
      }
      // Siempre quitar el loading después del fallback
      setIsInitialLoading(false);
    };
    // Cargar al inicio
    loadBranding();
    // Polling cada 1.5 segundos para detectar cambios más rápido, pero solo después de la carga inicial
    let interval: NodeJS.Timeout;
    setTimeout(() => {
      if (!isInitialLoading) {
        interval = setInterval(() => {
          loadBranding();
        }, 1500);
      }
    }, 1000);
    // Escuchar cambios de localStorage (backup)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portalBranding' || e.key === 'brandingTrigger') {
        loadBranding();
      }
    };
    // Escuchar eventos personalizados del admin
    const handleBrandingUpdate = (e: CustomEvent) => {
      console.log('Evento de actualización de branding recibido:', e.detail);
      loadBranding();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    // Timeout de seguridad: quitar loading después de 3 segundos máximo
    const safetyTimeout = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000);
    return () => {
      if (interval) clearInterval(interval);
      clearTimeout(safetyTimeout);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    };
  }, [isInitialLoading]);

  // Cargar configuración del portal (tarjetas y empresa)
  useEffect(() => {
    const loadPortalConfig = async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default');
        if (response.ok) {
          const data = await response.json();
          
          // Extraer la configuración del objeto response
          const config = data.config || data;
          
          setPortalConfig({
            nombreEmpresa: config.nombreEmpresa || 'LEALTA 2.0',
            tarjetas: config.tarjetas || []
          });
        }
      } catch (error) {
        console.error('Error cargando configuración del portal:', error);
      }
    };

    loadPortalConfig();
  }, []);

  // useEffect para el carrusel de imágenes (rotación automática cada 6 segundos para mejor sincronización)
  useEffect(() => {
    const carouselInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % carouselImages.length
      );
    }, 6000); // Cambia cada 6 segundos para dar tiempo a la animación de 1.5s
    return () => clearInterval(carouselInterval);
  }, [carouselImages.length]);
  const handleCedulaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) {
      setError('Por favor ingrese su cédula');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Verificar si el cliente existe
      const response = await fetch('/api/cliente/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedula.trim() })
      });
      const data = await response.json();
      if (response.ok && data.existe) {
        // Cliente existe, redirigir al dashboard
        setClienteData(data.cliente);
        
        // Guardar sesión usando la nueva utilidad
        await clientSession.save(cedula.trim());
        logger.log('💾 Sesión guardada para:', cedula.trim());
        
        // Verificar si hay un cambio de nivel de tarjeta
        const clientLevel = data.cliente.tarjetaLealtad?.nivel || 'Bronce';
        
        // Intentar recuperar el último nivel conocido
        const storedLevel = levelStorage.load(data.cliente.cedula);
        
        if (storedLevel && clientLevel !== storedLevel && isHigherLevel(clientLevel, storedLevel)) {
          // Hay un ascenso de nivel, mostrar animación
          setOldLevel(storedLevel);
          setNewLevel(clientLevel);
          setShowLevelUpAnimation(true);
        }
        
        // Guardar el nivel actual
        await levelStorage.save(data.cliente.cedula, clientLevel);
        
        setStep('dashboard');
      } else {
        // Cliente no existe, mostrar formulario de registro
        setFormData(prev => ({ ...prev })); // Mantener datos existentes
        setStep('register');
      }
    } catch (error) {
      console.error('Error verificando cliente:', error);
      setError('Error de conexión. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.telefono.trim() || !formData.correo.trim()) {
      setError('Por favor complete todos los campos');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/cliente/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: cedula.trim(),
          nombre: formData.nombre.trim(),
          telefono: formData.telefono.trim(),
          correo: formData.correo.trim()
        })
      });
      const data = await response.json();
      if (response.ok) {
        setClienteData(data.cliente);
        
        // Guardar sesión para cliente recién registrado usando la nueva utilidad
        await clientSession.save(cedula.trim());
        logger.log('💾 Sesión guardada para nuevo cliente:', cedula.trim());
        
        setStep('dashboard');
      } else {
        setError(data.error || 'Error al registrar el cliente');
      }
    } catch (error) {
      console.error('Error registrando cliente:', error);
      setError('Error de conexión. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };
  // Función para cargar categorías del Menú
  const loadMenuCategories = async () => {
    setIsLoadingMenu(true);
    try {
      const response = await fetch('/api/admin/menu?businessId=business_1');
      if (response.ok) {
        const data = await response.json();
        const allCats = data.menu || [];
        
        // Guardar todas las categorías para uso interno
        setAllCategories(allCats);
        
        // Mostrar solo categorías principales inicialmente
        const mainCategories = allCats.filter((cat: any) => !cat.parentId);
        setMenuCategories(mainCategories);
      }
    } catch (error) {
      console.error('Error loading menu categories:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  };
  // Función para cargar productos de una categorÃ­a o mostrar subcategorías
  const loadCategoryProducts = async (categoryId: string) => {
    setIsLoadingMenu(true);
    try {
      const category = allCategories.find(c => c.id === categoryId);
      if (category) {
        // Verificar si tiene subcategorías
        const subcategories = allCategories.filter(c => c.parentId === categoryId);
        
        if (subcategories.length > 0) {
          // Si tiene subcategorías, mostrarlas en lugar de productos
          setMenuCategories(subcategories);
          setSelectedCategory(categoryId);
          setActiveMenuSection('categories'); // Mantener en vista de categorías
        } else {
          // Si no tiene subcategorías, mostrar productos directamente
          setMenuProducts(category.productos || []);
          setSelectedCategory(categoryId);
          setActiveMenuSection('products');
        }
      }
    } catch (error) {
      console.error('Error loading category content:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  };
  // Función helper para renderizar la vista del Menú
  const renderMenuView = () => {
    if (searchQuery && searchQuery.length >= 2) {
      return (
        <MenuProductsView 
          products={filteredProducts}
          isLoading={isLoadingMenu}
          searchQuery={searchQuery}
        />
      );
    }
    
    if (activeMenuSection === 'categories') {
      return (
        <MenuCategoriesView 
          categories={menuCategories}
          onCategorySelect={loadCategoryProducts}
          isLoading={isLoadingMenu}
          searchQuery=""
        />
      );
    }
    
    return (
      <MenuProductsView 
        products={menuProducts}
        isLoading={isLoadingMenu}
        searchQuery=""
      />
    );
  };
  // Función para manejar navegaciÃ³n hacia atrÃ¡s
  const handleBackNavigation = async () => {
    // Limpiar bÃºsqueda primero si está activa
    if (searchQuery) {
      setSearchQuery('');
      setFilteredProducts(menuProducts);
      return;
    }
    
    if (activeMenuSection === 'products') {
      // Si estamos en productos, volver a categorías (subcategorías o principales)
      setActiveMenuSection('categories');
      setSelectedCategory(null);
      
      // Recargar categorías principales
      const mainCategories = allCategories.filter((cat: any) => !cat.parentId);
      setMenuCategories(mainCategories);
    } else if (selectedCategory) {
      // Si estamos en subcategorías, volver a categorías principales
      const mainCategories = allCategories.filter((cat: any) => !cat.parentId);
      setMenuCategories(mainCategories);
      setSelectedCategory(null);
    } else {
      // Cerrar el drawer
      setIsMenuDrawerOpen(false);
    }
  };
  // Función de búsqueda global - busca en todos los productos independientemente de la vista
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim() || query.trim().length < 2) {
      // Si no hay búsqueda o es muy corta, limpiar filtros
      setFilteredProducts(menuProducts);
      return;
    }
    const searchLower = query.toLowerCase().trim();
    
    // Búsqueda global en TODOS los productos, no solo los de la categoría actual
    // Obtener todos los productos de todas las categorías
    const allProducts: any[] = [];
    
    // Recopilar productos de todas las categorías
    allCategories.forEach((category: any) => {
      if (category.productos && Array.isArray(category.productos)) {
        allProducts.push(...category.productos);
      }
    });
    
    // Búsqueda mejorada en todos los productos
    const filtered = allProducts.filter((product: any) => {
      const nombre = product.nombre?.toLowerCase() || '';
      const descripcion = product.descripcion?.toLowerCase() || '';
      
      // Buscar palabras completas o al inicio de palabras
      const words = searchLower.split(' ').filter(word => word.length > 1);
      
      return words.some(word => 
        nombre.includes(word) || 
        descripcion.includes(word) ||
        nombre.startsWith(word) ||
        descripcion.startsWith(word)
      );
    });
    
    setFilteredProducts(filtered);
  }, [menuProducts, allCategories]);
  // Effect para actualizar filtros cuando cambian los datos
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      handleSearch(searchQuery);
    } else {
      setFilteredProducts(menuProducts);
    }
  }, [menuCategories, menuProducts, allCategories, handleSearch, searchQuery]);
  // Hook para cargar datos cuando se entra al dashboard
  useEffect(() => {
    if (step === 'dashboard') {
      loadMenuCategories();
    }
  }, [step]);
  // ActualizaciÃ³n periÃ³dica de datos del cliente para mantener la tarjeta actualizada
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
              // Actualizar los datos del cliente
              setClienteData(data.cliente);
              
              // Verificar si hubo un cambio de nivel
              const clientLevel = data.cliente.tarjetaLealtad?.nivel || 'Bronce';
              
              // Intentar recuperar el Ãºltimo nivel conocido del localStorage
              const storedLevel = localStorage.getItem(`lastLevel_${data.cliente.cedula}`);
              
              if (storedLevel && clientLevel !== storedLevel && isHigherLevel(clientLevel, storedLevel)) {
                // Hay un ascenso de nivel, mostrar animaciÃ³n
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
  // Función para mostrar el drawer del Menú
  const renderMenuDrawer = () => (
    <AnimatePresence>
      {isMenuDrawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <motion.div
            className="fixed top-0 left-0 right-0 bg-black text-white z-50 rounded-b-3xl flex flex-col"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ height: '85vh' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, info) => {
              setIsDragging(false);
              // Cerrar si se arrastra hacia arriba más de 80px o con velocidad suficiente
              if (info.offset.y < -80 || info.velocity.y < -500) {
                setIsMenuDrawerOpen(false);
              }
            }}
            onTouchStart={(e) => {
              // Guardar la posición inicial del toque
              const touch = e.touches[0];
              const startY = touch.clientY;
              const timestamp = Date.now();
              e.currentTarget.setAttribute('data-start-y', startY.toString());
              e.currentTarget.setAttribute('data-start-time', timestamp.toString());
            }}
            onTouchMove={(e) => {
              // Prevenir scroll del body mientras se arrastra
              if (isDragging) {
                e.preventDefault();
              }
            }}
            onTouchEnd={(e) => {
              // Calcular la distancia y velocidad del deslizamiento
              const startY = parseFloat(e.currentTarget.getAttribute('data-start-y') || '0');
              const startTime = parseFloat(e.currentTarget.getAttribute('data-start-time') || '0');
              const endY = e.changedTouches[0].clientY;
              const endTime = Date.now();
              
              const deltaY = startY - endY;
              const deltaTime = endTime - startTime;
              const velocity = deltaY / deltaTime; // px/ms
              
              // Si se deslizó hacia arriba más de 100px o con velocidad rápida, cerrar el menú
              if (deltaY > 100 || velocity > 0.5) {
                setIsMenuDrawerOpen(false);
              }
            }}
          >
            {/* Handle */}

            {/* Header del Drawer */}
            <div className="p-3 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleBackNavigation}
                    className="p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-300 rotate-180" />
                  </button>
                  <h1 className="text-lg font-bold">
                    {(() => {
                      if (activeMenuSection === 'products') return 'Productos';
                      if (selectedCategory) return 'categorías';
                      return 'Nuestro Menú';
                    })()}
                  </h1>
                </div>
                <button 
                  onClick={() => setIsMenuDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-gray-300 rotate-45" />
                </button>
              </div>
              
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-400 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <ArrowRight className="w-3 h-3 rotate-45" />
                  </button>
                )}
              </div>
            </div>
            {/* Contenido del Menú */}
            <div className="flex-1 overflow-y-auto p-3">
              {renderMenuView()}
            </div>
            
            {/* Indicador visual para gestos - Posicionado en la parte inferior */}
            <div className="flex flex-col items-center py-3 pt-2 cursor-pointer flex-shrink-0 border-t border-gray-700/50">
              <motion.div 
                className="w-12 h-1.5 bg-gray-500 rounded-full"
                initial={{ opacity: 0.6 }}
                animate={{ 
                  opacity: isDragging ? 1 : [0.6, 1, 0.6],
                  scaleX: isDragging ? 1.2 : [1, 1.1, 1],
                  backgroundColor: isDragging ? '#10b981' : '#6b7280'
                }}
                transition={{ 
                  duration: isDragging ? 0.2 : 2,
                  repeat: isDragging ? 0 : Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.p 
                className="text-xs mt-1"
                animate={{ 
                  color: isDragging ? '#10b981' : '#6b7280',
                  scale: isDragging ? 1.05 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                {isDragging ? 'Suelta para cerrar' : 'Desliza hacia arriba para cerrar'}
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
  const renderInitialView = () => (
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
          style={{
            backgroundImage: createFoodPatternBackground()
          }}
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
          {/* Carrusel de imÃ¡genes */}
          <motion.div 
            className="mb-12 w-full max-w-sm mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="relative h-[200px] overflow-hidden">
              <div className="flex items-center justify-center h-full relative z-0">
                {/* Contenedor de las imÃ¡genes con desplazamiento */}
                <div className="relative w-64 h-32 flex items-center justify-center">
                  {/* Track de imÃ¡genes que se desplaza */}
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
  );
  const renderCedulaForm = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-white font-bold text-xl">{brandingConfig.businessName}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
          <p className="text-gray-400">Ingrese su cédula para continuar</p>
        </div>
        <form onSubmit={handleCedulaSubmit} className="space-y-6">
          <div>
            <label htmlFor="cedula" className="block text-sm font-medium text-gray-300 mb-2">
              Número de Cédula
            </label>
            <input
              id="cedula"
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors"
              style={{
                '--focus-color': brandingConfig.primaryColor,
              } as React.CSSProperties}
              onFocus={(e) => {
                e.target.style.borderColor = brandingConfig.primaryColor;
                e.target.style.boxShadow = `0 0 0 3px ${brandingConfig.primaryColor}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#374151';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Ej: 12345678"
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            style={{ 
              backgroundColor: isLoading ? '#4B5563' : brandingConfig.primaryColor,
              boxShadow: isLoading ? 'none' : `0 4px 14px 0 ${brandingConfig.primaryColor}33`
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStep('initial')}
            className="w-full text-gray-400 hover:text-white transition-colors"
          >
            ← Volver
          </button>
        </form>
      </motion.div>
    </div>
  );
  const renderRegisterForm = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-white font-bold text-xl">{brandingConfig.businessName}</span>
          </div>
          <UserPlus className="w-8 h-8 mx-auto mb-3" style={{ color: brandingConfig.primaryColor }} />
          <h2 className="text-2xl font-bold text-white mb-2">Registro</h2>
          <p className="text-gray-400">Complete sus datos para crear su cuenta</p>
        </div>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-cedula" className="block text-sm font-medium text-gray-300 mb-2">
              Cédula
            </label>
            <input
              id="reg-cedula"
              type="text"
              value={cedula}
              disabled
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-400"
            />
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre Completo
            </label>
            <input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ej: Juan Pérez"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ej: +1 234 567 8900"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-300 mb-2">
              Correo Electrónico
            </label>
            <input
              id="correo"
              type="email"
              value={formData.correo}
              onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ej: juan@correo.com"
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            style={{ 
              backgroundColor: isLoading ? '#4B5563' : brandingConfig.primaryColor,
              boxShadow: isLoading ? 'none' : `0 4px 14px 0 ${brandingConfig.primaryColor}33`
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Crear Cuenta</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStep('cedula')}
            className="w-full text-gray-400 hover:text-white transition-colors"
          >
            ← Volver
          </button>
        </form>
      </motion.div>
    </div>
  );
  const renderDashboard = () => (
    <div className="min-h-screen bg-black text-white">
      {/* Header fijo */}
      <div className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl">
              Hola, <span className="text-pink-500 font-semibold">{clienteData?.nombre || 'Cliente'}</span>
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors">
              <Bell className="w-5 h-5 text-gray-300" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full bg-red-600/20 hover:bg-red-600/40 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 text-red-400" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {(clienteData?.nombre || 'C')[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Contenido principal con padding superior */}
      <div className="pt-16">
        {/* Balance Card */}
        <div className="mx-4 mb-6 mt-4">
          <motion.div
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
              <Coffee className="w-full h-full text-white/30" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/80 text-lg mb-2">Balance de Puntos</div>
                <div className="text-4xl font-bold text-white mb-1">
                  {clienteData?.puntos || 100}
                </div>
                <div className="text-white/60 text-sm mb-2">
                  Tarjeta ****{(clienteData?.cedula || cedula).slice(-4)}
                </div>
              </div>
              <button 
                onClick={() => setShowTarjeta(!showTarjeta)} 
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
                aria-label="Ver tarjeta de fidelidad"
              >
                <Eye className="w-6 h-6 text-white" />
              </button>
            </div>
          </motion.div>
        </div>
        {/* Banners Section - Editable desde Admin */}
        <BannersSection />
        {/* Promociones Section - Editable desde Admin */}
        <PromocionesSection />
        {/* Favorito del día Section - Editable desde Admin */}
        <FavoritoDelDiaSection />
        {/* Recompensas - Editable desde Admin */}
        <RecompensasSection />
      </div>
      {/* Modal de tarjeta de fidelidad */}
      <AnimatePresence>
        {showTarjeta && (
          <>
            {/* Overlay de fondo */}
            <motion.div 
              className="fixed inset-0 bg-black/70 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTarjeta(false)}
            />
            
            {/* Modal contenido */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="bg-dark-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
                {/* Vista de la tarjeta */}
                <div className="p-4">
                  {(() => {
                    // Obtener el nivel directamente desde la API si está disponible
                    // o calcular basado en puntos como fallback
                    const puntos = clienteData?.puntos || 100;
                    let nivel = clienteData?.tarjetaLealtad?.nivel || "Bronce";
                    
                    // Si no hay tarjeta asignada, calcular nivel sugerido basado en puntos (solo visualizaciÃ³n)
                    if (!clienteData?.tarjetaLealtad) {
                      if (puntos >= 3000) nivel = "Platino";
                      else if (puntos >= 1500) nivel = "Diamante";
                      else if (puntos >= 500) nivel = "Oro";
                      else if (puntos >= 100) nivel = "Plata";
                    }
                    
                    // Obtener configuración de tarjetas desde el portal config
                    const tarjetaConfig = portalConfig.tarjetas?.find((t: any) => t.nivel === nivel);
                    
                    // ConfiguraciÃ³n segÃºn nivel (usar configuración del admin o fallback)
                    const nivelesConfig: {[key: string]: any} = {
                      'Bronce': { 
                        colores: { gradiente: ['#CD7F32', '#8B4513'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente Inicial',
                        beneficio: tarjetaConfig?.beneficio || 'AcumulaciÃ³n de puntos bÃ¡sica' 
                      },
                      'Plata': { 
                        colores: { gradiente: ['#C0C0C0', '#808080'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente Frecuente',
                        beneficio: tarjetaConfig?.beneficio || '5% descuento en compras' 
                      },
                      'Oro': { 
                        colores: { gradiente: ['#FFD700', '#FFA500'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente VIP',
                        beneficio: tarjetaConfig?.beneficio || '10% descuento + producto gratis mensual' 
                      },
                      'Diamante': { 
                        colores: { gradiente: ['#B9F2FF', '#00CED1'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente Elite',
                        beneficio: tarjetaConfig?.beneficio || '15% descuento + acceso a eventos exclusivos' 
                      },
                      'Platino': { 
                        colores: { gradiente: ['#E5E4E2', '#C0C0C0'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente Exclusivo',
                        beneficio: tarjetaConfig?.beneficio || '20% descuento + servicio VIP personalizado' 
                      }
                    };
                    
                    // ConfiguraciÃ³n actual
                    const tarjeta = {
                      nivel: nivel,
                      nombrePersonalizado: tarjetaConfig?.nombrePersonalizado || `Tarjeta ${nivel}`,
                      textoCalidad: tarjetaConfig?.textoCalidad || nivelesConfig[nivel].textoDefault,
                      colores: nivelesConfig[nivel].colores,
                      beneficios: tarjetaConfig?.beneficio || nivelesConfig[nivel].beneficio
                    };
                    
                    // Función para obtener colores del nivel
                    const getLevelColors = (level: string) => {
                      const colorMap: { [key: string]: string } = {
                        'Bronce': '#8B4513',
                        'Plata': '#808080',
                        'Oro': '#B8860B',
                        'Diamante': '#4169E1',
                        'Platino': '#C0C0C0'
                      };
                      return colorMap[level] || '#71797E';
                    };
                    
                    return (
                      <div className="space-y-4">
                        {/* Vista previa de la tarjeta */}
                        <div className="flex justify-center">
                          <div className="relative w-80 h-48">
                            <div 
                              className="absolute inset-0 rounded-xl shadow-2xl transform transition-all duration-300 border-2"
                              style={{
                                background: `linear-gradient(135deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                                borderColor: getLevelColors(nivel)
                              }}
                            >
                              {/* Efectos especÃ­ficos por nivel */}
                              {nivel === 'Bronce' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-amber-200 via-transparent to-amber-800" />
                                  <div className="absolute top-6 right-8 w-3 h-3 bg-amber-600 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0s' }} />
                                  <div className="absolute top-12 right-12 w-2 h-2 bg-amber-500 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '0.5s' }} />
                                  <div className="absolute bottom-8 left-8 w-2.5 h-2.5 bg-amber-700 rounded-full opacity-45 animate-bounce" style={{ animationDelay: '1s' }} />
                                  <div className="absolute bottom-12 right-6 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-35 animate-bounce" style={{ animationDelay: '1.5s' }} />
                                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30 animate-pulse" />
                                </>
                              )}
                              
                              {nivel === 'Plata' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-15 bg-gradient-to-r from-gray-200 via-white to-gray-200" />
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
                                  <div className="absolute top-4 left-4 w-20 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50 animate-pulse" style={{ animationDelay: '0s' }} />
                                  <div className="absolute top-8 left-8 w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-40 animate-pulse" style={{ animationDelay: '0.7s' }} />
                                  <div className="absolute top-12 left-12 w-12 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60 animate-pulse" style={{ animationDelay: '1.4s' }} />
                                  <div className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-white via-transparent to-gray-300 rounded-full opacity-10 animate-spin" style={{ animationDuration: '8s' }} />
                                </>
                              )}
                              
                              {nivel === 'Oro' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-yellow-200 via-transparent to-yellow-600" />
                                  <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-10" />
                                  <div className="absolute bottom-4 left-4 w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-15" />
                                  <div className="absolute top-8 right-16 w-2 h-2 bg-yellow-300 rounded-full opacity-70 animate-ping" style={{ animationDelay: '0s' }} />
                                  <div className="absolute top-16 right-20 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-60 animate-ping" style={{ animationDelay: '0.8s' }} />
                                  <div className="absolute bottom-16 left-16 w-2.5 h-2.5 bg-yellow-200 rounded-full opacity-50 animate-ping" style={{ animationDelay: '1.6s' }} />
                                  <div className="absolute bottom-20 left-20 w-1 h-1 bg-yellow-500 rounded-full opacity-80 animate-ping" style={{ animationDelay: '2.4s' }} />
                                  <div className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-20 rotate-45 animate-pulse" />
                                  <div className="absolute top-1/2 left-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30 -rotate-45 animate-pulse" style={{ animationDelay: '1s' }} />
                                </>
                              )}
                              
                              {nivel === 'Diamante' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-blue-200 via-transparent to-cyan-400" />
                                  <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse" />
                                  <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse delay-300" />
                                  <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-pulse delay-700" />
                                  <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-cyan-200 rounded-full opacity-40 animate-pulse delay-1000" />
                                  <div className="absolute top-6 left-8 w-1.5 h-1.5 bg-blue-200 rounded-full opacity-55 animate-pulse delay-500" />
                                  <div className="absolute bottom-8 right-12 w-2 h-2 bg-cyan-300 rounded-full opacity-45 animate-pulse delay-1200" />
                                  <div className="absolute top-4 left-4 w-16 h-16 border border-cyan-200 opacity-20 rotate-45 animate-spin" style={{ animationDuration: '12s' }} />
                                  <div className="absolute bottom-4 right-4 w-12 h-12 border border-blue-200 opacity-15 -rotate-12 animate-spin" style={{ animationDuration: '15s' }} />
                                </>
                              )}
                              
                              {nivel === 'Platino' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-25 bg-gradient-to-br from-gray-100 via-white to-gray-300" />
                                  <div className="absolute top-0 left-0 w-full h-full border-2 border-white rounded-xl opacity-10" />
                                  <div className="absolute top-2 left-2 w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-5" />
                                  <div className="absolute top-6 right-10 w-3 h-3 bg-gradient-to-br from-white to-gray-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0s' }} />
                                  <div className="absolute top-12 right-6 w-2 h-2 bg-gradient-to-br from-gray-100 to-gray-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />
                                  <div className="absolute bottom-10 left-10 w-2.5 h-2.5 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
                                  <div className="absolute bottom-6 left-16 w-1.5 h-1.5 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                  <div className="absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-25 animate-pulse" style={{ animationDelay: '1.5s' }} />
                                  <div className="absolute bottom-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" style={{ animationDelay: '2.5s' }} />
                                  <div className="absolute top-1/2 left-1/2 w-40 h-40 border border-gray-200 rounded-full opacity-5 animate-spin" style={{ animationDuration: '20s' }} />
                                </>
                              )}
                              
                              <div className="relative p-6 h-full flex flex-col justify-between text-white">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="text-xl font-bold drop-shadow-lg text-white"
                                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                                      {tarjeta.nombrePersonalizado}
                                    </h3>
                                  </div>
                                </div>
                                
                                {/* Chip con mejor contraste */}
                                <div className="absolute top-16 left-6">
                                  <div 
                                    className="w-8 h-6 rounded-sm border"
                                    style={{
                                      background: `linear-gradient(135deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`,
                                      borderColor: 'rgba(255,255,255,0.3)',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                  />
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-lg font-bold tracking-widest mb-2 text-white"
                                      style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}>
                                    {nivel.toUpperCase()}
                                  </div>
                                  <p className="text-sm font-medium text-white"
                                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                                    {tarjeta.textoCalidad}
                                  </p>
                                </div>
                                
                                <div className="flex justify-between items-end text-xs font-semibold text-white"
                                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  <span>{portalConfig.nombreEmpresa || 'LEALTA 2.0'}</span>
                                  <span>****{(clienteData?.cedula || cedula).slice(-4)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Componente visual de nivel de tarjeta */}
                        <div className="bg-dark-900/70 rounded-xl p-4 mt-2">
                          <h3 className="text-white font-semibold mb-3">Nivel de Lealtad</h3>
                          <div className="relative pt-1">
                            <LoyaltyLevelDisplay 
                              portalConfig={portalConfig}
                              clienteData={clienteData}
                              tarjeta={tarjeta}
                              nivel={nivel}
                            />
                          </div>
                          
                          {/* Beneficios */}
                          <div className="mt-4">
                            <h4 className="text-white/90 text-sm font-semibold mb-2">Beneficios de tu nivel:</h4>
                            <p className="text-white/80 text-xs">
                              {tarjeta.beneficios}
                            </p>
                          </div>
                        </div>
                        
                        {/* botón cerrar */}
                        <div className="flex justify-center mt-2">
                          <button 
                            onClick={() => setShowTarjeta(false)}
                            className="px-6 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors text-sm"
                          >
                            Cerrar
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* AnimaciÃ³n de ascenso de nivel - VersiÃ³n simplificada */}
      {showLevelUpAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gradient-to-b from-dark-900 to-dark-800 p-8 rounded-2xl max-w-sm w-full text-center relative overflow-hidden">
            
            {/* Confeti simplificado */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => {
                const left = Math.random() * 100;
                const size = Math.random() * 10 + 5;
                const animationDuration = (Math.random() * 3 + 2) + 's';
                const animationDelay = (Math.random() * 1) + 's';
                const color = ['#FFD700', '#FFC0CB', '#00CED1', '#FF6347', '#ADFF2F'][Math.floor(Math.random() * 5)];
                // Crear un identificador Ãºnico basado en mÃºltiples valores aleatorios
                const uniqueKey = `confetti-${left.toFixed(2)}-${size.toFixed(2)}-${i}`;
                
                return (
                  <div
                    key={uniqueKey}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      top: '-20px',
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: color,
                      borderRadius: '50%',
                      animation: `fall ${animationDuration} linear ${animationDelay} forwards`
                    }}
                  />
                );
              })}
            </div>
            
            {/* eslint-disable-next-line react/no-unknown-property */}
            <style jsx>{`
              @keyframes fall {
                0% { transform: translateY(-10px); opacity: 1; }
                80% { opacity: 0.8; }
                100% { transform: translateY(100vh); opacity: 0; }
              }
            `}</style>
            <div className="bg-yellow-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">
              ¡Felicidades!
            </h3>
            
            <div className="text-gray-300 mb-8">
              <p className="mb-2">Has ascendido de nivel</p>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-gray-400">{oldLevel}</span>
                <ArrowRight className="w-5 h-5 text-primary-500" />
                <span className="text-xl font-semibold text-primary-400">{newLevel}</span>
              </div>
            </div>
            <button
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-10 rounded-full transition-all duration-300 text-lg shadow-lg z-[100] relative"
              onClick={() => {
                console.log("botón ¡Continuar! pulsado");
                setShowLevelUpAnimation(false);
                // Mostrar opciones de instalación inmediatamente
                setTimeout(() => {
                  setShowAddToHomeScreen(true);
                  // Intentar instalar la app automáticamente al subir de nivel
                  installApp();
                }, 300);
              }}
            >
              ¡Continuar!
            </button>
          </div>
        </div>
      )}
      {/* Modal para agregar al escritorio */}
      <AnimatePresence>
        {showAddToHomeScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowAddToHomeScreen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-dark-800 p-6 rounded-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Acceso rÃ¡pido</h3>
                <button 
                  onClick={() => setShowAddToHomeScreen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-300 text-sm">
                  Agrega nuestra aplicación a tu pantalla de inicio para un acceso más rÃ¡pido.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    installApp();
                    setShowAddToHomeScreen(false);
                  }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Agregar a pantalla de inicio</span>
                </button>
                
                <button 
                  onClick={() => setShowAddToHomeScreen(false)}
                  className="w-full bg-dark-700 hover:bg-dark-600 text-dark-300 font-medium py-2 px-4 rounded-lg"
                >
                  No mostrar de nuevo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40">
        <div className="flex items-center justify-around py-3">
          <div className="text-center">
            <Coffee className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Inicio</span>
          </div>
          <button 
            onClick={() => {
              setIsMenuDrawerOpen(true);
              if (menuCategories.length === 0) {
                loadMenuCategories();
              }
            }}
            className="text-center relative"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-1">
              <Menu className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-pink-500 font-medium">Menú</span>
          </button>
          <div className="text-center">
            <User className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Perfil</span>
          </div>
        </div>
      </div>
      {/* Spacer for bottom navigation */}
      <div className="h-20"></div>
    </div>
  );
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
  // Render based on current step
  if (step === 'cedula') return renderCedulaForm();
  if (step === 'register') return renderRegisterForm();
  if (step === 'dashboard') return (
    <>
      {renderDashboard()}
      {renderMenuDrawer()}
    </>
  );
  return (
    <>
      {renderInitialView()}
      {renderMenuDrawer()}
    </>
  );
}
// Helper function to create food pattern background
function createFoodPatternBackground(): string {
  const svgContent = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="food" patternUnits="userSpaceOnUse" width="100" height="100">
          <rect width="100" height="100" fill="#1a1a1a"/>
          <circle cx="50" cy="50" r="30" fill="#2d2d2d" opacity="0.8"/>
          <circle cx="50" cy="50" r="20" fill="#3d3d3d" opacity="0.6"/>
          <circle cx="50" cy="50" r="10" fill="#4d4d4d" opacity="0.4"/>
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#food)"/>
    </svg>
  `;
  
  return `url('data:image/svg+xml;base64,${btoa(svgContent)}')`;
}
// Componente para mostrar banners desde el admin
function BannersSection() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);

  // Memoizar cálculo del día actual para evitar recálculos constantes
  const diaActual = useMemo(() => {
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return diasSemana[new Date().getDay()];
  }, []);

  // Debounce para evitar actualizaciones demasiado rápidas
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/portal-config?businessId=default', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Obtener todos los banners activos de forma más eficiente
        const todosActivos = data.config?.banners?.filter((b: any) => 
          b.activo && b.imagenUrl && b.imagenUrl.trim() !== ''
        ) || [];
        
        if (todosActivos.length === 0) {
          setBanners([]);
          return;
        }
        
        // Obtener el día y hora actual de forma más eficiente
        const ahora = new Date();
        const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();
        
        // Filtrar banners del día actual (optimizado)
        const bannersDelDia = todosActivos.filter((b: any) => {
          // Verificar día
          if (b.dia !== diaActual) return false;
          
          // Verificar hora si está configurada
          if (b.horaPublicacion) {
            const [horas, minutos] = b.horaPublicacion.split(':').map(Number);
            const horaPublicacion = horas * 60 + minutos;
            return horaActualMinutos >= horaPublicacion;
          }
          
          return true;
        });
        
        // Actualizar banners inmediatamente
        setBanners(bannersDelDia.length > 0 ? bannersDelDia : todosActivos);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setIsLoading(false);
    }
  }, [diaActual]);

  useEffect(() => {
    console.log('🔌 BannersSection: Iniciando SSE para actualizaciones en tiempo real');
    
    // Verificar estado inicial de permisos de notificación
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission;
      // Solo logeamos el estado sin almacenarlo
      logger.log(`🔔 Permisos de notificación: ${currentPermission}`);
      setShowNotificationPrompt(currentPermission === 'default');
      console.log('🔔 Estado inicial de notificaciones:', currentPermission);
    }
    
    // Carga inicial
    fetchBanners();
    
    // Configurar SSE para actualizaciones instantáneas
    const eventSource = new EventSource('/api/admin/portal-config/stream');
    
    eventSource.onopen = () => {
      console.log('✅ SSE Banners: Conexión establecida para actualizaciones automáticas');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 SSE Banners: Datos recibidos:', data.type);
        
        // Actualizar banners cuando hay cambios de configuración
        if (data.type === 'config-update' || data.type === 'initial-config') {
          // Mostrar notificación push si hay cambios reales (no inicial)
          if (data.type === 'config-update') {
            browserNotifications.notifyBannerUpdate(1);
          }
          
          // Debounce: evitar actualizaciones demasiado rápidas
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
          }
          
          updateTimeoutRef.current = setTimeout(() => {
            fetchBanners();
          }, 100); // Esperar 100ms antes de actualizar
        }
      } catch (error) {
        console.error('❌ SSE Banners: Error procesando mensaje:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.log('⚠️ SSE Banners: Error de conexión, usando fallback:', error);
    };
    
    // Fallback: actualizar solo si SSE falla completamente
    const fallbackInterval = setInterval(() => {
      if (eventSource.readyState !== EventSource.OPEN) {
        fetchBanners();
      }
    }, 300000); // Solo cada 5 minutos como backup (reducir carga)
    
    return () => {
      console.log('🔌 BannersSection: Cerrando conexión SSE');
      eventSource.close();
      clearInterval(fallbackInterval);
      
      // Limpiar debounce timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [fetchBanners]);

  // Función para habilitar notificaciones del navegador
  const enableNotifications = async () => {
    try {
      const granted = await browserNotifications.requestPermission();
      logger.log(`✅ Notificaciones ${granted ? 'habilitadas' : 'denegadas'}`);
      setShowNotificationPrompt(false);
      
      if (granted) {
        console.log('✅ Notificaciones habilitadas correctamente');
      } else {
        console.log('❌ El usuario denegó los permisos de notificación');
      }
    } catch (error) {
      console.error('❌ Error al habilitar notificaciones:', error);
    }
  };

  const dismissNotificationPrompt = () => {
    setShowNotificationPrompt(false);
  };

  if (isLoading || banners.length === 0) return null;
  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Evento del día</h3>
      <div className="space-y-3">
        {/* Prompt para habilitar notificaciones */}
        {showNotificationPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 border border-blue-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-white" />
                <div>
                  <h4 className="font-semibold text-white">¡Recibe Notificaciones!</h4>
                  <p className="text-sm text-white/80">Te avisaremos cuando haya nuevas ofertas</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={enableNotifications}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  Activar
                </button>
                <button
                  onClick={dismissNotificationPrompt}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Banners normales */}
        {banners.slice(0, 1).map((banner: Banner, index: number) => (
          <motion.div
            key={banner.id}
            className="bg-dark-800 rounded-xl overflow-hidden relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <img 
              src={banner.imagenUrl} 
              alt="Evento del día"
              className="w-full h-48 object-cover rounded-xl"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
// Componente para mostrar promociones desde el admin
function PromocionesSection() {
  const [promociones, setPromociones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchPromociones = useCallback(async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default');
        if (response.ok) {
          const data = await response.json();
          
          // Obtener todas las promociones activas
          const todasActivas = data.config?.promociones?.filter((p: any) => p.activo) || [];
          
          // Obtener el día y hora actual SIEMPRE actualizada
          const ahora = new Date();
          const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
          const diaActual = diasSemana[ahora.getDay()];
          const horaActual = ahora.getHours() * 60 + ahora.getMinutes(); // Convertir a minutos desde medianoche
          
          console.log(`🕐 Debug Promociones - Día: ${diaActual}, Hora: ${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')}`);
          console.log(`🔍 Promociones totales encontradas:`, todasActivas);
          console.log(`⏰ Hora actual en minutos:`, horaActual);
          
          // Filtrar promociones del día actual que no hayan terminado
          const promocionesDelDia = todasActivas.filter((p: any) => {
            console.log(`📦 Evaluando promo "${p.titulo}" - Día: ${p.dia}, Hora término: ${p.horaTermino}`);
            
            if (p.dia !== diaActual) {
              console.log(`❌ Promo "${p.titulo}" no es para hoy (${diaActual})`);
              return false;
            }
            
            // Si tiene hora de término, verificar que no haya pasado
            if (p.horaTermino) {
              const [horas, minutos] = p.horaTermino.split(':').map(Number);
              const horaTermino = horas * 60 + minutos;
              
              console.log(`� Promo "${p.titulo}": termina a las ${p.horaTermino} (${horaTermino} min), ahora son ${horaActual} min`);
              
              const resultado = horaActual < horaTermino;
              console.log(`⏰ ¿Promo "${p.titulo}" aún válida?`, resultado);
              return resultado;
            }
            
            console.log(`✅ Promo "${p.titulo}" válida (sin hora límite)`);
            // Promoción válida sin restricción de horario
            return true;
          });
          
          console.log(`✅ Promociones válidas para ${diaActual}:`, promocionesDelDia);
          
          // Si no hay promociones para el día actual, mostrar todas las activas (sin filtro de hora)
          setPromociones(promocionesDelDia.length > 0 ? promocionesDelDia : todasActivas);
        }
      } catch (error) {
        console.error('Error loading promociones:', error);
      } finally {
        setIsLoading(false);
      }
    }, []);
    
    useEffect(() => {
      fetchPromociones();
      
      // Actualizar promociones cada minuto para cambios automáticos de día/hora
      const interval = setInterval(() => {
        console.log('🔄 Actualizando promociones automáticamente...');
        fetchPromociones();
      }, 60000); // Cada 60 segundos
      
      return () => clearInterval(interval);
    }, [fetchPromociones]);

    // También actualizar cuando se enfoque la ventana (si alguien vuelve después de un rato)
    useEffect(() => {
      const handleFocus = () => {
        console.log('👁️ Ventana enfocada - actualizando promociones...');
        fetchPromociones();
      };
      
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }, [fetchPromociones]);
    
  if (isLoading || promociones.length === 0) return null;
  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Promociones Especiales</h3>
      <div className="grid grid-cols-1 gap-3">
        {promociones.map((promo: Promocion, index: number) => (
          <motion.div
            key={promo.id}
            className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Imagen de fondo si existe */}
            {promo.imagenUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${promo.imagenUrl})` }}
              />
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{promo.titulo}</div>
                  <div className="text-white/80 text-sm">{promo.descripcion}</div>
                  <div className="text-white/90 text-sm mt-1 font-bold">
                    {promo.descuento}% de descuento
                  </div>
                  {promo.fechaFin && (
                    <div className="text-white/60 text-xs mt-1">
                      VÃ¡lido hasta: {new Date(promo.fechaFin).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <Percent className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
// Componente para mostrar recompensas
function RecompensasSection() {
  const [recompensas, setRecompensas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchRecompensas = async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default');
        if (response.ok) {
          const data = await response.json();
          // Buscar en ambos campos: recompensas (español) y rewards (inglés)
          const recompensasData = data.config?.recompensas || data.config?.rewards || [];
          setRecompensas(recompensasData.filter((r: any) => r.activo || r.isActive) || []);
        }
      } catch (error) {
        console.error('Error loading recompensas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecompensas();
    
    // Polling para actualización en tiempo real cada 5 segundos
    const interval = setInterval(fetchRecompensas, 5000);
    return () => clearInterval(interval);
  }, []);
  if (isLoading || recompensas.length === 0) return null;
  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recompensas</h3>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Gift className="w-6 h-6 text-white" />
          <div className="text-white font-semibold">Programa de Puntos</div>
        </div>
        {/* Contenedor scrollable horizontal para las recompensas */}
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2" style={{ width: 'max-content' }}>
            {recompensas.map((recompensa: Recompensa, index: number) => (
              <motion.div
                key={recompensa.id}
                className="bg-white/20 rounded-lg p-3 min-w-[200px] max-w-[200px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Imagen de la recompensa si existe */}
                {recompensa.imagenUrl && (
                  <div className="w-full h-20 mb-2 rounded-md overflow-hidden">
                    <img 
                      src={recompensa.imagenUrl} 
                      alt={recompensa.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="text-white font-medium text-sm">{recompensa.nombre}</div>
                  <div className="text-white/80 text-xs mb-2">{recompensa.descripcion}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-white font-bold text-sm">
                      {recompensa.puntosRequeridos} pts
                    </div>
                    {(recompensa.stock && recompensa.stock > 0) && (
                      <div className="text-white/60 text-xs">
                        Stock: {recompensa.stock}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// Componente para el nivel de lealtad visual
function LoyaltyLevelDisplay({ portalConfig, clienteData, tarjeta, nivel }: { 
  readonly portalConfig: any, 
  readonly clienteData: any, 
  readonly tarjeta: any, 
  readonly nivel: string 
}) {
  const levelData = calculateLoyaltyLevel(portalConfig, clienteData);
  const { nivelesOrdenados, puntosRequeridos, maxPuntos, puntosActuales } = levelData;
  
  return (
    <>
      <div className="flex mb-2 items-center justify-between">
        <div>
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white"
            style={{ background: `linear-gradient(90deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})` }}
          >
            {nivel}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold inline-block text-white/80">
            {puntosActuales} / {maxPuntos} pts
          </span>
        </div>
      </div>
      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-dark-700">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ 
            width: `${Math.min((puntosActuales / maxPuntos) * 100, 100)}%` 
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ 
            background: `linear-gradient(90deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`
          }} 
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded"
        />
      </div>
      <div className="grid grid-cols-5 text-xs text-white/60 mb-1">
        {nivelesOrdenados.map(nivelNombre => (
          <div key={nivelNombre} className="text-center">{nivelNombre}</div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-white/60">
        {nivelesOrdenados.map(nivelNombre => (
          <div key={nivelNombre}>{puntosRequeridos[nivelNombre as keyof typeof puntosRequeridos]}</div>
        ))}
      </div>
    </>
  );
}

// Helper function para encontrar favorito por día actual
function findFavoritoForToday(favoritos: any[]): any {
  const hoy = new Date();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const diaActual = diasSemana[hoy.getDay()];
  
  // Buscar favorito para el día actual
  let favoritoHoy = favoritos.find((f: any) => 
    f.dia === diaActual && f.activo && f.imagenUrl && f.imagenUrl.trim() !== ''
  );
  
  // Si no hay favorito para hoy, buscar el primer favorito activo
  if (!favoritoHoy) {
    favoritoHoy = favoritos.find((f: any) => 
      f.activo && f.imagenUrl && f.imagenUrl.trim() !== ''
    );
  }
  
  return favoritoHoy;
}

// Helper function para procesar favorito por formato
function processFavoritoData(favoritos: any): any {
  if (Array.isArray(favoritos)) {
    return findFavoritoForToday(favoritos);
  } else {
    // Compatibilidad con formato anterior
    const favoritoActivo = favoritos;
    return (favoritoActivo?.activo && favoritoActivo?.imagenUrl && favoritoActivo.imagenUrl.trim() !== '') 
      ? favoritoActivo 
      : null;
  }
}

// Sección de Favorito del día
function FavoritoDelDiaSection() {
  const [favorito, setFavorito] = useState<FavoritoDelDia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchFavorito = async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🎯 Cliente - Favoritos recibidos:', data.config?.favoritoDelDia);
          
          const favoritoEncontrado = processFavoritoData(data.config?.favoritoDelDia);
          
          if (favoritoEncontrado) {
            console.log('✅ Cliente - Favorito activo encontrado:', favoritoEncontrado);
            setFavorito(favoritoEncontrado);
          } else {
            setFavorito(null);
          }
        }
      } catch (error) {
        console.error('Error loading favorito:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFavorito();
    
    // Polling para actualización en tiempo real cada 2 segundos
    const interval = setInterval(fetchFavorito, 2000);
    return () => clearInterval(interval);
  }, []);
  if (isLoading || !favorito) return null;
  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Favorito del día</h3>
      <motion.div
        className="bg-dark-800 rounded-xl overflow-hidden relative"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img 
          src={favorito.imagenUrl} 
          alt="Favorito del día"
          className="w-full h-48 object-cover rounded-xl"
        />
      </motion.div>
    </div>
  );
}
// Componente para mostrar categorías del Menú
// Componente para mostrar categorías del Menú
interface MenuCategoriesViewProps {
  readonly categories: ReadonlyArray<MenuCategory>;
  readonly onCategorySelect: (categoryId: string) => void;
  readonly isLoading: boolean;
  readonly searchQuery: string;
}
function MenuCategoriesView({ categories, onCategorySelect, isLoading, searchQuery }: MenuCategoriesViewProps) {
  const skeletonIds = ['cat-1', 'cat-2', 'cat-3', 'cat-4'];
  
  // Renderizar estado de carga
  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'categorías'}
        </h2>
        <div className="animate-pulse space-y-4">
          {skeletonIds.map((id) => (
            <div key={id} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  // Renderizar estado vacÃ­o
  if (categories.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'categorías'}
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            {searchQuery ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
          </div>
          {searchQuery && (
            <div className="text-gray-500 text-sm">
              Intenta con otro tÃ©rmino de bÃºsqueda
            </div>
          )}
        </div>
      </div>
    );
  }
  // Renderizar categorías
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {searchQuery ? `Resultados para "${searchQuery}"` : 'categorías'}
      </h2>
      <div className="space-y-3">
        {categories.map((category: MenuCategory) => (
          <motion.div
            key={category.id}
            className="bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => onCategorySelect(category.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                category.parentId 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">{category.nombre}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
// Componente para mostrar productos de una categorÃ­a
interface MenuProductsViewProps {
  readonly products: ReadonlyArray<MenuItem>;
  readonly isLoading: boolean;
  readonly searchQuery: string;
}
function MenuProductsView({ products, isLoading, searchQuery }: MenuProductsViewProps) {
  const skeletonIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4'];
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  
  // Renderizar estado de carga
  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'Productos'}
        </h2>
        <div className="animate-pulse space-y-4">
          {skeletonIds.map((id) => (
            <div key={id} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  // Renderizar estado vacÃ­o
  if (products.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'Productos'}
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            {searchQuery ? 'No se encontraron productos' : 'No hay productos disponibles'}
          </div>
          {searchQuery && (
            <div className="text-gray-500 text-sm">
              Intenta con otro tÃ©rmino de bÃºsqueda
            </div>
          )}
        </div>
      </div>
    );
  }
  // Renderizar productos
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {searchQuery ? `Resultados para "${searchQuery}"` : 'Productos'}
      </h2>
      <div className="space-y-3">
        {products.map((product: MenuItem) => (
          <motion.div
            key={product.id}
            className="bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-800 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setSelectedProduct(product)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{product.nombre}</div>
                </div>
              </div>
              <div className="flex items-center">
                {(product.tipoProducto === 'bebida' || product.tipoProducto === 'botella') && product.precioVaso && product.precioBotella ? (
                  <div className="text-right">
                    <div className="text-white font-bold text-xs">
                      Vaso: {product.precioVaso.toFixed(2)}
                    </div>
                    <div className="text-white font-bold text-xs">
                      Bot: {product.precioBotella.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div className="text-white font-bold text-sm">
                    {(() => {
                      if (product.precio) return product.precio.toFixed(2);
                      if (product.precioVaso) return product.precioVaso.toFixed(2);
                      return '0.00';
                    })()} USD
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Modal para mostrar imagen y descripciÃ³n del producto */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 z-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
            />
            <motion.div
              className="fixed top-4 left-4 right-4 bottom-4 md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-gray-900 rounded-xl p-6 z-70 max-w-lg md:w-auto overflow-y-auto flex flex-col border border-gray-700"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-white font-semibold text-lg">{selectedProduct.nombre}</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 text-gray-400 rotate-45" />
                </button>
              </div>
              
              {selectedProduct.imagenUrl && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={selectedProduct.imagenUrl}
                    alt={selectedProduct.nombre}
                    className="max-w-full max-h-64 object-contain bg-gray-800 rounded-lg"
                  />
                </div>
              )}
              
              {!selectedProduct.imagenUrl && selectedProduct.descripcion && (
                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-gray-300 text-sm leading-relaxed text-center">
                    {selectedProduct.descripcion}
                  </p>
                </div>
              )}
              
              {selectedProduct.imagenUrl && selectedProduct.descripcion && (
                <div className="text-center">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedProduct.descripcion}
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}





