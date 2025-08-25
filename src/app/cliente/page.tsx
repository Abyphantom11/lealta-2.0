'use client';

import { useState } from 'react';
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
  Calendar,
  Star,
  MapPin,
  Clock,
  Percent,
  Menu,
  Utensils,
  CreditCard,
  TrendingUp,
  Target
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

      {/* Transacciones Recientes */}
      <div className="mx-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Actividad reciente</h2>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          <motion.div
            className="flex items-center justify-between py-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Cena Familiar</div>
                <div className="text-gray-400 text-sm">Consumo 16 Ago</div>
              </div>
            </div>
            <div className="text-green-400 font-semibold">+25 pts</div>
          </motion.div>

          <motion.div
            className="flex items-center justify-between py-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Promoción 2x1</div>
                <div className="text-gray-400 text-sm">Canje 07 Ago</div>
              </div>
            </div>
            <div className="text-red-400 font-semibold">-50 pts</div>
          </motion.div>

          <motion.div
            className="flex items-center justify-between py-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">Bonus Bienvenida</div>
                <div className="text-gray-400 text-sm">Registro 06 Ago</div>
              </div>
            </div>
            <div className="text-green-400 font-semibold">+100 pts</div>
          </motion.div>
        </div>
      </div>

      {/* Promociones y Metas */}
      <div className="mx-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Metas</span>
            </div>
            <div className="text-white text-xs mb-1">
              Próximo descuento en {250 - (clienteData?.puntos || 100)} pts
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2" 
                style={{ width: `${((clienteData?.puntos || 100) / 250) * 100}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-2xl p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Percent className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Promociones</span>
            </div>
            <div className="text-white text-xs">
              Descuentos hasta 25% en menú especial
            </div>
          </motion.div>
        </div>
      </div>

      {/* Menú Central - Botón Principal */}
      <div className="mx-4 mb-6">
        <motion.button
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 flex items-center justify-between hover:from-orange-600 hover:to-red-700 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-white text-lg font-bold">Ver Menú Completo</div>
              <div className="text-white/80 text-sm">Descubre nuestros platos especiales</div>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Servicios Rápidos */}
      <div className="mx-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Servicios</h3>
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            className="bg-gray-900 rounded-xl p-4 text-center hover:bg-gray-800 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-white text-sm font-medium">Reservas</div>
            <div className="text-gray-400 text-xs">Mesa para hoy</div>
          </motion.div>

          <motion.div
            className="bg-gray-900 rounded-xl p-4 text-center hover:bg-gray-800 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <MapPin className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-white text-sm font-medium">Ubicación</div>
            <div className="text-gray-400 text-xs">Cómo llegar</div>
          </motion.div>

          <motion.div
            className="bg-gray-900 rounded-xl p-4 text-center hover:bg-gray-800 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-white text-sm font-medium">Horarios</div>
            <div className="text-gray-400 text-xs">Lun-Dom 11am</div>
          </motion.div>

          <motion.div
            className="bg-gray-900 rounded-xl p-4 text-center hover:bg-gray-800 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-white text-sm font-medium">Recompensas</div>
            <div className="text-gray-400 text-xs">Canjear puntos</div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
        <div className="flex items-center justify-around py-3">
          <div className="text-center">
            <Coffee className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Inicio</span>
          </div>
          <div className="text-center">
            <CreditCard className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Pagos</span>
          </div>
          <div className="text-center relative">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-1">
              <Menu className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-pink-500 font-medium">Menú</span>
          </div>
          <div className="text-center">
            <Gift className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Ofertas</span>
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

  // Render based on current step
  if (step === 'cedula') return renderCedulaForm();
  if (step === 'register') return renderRegisterForm();
  if (step === 'dashboard') return renderDashboard();

  return renderInitialView();
}

interface CategoryCardProps {
  icon: React.ReactNode;
  label: string;
  color: string;
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
