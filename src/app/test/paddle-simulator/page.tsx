'use client';

import { motion } from 'framer-motion';

/**
 * 🧪 PÁGINA DE PRUEBA: Paddle Simulator
 * 
 * Simulador de Paddle para pruebas
 */

export default function PaddleSimulatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🎛️ Simulador Paddle
          </h1>
          <p className="text-gray-400 text-lg">
            Herramienta para simular eventos y transacciones de Paddle
          </p>
        </motion.div>

        {/* Simulator Content */}
        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Simulador en Desarrollo</h2>
          <p className="text-gray-300 mb-6">
            Esta herramienta permitirá simular diferentes eventos de Paddle para probar la integración.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <h3 className="text-blue-300 font-semibold mb-2">Funcionalidades Planeadas:</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Simular webhooks de Paddle</li>
                <li>• Probar diferentes estados de suscripción</li>
                <li>• Validar flujos de pago</li>
                <li>• Testear eventos de facturación</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
              <p className="text-green-300">
                ✅ Para usar Paddle, visita la página principal de pricing: /pricing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
