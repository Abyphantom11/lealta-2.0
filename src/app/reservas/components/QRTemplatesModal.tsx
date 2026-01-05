'use client';

import { useState, useEffect } from 'react';
import { X, Save, Eye, Loader2 } from 'lucide-react';
import QRCard from './QRCard';
import { MOCK_RESERVA } from '@/types/qr-branding';
import { Button } from './ui/button';
import { toast } from 'sonner';

// Tipo para el diseño de tarjeta
type CardDesign = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  shadowColor: string;
  shadowSize: 'none' | 'lg' | 'xl';
  headerColor: string;
  textColor: string;
};

// Plantillas de TARJETAS (diseño que rodea el QR)
const CARD_TEMPLATES = {
  elegant: {
    name: 'Elegante',
    description: 'Black Card Premium',
    style: {
      backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      borderColor: '#2a2a2a',
      borderWidth: 1,
      borderRadius: 20,
      padding: 40,
      shadowColor: '#000000',
      shadowSize: 'xl' as const,
      headerColor: '#ffffff',
      textColor: '#9ca3af',
    } as CardDesign,
  },
  modern: {
    name: 'Moderno',
    description: 'Gradiente vibrante',
    style: {
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 20,
      padding: 32,
      shadowColor: '#000000',
      shadowSize: 'xl' as const,
      headerColor: '#ffffff',
      textColor: '#f3f4f6',
    } as CardDesign,
  },
  minimal: {
    name: 'Minimalista',
    description: 'Simple y limpio',
    style: {
      backgroundColor: '#fafafa',
      borderColor: '#000000',
      borderWidth: 2,
      borderRadius: 8,
      padding: 24,
      shadowColor: '#000000',
      shadowSize: 'none' as const,
      headerColor: '#000000',
      textColor: '#525252',
    } as CardDesign,
  },
  halloween: {
    name: '🎃 Halloween',
    description: 'Especial Halloween',
    style: {
      backgroundColor: 'linear-gradient(135deg, #1a0a0f 0%, #2d1b1f 25%, #4a1f2d 50%, #2d1b1f 75%, #1a0a0f 100%)',
      borderColor: '#FF6B1A',
      borderWidth: 3,
      borderRadius: 24,
      padding: 40,
      shadowColor: '#FF6B1A',
      shadowSize: 'xl' as const,
      headerColor: '#FF8C00',
      textColor: '#a855f7',
    } as CardDesign,
  },
  christmas: {
    name: '🎄 Navidad',
    description: 'Especial Navidad',
    style: {
      backgroundColor: 'linear-gradient(135deg, #0f1a0f 0%, #1a2e1a 25%, #2d4a2d 50%, #1a2e1a 75%, #0f1a0f 100%)',
      borderColor: '#C41E3A',
      borderWidth: 3,
      borderRadius: 24,
      padding: 40,
      shadowColor: '#C41E3A',
      shadowSize: 'xl' as const,
      headerColor: '#FFD700',
      textColor: '#98FB98',
    } as CardDesign,
  },
  newYear2025: {
    name: '🎆 Fin de Año 2025',
    description: 'Celebración Año Nuevo',
    style: {
      backgroundColor: 'linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 25%, #2d2d5e 50%, #1a1a3e 75%, #0c0c1e 100%)',
      borderColor: '#FFD700',
      borderWidth: 3,
      borderRadius: 24,
      padding: 40,
      shadowColor: '#FFD700',
      shadowSize: 'xl' as const,
      headerColor: '#FFD700',
      textColor: '#C0C0C0',
    } as CardDesign,
  },
};

interface QRTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

