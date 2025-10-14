'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SimplePWAButton from './SimplePWAButton';

interface AuthHeaderProps {
  showBackButton?: boolean;
  className?: string;
}

export default function AuthHeader({ showBackButton = true, className = '' }: Readonly<AuthHeaderProps>) {
  return (
    <header className={`relative z-50 ${className}`}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Botón de regresar - Esquina superior izquierda */}
          {showBackButton && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 text-gray-300 hover:text-white bg-gray-800/70 hover:bg-gray-700/80 border border-gray-600/80 hover:border-gray-500 rounded-lg transition-all duration-200 group backdrop-blur-sm shadow-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Volver al inicio
              </Link>
            </motion.div>
          )}

          {/* Espacio para mantener layout */}
          <div className="invisible">
            <span>placeholder</span>
          </div>

          {/* PWA Install Button - Esquina superior derecha */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <SimplePWAButton position="top-right" />
          </motion.div>
        </div>
      </div>
    </header>
  );
}
