'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FavoritoDelDia {
  id: string;
  nombre?: string;
  imagenUrl: string;
  activo: boolean;
  dia?: string;
}

// Helper function para encontrar favorito por día actual
function findFavoritoForToday(favoritos: any[]): any {
  const hoy = new Date();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const diaActual = diasSemana[hoy.getDay()];
  
  // Buscar favorito para el día actual
  let favoritoHoy = favoritos.find((f: any) => 
    f.dia === diaActual && f.activo && f.imagenUrl && f.imagenUrl.trim() !== ''
  );
  
  // Si no hay favorito para hoy, buscar el primer favorito activo
  if (!favoritoHoy) {
    favoritoHoy = favoritos.find((f: any) => 
      f.activo && f.imagenUrl && f.imagenUrl.trim() !== ''
    );
  }
  
  return favoritoHoy;
}

// Helper function para procesar favorito por formato
function processFavoritoData(favoritos: any): any {
  if (Array.isArray(favoritos)) {
    return findFavoritoForToday(favoritos);
  } else {
    // Compatibilidad con formato anterior
    const favoritoActivo = favoritos;
    return (favoritoActivo?.activo && favoritoActivo?.imagenUrl && favoritoActivo.imagenUrl.trim() !== '') 
      ? favoritoActivo 
      : null;
  }
}

export default function FavoritoDelDiaSection() {
  const [favorito, setFavorito] = useState<FavoritoDelDia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchFavorito = async () => {
      try {
        const response = await fetch('/api/admin/portal-config?businessId=default', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🎯 Cliente - Favoritos recibidos:', data.config?.favoritoDelDia);
          
          const favoritoEncontrado = processFavoritoData(data.config?.favoritoDelDia);
          
          if (favoritoEncontrado) {
            console.log('✅ Cliente - Favorito activo encontrado:', favoritoEncontrado);
            setFavorito(favoritoEncontrado);
          } else {
            setFavorito(null);
          }
        }
      } catch (error) {
        console.error('Error loading favorito:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFavorito();
    
    // Polling para actualización en tiempo real cada 2 segundos
    const interval = setInterval(fetchFavorito, 2000);
    return () => clearInterval(interval);
  }, []);
  
  if (isLoading || !favorito) return null;
  
  return (
    <div className="mx-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Favorito del día</h3>
      <motion.div
        className="bg-dark-800 rounded-xl overflow-hidden relative"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img 
          src={favorito.imagenUrl} 
          alt="Favorito del día"
          className="w-full h-48 object-cover rounded-xl"
        />
      </motion.div>
    </div>
  );
}
