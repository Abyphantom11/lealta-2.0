'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IdCard } from 'lucide-react';
import { useBranding } from '../branding/BrandingProvider';
import { PresentationViewProps } from './auth.types';

export const PresentationView = ({ setStep }: PresentationViewProps) => {
  const { brandingConfig } = useBranding();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Imágenes del carrusel - usando las mismas que el cliente original
  const carouselImages = [
    '/images/menu/bebida-naranja.jpg',
    '/images/menu/hamburguesa.jpg',
    '/images/menu/bebida-verde.jpg',
    '/images/menu/postre.jpg',
    '/images/menu/cafe.jpg'
  ];

  // Efecto para el carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % carouselImages.length
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Imagen de fondo */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/images/menu/fondo-menu.jpg)',
          filter: 'brightness(0.3)'
        }}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Gradiente overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      {/* Contenido principal */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 pt-16">
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-white mb-8 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Descubre Nuestro Menú
        </motion.h1>
        
        {/* Carrusel de imágenes */}
        <motion.div 
          className="mb-12 w-full max-w-sm mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="relative h-[200px] overflow-hidden">
            <div className="flex items-center justify-center h-full relative z-0">
              {/* Contenedor de las imágenes con desplazamiento */}
              <div className="relative w-64 h-32 flex items-center justify-center">
                {/* Track de imágenes que se desplaza */}
                <div 
                  className="flex items-center absolute transition-transform duration-1500 ease-out"
                  style={{
                    transform: `translateX(${-currentImageIndex * 120}px)`,
                    left: '50%',
                    marginLeft: '-60px' // Centrar el track
                  }}
                >
                  {carouselImages.map((imageUrl: string, index: number) => {
                    const isCurrent = index === currentImageIndex;
                    const isAdjacent = Math.abs(index - currentImageIndex) === 1;
                    
                    return (
                      <div
                        key={index}
                        className={`flex-shrink-0 rounded-lg overflow-hidden mx-2 transition-all duration-500 ${
                          isCurrent 
                            ? 'w-24 h-24 border-2 border-white shadow-lg' 
                            : isAdjacent 
                              ? 'w-16 h-16 opacity-60' 
                              : 'w-12 h-12 opacity-30'
                        }`}
                      >
                        <img
                          src={imageUrl}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback en caso de error de imagen
                            e.currentTarget.src = '/images/placeholder-food.jpg';
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Indicadores de puntos */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {carouselImages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Botón "Acceder con Cédula" */}
        <div className="flex justify-center mt-8">
          <motion.button 
            onClick={() => setStep('cedula')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-lg"
            style={{ 
              backgroundColor: brandingConfig.primaryColor,
              boxShadow: `0 4px 15px 0 ${brandingConfig.primaryColor}33`
            }}
            whileHover={{ 
              filter: 'brightness(1.1)',
              scale: 1.02 
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <IdCard className="w-5 h-5" />
            <span>Acceder con Cédula</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
