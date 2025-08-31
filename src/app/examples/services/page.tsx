import ServicesExample from '@/components/examples/ServicesExample';

/**
 * Página de demostración de los servicios y utilidades
 */
export default function ServicesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Demostración de Servicios y Utilidades
      </h1>
      
      <ServicesExample />
      
      <div className="mt-12 max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Beneficios de los Servicios Centralizados
        </h2>
        
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>Reutilización de código:</strong> Evita duplicación y facilita el mantenimiento.
          </li>
          <li>
            <strong>Tipado seguro:</strong> Todas las funciones tienen tipos TypeScript adecuados.
          </li>
          <li>
            <strong>Consistencia:</strong> Garantiza un comportamiento uniforme en toda la aplicación.
          </li>
          <li>
            <strong>Centralización:</strong> Un solo punto de entrada para servicios comunes.
          </li>
          <li>
            <strong>Mejor debugging:</strong> El servicio de logging facilita la depuración.
          </li>
        </ul>
      </div>
    </div>
  );
}
