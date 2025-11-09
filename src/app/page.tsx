'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  Brain, 
  Building2, 
  CheckCircle, 
  Globe, 
  Rocket, 
  Sparkles, 
  Star, 
  TrendingUp, 
  Users, 
  Zap 
} from 'lucide-react';
import { motion } from '../components/motion';
import { DesktopTitleBar } from '../components/DesktopUI';
import Footer from '../components/ui/Footer';
import Header from '../components/ui/Header';
import CookieBanner from '../components/ui/CookieBanner';

// ========================================
// 🎨 COMPONENTES AUXILIARES PREMIUM
// ========================================

function StatCard({ number, label }: Readonly<{ number: string; label: string }>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-3xl md:text-4xl font-bold text-white mb-2">{number}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </motion.div>
  );
}

function ValueCard({
  icon,
  title,
  description,
  gradient
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="group relative p-8 bg-gray-800/50 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300"
    >
      <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function ModuleCard({
  icon,
  title,
  description,
  features
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="group p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 hover:bg-gray-800/50"
    >
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 text-sm mb-4 leading-relaxed">{description}</p>
      <div className="space-y-2">
        {features.map((feature) => (
          <div key={feature} className="flex items-center text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
            <span className="text-gray-300">{feature}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Componente separado para manejar searchParams
function PaddleTransactionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detectar si viene de un pago exitoso de Paddle
  useEffect(() => {
    if (!searchParams) return;
    
    const paddleTransaction = searchParams.get('_ptxn');
    
    if (paddleTransaction) {
      console.log('✅ Transacción de Paddle detectada:', paddleTransaction);
      
      // Mostrar mensaje de éxito
      const showSuccessMessage = () => {
        // Intentar redirigir al admin si el usuario está logueado
        // Si no, mostrar mensaje genérico
        alert('🎉 ¡Pago procesado exitosamente!\n\nTu suscripción se activará en unos momentos.\n\nPuedes cerrar esta ventana y verificar tu estado en el panel de administración.');
        
        // Limpiar la URL
        router.replace('/');
      };
      
      showSuccessMessage();
    }
  }, [searchParams, router]);

  return null;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Desktop Title Bar - Only shown in Electron */}
      <DesktopTitleBar />

      {/* Header con navegación */}
      <Header />

      {/* Manejar transacciones de Paddle con Suspense */}
      <Suspense fallback={null}>
        <PaddleTransactionHandler />
      </Suspense>

      {/* Hero Section Premium */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Platform Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium mb-8"
            >
              <Globe className="w-4 h-4 mr-2" />
              Plataforma Web Enterprise
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Plataforma de{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Inteligencia
              </span>
              <br />
              y{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Escalabilidad
              </span>
              <br />
              Comercial
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Transforma tu negocio en una organización{' '}
              <span className="text-white font-semibold">data-driven</span> con
              inteligencia artificial, análisis predictivo y escalabilidad sin límites.
              <br />
              <span className="text-emerald-400 font-medium">
                Diseñada para crecer contigo, desde el primer día.
              </span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center text-xl"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  Comenzar Prueba Gratis
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-gray-400 hover:text-white transition-all duration-300 flex items-center text-lg"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Rocket className="w-5 h-5 mr-2" />
                Conocer Más
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            <StatCard number="IA" label="Nativa Incluida" />
            <StatCard number="24h" label="Para Implementar" />
            <StatCard number="∞" label="Escalabilidad" />
            <StatCard number="100%" label="Personalizable" />
          </motion.div>
        </div>
      </div>

      {/* Value Proposition Section */}
      <div id="features" className="py-20 bg-gradient-to-b from-gray-900/50 to-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Tu negocio está listo para{' '}
              <span className="text-blue-400">crecer sin límites?</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Una plataforma construida pensando en el crecimiento.
              Tecnología avanzada con la simplicidad que necesitas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValueCard
              icon={<Brain className="w-8 h-8" />}
              title="IA Enterprise-Grade"
              description="Reconocimiento automático de productos, análisis predictivo y automatización inteligente incluida desde el primer día."
              gradient="from-blue-500 to-purple-600"
            />
            <ValueCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Escalabilidad Sin Límites"
              description="De 1 a 1000+ ubicaciones en la misma plataforma. Crecer sin cambiar de sistema."
              gradient="from-emerald-500 to-teal-600"
            />
            <ValueCard
              icon={<Zap className="w-8 h-8" />}
              title="Implementación Instantánea"
              description="Setup en 24 horas, no meses. Tu equipo productivo desde el primer día."
              gradient="from-orange-500 to-red-600"
            />
          </div>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Módulos que{' '}
              <span className="text-emerald-400">crecen contigo</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Arquitectura modular enterprise que se adapta a tu crecimiento empresarial
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModuleCard
              icon={<Users className="w-6 h-6" />}
              title="Staff Intelligence"
              description="IA para reconocimiento de productos y automatización de procesos"
              features={["OCR Avanzado", "IA Predictiva", "Automatización"]}
            />
            <ModuleCard
              icon={<Star className="w-6 h-6" />}
              title="Customer Experience"
              description="Experiencia premium para tus clientes más exigentes"
              features={["Portal Premium", "Fidelización IA", "Analytics 360°"]}
            />
            <ModuleCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Business Analytics"
              description="Dashboards enterprise con insights accionables"
              features={["Dashboards Real-time", "Predictive Analytics", "ROI Tracking"]}
            />
            <ModuleCard
              icon={<Building2 className="w-6 h-6" />}
              title="Multi-Location"
              description="Control centralizado de operaciones distribuidas"
              features={["Control Central", "Reporting Global", "Escalabilidad"]}
            />
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="py-20 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Listo para{' '}
              <span className="text-blue-400">transformar tu negocio?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Plataforma diseñada para escalar sin límites.
              Tu negocio merece herramientas de siguiente nivel.
            </p>
            
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center mx-auto text-xl"
              >
                <Sparkles className="w-6 h-6 mr-3" />
                Comenzar Ahora
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <Footer variant="full" />
      
      {/* Cookie Banner - Solo en landing page */}
      <CookieBanner position="from-logo" theme="dark" />
    </div>
  );
}
