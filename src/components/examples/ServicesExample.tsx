'use client';

import React, { useState } from 'react';
import services from '@/lib';
import LoadingButton from '@/components/ui/LoadingButton';

// Interfaz para los datos de ejemplo
interface ExampleData {
  name?: string;
  date?: string | Date;
  count?: number;
}

/**
 * Componente de ejemplo que demuestra el uso de los servicios y utilidades
 */
const ServicesExample = () => {
  const [loading, setLoading] = useState(false);

  // Ejemplo de uso del servicio de notificaciones
  const showNotifications = () => {
    setLoading(true);
    
    // Registrar en el log
    services.logger.info('Mostrando notificaciones de ejemplo');
    
    // Mostrar notificación de éxito
    services.notification.success({
      title: 'Operación completada',
      message: 'La acción se ha completado correctamente',
    });
    
    // Esperar 1 segundo y mostrar notificación de información
    setTimeout(() => {
      services.notification.info({
        title: 'Recordatorio',
        message: 'No olvides guardar tus cambios',
      });
    }, 1000);
    
    // Esperar 2 segundos y mostrar notificación de advertencia
    setTimeout(() => {
      services.notification.warning({
        title: 'Advertencia',
        message: 'Esta acción no se puede deshacer',
      });
    }, 2000);
    
    // Esperar 3 segundos y mostrar notificación de error
    setTimeout(() => {
      services.notification.error({
        title: 'Error',
        message: 'Se ha producido un error al procesar la solicitud',
      });
      
      // Finalizar carga
      setLoading(false);
    }, 3000);
  };

  // Ejemplo de uso del servicio de localStorage
  const handleLocalStorage = () => {
    const exampleData: ExampleData = {
      name: 'Lealta',
      date: new Date(),
      count: 42,
    };
    
    // Guardar datos en localStorage
    services.storage.setItem('exampleData', exampleData);
    
    // Recuperar datos de localStorage
    const data = services.storage.getItem<ExampleData>('exampleData', {});
    
    // Mostrar datos en una notificación
    services.notification.info({
      title: 'Datos guardados',
      message: `Nombre: ${data.name || 'N/A'}, Fecha: ${data.date || 'N/A'}, Contador: ${data.count || 0}`,
    });
    
    // Registrar en el log
    services.logger.info('Datos recuperados del localStorage', data);
  };

  // Ejemplo de uso del servicio de fechas
  const handleDateUtils = () => {
    const now = new Date();
    const formattedDate = services.date.formatDate(now);
    const formattedDateTime = services.date.formatDateTime(now);
    const futureDate = services.date.addDays(now, 30);
    
    services.notification.info({
      title: 'Utilidades de fecha',
      message: `
        Fecha actual: ${formattedDate}<br>
        Fecha y hora: ${formattedDateTime}<br>
        Fecha en 30 días: ${services.date.formatDate(futureDate)}
      `,
      isHTML: true,
    });
  };

  // Ejemplo de uso del servicio de números
  const handleNumberUtils = () => {
    const price = 1299.99;
    const discount = 15;
    
    const discountedPrice = services.number.calculateDiscountedPrice(price, discount);
    const formattedPrice = services.number.formatPrice(price);
    const formattedDiscountedPrice = services.number.formatPrice(discountedPrice);
    
    services.notification.info({
      title: 'Utilidades de precios',
      message: `
        Precio original: ${formattedPrice}<br>
        Descuento: ${discount}%<br>
        Precio con descuento: ${formattedDiscountedPrice}
      `,
      isHTML: true,
    });
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Ejemplo de Servicios</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2 text-gray-700">Servicio de Notificaciones</h3>
          <p className="text-gray-600 mb-3">
            Muestra diferentes tipos de notificaciones usando el servicio centralizado.
          </p>
          <LoadingButton 
            onClick={showNotifications} 
            isLoading={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Mostrar Notificaciones
          </LoadingButton>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-2 text-gray-700">Almacenamiento Local</h3>
          <p className="text-gray-600 mb-3">
            Guarda y recupera datos del localStorage de forma tipada.
          </p>
          <button 
            onClick={handleLocalStorage}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
          >
            Probar LocalStorage
          </button>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-2 text-gray-700">Utilidades de Fecha</h3>
          <p className="text-gray-600 mb-3">
            Formatea y manipula fechas de manera consistente.
          </p>
          <button 
            onClick={handleDateUtils}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
          >
            Probar Utilidades de Fecha
          </button>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-2 text-gray-700">Utilidades de Números</h3>
          <p className="text-gray-600 mb-3">
            Formatea precios y realiza cálculos con precisión.
          </p>
          <button 
            onClick={handleNumberUtils}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition"
          >
            Probar Utilidades de Números
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicesExample;
