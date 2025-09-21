'use client';

import { Heart, Globe, Shield, FileText, Mail, Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

interface FooterProps {
  variant?: 'minimal' | 'full';
  className?: string;
}

export default function Footer({ variant = 'minimal', className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className={`bg-gray-950/80 backdrop-blur-sm border-t border-gray-800 ${className}`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            {/* Enlaces legales */}
            <div className="flex items-center space-x-6 text-sm">
              <Link 
                href="/legal/terminos" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Términos
              </Link>
              <Link 
                href="/legal/privacidad" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacidad
              </Link>
              <span className="text-gray-500">
                © {currentYear} lealta
              </span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Footer completo para landing page
  return (
    <footer className={`bg-gradient-to-b from-gray-900 to-gray-950 border-t border-gray-800 ${className}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Marca */}
          <div className="col-span-1">
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Plataforma de inteligencia comercial diseñada para escalar sin límites.
            </p>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>Hecho con</span>
              <Heart className="w-3 h-3 text-red-500" />
              <span>para emprendedores</span>
            </div>
          </div>

          {/* Producto */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Plataforma</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/signup" className="text-gray-400 hover:text-white transition-colors">
                  Comenzar gratis
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <span className="text-gray-500">Documentación</span>
              </li>
              <li>
                <span className="text-gray-500">API</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/legal/terminos" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  <FileText className="w-3 h-3 mr-2" />
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/privacidad" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  <Shield className="w-3 h-3 mr-2" />
                  Políticas de Privacidad
                </Link>
              </li>
              <li>
                <span className="text-gray-500 flex items-center">
                  <Globe className="w-3 h-3 mr-2" />
                  Términos de Servicio
                </span>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="mailto:hola@lealta.com" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                >
                  <Mail className="w-3 h-3 mr-2" />
                  hola@lealta.com
                </a>
              </li>
            </ul>
            
            {/* Redes sociales */}
            <div className="flex items-center space-x-3 mt-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-gray-500 text-sm">
              © {currentYear} lealta. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Versión 2.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
