export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Última actualización:</strong> 1 de octubre de 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información que Recopilamos</h2>
            <p className="text-gray-700 mb-4">
              En Lealta 2.0, recopilamos y procesamos la siguiente información para brindarte nuestros servicios:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Información de cuenta:</strong> Nombre, correo electrónico, teléfono</li>
              <li><strong>Información de reservas:</strong> Datos de contacto, número de personas, fechas y horarios</li>
              <li><strong>Códigos QR:</strong> Códigos únicos generados para tus reservas</li>
              <li><strong>Datos de uso:</strong> Información sobre cómo utilizas nuestra aplicación</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Uso de la Cámara</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-900">
                <strong>¿Por qué necesitamos acceso a tu cámara?</strong>
              </p>
              <p className="text-blue-800 mt-2">
                Utilizamos tu cámara únicamente para escanear códigos QR de reservas. Esto nos permite verificar
                tu asistencia de forma rápida y segura.
              </p>
            </div>
            
            <p className="text-gray-700 mb-4">
              <strong>Garantías de privacidad:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>✅ Solo accedemos a la cámara cuando TÚ lo autorizas</li>
              <li>✅ Las imágenes NO se guardan ni se envían a servidores</li>
              <li>✅ Solo procesamos los códigos QR escaneados</li>
              <li>✅ Puedes revocar el permiso en cualquier momento desde tu navegador</li>
              <li>✅ El acceso a la cámara se cierra automáticamente al salir del scanner</li>
            </ul>

            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-900 font-semibold mb-2">Cómo funciona:</p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                <li>Presionas el botón &quot;Escanear QR&quot;</li>
                <li>Tu navegador te pide permiso para usar la cámara</li>
                <li>Autorizas el acceso (solo una vez)</li>
                <li>Escaneamos el código QR</li>
                <li>La cámara se desactiva automáticamente</li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cómo Usamos tu Información</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Gestionar tus reservas y confirmaciones</li>
              <li>Verificar tu asistencia mediante códigos QR</li>
              <li>Mejorar nuestros servicios y experiencia de usuario</li>
              <li>Comunicarnos contigo sobre tus reservas</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Seguridad de tus Datos</h2>
            <p className="text-gray-700 mb-4">
              Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger tu información:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>🔒 Conexiones HTTPS cifradas</li>
              <li>🔐 Autenticación segura</li>
              <li>🛡️ Acceso restringido a datos personales</li>
              <li>💾 Backups regulares</li>
              <li>🔍 Monitoreo de seguridad continuo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Compartir Información</h2>
            <p className="text-gray-700 mb-4">
              <strong>NO vendemos ni compartimos tu información personal con terceros</strong> excepto en las siguientes situaciones:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Con el establecimiento donde hiciste tu reserva</li>
              <li>Cuando sea requerido por ley</li>
              <li>Para proteger nuestros derechos legales</li>
              <li>Con proveedores de servicios que nos ayudan a operar (bajo acuerdos de confidencialidad)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Tus Derechos</h2>
            <p className="text-gray-700 mb-4">
              Tienes derecho a:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>✅ Acceder a tu información personal</li>
              <li>✅ Corregir datos inexactos</li>
              <li>✅ Solicitar la eliminación de tu información</li>
              <li>✅ Oponerte al procesamiento de tus datos</li>
              <li>✅ Exportar tus datos</li>
              <li>✅ Revocar permisos (incluyendo acceso a cámara)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies y Tecnologías Similares</h2>
            <p className="text-gray-700 mb-4">
              Utilizamos cookies esenciales para el funcionamiento de la aplicación:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Cookies de sesión:</strong> Para mantener tu sesión activa</li>
              <li><strong>Cookies de preferencias:</strong> Para recordar tus configuraciones</li>
              <li><strong>LocalStorage:</strong> Para almacenar datos temporales (reservas, ediciones)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Retención de Datos</h2>
            <p className="text-gray-700">
              Conservamos tu información personal solo durante el tiempo necesario para los fines descritos en esta política,
              o según lo requiera la ley. Las reservas se mantienen durante 2 años para fines de auditoría.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Menores de Edad</h2>
            <p className="text-gray-700">
              Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos intencionalmente
              información de menores de edad.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cambios a esta Política</h2>
            <p className="text-gray-700">
              Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos
              mediante un aviso en nuestra aplicación o por correo electrónico.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos tu información, contáctanos:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-900"><strong>Email:</strong> privacidad@lealta.app</p>
              <p className="text-gray-900"><strong>Teléfono:</strong> +506 1234-5678</p>
              <p className="text-gray-900"><strong>Dirección:</strong> San José, Costa Rica</p>
            </div>
          </section>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-8">
            <p className="text-green-900 font-semibold">
              📱 Cómo gestionar permisos de cámara:
            </p>
            <ul className="list-disc pl-6 text-green-800 mt-2 space-y-1">
              <li><strong>Chrome/Edge:</strong> Configuración → Privacidad → Permisos del sitio → Cámara</li>
              <li><strong>Firefox:</strong> Configuración → Privacidad y seguridad → Permisos → Cámara</li>
              <li><strong>Safari:</strong> Preferencias → Sitios web → Cámara</li>
              <li><strong>Móviles:</strong> Configuración del sistema → Aplicaciones → Navegador → Permisos</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600">
            © 2025 Lealta 2.0. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
