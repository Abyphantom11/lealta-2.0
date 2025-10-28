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

/**
 * 💰 PÁGINA: Pricing
 * 
 * Página principal de precios con integración de Paddle
 */

export default function PricingPage() {
  const { data: session } = useSession();
  const { createCheckout, isLoading: paddleLoading } = usePaddle();
  const [isProcessing, setIsProcessing] = useState(false);
  // Función para manejar la suscripción con Paddle
  const handleStartTrial = async () => {
    if (!session?.user?.email) {
      // Redirigir a login si no está autenticado
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    try {
      setIsProcessing(true);
      
      await createCheckout({
        priceId: process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID || 'pri_lealta_enterprise_plan', // Plan único Enterprise
        businessId: session.user.businessId || 'temp_business_id',
        customerEmail: session.user.email,
        customerName: session.user.name || '',
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
    { feature: 'Analytics Avanzado', lealta: true, others: '$299/mes' },
    { feature: 'Fidelización & Gamificación', lealta: true, others: '$599/mes' },
    { feature: 'Clientes + Reservas Ilimitados', lealta: true, others: false },
    { feature: 'Staff Ilimitado', lealta: true, others: '5 usuarios' },
    { feature: 'Sistema de Promotores', lealta: true, others: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Lealta
            </Link>
            <Link 
              href="/login" 
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium">
              ✨ Solución personalizada exclusiva
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Lealta Enterprise
            <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Solución Personalizada
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            <strong className="text-white">Software exclusivo para su organización.</strong>
            <br />
            Gestione múltiples negocios con una plataforma empresarial a medida.
          </p>
        </motion.div>

        {/* Main Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-20"
        >
          <div className="relative max-w-2xl mx-auto">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-3xl opacity-30 animate-pulse"></div>
            
            {/* Card */}
            <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-purple-500/30 shadow-2xl">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold shadow-lg flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  ENTERPRISE EXCLUSIVO
                </span>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Lealta Enterprise</h2>
                <p className="text-gray-400">Solución personalizada para múltiples negocios</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-6xl md:text-7xl font-bold text-white">$250</span>
                  <div className="text-left">
                    <div className="text-gray-400 text-sm">USD</div>
                    <div className="text-gray-400 text-sm">/ negocio</div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
                  <span className="text-purple-400 font-medium">Software personalizado exclusivo</span>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                      <feature.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium mb-1">{feature.text}</div>
                      <div className="text-gray-400 text-sm">{feature.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartTrial}
                  disabled={isProcessing || paddleLoading}
                  className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      {session?.user ? 'Contratar Solución Enterprise' : 'Iniciar Sesión para Continuar'}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>

                <Link href="/test/paddle" className="block">
                  <button className="w-full px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors">
                    Contactar para Demo Personalizada
                  </button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-6 border-t border-white/10 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Sin tarjeta de crédito para probar</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>Cancela cuando quieras, sin preguntas</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-20"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Tu inversión vs lo que obtienes
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20">
                <div className="text-4xl font-bold text-red-400 mb-2">$99</div>
                <div className="text-white font-medium mb-2">Tu inversión</div>
                <div className="text-gray-400 text-sm">por mes</div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-purple-400" />
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                <div className="text-4xl font-bold text-green-400 mb-2">$1,496</div>
                <div className="text-white font-medium mb-2">Valor real</div>
                <div className="text-gray-400 text-sm">en herramientas equivalentes</div>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20">
              <div className="text-center text-gray-300">
                <p className="mb-2">
                  <strong className="text-white">Ahorro: 94.5% vs comprar cada sistema por separado</strong>
                </p>
                <p className="text-sm">
                  Reemplaza OpenTable ($449) + Yotpo ($599) + OCR Tools ($50) + Analytics ($299) + más
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mb-20"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Lealta vs Otros Sistemas
            </h2>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-800/50 backdrop-blur-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-gray-400 font-medium">Características</th>
                    <th className="px-6 py-4 text-center text-white font-bold bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Lealta
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-gray-400 font-medium">Competencia</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonItems.map((item, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-gray-300">{item.feature}</td>
                      <td className="px-6 py-4 text-center">
                        {item.lealta === true ? (
                          <div className="flex items-center justify-center">
                            <div className="p-2 rounded-full bg-green-500/20">
                              <Check className="w-5 h-5 text-green-400" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-white font-medium">{item.lealta}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500">
                        {item.others === true ? (
                          <Check className="w-5 h-5 text-gray-500 mx-auto" />
                        ) : item.others === false ? (
                          <span className="text-2xl">✗</span>
                        ) : (
                          <span className="text-yellow-500 font-medium">{item.others}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                    <td className="px-6 py-4 text-white font-bold">Precio mensual TOTAL</td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-2xl font-bold text-green-400">$99</div>
                      <div className="text-xs text-gray-400">todo incluido</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-xl font-bold text-red-400">$1,496+</div>
                      <div className="text-xs text-gray-400">5+ suscripciones</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mb-20"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Preguntas Frecuentes
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: '¿Puedo cancelar en cualquier momento?',
                  a: 'Sí, absolutamente. No hay contratos ni compromisos a largo plazo. Cancela cuando quieras con un solo clic.',
                },
                {
                  q: '¿Hay costos ocultos o cargos adicionales?',
                  a: 'No. $99/mes incluye TODO. Sin límites, sin cargos por features adicionales, sin sorpresas.',
                },
                {
                  q: '¿Qué pasa si necesito más de lo que ofrece el plan?',
                  a: 'El plan incluye TODO sin límites: clientes ilimitados, reservas ilimitadas, usuarios ilimitados. No hay "más" que necesitar.',
                },
                {
                  q: '¿Ofrecen garantía de devolución?',
                  a: 'Sí, 30 días de garantía. Si no estás satisfecho, te devolvemos el 100% de tu dinero sin preguntas.',
                },
                {
                  q: '¿Necesito conocimientos técnicos?',
                  a: 'No. Lealta está diseñado para ser súper intuitivo. Si puedes usar WhatsApp, puedes usar Lealta. Además, nuestro equipo te ayuda con el setup inicial.',
                },
                {
                  q: '¿Qué incluye el soporte prioritario?',
                  a: 'Respuestas en menos de 24 horas, ayuda con configuración, capacitación de tu equipo y acceso directo a nuestro equipo técnico.',
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <h3 className="text-white font-bold mb-2 flex items-start gap-2">
                    <span className="text-purple-400 flex-shrink-0">Q:</span>
                    {faq.q}
                  </h3>
                  <p className="text-gray-400 pl-6">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-center"
        >
          <div className="max-w-3xl mx-auto p-12 rounded-3xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 backdrop-blur-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Elimina 5 suscripciones. Ahorra $16,884/año. Una sola plataforma.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl shadow-2xl shadow-purple-500/50 inline-flex items-center gap-3"
            >
              <Zap className="w-6 h-6" />
              Empezar prueba gratuita
              <ArrowRight className="w-6 h-6" />
            </motion.button>
            <p className="mt-4 text-gray-400 text-sm">
              14 días gratis • Sin tarjeta de crédito • Cancela cuando quieras
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2025 Lealta. Todos los derechos reservados.</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <Link href="/terms" className="hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
