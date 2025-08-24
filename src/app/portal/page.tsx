'use client';

import { useState, useEffect } from 'react';
import { motion } from '../../components/motion';
import { 
  Home, 
  Calendar, 
  Menu, 
  Clock, 
  User, 
  MapPin, 
  Star, 
  Gift
} from 'lucide-react';

export default function PortalPage() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    correo: '',
    telefono: '',
    consent: false
  });

  useEffect(() => {
    // Check if customer is already registered via cookie
    const clienteId = document.cookie
      .split('; ')
      .find(row => row.startsWith('clienteId='))
      ?.split('=')[1];
    
    if (clienteId) {
      setIsRegistered(true);
      // In a real app, fetch customer data here
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsRegistered(true);
        // Cookie is set by the API
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error de conexión. Por favor intente nuevamente.');
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await fetch('/api/portal/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cedula: formData.cedula, 
          locationId: 'default-location' 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('¡Check-in exitoso! Bienvenido/a');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Error de conexión. Por favor intente nuevamente.');
    }
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto pt-12"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center"
            >
              <Star className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bienvenido a <span className="gradient-primary bg-clip-text text-transparent">Lealta</span>
            </h1>
            <p className="text-dark-400">
              Regístrate para acceder a nuestra experiencia premium
            </p>
          </div>

          {/* Registration Form */}
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleRegister}
            className="premium-card space-y-4"
          >
            <div>
              <label htmlFor="cedula" className="block text-sm font-medium text-dark-300 mb-2">
                Cédula de Identidad
              </label>
              <input
                id="cedula"
                type="text"
                required
                className="form-input"
                placeholder="Ej: 12345678"
                value={formData.cedula}
                onChange={(e) => setFormData({...formData, cedula: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-dark-300 mb-2">
                Nombre Completo
              </label>
              <input
                id="nombre"
                type="text"
                required
                className="form-input"
                placeholder="Tu nombre completo"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-dark-300 mb-2">
                Correo Electrónico
              </label>
              <input
                id="correo"
                type="email"
                required
                className="form-input"
                placeholder="tu@email.com"
                value={formData.correo}
                onChange={(e) => setFormData({...formData, correo: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-dark-300 mb-2">
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                required
                className="form-input"
                placeholder="+1 234 567 8900"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              />
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="consent"
                required
                className="mt-1"
                checked={formData.consent}
                onChange={(e) => setFormData({...formData, consent: e.target.checked})}
              />
              <label htmlFor="consent" className="text-sm text-dark-300">
                Acepto los términos y condiciones y autorizo el tratamiento de mis datos personales
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full btn-primary"
            >
              Registrarme
            </motion.button>
          </motion.form>

          {/* Features Preview */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 grid grid-cols-2 gap-4"
          >
            <div className="text-center p-4 bg-dark-800/50 rounded-lg">
              <Menu className="w-8 h-8 text-primary-400 mx-auto mb-2" />
              <p className="text-sm text-dark-300">Menú Premium</p>
            </div>
            <div className="text-center p-4 bg-dark-800/50 rounded-lg">
              <Gift className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-dark-300">Promociones</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      {/* Header */}
      <div className="bg-dark-900/80 backdrop-blur-xl border-b border-dark-700 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">¡Hola!</h1>
            <p className="text-dark-400 text-sm">Bienvenido a Lealta Premium</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCheckIn}
          className="w-full max-w-md mx-auto mb-6 bg-gradient-to-r from-success-600 to-success-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center space-x-2"
        >
          <MapPin className="w-5 h-5" />
          <span>¡Estoy aquí!</span>
        </motion.button>

        {/* Featured Cards */}
        <div className="max-w-md mx-auto space-y-4">
          <FeaturedCard
            title="Menú del Día"
            description="Descubre nuestras especialidades"
            icon={<Menu className="w-6 h-6" />}
            gradient="from-primary-600 to-blue-600"
          />
          
          <FeaturedCard
            title="Eventos Especiales"
            description="Próximos eventos y shows en vivo"
            icon={<Calendar className="w-6 h-6" />}
            gradient="from-purple-600 to-pink-600"
          />

          <FeaturedCard
            title="Mis Puntos"
            description="0 puntos disponibles"
            icon={<Gift className="w-6 h-6" />}
            gradient="from-warning-600 to-orange-600"
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

function FeaturedCard({ title, description, icon, gradient }: Readonly<{
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}>) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`premium-card cursor-pointer`}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-dark-400 text-sm">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function BottomNavigation() {
  const tabs = [
    { id: 'inicio', icon: Home, label: 'Inicio', active: true },
    { id: 'eventos', icon: Calendar, label: 'Eventos' },
    { id: 'menu', icon: Menu, label: 'Menú' },
    { id: 'reservas', icon: Clock, label: 'Reservas' },
    { id: 'perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-900/90 backdrop-blur-xl border-t border-dark-700 p-4">
      <div className="max-w-md mx-auto flex justify-around">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${
              tab.active ? 'text-primary-400' : 'text-dark-500'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs">{tab.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
