'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * 🧪 PÁGINA DE PRUEBA: Paddle Integration
 * 
 * Página para probar la integración de Paddle
 */

export default function PaddleTestPage() {
  const [testData, setTestData] = useState({
    businessId: 'test-business-123',
    customerEmail: 'test@lealta.app',
    customerName: 'Usuario de Prueba'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🧪 Prueba de Integración Paddle
          </h1>
          <p className="text-gray-400 text-lg">
            Página de prueba para verificar la integración con Paddle
          </p>
        </motion.div>

        {/* Test Content */}
        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Test Data</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Business ID</label>
              <input
                type="text"
                value={testData.businessId}
                onChange={(e) => setTestData(prev => ({ ...prev, businessId: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Customer Email</label>
              <input
                type="email"
                value={testData.customerEmail}
                onChange={(e) => setTestData(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Customer Name</label>
              <input
                type="text"
                value={testData.customerName}
                onChange={(e) => setTestData(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              />
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <p className="text-yellow-300">
              ⚠️ Esta es una página de prueba. La integración completa está en /pricing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
