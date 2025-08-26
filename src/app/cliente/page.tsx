'use client';

import { useState, useEffect } from 'react';
import { motion } from '../../components/motion';
import { 
  Bell, 
  User, 
  UtensilsCrossed, 
  Coffee, 
  Wine, 
  Cake, 
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
  const [step, setStep] = useState<'initial' | 'cedula' | 'register' | 'dashboard' | 'menu'>('initial');
  const [cedula, setCedula] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [clienteData, setClienteData] = useState<any>(null);
  const [activeMenuSection, setActiveMenuSection] = useState<'categories' | 'products'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [menuProducts, setMenuProducts] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

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
      const response = await fetch('/api/admin/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuCategories(data.categorias || []);
      }
    } catch (error) {
      console.error('Error loading menu categories:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Función para cargar productos de una categoría
  const loadCategoryProducts = async (categoryId: string) => {
    setIsLoadingMenu(true);
    try {
      const category = menuCategories.find(c => c.id === categoryId);
      setMenuProducts(category?.productos || []);
      setSelectedCategory(categoryId);
      setActiveMenuSection('products');
    } catch (error) {
      console.error('Error loading category products:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Hook para cargar datos cuando se entra al dashboard
  useEffect(() => {
    if (step === 'dashboard') {
      loadMenuCategories();
    }
  }, [step]);

  // Función para mostrar el menú completo
  const renderMenuView = () => (
    <div className="min-h-screen bg-black text-white">
      {/* Header del Menú */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              if (activeMenuSection === 'products') {
                setActiveMenuSection('categories');
                setSelectedCategory(null);
              } else {
                setStep('dashboard');
              }
            }}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-300 rotate-180" />
          </button>
          <h1 className="text-xl font-bold">
            {activeMenuSection === 'categories' ? 'Nuestro Menú' : 
             menuCategories.find(c => c.id === selectedCategory)?.nombre}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors">
            <Search className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Contenido del Menú */}
      <div className="p-4">
        {activeMenuSection === 'categories' ? (
          <MenuCategoriesView 
            categories={menuCategories}
            onCategorySelect={loadCategoryProducts}
            isLoading={isLoadingMenu}
          />
        ) : (
          <MenuProductsView 
            products={menuProducts}
            isLoading={isLoadingMenu}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
        <div className="flex items-center justify-around py-3">
          <button 
            onClick={() => setStep('dashboard')}
            className="text-center"
          >
            <Coffee className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Inicio</span>
          </button>
          <div className="text-center relative">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-1">
              <Menu className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-pink-500 font-medium">Menú</span>
          </div>
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

  const renderInitialView = () => (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded flex items-center justify-center">
            <span className="text-black font-bold text-sm">⚡</span>
          </div>
          <span className="text-white font-bold text-lg">LEALTA</span>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5 text-white" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <User className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: createFoodPatternBackground()
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Descubre Nuestro Menú
          </motion.h1>
          <motion.p 
            className="text-gray-300 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Premium Digital
          </motion.p>
          <motion.button 
            onClick={() => setStep('cedula')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <IdCard className="w-5 h-5" />
            <span>Acceder con Cédula</span>
          </motion.button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="p-6">
        <motion.div 
          className="grid grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <CategoryCard 
            icon={<UtensilsCrossed className="w-6 h-6" />}
            label="Enter"
            color="bg-green-600"
          />
          <CategoryCard 
            icon={<Coffee className="w-6 h-6" />}
            label="Princ"
            color="bg-red-600"
          />
          <CategoryCard 
            icon={<Wine className="w-6 h-6" />}
            label="Bebid"
            color="bg-yellow-600"
          />
          <CategoryCard 
            icon={<Cake className="w-6 h-6" />}
            label="Post"
            color="bg-orange-600"
          />
        </motion.div>
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
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded flex items-center justify-center">
              <span className="text-black font-bold text-sm">⚡</span>
            </div>
            <span className="text-white font-bold text-xl">LEALTA</span>
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
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
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
          <UserPlus className="w-12 h-12 text-blue-500 mx-auto mb-4" />
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
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
      {/* Header */}
      <div className="flex items-center justify-between p-4">
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

      {/* Balance Card */}
      <div className="mx-4 mb-6">
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
        <div className="flex items-center justify-around py-3">
          <div className="text-center">
            <Coffee className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Inicio</span>
          </div>
          <button 
            onClick={() => setStep('menu')}
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

  // Render based on current step
  if (step === 'cedula') return renderCedulaForm();
  if (step === 'register') return renderRegisterForm();
  if (step === 'dashboard') return renderDashboard();
  if (step === 'menu') return renderMenuView();

  return renderInitialView();
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
  const [favoritoDelDia, setFavoritoDelDia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavoritoDelDia = async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('🔄 Cliente - Datos recibidos:', data.config); // Debug
          const favorito = data.config?.favoritoDelDia;
          if (favorito?.activo && favorito?.imagenUrl) {
            console.log('✅ Cliente - Favorito encontrado:', favorito); // Debug
            setFavoritoDelDia(favorito);
          } else {
            console.log('❌ Cliente - Sin favorito válido'); // Debug
            setFavoritoDelDia(null);
          }
        }
      } catch (error) {
        console.error('Error loading favorito del día:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoritoDelDia();
    
    // Polling para actualización en tiempo real cada 2 segundos
    const interval = setInterval(fetchFavoritoDelDia, 2000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !favoritoDelDia) return null;

  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Favorito del Día</h3>
      <motion.div 
        className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {favoritoDelDia.imagenUrl && (
          <div className="relative">
            <img 
              src={favoritoDelDia.imagenUrl} 
              alt="Favorito del día" 
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium text-sm">Favorito del Día</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Componente para mostrar categorías del menú
function MenuCategoriesView({ categories, onCategorySelect, isLoading }: any) {
  const skeletonIds = ['cat-1', 'cat-2', 'cat-3', 'cat-4'];
  
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">Categorías</h2>
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {skeletonIds.map((id) => (
            <div key={id} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category: any) => (
            <motion.div
              key={category.id}
              className="bg-gray-900 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={() => onCategorySelect(category.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <div className="text-white font-medium">{category.nombre}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para mostrar productos de una categoría
function MenuProductsView({ products, isLoading }: any) {
  const skeletonIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4'];
  
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">Productos</h2>
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {skeletonIds.map((id) => (
            <div key={id} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product: any) => (
            <motion.div
              key={product.id}
              className="bg-gray-900 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Coffee className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-white font-medium">{product.nombre}</div>
                </div>
                <div className="text-white font-bold">
                  {product.precio.toFixed(2)} USD
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
