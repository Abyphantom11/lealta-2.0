'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * 🎉 COMPONENTE: Billing Success Content
 * 
 * Contenido de la página de éxito después de completar un pago con Paddle
 */

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Registrar evento de conversión para analytics
    if (typeof globalThis !== 'undefined' && globalThis.window && (globalThis.window as any).gtag) {
      let planValue = 250; // Enterprise plan
      
      (globalThis.window as any).gtag('event', 'purchase', {
        transaction_id: sessionId,
        value: planValue,
        currency: 'USD',
        items: [{
          item_id: `lealta_${plan?.toLowerCase()}`,
          item_name: `Lealta ${plan}`,
          category: 'Software',
          quantity: 1,
          price: planValue
        }]
      });
    }

    // Opcional: Redirigir después de unos segundos
    const timer = setTimeout(() => {
      // Auto redirect después de 10 segundos
      // window.location.href = '/dashboard';
    }, 10000);

    return () => clearTimeout(timer);
  }, [plan, sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
        className="max-w-lg w-full"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¡Pago Completado!
            </h1>
            
            <p className="text-xl text-gray-200 mb-2">
              Bienvenido a Lealta Enterprise
            </p>
            
            {plan && (
              <p className="text-lg text-green-300 mb-6">
                Plan: <strong>{plan}</strong>
              </p>
            )}
            
            <p className="text-gray-300 mb-8 leading-relaxed">
              Tu suscripción está activa. Recibirás un email de confirmación con todos los detalles en los próximos minutos.
            </p>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-4"
          >
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-2">Próximos pasos:</h3>
              <ul className="text-gray-300 text-sm space-y-2 text-left">
                <li>• Accede a tu panel de administración</li>
                <li>• Configura tu primer negocio</li>
                <li>• Invita a tu equipo</li>
                <li>• Comienza a recibir reservas</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  href="/dashboard"
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  Ir al Panel de Administración
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  href="/"
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border border-white/20 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Volver al Inicio
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Support Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 pt-6 border-t border-white/10"
          >
            <p className="text-gray-400 text-sm">
              ¿Necesitas ayuda? Contacta nuestro{' '}
              <Link href="/support" className="text-green-400 hover:text-green-300 underline">
                soporte técnico
              </Link>
            </p>
            
            {sessionId && (
              <p className="text-gray-500 text-xs mt-2">
                ID de Transacción: {sessionId}
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}

export default function BillingSuccessClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}
