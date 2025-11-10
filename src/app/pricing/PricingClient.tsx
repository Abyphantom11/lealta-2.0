'use client';

import { useSession, signIn } from 'next-auth/react';
import { usePaddle } from '@/hooks/usePaddle';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  Calendar,
  Sparkles,
  ArrowRight,
  X,
  Mail,
  Lock,
  Building2,
  CreditCard
} from 'lucide-react';
import { useState } from 'react';

interface PricingClientProps {
  initialSession: any; // Session inicial del servidor
}

export default function PricingClient({ initialSession }: PricingClientProps) {
  const { data: session } = useSession();
  const { createCheckout, isLoading: paddleLoading, error: paddleError } = usePaddle();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'login'>('signup');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    businessName: '',
  });
  
  // Usar la sesión del cliente si está disponible, sino la inicial del servidor
  const currentSession = session || initialSession;

  // Función para abrir modal de registro/login
  const handleStartTrial = async () => {
    if (!currentSession?.user?.email) {
      // Abrir modal para registro o login
      setShowModal(true);
      setModalMode('signup');
      return;
    }

    // Si ya está logueado, abrir checkout directo
    openPaddleCheckout();
  };

  // Crear cuenta nueva
  const handleSignup = async (payNow: boolean) => {
    setIsProcessing(true);

    try {
      // Crear cuenta en el backend
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          businessName: formData.businessName,
          trial: !payNow, // 14 días gratis si no paga ahora
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al crear cuenta');
      }

      // Loguear automáticamente
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Error al iniciar sesión');
      }

      // Si quiere pagar ahora, abrir Paddle con los datos del formulario
      if (payNow) {
        // Esperar un momento para que la sesión se actualice
        setTimeout(() => {
          openPaddleCheckout(data.businessId, formData.email, formData.name);
        }, 1000);
      } else {
        // Redirigir al dashboard con trial activado
        setTimeout(() => {
          globalThis.location.href = `/${data.businessId}/admin`;
        }, 500);
      }

    } catch (error) {
      console.error('Error en signup:', error);
      alert(error instanceof Error ? error.message : 'Error al crear cuenta');
    } finally {
      setIsProcessing(false);
    }
  };

  // Login de usuario existente
  const handleLogin = async () => {
    setIsProcessing(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Email o contraseña incorrectos');
      }

      // Cerrar modal y abrir checkout
      setShowModal(false);
      
      // Esperar un momento para que la sesión se actualice
      setTimeout(() => {
        openPaddleCheckout();
      }, 500);

    } catch (error) {
      console.error('Error en login:', error);
      alert(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setIsProcessing(false);
    }
  };

  // Abrir Paddle Checkout
  const openPaddleCheckout = async (businessId?: string, email?: string, name?: string) => {
    if (paddleError) {
      alert('⚠️ Paddle aún no está configurado.\n\nPara activar los pagos, sigue la guía: PADDLE_TESTING_GUIDE.md');
      return;
    }

    // Obtener email y nombre del usuario actual o de los parámetros
    const customerEmail = email || currentSession?.user?.email || formData.email;
    const customerName = name || currentSession?.user?.name || formData.name;
    const targetBusinessId = businessId || currentSession?.user?.businessId;

    if (!customerEmail) {
      alert('Error: Email requerido para procesar el pago');
      return;
    }

    try {
      console.log('🎯 Abriendo checkout con:', {
        customerEmail,
        customerName,
        businessId: targetBusinessId,
      });

      await createCheckout({
        priceId: process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID || 'pri_lealta_enterprise_plan',
        businessId: targetBusinessId || 'temp_business_id',
        customerEmail: customerEmail,
        customerName: customerName || 'Usuario',
        successUrl: `${globalThis.location.origin}/billing/success?plan=ENTERPRISE`,
        cancelUrl: `${globalThis.location.origin}/pricing`,
      });
      
      setShowModal(false);
    } catch (error) {
      console.error('Error iniciando suscripción:', error);
      alert('Error al procesar el pago. Inténtalo de nuevo.');
    }
  };

  const features = [
    { icon: Users, text: 'Múltiples negocios', description: 'Gestiona todos tus establecimientos desde una plataforma' },
    { icon: Calendar, text: 'Reservas ilimitadas', description: 'Sin límites de reservas en ningún negocio' },
    { icon: Users, text: 'Staff ilimitado', description: 'Usuarios ilimitados para todos tus negocios' },
    { icon: Sparkles, text: 'Personalización total', description: 'Adaptado específicamente a tus necesidades' },
    { icon: Zap, text: 'QR y fidelización', description: 'Sistema completo de puntos y recompensas' },
    { icon: TrendingUp, text: 'Analytics empresarial', description: 'Reportes consolidados de todos los negocios' },
    { icon: Shield, text: 'Soporte dedicado', description: 'Soporte prioritario 24/7 personalizado' },
    { icon: Sparkles, text: 'Desarrollo continuo', description: 'Nuevas features desarrolladas exclusivamente' },
  ];

  const comparisonItems = [
    { feature: 'Sistema de Reservas + QR', lealta: true, others: '$449/mes' },
    { feature: 'Portal Cliente Personalizable', lealta: true, others: '$399/mes' },
    { feature: 'Registro con OCR (IA)', lealta: true, others: '$50/mes' },
    { feature: 'Sistema de Fidelización', lealta: true, others: '$199/mes' },
    { feature: 'Analytics Avanzados', lealta: true, others: '$299/mes' },
    { feature: 'Soporte Personalizado', lealta: true, others: '$399/mes' },
    { feature: 'Desarrollo Custom', lealta: true, others: '$2,999/mes' },
    { feature: 'Múltiples Negocios', lealta: true, others: 'No incluido' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-purple-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Plan Enterprise Exclusivo</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Una Plataforma
            <br />
            <span className="text-purple-400">Todo Incluido</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            La solución empresarial más completa para gestionar todos tus negocios.
            <br />
            Todo lo que necesitas, por el precio de una herramienta básica.
          </p>
        </motion.div>

        {/* Main Pricing Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-3xl p-8 md:p-12 border border-purple-500/30 shadow-2xl backdrop-blur-sm">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full px-6 py-2">
                <span className="text-sm font-bold text-white">🚀 PLAN ENTERPRISE</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-6xl md:text-8xl font-bold">$250</span>
                <div className="text-left">
                  <div className="text-gray-400 text-lg">USD</div>
                  <div className="text-gray-400 text-sm">por negocio/mes</div>
                </div>
              </div>
              
              <p className="text-gray-300 text-lg mb-6">
                Precio fijo sin importar el número de usuarios o volumen de reservas
              </p>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartTrial}
                disabled={isProcessing || paddleLoading}
                className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                  isProcessing || paddleLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-purple-500/25'
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  {isProcessing || paddleLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {currentSession ? 'Comenzar Suscripción' : 'Crear Cuenta y Suscribirse'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </div>
              </motion.button>

              {!currentSession && (
                <p className="text-gray-400 text-sm mt-3">
                  ¿Ya tienes cuenta?{' '}
                  <button 
                    onClick={() => {
                      setShowModal(true);
                      setModalMode('login');
                    }}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-colors"
            >
              <feature.icon className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="font-semibold mb-2">{feature.text}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ¿Por qué Lealta es la mejor inversión?
          </h2>
          
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-gray-400 font-medium">Funcionalidad</div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg px-4 py-2 font-bold">
                  Lealta Enterprise
                </div>
              </div>
              <div className="text-center font-medium text-gray-400">Competencia</div>
            </div>
            
            {comparisonItems.map((item, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 py-4 border-t border-white/10">
                <div className="font-medium">{item.feature}</div>
                <div className="text-center">
                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                </div>
                <div className="text-center text-gray-400">{item.others}</div>
              </div>
            ))}
            
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-purple-500/30 mt-6">
              <div className="font-bold text-lg">Total Mensual</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">$250</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">$5,193+</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: "¿Puedo cambiar o cancelar mi suscripción?",
                a: "Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de administración. Los cambios se aplicarán al final del período actual."
              },
              {
                q: "¿Hay límites en el número de usuarios o reservas?",
                a: "No hay límites. El plan Enterprise incluye usuarios ilimitados y reservas ilimitadas para todos tus negocios."
              },
              {
                q: "¿Qué tipo de soporte incluye?",
                a: "Incluye soporte prioritario 24/7, un manager dedicado y desarrollo de funcionalidades personalizadas según tus necesidades."
              },
              {
                q: "¿Puedo usar Lealta para múltiples negocios?",
                a: "¡Absolutamente! El plan está diseñado para empresarios con múltiples establecimientos. Cada negocio paga $250/mes independientemente del tamaño."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="font-semibold mb-3 text-purple-300">{faq.q}</h3>
                <p className="text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/30">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              ¿Listo para revolucionar tu negocio?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Únete a los empresarios que ya están transformando sus negocios con Lealta.
              Comienza hoy y ve la diferencia desde el primer día.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartTrial}
              disabled={isProcessing || paddleLoading}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                isProcessing || paddleLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-purple-500/25'
              }`}
            >
              <div className="flex items-center gap-2">
                {isProcessing || paddleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Comenzar Ahora
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Modal de Registro/Login */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {modalMode === 'signup' ? '🚀 Crear Cuenta' : '🔐 Iniciar Sesión'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Formulario */}
              <div className="space-y-4">
                {modalMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Nombre del Negocio
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="Restaurante El Sabor"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Users className="w-4 h-4 inline mr-2" />
                        Tu Nombre
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Juan Pérez"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Botones de acción */}
                {modalMode === 'signup' ? (
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={() => handleSignup(false)}
                      disabled={isProcessing || !formData.email || !formData.password || !formData.name || !formData.businessName}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🎉 Comenzar con 14 Días Gratis
                    </button>

                    <button
                      onClick={() => handleSignup(true)}
                      disabled={isProcessing || !formData.email || !formData.password || !formData.name || !formData.businessName}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      Pagar Ahora ($250/mes)
                    </button>

                    <p className="text-center text-sm text-gray-400 mt-4">
                      ¿Ya tienes cuenta?{' '}
                      <button
                        onClick={() => setModalMode('login')}
                        className="text-purple-400 hover:text-purple-300 underline"
                      >
                        Inicia sesión
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={handleLogin}
                      disabled={isProcessing || !formData.email || !formData.password}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Iniciando...
                        </div>
                      ) : (
                        'Iniciar Sesión'
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-400 mt-4">
                      ¿No tienes cuenta?{' '}
                      <button
                        onClick={() => setModalMode('signup')}
                        className="text-purple-400 hover:text-purple-300 underline"
                      >
                        Crear cuenta
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
