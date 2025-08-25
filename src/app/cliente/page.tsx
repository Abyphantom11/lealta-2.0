'use client';

import { useState } from 'react';
import { motion } from '../../components/motion';
import { Bell, User, UtensilsCrossed, Coffee, Wine, Cake, IdCard, UserPlus, ArrowRight } from 'lucide-react';

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <header className="bg-gray-900 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded flex items-center justify-center">
                <span className="text-black font-bold text-sm">⚡</span>
              </div>
              <span className="text-white font-bold text-lg">LEALTA</span>
            </div>
            <button 
              onClick={() => {
                setStep('initial');
                setCedula('');
                setFormData({ nombre: '', telefono: '', correo: '' });
                setClienteData(null);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Welcome Section */}
        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              ¡Bienvenido {clienteData?.nombre || 'Cliente'}!
            </h1>
            <p className="text-blue-100">
              Tu cédula: {clienteData?.cedula || cedula}
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white text-sm">Puntos Acumulados</p>
                <p className="text-2xl font-bold text-white">{clienteData?.puntos || 100}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white text-sm">Visitas</p>
                <p className="text-2xl font-bold text-white">{clienteData?.visitas || 1}</p>
              </div>
            </div>
          </div>

          {/* Menu Categories */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <UtensilsCrossed className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-white font-medium">Entradas</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <Coffee className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-white font-medium">Principales</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <Wine className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-white font-medium">Bebidas</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <Cake className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-white font-medium">Postres</p>
            </div>
          </div>

          {/* Promotions */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Promociones Especiales</h3>
            <div className="space-y-2">
              <div className="bg-green-800/30 border border-green-700 rounded-lg p-3">
                <p className="text-green-300 font-medium">¡2x1 en Cócteles!</p>
                <p className="text-green-400 text-sm">Válido hasta el domingo</p>
              </div>
              <div className="bg-blue-800/30 border border-blue-700 rounded-lg p-3">
                <p className="text-blue-300 font-medium">20% off en Paella</p>
                <p className="text-blue-400 text-sm">Solo por hoy</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
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
