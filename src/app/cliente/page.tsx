'use client';

import { useState, useEffect } from 'react';
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
  Menu
} from 'lucide-react';

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
  const [clienteData, setClienteData] = useState<any>(null);
  
  // Estado de carga inicial
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
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
  
  // Estados del menú drawer
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState<'categories' | 'products'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]); // Todas las categorías incluyendo subcategorías
  const [menuProducts, setMenuProducts] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  
  // Estados del buscador
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

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

  // Función para cargar categorías del menú
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

  // Función para cargar productos de una categoría o mostrar subcategorías
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

  // Función helper para renderizar la vista del menú
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

  // Función para manejar navegación hacia atrás
  const handleBackNavigation = async () => {
    // Limpiar búsqueda primero si está activa
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
  const handleSearch = (query: string) => {
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
  };

  // Effect para actualizar filtros cuando cambian los datos
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      handleSearch(searchQuery);
    } else {
      setFilteredProducts(menuProducts);
    }
  }, [menuCategories, menuProducts, allCategories]);

  // Hook para cargar datos cuando se entra al dashboard
  useEffect(() => {
    if (step === 'dashboard') {
      loadMenuCategories();
    }
  }, [step]);

  // Función para mostrar el drawer del menú
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
            className="fixed bottom-0 left-0 right-0 bg-black text-white z-50 rounded-t-3xl flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ height: '85vh' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                setIsMenuDrawerOpen(false);
              }
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1 cursor-pointer flex-shrink-0">
              <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
            </div>

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
                      if (selectedCategory) return 'Categorías';
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const renderInitialView = () => (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-center p-4 relative z-10">
        <div className="flex items-center space-x-2">
          <span className="text-white font-bold text-lg">{brandingConfig.businessName}</span>
        </div>
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
                          key={`carousel-img-${imageUrl.split('?')[0].split('/').pop()}`}
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
                    key={`carousel-dot-${imageUrl.split('?')[0].split('/').pop()}`}
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

          {/* Botón centrado debajo del carrusel */}
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
                <div className="text-white/60 text-sm">
                  Tarjeta ****{(clienteData?.cedula || cedula).slice(-4)}
                </div>
              </div>
              <button className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors">
                <Eye className="w-6 h-6 text-white" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Banners Section - Editable desde Admin */}
        <BannersSection />

        {/* Promociones Section - Editable desde Admin */}
        <PromocionesSection />

        {/* Favorito del Día Section - Editable desde Admin */}
        <FavoritoDelDiaSection />

        {/* Recompensas de Fidelización - Editable desde Admin */}
        <RecompensasSection />
      </div>

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

interface CategoryCardProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly color: string;
}

function CategoryCard({ icon, label, color }: CategoryCardProps) {
  return (
    <div className="flex flex-col items-center space-y-2 p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white`}>
        {icon}
      </div>
      <span className="text-white text-sm font-medium">{label}</span>
    </div>
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

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('🎯 Cliente - Banners recibidos:', data.config?.banners); // Debug
          const activeBanners = data.config?.banners?.filter((b: any) => 
            b.activo && b.imagenUrl && b.imagenUrl.trim() !== ''
          ) || [];
          console.log('✅ Cliente - Banners activos filtrados:', activeBanners); // Debug
          setBanners(activeBanners);
        }
      } catch (error) {
        console.error('Error loading banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
    
    // Polling para actualización en tiempo real cada 2 segundos
    const interval = setInterval(fetchBanners, 2000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || banners.length === 0) return null;

  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Evento del día</h3>
      <div className="space-y-3">
        {banners.slice(0, 1).map((banner: any, index: number) => (
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

  useEffect(() => {
    const fetchPromociones = async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default');
        if (response.ok) {
          const data = await response.json();
          setPromociones(data.config?.promociones?.filter((p: any) => p.activo) || []);
        }
      } catch (error) {
        console.error('Error loading promociones:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromociones();
    
    // Polling para actualización en tiempo real cada 5 segundos
    const interval = setInterval(fetchPromociones, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || promociones.length === 0) return null;

  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Promociones Especiales</h3>
      <div className="grid grid-cols-1 gap-3">
        {promociones.slice(0, 2).map((promo: any, index: number) => (
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
                      Válido hasta: {new Date(promo.fechaFin).toLocaleDateString()}
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

// Componente para mostrar recompensas de fidelización
function RecompensasSection() {
  const [recompensas, setRecompensas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecompensas = async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default');
        if (response.ok) {
          const data = await response.json();
          setRecompensas(data.config?.recompensas?.filter((r: any) => r.activo) || []);
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
      <h3 className="text-lg font-semibold text-white mb-4">Recompensas de Fidelización</h3>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Gift className="w-6 h-6 text-white" />
          <div className="text-white font-semibold">Programa de Puntos</div>
        </div>
        {/* Contenedor scrollable horizontal para las recompensas */}
        <div className="overflow-x-auto">
          <div className="flex space-x-3 pb-2" style={{ width: 'max-content' }}>
            {recompensas.map((recompensa: any, index: number) => (
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
                    {recompensa.stock > 0 && (
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

// Sección de Favorito del Día
function FavoritoDelDiaSection() {
  const [favorito, setFavorito] = useState<any>(null);
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
          console.log('🎯 Cliente - Favorito recibido:', data.config?.favoritoDelDia); // Debug
          const favoritoActivo = data.config?.favoritoDelDia;
          
          if (favoritoActivo?.activo && favoritoActivo?.imagenUrl && favoritoActivo.imagenUrl.trim() !== '') {
            console.log('✅ Cliente - Favorito activo encontrado:', favoritoActivo); // Debug
            setFavorito(favoritoActivo);
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

// Componente para mostrar categorías del menú
function MenuCategoriesView({ categories, onCategorySelect, isLoading, searchQuery }: any) {
  const skeletonIds = ['cat-1', 'cat-2', 'cat-3', 'cat-4'];
  
  // Renderizar estado de carga
  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'Categorías'}
        </h2>
        <div className="animate-pulse space-y-4">
          {skeletonIds.map((id) => (
            <div key={id} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Renderizar estado vacío
  if (categories.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {searchQuery ? `Resultados para "${searchQuery}"` : 'Categorías'}
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            {searchQuery ? 'No se encontraron categorías' : 'No hay categorías disponibles'}
          </div>
          {searchQuery && (
            <div className="text-gray-500 text-sm">
              Intenta con otro término de búsqueda
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
        {searchQuery ? `Resultados para "${searchQuery}"` : 'Categorías'}
      </h2>
      <div className="space-y-3">
        {categories.map((category: any) => (
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

// Componente para mostrar productos de una categoría
function MenuProductsView({ products, isLoading, searchQuery }: any) {
  const skeletonIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4'];
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
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

  // Renderizar estado vacío
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
              Intenta con otro término de búsqueda
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
        {products.map((product: any) => (
          <motion.div
            key={product.id}
            className="bg-gray-900 rounded-lg p-3 cursor-pointer hover:bg-gray-800 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{product.nombre}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-300" />
                </button>
                <div className="text-white font-bold text-sm">
                  {(() => {
                    if (product.precio) return product.precio.toFixed(2);
                    if (product.precioVaso) return product.precioVaso.toFixed(2);
                    return '0.00';
                  })()} USD
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal para mostrar imagen y descripción del producto */}
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
              className="fixed top-4 left-4 right-4 bottom-4 md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-gray-900 rounded-xl p-6 z-70 max-w-lg md:w-auto overflow-y-auto flex flex-col"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
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
