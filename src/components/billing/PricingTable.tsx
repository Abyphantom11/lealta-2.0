'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { usePaddle, usePaddlePlans } from '@/hooks/usePaddle';
import PaddlePaymentButton from './PaddlePaymentButton';

/**
 * 💳 COMPONENTE: PricingTable
 * 
 * Tabla de precios con integración de Paddle para Lealta 2.0
 */

interface PricingTableProps {
  businessId?: string;
  customerEmail?: string;
  customerName?: string;
  onPlanSelected?: (planId: string) => void;
}

const planIcons = {
  STARTER: Star,
  PROFESSIONAL: Zap,
  ENTERPRISE: Crown,
};

const planColors = {
  STARTER: 'from-blue-500 to-cyan-500',
  PROFESSIONAL: 'from-purple-500 to-pink-500',
  ENTERPRISE: 'from-yellow-500 to-orange-500',
};

export default function PricingTable({ 
  businessId, 
  customerEmail, 
  customerName,
  onPlanSelected 
}: PricingTableProps) {
  // Ya no necesitamos el hook usePaddle - usamos Payment Links directo
  const { plans } = usePaddlePlans();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  return (
    <div className="py-12 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Planes que se adaptan a tu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              crecimiento
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto"
          >
            Desde restaurantes pequeños hasta cadenas enterprise. 
            Facturación automática con Paddle.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(plans).map(([key, plan], index) => {
            const Icon = planIcons[key as keyof typeof planIcons];
            const isPopular = key === 'PROFESSIONAL';
            const isLoading = loadingPlan === key;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 
                  rounded-2xl p-8 text-center hover:bg-gray-800/70 
                  transition-all duration-300 hover:scale-105
                  ${isPopular ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-400/20' : ''}
                `}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-black px-4 py-1 rounded-full text-sm font-semibold">
                      Más Popular
                    </span>
                  </div>
                )}

                {/* Plan Icon */}
                <div className={`
                  inline-flex p-3 rounded-full bg-gradient-to-r ${planColors[key as keyof typeof planColors]} 
                  mb-6
                `}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                
                {/* Plan Description */}
                <p className="text-gray-400 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={`${key}-feature-${idx}`} className="flex items-center text-gray-300">
                      <Check className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button - Payment Link directo (evita 403) */}
                <PaddlePaymentButton
                  priceId={plan.id}
                  businessId={businessId}
                  customerEmail={customerEmail}
                  customerName={customerName}
                  buttonText={isLoading ? 'Procesando...' : 'Seleccionar Plan'}
                  className={`
                    w-full py-3 px-6 rounded-lg font-semibold text-white
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    ${isPopular 
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                    }
                  `}
                />

                {/* Additional Info */}
                <p className="text-gray-500 text-sm mt-4">
                  Cancela cuando quieras • Soporte incluido
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-4">
            ¿Necesitas algo personalizado? 
          </p>
          <button className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Contáctanos para planes enterprise
          </button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center items-center space-x-8 mt-12 text-gray-500"
        >
          <div className="flex items-center">
            <Check className="w-5 h-5 text-emerald-400 mr-2" />
            <span>Pagos seguros con Paddle</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-emerald-400 mr-2" />
            <span>Sin contratos largos</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-emerald-400 mr-2" />
            <span>Soporte 24/7</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
