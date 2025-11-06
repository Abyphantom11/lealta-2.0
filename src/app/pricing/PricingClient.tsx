'use client';

import { useSession } from 'next-auth/react';
import { usePaddle } from '@/hooks/usePaddle';
import { motion } from 'framer-motion';
import { 
  Check, 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface PricingClientProps {
  initialSession: any; // Session inicial del servidor
}

export default function PricingClient({ initialSession }: PricingClientProps) {
  const { data: session } = useSession();
  const { createCheckout, isLoading: paddleLoading, error: paddleError } = usePaddle();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Usar la sesión del cliente si está disponible, sino la inicial del servidor
  const currentSession = session || initialSession;

  // Función para manejar la suscripción con Paddle
  const handleStartTrial = async () => {
    if (!currentSession?.user?.email) {
      // Redirigir a login si no está autenticado
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    // Si Paddle no está configurado, mostrar mensaje
    if (paddleError) {
      alert('⚠️ Paddle aún no está configurado.\n\nPara activar los pagos, sigue la guía: PADDLE_TESTING_GUIDE.md');
      return;
    }

    try {
      setIsProcessing(true);
      
      await createCheckout({
        priceId: process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID || 'pri_lealta_enterprise_plan',
        businessId: currentSession.user.businessId || 'temp_business_id',
        customerEmail: currentSession.user.email,
        customerName: currentSession.user.name || '',
        successUrl: `${window.location.origin}/billing/success?plan=ENTERPRISE`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
      });
    } catch (error) {
      console.error('Error iniciando suscripción:', error);
      alert('Error al procesar el pago. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
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
                  <Link href="/login?redirect=/pricing" className="text-purple-400 hover:text-purple-300">
                    Inicia sesión aquí
                  </Link>
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
    </div>
  );
}
