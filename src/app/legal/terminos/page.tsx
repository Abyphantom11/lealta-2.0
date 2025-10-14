'use client';

import { motion } from '../../../components/motion';
import { ArrowLeft, FileText, Shield } from 'lucide-react';
import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500/30 rounded-full blur-2xl" />
        </div>
        
        <div className="relative container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
              <FileText className="w-4 h-4 mr-2" />
              Marco Legal
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Términos y Condiciones
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Marco legal que rige el uso de la plataforma lealta
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

          {/* Contenido de términos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-white" />
                  <h2 className="text-white font-semibold text-xl">
                    Términos y Condiciones - lealta
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="p-8 md:p-12 prose prose-slate max-w-none">
              {/* Introducción */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
                <p className="text-gray-700 leading-relaxed">
                  Al acceder y utilizar lealta (&quot;el Servicio&quot;), usted acepta estar sujeto a estos Términos y Condiciones. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro Servicio.
                </p>
              </section>

              {/* User Accounts */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Cuentas de Usuario</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Cuando crea una cuenta con nosotros, debe proporcionar información precisa, completa y actualizada según lo 
                  requiera el formulario de registro. El incumplimiento de esta obligación constituye una violación de estos 
                  Términos, lo que puede resultar en la terminación inmediata de su cuenta.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Usted es responsable de salvaguardar la contraseña que utiliza para acceder al Servicio y de cualquier actividad 
                  o acción realizada bajo su contraseña, ya sea que su contraseña esté asociada con nuestro Servicio o con un servicio 
                  de terceros.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Acepta no divulgar su contraseña a terceros. Debe notificarnos inmediatamente al tener conocimiento de cualquier 
                  violación de seguridad o uso no autorizado de su cuenta.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Al crear una cuenta, usted consiente la recopilación y el uso de su información personal de acuerdo con nuestra 
                  Política de Privacidad.
                </p>
              </section>

              {/* Payments */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Pagos</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Todos los pagos y suscripciones realizados a través de nuestra plataforma son procesados de manera segura por 
                  nuestro socio de pagos, <strong>Paddle</strong>. Al realizar una compra a través de nuestro sitio web, usted 
                  acepta los Términos del Comprador y la Política de Privacidad de Paddle.
                </p>
              </section>

              {/* Refund Policy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Política de Reembolso</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Tiene derecho a solicitar un reembolso dentro de los 14 días posteriores a la compra, siempre que el servicio no 
                  haya sido utilizado o consumido completamente. Las solicitudes de reembolso pueden realizarse contactándonos en{' '}
                  <a href="mailto:support@lealta.app" className="text-blue-600 hover:text-blue-700 font-medium">
                    support@lealta.app
                  </a>.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Los reembolsos se procesarán de acuerdo con los Términos del Comprador de Paddle, que se aplican a todas las 
                  transacciones.
                </p>
              </section>

              {/* Uso del Servicio */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Uso del Servicio</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Usted se compromete a utilizar el Servicio únicamente para fines legales y de acuerdo con estos Términos. 
                  Acepta no utilizar el Servicio:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>De cualquier manera que viole cualquier ley o regulación aplicable</li>
                  <li>Para transmitir material publicitario o promocional no solicitado</li>
                  <li>Para suplantar o intentar suplantar a otra persona o entidad</li>
                  <li>Para interferir o interrumpir el Servicio o los servidores o redes conectados al Servicio</li>
                </ul>
              </section>

              {/* Propiedad Intelectual */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propiedad Intelectual</h2>
                <p className="text-gray-700 leading-relaxed">
                  El Servicio y todo su contenido, características y funcionalidades son propiedad de lealta y están protegidos 
                  por derechos de autor, marcas registradas y otras leyes de propiedad intelectual.
                </p>
              </section>

              {/* Limitación de Responsabilidad */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitación de Responsabilidad</h2>
                <p className="text-gray-700 leading-relaxed">
                  En ningún caso lealta, sus directores, empleados, socios, agentes, proveedores o afiliados serán responsables 
                  de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluida la pérdida de beneficios, 
                  datos, uso o cualquier otra pérdida intangible.
                </p>
              </section>

              {/* Modificaciones */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modificaciones de los Términos</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es 
                  material, intentaremos proporcionar un aviso con al menos 30 días de anticipación antes de que los nuevos 
                  términos entren en vigor.
                </p>
              </section>

              {/* Contacto */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contacto</h2>
                <p className="text-gray-700 leading-relaxed">
                  Si tiene preguntas sobre estos Términos, puede contactarnos en:
                </p>
                <ul className="list-none text-gray-700 space-y-2 mt-4">
                  <li>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:support@lealta.app" className="text-blue-600 hover:text-blue-700">
                      support@lealta.app
                    </a>
                  </li>
                  <li>
                    <strong>Email legal:</strong>{' '}
                    <a href="mailto:legal@lealta.app" className="text-blue-600 hover:text-blue-700">
                      legal@lealta.app
                    </a>
                  </li>
                </ul>
              </section>

              {/* Footer de referencia TermsFeed */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Documento generado y respaldado por{' '}
                  <a 
                    href="https://www.termsfeed.com/live/fe733ddd-127d-4c4e-92b1-04648f07c8e0" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    TermsFeed
                  </a>
                </p>
              </div>
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
                Para consultas sobre estos términos, contacta a: support@lealta.app
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
