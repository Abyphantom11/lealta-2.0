'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Link as LinkIcon, Users, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Promotor {
  id: string;
  nombre: string;
  activo: boolean;
}

interface PromoterLinkGeneratorProps {
  readonly eventSlug: string;
  readonly eventName: string;
  readonly businessId: string;
  readonly onClose: () => void;
}

export default function PromoterLinkGenerator({ 
  eventSlug, 
  eventName, 
  businessId, 
  onClose 
}: PromoterLinkGeneratorProps) {
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPromotores = async () => {
    try {
      const response = await fetch(`/api/promotores?businessId=${businessId}`);
      if (!response.ok) throw new Error('Error al cargar promotores');
      
      const data = await response.json();
      setPromotores(data.promotores || []);
    } catch (error) {
      console.error('Error loading promotores:', error);
      toast.error('Error al cargar promotores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const generatePromoterLink = (promotor: Promotor): string => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || globalThis.window.location.origin;
    return `${baseUrl}/evento/${eventSlug}?ref=${encodeURIComponent(promotor.nombre)}`;
  };

  const copyPromoterLink = async (promotor: Promotor) => {
    const link = generatePromoterLink(promotor);
    
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(promotor.id);
      toast.success('Link copiado', {
        description: `Link de "${promotor.nombre}" copiado al portapapeles`
      });
      
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Error al copiar link');
    }
  };

  const filteredPromotores = promotores.filter(p =>
    p.activo && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Links Referenciados
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Genera links personalizados para cada promotor
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Event info */}
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm font-medium text-indigo-900">
              📅 {eventName}
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              Los invitados registrados serán vinculados automáticamente al promotor
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar promotor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Promotores List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          )}
          
          {!loading && filteredPromotores.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {promotores.length === 0 
                  ? 'No hay promotores activos' 
                  : 'No se encontraron promotores'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {promotores.length === 0 
                  ? 'Crea promotores en la sección de Gestión de Promotores' 
                  : 'Prueba con otro término de búsqueda'}
              </p>
            </div>
          )}
          
          {!loading && filteredPromotores.length > 0 && (
            <div className="space-y-3">
              {filteredPromotores.map((promotor) => {
                const link = generatePromoterLink(promotor);
                const isCopied = copiedId === promotor.id;

                return (
                  <div
                    key={promotor.id}
                    className="group p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Promotor info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {promotor.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800">
                            {promotor.nombre}
                          </h3>
                        </div>

                        {/* Link preview */}
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <code className="text-xs text-gray-600 truncate flex-1">
                            {link}
                          </code>
                        </div>
                      </div>

                      {/* Copy button */}
                      <button
                        onClick={() => copyPromoterLink(promotor)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all flex-shrink-0 ${
                          isCopied
                            ? 'bg-green-500 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="hidden sm:inline">Copiar Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Stats hint */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        💡 Comparte este link y todos los registros serán vinculados a <strong>{promotor.nombre}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LinkIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">
                ¿Cómo funciona?
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cada promotor tiene un link único con su código de referencia. 
                Cuando alguien se registre usando ese link, quedará vinculado automáticamente 
                al promotor y podrás ver sus estadísticas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
