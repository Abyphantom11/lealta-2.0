// Componente de debugging temporal para mostrar datos directos de la API
'use client';

import { useState, useEffect } from 'react';

interface DebugBannersProps {
  businessId?: string;
}

export default function DebugBannersSection({ businessId }: DebugBannersProps) {
  const [apiData, setApiData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDirectly = async () => {
      try {
        console.log('🔍 [DEBUG COMPONENT] Fetching directly from API...');
        console.log('🔍 [DEBUG COMPONENT] BusinessId:', businessId);
        
        const timestamp = new Date().getTime();
        const dayKey = new Date().toDateString();
        
        const response = await fetch(
          `/api/portal/config-v2?businessId=${businessId}&t=${timestamp}&dayKey=${encodeURIComponent(dayKey)}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ [DEBUG COMPONENT] API Response:', data);
        
        setApiData(data);
        setError(null);
      } catch (err: any) {
        console.error('❌ [DEBUG COMPONENT] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchDirectly();
    }
  }, [businessId]);

  if (loading) {
    return (
      <div className="bg-blue-500/20 border border-blue-500 rounded p-4 text-blue-200 m-4">
        <h3 className="font-bold">🔍 DEBUG: Cargando datos de la API...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded p-4 text-red-200 m-4">
        <h3 className="font-bold">❌ DEBUG: Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  const realData = apiData?.data || apiData;
  const banners = realData?.banners || [];

  return (
    <div className="bg-green-500/20 border border-green-500 rounded p-4 text-green-200 m-4">
      <h3 className="font-bold mb-2">🔍 DEBUG: Datos directos de la API</h3>
      <div className="text-sm space-y-1">
        <p><strong>BusinessId:</strong> {businessId}</p>
        <p><strong>API Success:</strong> {apiData?.success ? '✅' : '❌'}</p>
        <p><strong>Banners en API:</strong> {banners.length}</p>
        <p><strong>Source:</strong> {realData?.source}</p>
        <p><strong>Last Updated:</strong> {realData?.lastUpdated}</p>
      </div>
      
      {banners.length > 0 && (
        <div className="mt-3">
          <h4 className="font-bold">📊 BANNERS ENCONTRADOS:</h4>
          {banners.map((banner: any, idx: number) => (
            <div key={banner.id} className="mt-2 p-2 bg-black/20 rounded">
              <p><strong>{idx + 1}. {banner.titulo}</strong></p>
              <p>ID: {banner.id}</p>
              <p>Activo: {banner.activo ? '✅' : '❌'}</p>
              <p>Día: {banner.dia}</p>
              <p>Imagen: {banner.imagenUrl ? '✅' : '❌'}</p>
              {banner.imagenUrl && (
                <img 
                  src={banner.imagenUrl} 
                  alt={banner.titulo}
                  className="w-20 h-20 object-cover rounded mt-1"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
