'use client';

import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { LealtaLogo } from '../LealtaLogo';
import PWAInstallButton from './PWAInstallButton';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  return (
    <header className={`relative z-50 ${className}`}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo - Esquina superior izquierda */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center space-x-3"
          >
            <LealtaLogo size={40} className="text-white" animated />
            <span className="text-white font-bold text-xl">
              lealta
            </span>
          </motion.div>

          {/* Botones de autenticación - Esquina superior derecha */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            {/* Botón de Iniciar Sesión */}
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-4 py-2 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-all duration-200"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </motion.button>
            </Link>

            {/* Botón de Registrarse */}
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Registrarse
              </motion.button>
            </Link>

            {/* PWA Install Button */}
            <div className="relative">
              <PWAInstallButton position="top-right" theme="dark" />
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
