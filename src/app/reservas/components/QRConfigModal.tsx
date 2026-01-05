'use client';

import { useState, useEffect } from 'react';
import { useQRBranding } from '@/hooks/useQRBranding';
import { X, Save, RotateCcw, Loader2, Eye } from 'lucide-react';
import BrandedQRGenerator from './BrandedQRGenerator';
import { MOCK_RESERVA } from '@/types/qr-branding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';

interface QRConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

export function QRConfigModal({ isOpen, onClose, businessId }: Readonly<QRConfigModalProps>) {
  const { config, isLoading, error, updateConfig, resetConfig } = useQRBranding(businessId);
  
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Actualizar local config cuando cambia el config de la API
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Función para actualizar config local
  const updateLocalConfig = (path: string[], value: any) => {
    setLocalConfig((prev) => {
      const newConfig = { ...prev };
      let current: any = newConfig;
      
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newConfig;
    });
  };

  // Guardar cambios
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateConfig(localConfig);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al guardar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Resetear a valores por defecto
  const handleReset = async () => {
    if (confirm('¿Restaurar valores por defecto del QR?')) {
      try {
        await resetConfig();
        setLocalConfig(config);
      } catch (err) {
        console.error('Error al resetear:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configuración de QR</h2>
            <p className="text-sm text-gray-600">Personaliza el diseño de tus códigos QR</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : null}
          
          {error && !isLoading ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          ) : null}
          
          {!isLoading && !error ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de Configuración */}
              <div className="space-y-4">
                {/* Success Alert */}
                {saveSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                    ✅ Configuración guardada exitosamente
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    { id: 'mensaje', label: 'Mensaje' },
                    { id: 'colores', label: 'Colores' },
                    { id: 'campos', label: 'Campos' },
                    { id: 'contacto', label: 'Contacto' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {/* TAB: Mensaje */}
                  {activeTab === 'mensaje' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Texto del Mensaje
                        </label>
                        <input
                          type="text"
                          value={localConfig.mensaje.texto}
                          onChange={(e) => updateLocalConfig(['mensaje', 'texto'], e.target.value)}
                          placeholder="¡Te esperamos!"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emoji
                        </label>
                        <input
                          type="text"
                          value={localConfig.mensaje.emoji}
                          onChange={(e) => updateLocalConfig(['mensaje', 'emoji'], e.target.value)}
                          placeholder="🎉"
                          maxLength={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color del Mensaje
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={localConfig.mensaje.color}
                            onChange={(e) => updateLocalConfig(['mensaje', 'color'], e.target.value)}
                            className="w-16 h-10 rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={localConfig.mensaje.color}
                            onChange={(e) => updateLocalConfig(['mensaje', 'color'], e.target.value)}
                            placeholder="#6366f1"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB: Colores */}
                  {activeTab === 'colores' && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Marco Habilitado
                        </label>
                        <button
                          onClick={() => updateLocalConfig(['marco', 'enabled'], !localConfig.marco.enabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            localConfig.marco.enabled ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              localConfig.marco.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {localConfig.marco.enabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Color Primario
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={localConfig.marco.colorPrimario}
                                onChange={(e) => updateLocalConfig(['marco', 'colorPrimario'], e.target.value)}
                                className="w-16 h-10 rounded border border-gray-300"
                              />
                              <input
                                type="text"
                                value={localConfig.marco.colorPrimario}
                                onChange={(e) => updateLocalConfig(['marco', 'colorPrimario'], e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Color Secundario
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={localConfig.marco.colorSecundario}
                                onChange={(e) => updateLocalConfig(['marco', 'colorSecundario'], e.target.value)}
                                className="w-16 h-10 rounded border border-gray-300"
                              />
                              <input
                                type="text"
                                value={localConfig.marco.colorSecundario}
                                onChange={(e) => updateLocalConfig(['marco', 'colorSecundario'], e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Grosor del Borde ({localConfig.marco.grosorBorde}px)
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              value={localConfig.marco.grosorBorde}
                              onChange={(e) => updateLocalConfig(['marco', 'grosorBorde'], Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* TAB: Campos */}
                  {activeTab === 'campos' && (
                    <>
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 mb-3">Campos Visibles</p>
                        {Object.entries(localConfig.camposMostrados).map(([campo, visible]) => (
                          <div key={campo} className="flex items-center justify-between">
                            <label className="text-sm text-gray-700">
                              {localConfig.etiquetas[campo as keyof typeof localConfig.etiquetas]}
                            </label>
                            <button
                              onClick={() => updateLocalConfig(['camposMostrados', campo], !visible)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                visible ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  visible ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-300 pt-4 mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Etiquetas Personalizadas</p>
                        <div className="space-y-3">
                          {Object.entries(localConfig.etiquetas).map(([campo, etiqueta]) => (
                            <div key={campo}>
                              <label className="block text-xs text-gray-600 mb-1 capitalize">
                                {campo}
                              </label>
                              <input
                                type="text"
                                value={etiqueta}
                                onChange={(e) => updateLocalConfig(['etiquetas', campo], e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB: Contacto */}
                  {activeTab === 'contacto' && (
                    <>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              Mostrar Teléfono
                            </label>
                            <button
                              onClick={() => updateLocalConfig(['contacto', 'mostrarTelefono'], !localConfig.contacto.mostrarTelefono)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                localConfig.contacto.mostrarTelefono ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  localConfig.contacto.mostrarTelefono ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                          {localConfig.contacto.mostrarTelefono && (
                            <input
                              type="tel"
                              value={localConfig.contacto.telefono || ''}
                              onChange={(e) => updateLocalConfig(['contacto', 'telefono'], e.target.value)}
                              placeholder="+507 6000-0000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              Mostrar Email
                            </label>
                            <button
                              onClick={() => updateLocalConfig(['contacto', 'mostrarEmail'], !localConfig.contacto.mostrarEmail)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                localConfig.contacto.mostrarEmail ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  localConfig.contacto.mostrarEmail ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                          {localConfig.contacto.mostrarEmail && (
                            <input
                              type="email"
                              value={localConfig.contacto.email || ''}
                              onChange={(e) => updateLocalConfig(['contacto', 'email'], e.target.value)}
                              placeholder="info@negocio.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              Mostrar Dirección
                            </label>
                            <button
                              onClick={() => updateLocalConfig(['contacto', 'mostrarDireccion'], !localConfig.contacto.mostrarDireccion)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                localConfig.contacto.mostrarDireccion ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  localConfig.contacto.mostrarDireccion ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                          {localConfig.contacto.mostrarDireccion && (
                            <input
                              type="text"
                              value={localConfig.contacto.direccion || ''}
                              onChange={(e) => updateLocalConfig(['contacto', 'direccion'], e.target.value)}
                              placeholder="Calle Principal, Ciudad"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Panel de Preview */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                      <h3 className="font-semibold text-gray-900">Vista Previa</h3>
                      <p className="text-sm text-gray-600">Así se verá tu QR</p>
                    </div>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {showPreview && (
                    <div className="p-6 flex justify-center">
                      <BrandedQRGenerator
                        reserva={MOCK_RESERVA}
                        config={localConfig}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
