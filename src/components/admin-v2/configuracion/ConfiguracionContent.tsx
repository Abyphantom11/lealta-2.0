'use client';

import React, { useState } from 'react';
import { Settings, QrCode, Save, Eye, RotateCcw } from 'lucide-react';
import QRCard from '@/app/reservas/components/QRCard';
import { MOCK_RESERVA } from '@/types/qr-branding';
import { toast } from 'sonner';

/**
 * Componente para configuración del sistema y diseño de tarjetas QR
 */

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
};

interface ConfiguracionContentProps {
  businessId?: string;
}

const ConfiguracionContent: React.FC<ConfiguracionContentProps> = ({ businessId }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof CARD_TEMPLATES>('elegant');
  const [businessName, setBusinessName] = useState('Mi Negocio');
  const [cardDesign, setCardDesign] = useState<CardDesign>(CARD_TEMPLATES.elegant.style);
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cargar configuración al montar
  React.useEffect(() => {
    if (!businessId) return;
    
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/business/${businessId}/qr-branding`);
        if (response.ok) {
          const data = await response.json();
          
          // Cargar diseño de tarjeta
          if (data.data?.cardDesign) {
            setCardDesign(data.data.cardDesign);
          }
          
          // Cargar nombre del negocio
          if (data.data?.businessName) {
            setBusinessName(data.data.businessName);
          }
          
          // Cargar plantilla seleccionada
          if (data.data?.selectedTemplate) {
            setSelectedTemplate(data.data.selectedTemplate);
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    };
    
    loadConfig();
  }, [businessId]);

  // Aplicar plantilla
  const applyTemplate = (templateKey: keyof typeof CARD_TEMPLATES) => {
    const template = CARD_TEMPLATES[templateKey];
    setSelectedTemplate(templateKey);
    setCardDesign(template.style);
  };

  // Guardar configuración
  const handleSave = async () => {
    if (!businessId) {
      console.error('❌ No hay businessId');
      toast.error('❌ Error: No se encontró el ID del negocio');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
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
        const errorData = await response.json().catch(() => null);
        console.error('❌ Error response:', errorData);
        throw new Error('Error al guardar');
      }

      await response.json();

      setSaveSuccess(true);
      toast.success('✅ Cambios guardados correctamente', {
        className: 'bg-green-600 text-white border-0',
        description: 'La configuración del QR se aplicará a todas las nuevas reservas',
        duration: 4000,
      });
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('❌ Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar valores por defecto
  const handleReset = () => {
    if (confirm('¿Restaurar diseño por defecto?')) {
      setSelectedTemplate('elegant');
      setCardDesign(CARD_TEMPLATES.elegant.style);
      setBusinessName('Mi Negocio');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-primary-500" />
          <h3 className="text-xl font-semibold text-white">
            Configuración del Sistema
          </h3>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-green-400 font-medium text-sm">¡Configuración guardada exitosamente!</p>
              <p className="text-green-300 text-xs mt-1">Los cambios se aplicarán automáticamente a todas las nuevas reservas</p>
            </div>
          </div>
        </div>
      )}

      {/* Diseño de Tarjetas QR */}
      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-primary-500" />
            <h4 className="text-lg font-semibold text-white">Diseño de Tarjeta QR</h4>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Ocultar' : 'Vista Previa'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-4">
            {/* Nombre del Negocio */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Nombre del Negocio
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: Restaurante La Plaza"
              />
            </div>

            {/* Plantillas de Tarjeta */}
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Diseños de Tarjeta
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(CARD_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => applyTemplate(key as keyof typeof CARD_TEMPLATES)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === key
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600 bg-dark-700 hover:border-dark-500'
                    }`}
                  >
                    <div className="text-sm font-medium text-white mb-1">
                      {template.name}
                    </div>
                    <div className="text-xs text-dark-300">
                      {template.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personalización Avanzada */}
            <div className="space-y-3">
              <label className="block text-white text-sm font-medium">
                Personalización de Colores
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-dark-300 text-xs mb-2">Color del Título</span>
                  <div className="relative">
                    <input
                      type="color"
                      value={cardDesign.headerColor}
                      onChange={(e) => setCardDesign({ ...cardDesign, headerColor: e.target.value })}
                      className="w-full h-12 rounded-lg cursor-pointer border-2 border-dark-600 hover:border-primary-500 transition-colors"
                      title="Selecciona el color del título"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-dark-800/90 text-white text-xs py-1 text-center rounded-b-lg">
                      {cardDesign.headerColor}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="block text-dark-300 text-xs mb-2">Color del Texto</span>
                  <div className="relative">
                    <input
                      type="color"
                      value={cardDesign.textColor}
                      onChange={(e) => setCardDesign({ ...cardDesign, textColor: e.target.value })}
                      className="w-full h-12 rounded-lg cursor-pointer border-2 border-dark-600 hover:border-primary-500 transition-colors"
                      title="Selecciona el color del texto"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-dark-800/90 text-white text-xs py-1 text-center rounded-b-lg">
                      {cardDesign.textColor}
                    </div>
                  </div>
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <span className="block text-dark-300 text-xs mb-1">
                  Radio de Bordes: {cardDesign.borderRadius}px
                </span>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={cardDesign.borderRadius}
                  onChange={(e) => setCardDesign({ ...cardDesign, borderRadius: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Padding */}
              <div>
                <span className="block text-dark-300 text-xs mb-1">
                  Espaciado Interno: {cardDesign.padding}px
                </span>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={cardDesign.padding}
                  onChange={(e) => setCardDesign({ ...cardDesign, padding: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Vista Previa */}
          {showPreview && (
            <div className="flex items-center justify-center bg-gradient-to-br from-dark-700 to-dark-800 rounded-lg p-6">
              <QRCard
                reserva={MOCK_RESERVA}
                businessName={businessName}
                cardDesign={cardDesign}
              />
            </div>
          )}
        </div>

        {/* Botones de Acción - Compactos y Centrados */}
        <div className="flex gap-3 justify-center pt-4 border-t border-dark-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-dark-600 disabled:to-dark-600 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-green-500/30"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuración General */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Configuración General
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Nombre del Negocio</span>
              <input
                type="text"
                defaultValue="Mi Restaurante"
                className="px-3 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Moneda</span>
              <select className="px-3 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:ring-2 focus:ring-primary-500">
                <option>USD</option>
                <option>EUR</option>
                <option>PAB</option>
              </select>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Configuración del Portal
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Registro automático</span>
              <button className="w-12 h-6 bg-success-600 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Notificaciones push</span>
              <button className="w-12 h-6 bg-dark-600 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
        <h5 className="text-white font-medium mb-2">ℹ️ Información del Sistema</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-dark-400">Versión:</span>
            <span className="text-white ml-2">Lealta 2.0</span>
          </div>
          <div>
            <span className="text-dark-400">Última actualización:</span>
            <span className="text-white ml-2">Oct 2025</span>
          </div>
          <div>
            <span className="text-dark-400">Estado:</span>
            <span className="text-success-400 ml-2">✓ Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionContent;
