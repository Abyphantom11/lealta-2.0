'use client';

import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, Home, Mail } from 'lucide-react';
import Link from 'next/link';

/**
 * ❌ PÁGINA: Billing Cancel
 * 
 * Página cuando el usuario cancela el proceso de pago
 */

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-700"
      >
        {/* Cancel Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center"
        >
          <XCircle className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-4"
        >
          Pago Cancelado
        </motion.h1>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-8"
        >
          <p className="text-gray-300">
            No te preocupes, no se realizó ningún cargo.
          </p>
          
          <p className="text-gray-400 text-sm">
            Puedes intentar de nuevo cuando estés listo o contactarnos si tienes alguna pregunta.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <Link href="/pricing" className="block">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-emerald-600 hover:to-green-600 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver a Planes</span>
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

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-6 border-t border-gray-700"
        >
          <p className="text-gray-400 text-sm mb-3">
            ¿Necesitas ayuda con tu suscripción?
          </p>
          
          <a 
            href="mailto:support@lealta.app" 
            className="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-semibold text-sm"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contáctanos
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