export function QRTemplatesModal({ isOpen, onClose, businessId }: Readonly<QRTemplatesModalProps>) {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof CARD_TEMPLATES>('elegant');
  const [businessName, setBusinessName] = useState('Mi Negocio');
  const [cardDesign, setCardDesign] = useState<CardDesign>(CARD_TEMPLATES.elegant.style);
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración al abrir el modal
  useEffect(() => {
    if (!isOpen || !businessId) return;
    
    const loadConfig = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/business/${businessId}/qr-branding`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.data?.cardDesign) {
            setCardDesign(data.data.cardDesign);
          }
          
          if (data.data?.businessName) {
            setBusinessName(data.data.businessName);
          }
          
          if (data.data?.selectedTemplate) {
            setSelectedTemplate(data.data.selectedTemplate);
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfig();
  }, [isOpen, businessId]);

  // Aplicar plantilla
  const applyTemplate = (templateKey: keyof typeof CARD_TEMPLATES) => {
    const template = CARD_TEMPLATES[templateKey];
    setSelectedTemplate(templateKey);
    setCardDesign(template.style);
  };

  // Guardar configuración
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/business/${businessId}/qr-branding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardDesign,
          businessName,
          selectedTemplate,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      toast.success('✅ Estilo de QR guardado correctamente', {
        description: 'Se aplicará a todas las nuevas reservas',
      });
      
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('❌ Error al guardar el estilo de QR');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-2 max-h-[95vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">🎨 Estilos de QR</h2>
            <p className="text-xs text-gray-600">Elige el diseño de tus códigos QR</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-3 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Editor */}
              <div className="space-y-3">
                {/* Nombre del Negocio */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombre del Negocio
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Restaurante La Plaza"
                  />
                </div>

                {/* Plantillas de Tarjeta */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Diseños Temáticos
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(CARD_TEMPLATES).map(([key, template]) => (
                      <button
                        key={key}
                        onClick={() => applyTemplate(key as keyof typeof CARD_TEMPLATES)}
                        className={`p-1.5 rounded border-2 transition-all text-left ${
                          selectedTemplate === key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        <div className="text-[10px] font-medium text-gray-900 leading-tight">
                          {template.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personalización de Colores */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Personalización
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[9px] text-gray-600 mb-0.5">Título</span>
                      <input
                        type="color"
                        value={cardDesign.headerColor}
                        onChange={(e) => setCardDesign({ ...cardDesign, headerColor: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer border border-gray-300"
                      />
                    </div>

                    <div>
                      <span className="block text-[9px] text-gray-600 mb-0.5">Texto</span>
                      <input
                        type="color"
                        value={cardDesign.textColor}
                        onChange={(e) => setCardDesign({ ...cardDesign, textColor: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer border border-gray-300"
                      />
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <span className="block text-[9px] text-gray-600 mb-0.5">
                      Bordes: {cardDesign.borderRadius}px
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      value={cardDesign.borderRadius}
                      onChange={(e) => setCardDesign({ ...cardDesign, borderRadius: Number(e.target.value) })}
                      className="w-full h-1"
                    />
                  </div>

                  {/* Padding */}
                  <div>
                    <span className="block text-[9px] text-gray-600 mb-0.5">
                      Espaciado: {cardDesign.padding}px
                    </span>
                    <input
                      type="range"
                      min="16"
                      max="48"
                      value={cardDesign.padding}
                      onChange={(e) => setCardDesign({ ...cardDesign, padding: Number(e.target.value) })}
                      className="w-full h-1"
                    />
                  </div>
                </div>
              </div>

              {/* Vista Previa */}
              <div>
                <div className="bg-gray-50 rounded border border-gray-200">
                  <div className="flex items-center justify-between p-2 border-b border-gray-200">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-900">Vista Previa</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="h-6 text-[10px] px-2"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {showPreview ? 'Ocultar' : 'Ver'}
                    </Button>
                  </div>
                  {showPreview && (
                    <div className="p-3 flex justify-center">
                      <div className="scale-75 origin-top">
                        <QRCard
                          reserva={MOCK_RESERVA}
                          businessName={businessName}
                          cardDesign={cardDesign}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-end gap-2 p-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="h-8 text-sm px-4"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-sm px-4"
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
