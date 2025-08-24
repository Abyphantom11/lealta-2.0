'use client';

import Link from 'next/link';
import { Star, Users, ShoppingBag, BarChart3, Monitor, Globe } from 'lucide-react';
import { PlatformAware, useElectron } from '../components/ElectronProvider';
import { DesktopTitleBar } from '../components/DesktopUI';

export default function HomePage() {
  const { isElectron } = useElectron();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      {/* Desktop Title Bar - Only shown in Electron */}
      <DesktopTitleBar />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center">
            {isElectron ? <Monitor className="w-12 h-12 text-white" /> : <Star className="w-12 h-12 text-white" />}
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Bienvenido a <span className="gradient-primary bg-clip-text text-transparent">Lealta</span>
          </h1>
          
          <PlatformAware
            desktop={
              <p className="text-xl text-dark-400 mb-12 max-w-2xl mx-auto">
                <span className="inline-flex items-center px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm mb-4">
                  <Monitor className="w-4 h-4 mr-2" />
                  Aplicación de Escritorio
                </span>
                <br />
                Sistema integral de gestión para personal administrativo.
                Gestiona clientes, consumos y analytics desde tu escritorio.
              </p>
            }
            web={
              <p className="text-xl text-dark-400 mb-12 max-w-2xl mx-auto">
                <span className="inline-flex items-center px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-full text-sm mb-4">
                  <Globe className="w-4 h-4 mr-2" />
                  Plataforma Web
                </span>
                <br />
                Sistema integral de captación y control de clientes para bares, restaurantes y discotecas.
                Registra antes del consumo, captura antes del cobro.
              </p>
            }
          />
        </div>

        {/* Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <AccessCard
            title="Portal Cliente"
            description="Experiencia premium para clientes"
            icon={<Users className="w-8 h-8" />}
            href="/portal"
            gradient="from-primary-600 to-blue-600"
          />
          
          <AccessCard
            title="Staff Portal"
            description="Captura de consumo pre-pago"
            icon={<ShoppingBag className="w-8 h-8" />}
            href="/staff"
            gradient="from-success-600 to-green-600"
          />
          
          <AccessCard
            title="Admin Panel"
            description="Gestión de portal y loyalty"
            icon={<BarChart3 className="w-8 h-8" />}
            href="/admin"
            gradient="from-purple-600 to-pink-600"
          />
          
          <AccessCard
            title="Super Admin"
            description="Analytics y control total"
            icon={<Star className="w-8 h-8" />}
            href="/superadmin"
            gradient="from-warning-600 to-orange-600"
          />
        </div>

        {/* Features */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Características Principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <FeatureCard
              title="Registro Pre-Consumo"
              description="Los clientes se registran antes de consumir para acceder al portal premium"
            />
            <FeatureCard
              title="OCR de Tickets"
              description="Captura automática de consumos mediante reconocimiento óptico de tickets"
            />
            <FeatureCard
              title="Control de Riesgo"
              description="Trazabilidad completa de clientes y comportamiento de pago"
            />
          </div>
        </div>

        {/* Login Button */}
        <div className="mt-16 text-center">
          <Link 
            href="/login"
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Acceso Backoffice
          </Link>
        </div>
      </div>
    </div>
  );
}

function AccessCard({ title, description, icon, href, gradient }: Readonly<{
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
}>) {
  return (
    <Link href={href}>
      <div className="premium-card cursor-pointer group">
        <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-dark-400 text-sm">{description}</p>
      </div>
    </Link>
  );
}

function FeatureCard({ title, description }: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <div className="p-6 bg-dark-800/50 rounded-lg border border-dark-700">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <p className="text-dark-400 text-sm">{description}</p>
    </div>
  );
}
