'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * 🎉 PÁGINA: Billing Success
 * 
 * Página de éxito después de completar un pago con Paddle
 */

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Registrar evento de conversión para analytics
    if (typeof globalThis !== 'undefined' && globalThis.window && (globalThis.window as any).gtag) {
      let planValue = 29; // Default starter
      if (plan === 'PROFESSIONAL') planValue = 79;
      if (plan === 'ENTERPRISE') planValue = 199;
      
      (globalThis.window as any).gtag('event', 'purchase', {
        transaction_id: sessionId,
        value: planValue,
        currency: 'USD',
        items: [{
          item_id: plan,
          item_name: `Plan ${plan}`,
          category: 'Subscription',
          quantity: 1,
        }]
      });
    }

    // Mostrar confirmación
    console.log('✅ Pago completado exitosamente:', { plan, sessionId });
  }, [plan, sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-gray-900 to-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-4"
        >
          ¡Pago Exitoso!
        </motion.h1>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-8"
        >
          <p className="text-gray-300">
            Tu suscripción ha sido activada correctamente.
          </p>
          
          {plan && (
            <p className="text-emerald-400 font-semibold">
              Plan {plan.charAt(0) + plan.slice(1).toLowerCase()} activado
            </p>
          )}

          <p className="text-gray-400 text-sm">
            Recibirás un email de confirmación en breve.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <Link href="/admin" className="block">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-emerald-600 hover:to-green-600 transition-all duration-200"
            >
              <span>Ir al Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>

          <Link href="/" className="block">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-gray-600 transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              <span>Volver al Inicio</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Session Info */}
        {sessionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 pt-6 border-t border-gray-700"
          >
            <p className="text-gray-500 text-xs">
              ID de transacción: {sessionId}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
