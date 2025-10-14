'use client';
import { useState, useEffect, useCallback } from 'react';
import { useBranding } from './branding/BrandingProvider';
import { CedulaForm } from './auth/CedulaForm';
import { RegisterForm } from './auth/RegisterForm';
import { Dashboard } from './dashboard/Dashboard';
import MenuDrawer from './MenuDrawer';
import {
  levelStorage,
  clientSession as improvedClientSession,
} from '@/utils/improvedClientSession';
import { 
  mobileStorage,
} from '@/utils/mobileStorage';
import { logger } from '@/utils/logger';
import { runBrowserDiagnostic } from '@/utils/browserDiagnostic';
import { setupOperaFallback } from '@/utils/operaFallback';
import { isHigherLevel } from '../utils/loyaltyCalculations';
import {
  AuthStep,
  ClienteData,
  MenuCategory,
  MenuItem,
  FormData,
} from './types';
import { IdCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientNotifications } from '@/services/clientNotificationService';
import PWANotificationTrigger from '@/components/pwa/PWANotificationTrigger';
import { debugLog } from '@/lib/debug-utils';

interface AuthHandlerProps {
  readonly businessId?: string;
}

export default function AuthHandler({ businessId: propBusinessId }: Readonly<AuthHandlerProps>) {
  const { brandingConfig, isLoading: brandingLoading, businessId: contextBusinessId } = useBranding();
  const { notifyLevelUpManual } = useClientNotifications();
  
  // 🔥 USAR businessId del contexto o del prop, con fallback
  const businessId = propBusinessId || contextBusinessId || 'cmgf5px5f0000eyy0elci9yds';

  // 🔥 VERIFICAR SI TENEMOS DATOS REALES DE CONFIGURACIÓN
  // Aceptar cualquier nombre que no sea el fallback por defecto
  const hasRealBrandingData = brandingConfig.businessName && 
                             brandingConfig.businessName !== 'LEALTA' &&
                             brandingConfig.businessName.trim() !== '';

  // 🔥 MOSTRAR LOADING HASTA TENER DATOS REALES
  const shouldShowLoading = brandingLoading || !hasRealBrandingData;

  // Estados principales de autenticación - EXTRAÍDOS DEL ORIGINAL
  // Estado local
  const [step, setStep] = useState<AuthStep>('presentation');
  const [cedula, setCedula] = useState('');
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Estados de formulario - EXTRAÍDOS DEL ORIGINAL
  const [formData, setFormData] = useState<FormData>({
    cedula: '',
    nombre: '',
    telefono: '',
    email: '',
  });

  // Estados del menú - EXTRAÍDOS DEL ORIGINAL
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState<
    'categories' | 'products'
  >('categories');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(
    null
  );
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [allCategories, setAllCategories] = useState<MenuCategory[]>([]); // Todas las categorías incluyendo subcategorías
  const [menuProducts, setMenuProducts] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

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
    tarjetas: [],
  });
  const [isPortalConfigLoaded, setIsPortalConfigLoaded] = useState(false);

  // Estados del carrusel - EXTRAÍDOS DEL ORIGINAL
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Estado para prevenir salida accidental del dashboard
  const [backPressCount, setBackPressCount] = useState(0);

  // Imágenes del carrusel - solo usar las configuradas por el admin, sin fallback
  const carouselImages = brandingConfig.carouselImages || [];
  
  // Si no hay imágenes configuradas, usar números del 1 al 6 como fallback
  const fallbackNumbers = carouselImages.length === 0 ? ['1', '2', '3', '4', '5', '6'] : [];
  const displayItems = carouselImages.length > 0 ? carouselImages : fallbackNumbers;

  // useEffect para marcar cuando el componente está montado en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // useEffect para manejar el botón de retroceso del navegador/dispositivo
  useEffect(() => {
    // Solo aplicar en el dashboard cuando NO está el menú abierto
    if (step !== 'dashboard' || isMenuDrawerOpen) {
      setBackPressCount(0); // Reset si no estamos en dashboard o si el menú está abierto
      return;
    }

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      
      if (backPressCount === 0) {
        // Primer intento: mostrar aviso
        setBackPressCount(1);
        // Evitar que realmente navegue hacia atrás
        window.history.pushState(null, '', window.location.href);
      } else {
        // Segundo intento: permitir salir
        setBackPressCount(0);
        // Aquí podríamos redirigir o permitir que salga
        window.history.back();
      }
    };

    // Agregar una entrada al historial para interceptar el back
    window.history.pushState(null, '', window.location.href);
    
    // Escuchar el evento popstate
    window.addEventListener('popstate', handlePopState);

    // Timer para resetear el contador después de 2 segundos
    let timer: NodeJS.Timeout;
    if (backPressCount > 0) {
      timer = setTimeout(() => {
        setBackPressCount(0);
      }, 2000);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (timer) clearTimeout(timer);
    };
  }, [step, isMenuDrawerOpen, backPressCount]);

  // Función para cerrar sesión - EXTRAÍDA DEL ORIGINAL
  const handleLogout = () => {
    logger.log('🚪 Cerrando sesión...');

    // Limpiar almacenamiento usando las nuevas utilidades
    improvedClientSession.clear();
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
      email: '',
    });
    setStep('presentation');

    logger.log('✅ Sesión cerrada exitosamente');
  };

  // Funciones auxiliares para reducir complejidad cognitiva
  const getDefaultPortalConfig = () => ({
    nombreEmpresa: 'LEALTA 2.0',
    tarjetas: [
      {
        id: 'tarjeta_principal',
        nombre: 'Tarjeta Love Me',
        descripcion: 'Sistema de lealtad progresivo',
        activa: true,
        condicional: 'OR',
        niveles: [
          {
            nombre: 'Bronce',
            puntosRequeridos: 0,
            visitasRequeridas: 0,
            beneficio: 'Cliente Inicial',
            colores: ['#CD7F32', '#B8860B'],
          },
          {
            nombre: 'Plata',
            puntosRequeridos: 300,
            visitasRequeridas: 5,
            beneficio: '5% descuento en compras',
            colores: ['#C0C0C0', '#A9A9A9'],
          },
          {
            nombre: 'Oro',
            puntosRequeridos: 500,
            visitasRequeridas: 10,
            beneficio: '10% descuento + producto gratis mensual',
            colores: ['#FFD700', '#FFA500'],
          },
          {
            nombre: 'Diamante',
            puntosRequeridos: 1000,
            visitasRequeridas: 20,
            beneficio: '15% descuento + acceso VIP',
            colores: ['#B9F2FF', '#87CEEB'],
          },
          {
            nombre: 'Platino',
            puntosRequeridos: 1500,
            visitasRequeridas: 30,
            beneficio: '20% descuento + eventos exclusivos',
            colores: ['#E5E4E2', '#BCC6CC'],
          },
        ],
      },
    ],
  });

  const loadPortalConfig = useCallback(async () => {
    try {
      // 🔥 USAR businessId real (ya no puede ser 'default')
      if (!businessId || businessId === 'default') {
        console.warn('⚠️ businessId no válido, usando configuración por defecto');
        setPortalConfig(getDefaultPortalConfig());
        setIsPortalConfigLoaded(true);
        return;
      }
      
      const configResponse = await fetch(`/api/portal/config-v2?businessId=${businessId}`);

      if (configResponse.ok) {
        const config = await configResponse.json();

        // Usar la configuración si existe, independientemente de si tiene tarjetas
        if (config) {
          // Asegurar que la configuración tenga los valores por defecto si faltan
          const configConDefaults = {
            ...getDefaultPortalConfig(),
            ...config
          };
          setPortalConfig(configConDefaults);
          setIsPortalConfigLoaded(true);
          logger.log('✅ Configuración del portal cargada correctamente:', configConDefaults);
        } else {
          console.warn('⚠️ Configuración vacía, usando fallback');
          setPortalConfig(getDefaultPortalConfig());
          setIsPortalConfigLoaded(true);
        }
      } else {
        console.error('❌ Error en respuesta de configuración:', configResponse.status);
        const errorText = await configResponse.text();
        console.error('📄 Texto de error:', errorText);
        logger.warn('⚠️ No se pudo cargar la configuración del portal, usando configuración por defecto');
        setPortalConfig(getDefaultPortalConfig());
        setIsPortalConfigLoaded(true);
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      setPortalConfig(getDefaultPortalConfig());
      setIsPortalConfigLoaded(true);
    }
  }, [businessId]); // useCallback dependencies

  // Función para refrescar datos del cliente Y verificar notificaciones
  const refreshClienteData = useCallback(async () => {
    if (!cedula) return;

    // Función para verificar notificaciones en tiempo real (dentro del callback)
    const verificarNotificacionesEnTiempoReal = async (clienteAnterior: any, clienteNuevo: any) => {
      try {
        // Detectar si hubo un cambio de nivel
        const nivelAnterior = clienteAnterior?.tarjetaLealtad?.nivel;
        const nivelNuevo = clienteNuevo?.tarjetaLealtad?.nivel;

        if (nivelAnterior && nivelNuevo && nivelAnterior !== nivelNuevo) {
          // Verificar si ya se notificó este nivel
          const lastNotifiedLevel = localStorage.getItem(`lastNotifiedLevel_${clienteNuevo.cedula}`);
          
          if (lastNotifiedLevel !== nivelNuevo) {
            // Notificar ascenso de nivel (manual o automático)
            notifyLevelUpManual(nivelAnterior, nivelNuevo, clienteNuevo.id);

            // Marcar como notificado
            localStorage.setItem(`lastNotifiedLevel_${clienteNuevo.cedula}`, nivelNuevo);
          }
        }
      } catch (error) {
        console.error('Error verificando notificaciones en tiempo real:', error);
      }
    };

    try {
      logger.log('🔄 Refrescando datos del cliente...');
      
      // 1. Refrescar datos del cliente
      const response = await fetch('/api/cliente/verificar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(businessId && { 'x-business-id': businessId })
        },
        body: JSON.stringify({ 
          cedula,
          businessId: businessId // Incluir businessId como fallback
        }),
      });

      const data = await response.json();
      if (response.ok && data.existe) {
        logger.log('✅ Datos del cliente actualizados:', data.cliente);

        // Verificar notificaciones ANTES de actualizar los datos
        const clienteAnterior = clienteData;
        
        // ✅ Verificar notificaciones de ascenso manual en tiempo real
        await verificarNotificacionesEnTiempoReal(clienteAnterior, data.cliente);
        
        // Actualizar datos después de verificar notificaciones
        setClienteData(data.cliente);
        
        // NO recargar portal config en cada polling - se carga solo al inicio
      }
    } catch (error) {
      console.error('❌ Error refrescando datos del cliente:', error);
    }
  }, [cedula, clienteData, notifyLevelUpManual, businessId]); // Removido loadPortalConfig de dependencias

  // Configurar polling para refrescar datos automáticamente (con notificaciones en tiempo real)
  useEffect(() => {
    if (step === 'dashboard' && cedula) {
      // Polling más frecuente si hay asignaciones manuales recientes
      const hasRecentManualAssignment = clienteData?.tarjetaLealtad?.asignacionManual;
      const pollingInterval = hasRecentManualAssignment ? 3000 : 15000; // 3s para manuales, 15s normal
      
      // Refrescar cada 5 segundos para notificaciones casi instantáneas
      // Polling optimizado: cada 15 segundos para refresco de portal config
      const interval = setInterval(refreshClienteData, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [step, cedula, refreshClienteData, clienteData?.tarjetaLealtad?.asignacionManual]);

  const setupEnvironment = async () => {
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
  };

  // Verificar sesión guardada al cargar - EXTRAÍDA DEL ORIGINAL
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        // Cargar configuración del portal PRIMERO
        await loadPortalConfig();

        // Configurar entorno del navegador
        await setupEnvironment();

        const savedSession = improvedClientSession.load();
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
              headers: { 
                'Content-Type': 'application/json',
                ...(businessId && { 'x-business-id': businessId })
              },
              body: JSON.stringify({ 
                cedula: savedCedula,
                businessId: businessId // Incluir businessId como fallback
              }),
            });

            const data = await response.json();
            if (response.ok && data.existe) {
              // Cliente existe, restaurar sesión
              logger.log(
                '🎉 Sesión restaurada exitosamente para:',
                savedCedula
              );
              setClienteData(data.cliente);
              setCedula(savedCedula);
              setStep('dashboard');

              // Disparar evento de login exitoso para PWA iOS
              window.dispatchEvent(new CustomEvent('client-logged-in'));

              // Las notificaciones se verificarán automáticamente con el useEffect

              // No establecer isInitialLoading a false aquí - se hace al final
            } else {
              // Cliente no existe, limpiar sesión
              logger.warn('⚠️ Cliente no existe, limpiando sesión');
              improvedClientSession.clear();
              setStep('presentation'); // Asegurar que va a presentation si no hay sesión válida
            }
          } else {
            // Sesión expirada, limpiar
            logger.log('⏰ Sesión expirada, limpiando');
            improvedClientSession.clear();
            setStep('presentation'); // Asegurar que va a presentation si la sesión expiró
          }
        } else {
          logger.log('ℹ️ No hay sesión guardada');
          setStep('presentation'); // Asegurar que va a presentation si no hay sesión
        }
      } catch (error) {
        logger.error('❌ Error verificando sesión guardada:', error);
        // En caso de error, limpiar cualquier sesión corrupta
        improvedClientSession.clear();
        setStep('presentation'); // En caso de error, ir a presentation
      } finally {
        // Siempre establecer isInitialLoading a false al final
        setIsInitialLoading(false);
      }
    };

    checkSavedSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]); // SOLO businessId - evita loop infinito con loadPortalConfig
  const getBackgroundStyle = () => {
    if (!isClient) return { backgroundColor: '#1a1a1a' }; // Fondo simple en el servidor

    return {
      backgroundColor: '#1a1a1a',
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(74, 74, 74, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(74, 74, 74, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(74, 74, 74, 0.1) 0%, transparent 50%)
      `,
    };
  };

  // useEffect para el carrusel de imágenes (rotación automática cada 6 segundos para mejor sincronización)
  useEffect(() => {
    const carouselInterval = setInterval(() => {
      setCurrentImageIndex(
        prevIndex => (prevIndex + 1) % displayItems.length
      );
    }, 6000); // Cambia cada 6 segundos para dar tiempo a la animación de 1.5s
    return () => clearInterval(carouselInterval);
  }, [displayItems.length]);

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

  // Función para cargar categorías del menú
  const loadMenuCategories = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const response = await fetch('/api/menu/categorias', {
        headers: {
          'Content-Type': 'application/json',
          ...(businessId && { 'x-business-id': businessId })
        }
      });
      if (response.ok) {
        const data = await response.json();
        const mainCategories = data.filter((cat: any) => !cat.parentId);
        setMenuCategories(mainCategories);
        setAllCategories(data);
        setActiveMenuSection('categories');
      } else {
        console.error('Error en respuesta de categorías:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error cargando categorías del menú:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  }, [businessId]);

  // Función para cargar productos de una categoría
  const loadCategoryProducts = useCallback(
    async (categoryId: string) => {
      setIsLoadingMenu(true);
      try {
        // Buscar la categoría seleccionada
        const category = allCategories.find(cat => cat.id === categoryId);
        setSelectedCategory(category || null);

        // Verificar si tiene subcategorías
        const subcategorias = allCategories.filter(
          cat => cat.parentId === categoryId
        );

        if (subcategorias.length > 0) {
          // Mostrar subcategorías
          setMenuCategories(subcategorias);
          setActiveMenuSection('categories');
        } else {
          // Cargar productos de la categoría
          const response = await fetch(
            `/api/menu/productos?categoriaId=${categoryId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                ...(businessId && { 'x-business-id': businessId })
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            debugLog('🍽️ Datos recibidos del API productos:', data);
            
            // El API devuelve { success: true, productos: [...] }
            if (data.success && Array.isArray(data.productos)) {
              setMenuProducts(data.productos);
              setActiveMenuSection('products');
            } else {
              console.error('❌ Estructura de datos inesperada:', data);
              setMenuProducts([]);
            }
          }
        }
      } catch (error) {
        console.error('Error cargando productos de categoría:', error);
      } finally {
        setIsLoadingMenu(false);
      }
    },
    [allCategories, businessId]
  );

  // Verificar sesión inicial
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = improvedClientSession.load();
        if (sessionData?.cedula) {
          logger.log('📱 Sesión encontrada:', sessionData.cedula);
          setCedula(sessionData.cedula);

          // Verificar cliente en la base de datos
          const response = await fetch('/api/cliente/verificar', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(businessId && { 'x-business-id': businessId })
            },
            body: JSON.stringify({ 
              cedula: sessionData.cedula,
              businessId: businessId
            }),
          });

          const data = await response.json();
          if (response.ok && data.existe) {
            setClienteData(data.cliente);
            setStep('dashboard');

            // Disparar evento de login exitoso para PWA iOS
            window.dispatchEvent(new CustomEvent('client-logged-in'));

            // Las notificaciones se verificarán automáticamente con el useEffect
          } else {
            improvedClientSession.clear();
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
  }, [businessId]); // Hook de inicialización de sesión

  // Hook para cargar datos cuando se entra al dashboard
  useEffect(() => {
    if (step === 'dashboard') {
      loadMenuCategories();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Helper functions para reducir complejidad cognitiva
  const updateClienteDataOnly = useCallback(async (cedula: string) => {
    const clienteResponse = await fetch('/api/cliente/verificar', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(businessId && { 'x-business-id': businessId })
      },
      body: JSON.stringify({ 
        cedula,
        businessId: businessId
      }),
    });

    if (clienteResponse.ok) {
      const clienteActualizado = await clienteResponse.json();
      if (clienteActualizado.existe) {
        setClienteData(clienteActualizado.cliente);
      }
    }
  }, [businessId]);

  const evaluateClientLevel = useCallback(async (cedula: string) => {
    const evaluacionResponse = await fetch('/api/cliente/evaluar-nivel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula, businessId }),
    });

    if (evaluacionResponse.ok) {
      const evaluacionData = await evaluacionResponse.json();
      return evaluacionData;
    }
    return null;
  }, [businessId]);

  const checkStoredLevelChange = useCallback((cliente: any) => {
    const clientLevel = cliente.tarjetaLealtad?.nivel || 'Bronce';
    const storedLevel = localStorage.getItem(`lastLevel_${cliente.cedula}`);

    if (storedLevel && clientLevel !== storedLevel && isHigherLevel(clientLevel, storedLevel)) {
      setOldLevel(storedLevel);
      setNewLevel(clientLevel);
      setShowLevelUpAnimation(true);
      localStorage.setItem(`lastLevel_${cliente.cedula}`, clientLevel);
    } else if (!storedLevel) {
      localStorage.setItem(`lastLevel_${cliente.cedula}`, clientLevel);
    }
  }, [setOldLevel, setNewLevel, setShowLevelUpAnimation]);

  // Función extraída para manejar actualizaciones de nivel y reducir complejidad cognitiva
  const handleLevelUpdateInEffect = useCallback((evaluacionData: any) => {
    if (evaluacionData.actualizado && evaluacionData.mostrarAnimacion) {
      setOldLevel(evaluacionData.nivelAnterior);
      setNewLevel(evaluacionData.nivelNuevo);
      setShowLevelUpAnimation(true);

      localStorage.setItem(`lastLevel_${clienteData?.cedula}`, evaluacionData.nivelNuevo);
    } else if (evaluacionData.actualizado && evaluacionData.esBajada) {
      localStorage.setItem(`lastLevel_${clienteData?.cedula}`, evaluacionData.nivelNuevo);
    }
  }, [clienteData?.cedula, setOldLevel, setNewLevel, setShowLevelUpAnimation]);

  // Actualización periódica de datos del cliente para mantener la tarjeta actualizada
  useEffect(() => {
    if (step === 'dashboard' && clienteData?.id) {
      const fetchClienteActualizado = async () => {
        try {
          // ✅ CAMBIO: Permitir evaluación automática para ascensos, incluso en tarjetas manuales
          const evaluacionData = await evaluateClientLevel(clienteData.cedula);
          
          if (evaluacionData) {
            // Solo mostrar animación si es un ascenso automático (no degradación)
            if (evaluacionData.actualizado && evaluacionData.esSubida) {
              handleLevelUpdateInEffect(evaluacionData);
            }
          }

          const response = await fetch('/api/cliente/verificar', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(businessId && { 'x-business-id': businessId })
            },
            body: JSON.stringify({ 
              cedula: clienteData.cedula,
              businessId: businessId
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.existe) {
              setClienteData(data.cliente);
              checkStoredLevelChange(data.cliente);
            }
          }
        } catch (error) {
          console.error('Error actualizando datos del cliente:', error);
        }
      };

      // Actualizar inmediatamente al entrar
      fetchClienteActualizado();

      // Polling optimizado: cada 30 segundos para datos del cliente
      const updateInterval = setInterval(fetchClienteActualizado, 30000);

      return () => clearInterval(updateInterval);
    }
  }, [step, clienteData?.id, clienteData?.cedula, clienteData?.tarjetaLealtad?.asignacionManual, handleLevelUpdateInEffect, businessId, updateClienteDataOnly, evaluateClientLevel, checkStoredLevelChange]);

  // 🔥 MOSTRAR LOADING hasta tener datos reales de configuración
  if (isInitialLoading || shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-sm">
            {isInitialLoading ? 'Inicializando...' : 'Cargando configuración...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* PWA Notification Trigger - Solo activo cuando hay un cliente logueado */}
      {clienteData && (
        <PWANotificationTrigger 
          clienteId={clienteData.cedula} 
          enabled={true} 
        />
      )}
      
      {step === 'presentation' && !clienteData && (
        <div className="min-h-screen bg-black text-white">
          {/* Header */}
          <header className="flex items-center justify-between p-4 relative z-10">
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold text-lg">
                {brandingConfig.businessName}
              </span>
            </div>
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
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8 mt-8 text-center leading-tight px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Sé usuario {brandingConfig.businessName} y descubre todo lo que tenemos para ti!
              </motion.h1>
              {/* Carrusel de imágenes o números */}
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
                          marginLeft: '-60px', // Centrar el track
                        }}
                      >
                        {displayItems.map(
                          (item: string, index: number) => {
                            const isCurrent = index === currentImageIndex;
                            const isAdjacent =
                              Math.abs(index - currentImageIndex) === 1;

                            let opacity = 0;
                            if (isCurrent) opacity = 1;
                            else if (isAdjacent) opacity = 0.6;

                            return (
                              <div
                                key={`carousel-item-${item}-${index}`}
                                className="flex-shrink-0 mx-4 transition-all duration-1500 ease-out flex items-center justify-center"
                                style={{
                                  transform: isCurrent
                                    ? 'scale(1)'
                                    : 'scale(0.75)',
                                  opacity: opacity,
                                  zIndex: isCurrent ? 5 : 1,
                                }}
                              >
                                {carouselImages.length === 0 ? (
                                  // Mostrar número cuando no hay imágenes configuradas
                                  <div 
                                    className={`rounded-lg flex items-center justify-center ${
                                      isCurrent ? 'w-32 h-32' : 'w-20 h-20'
                                    }`}
                                    style={{ 
                                      backgroundColor: '#374151',
                                      boxShadow: isCurrent ? `0 8px 20px ${brandingConfig.primaryColor}33` : undefined
                                    }}
                                  >
                                    <span className="text-white text-2xl font-bold">
                                      {item}
                                    </span>
                                  </div>
                                ) : (
                                  // Mostrar imagen cuando hay imágenes configuradas
                                  <img
                                    src={item}
                                    alt={`Imagen ${index + 1}`}
                                    className={`object-cover rounded-lg ${
                                      isCurrent ? 'w-32 h-32' : 'w-20 h-20'
                                    }`}
                                    style={
                                      isCurrent
                                        ? {
                                            boxShadow: `0 8px 20px ${brandingConfig.primaryColor}33`,
                                          }
                                        : {}
                                    }
                                  />
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indicadores de puntos */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {displayItems.map((item: string, index: number) => (
                      <div
                        key={`carousel-dot-${index}-${item}`}
                        className={`w-2 h-2 rounded-full transition-all duration-700 ease-in-out ${
                          index === currentImageIndex
                            ? 'opacity-100 scale-125'
                            : 'bg-white opacity-40 scale-100'
                        }`}
                        style={{
                          backgroundColor:
                            index === currentImageIndex
                              ? brandingConfig.primaryColor
                              : undefined,
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
                    boxShadow: `0 4px 15px 0 ${brandingConfig.primaryColor}33`,
                  }}
                  whileHover={{
                    filter: 'brightness(1.1)',
                    scale: 1.02,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
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
          businessId={businessId}
        />
      )}

      {step === 'register' && (
        <RegisterForm
          setStep={setStep}
          cedula={cedula}
          formData={formData}
          setFormData={setFormData}
          setClienteData={setClienteData}
          businessId={businessId}
        />
      )}

      {step === 'dashboard' && !isPortalConfigLoaded && (
        <div
          className="min-h-screen flex items-center justify-center"
          style={getBackgroundStyle()}
        >
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Cargando configuración...</p>
          </div>
        </div>
      )}

      {step === 'dashboard' && isPortalConfigLoaded && (
        <>
          <Dashboard
            clienteData={clienteData}
            cedula={cedula}
            showLevelUpAnimation={showLevelUpAnimation}
            setShowLevelUpAnimation={setShowLevelUpAnimation}
            oldLevel={oldLevel}
            newLevel={newLevel}
            onMenuOpen={() => setIsMenuDrawerOpen(true)}
            handleLogout={handleLogout}
            showTarjeta={showTarjeta}
            setShowTarjeta={setShowTarjeta}
            portalConfig={portalConfig}
            businessId={businessId}
          />

          {/* Mensaje de confirmación para salir */}
          <AnimatePresence>
            {backPressCount > 0 && !isMenuDrawerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-4 bg-gray-900/95 backdrop-blur-sm border border-purple-500/50 rounded-2xl shadow-2xl max-w-sm mx-4"
              >
                <p className="text-white text-center font-medium">
                  Presiona atrás nuevamente para salir
                </p>
              </motion.div>
            )}
          </AnimatePresence>

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
