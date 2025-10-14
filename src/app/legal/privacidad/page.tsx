'use client';

import { motion } from '../../../components/motion';
import { ArrowLeft, Shield, Lock, Globe } from 'lucide-react';
import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900/20 via-teal-900/20 to-cyan-900/20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/30 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-teal-500/30 rounded-full blur-2xl" />
        </div>
        
        <div className="relative container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium mb-6">
              <Lock className="w-4 h-4 mr-2" />
              Privacidad y Seguridad
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Políticas de Privacidad
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Protección y manejo responsable de tus datos personales
            </p>
          </motion.div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Botón de regreso */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link
              href="/"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Volver al inicio
            </Link>
          </motion.div>

          {/* Iframe responsive */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-white" />
                  <h2 className="text-white font-semibold text-lg">
                    Políticas de Privacidad - lealta
                  </h2>
                </div>
                <a
                  href="https://www.termsfeed.com/live/3339968f-08f6-4f95-878b-aab473a50971"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div className="relative" style={{ paddingBottom: '75%' }}>
              <iframe
                src="https://www.termsfeed.com/live/3339968f-08f6-4f95-878b-aab473a50971"
                className="absolute top-0 left-0 w-full h-full border-0"
                title="Políticas de Privacidad"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Footer del documento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <p className="text-gray-400 text-sm">
                Última actualización: {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Para consultas sobre privacidad, contacta a: privacidad@lealta.com
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
