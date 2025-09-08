'use client';

import React, { useState } from 'react';
import { CreditCard, Save, Edit } from 'lucide-react';

interface GeneralConfig {
  nivelesConfig?: Record<string, any>;
  empresa?: {
    nombre: string;
  };
  nombreEmpresa?: string;
}

interface GestionTarjetasOriginalProps {
  config: GeneralConfig;
  onUpdateConfig?: (field: string, value: any) => Promise<void>;
  showNotification: (message: string, type: string) => void;
}

export default function GestionTarjetasOriginal({
  config,
  onUpdateConfig,
  showNotification
}: GestionTarjetasOriginalProps) {
  const [nombreEmpresa, setNombreEmpresa] = useState(
    config.nombreEmpresa || config.empresa?.nombre || 'Love me'
  );
  const [editingEmpresa, setEditingEmpresa] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveEmpresa = async () => {
    if (!onUpdateConfig) {
      showNotification('Funcionalidad de guardado no configurada', 'warning');
      return;
    }

    try {
      setSaving(true);
      await onUpdateConfig('nombreEmpresa', nombreEmpresa);
      setEditingEmpresa(false);
      showNotification('Nombre de empresa actualizado correctamente', 'success');
    } catch (error) {
      showNotification('Error al actualizar el nombre de empresa', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">
          Gestión de Tarjetas de Lealtad
        </h3>
      </div>

      {/* Nombre de la Empresa en Tarjetas */}
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">
            Nombre de la Empresa en Tarjetas
          </h4>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Nombre actual:
              </span>
              {!editingEmpresa && (
                <button
                  onClick={() => setEditingEmpresa(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </button>
              )}
            </div>
            
            {editingEmpresa ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre de la empresa"
                  disabled={saving}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEmpresa}
                    disabled={saving || !nombreEmpresa.trim()}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        Guardar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmpresa(false);
                      setNombreEmpresa(config.nombreEmpresa || config.empresa?.nombre || 'Love me');
                    }}
                    disabled={saving}
                    className="text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded border px-3 py-2 font-medium">
                {nombreEmpresa}
              </div>
            )}
            
            <p className="text-gray-500 text-sm mt-2">
              Este nombre aparecerá en la esquina inferior izquierda de todas las
              tarjetas. Los cambios se guardan automáticamente.
            </p>
          </div>
        </div>

        {/* Información adicional sobre configuración de niveles */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">
            Configuración de Niveles de Tarjetas
          </h5>
          <p className="text-blue-700 text-sm mb-3">
            Los niveles de tarjetas se configuran automáticamente según las condiciones predefinidas:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-amber-600 to-amber-700 rounded"></div>
              <span className="font-medium">Bronce:</span> Punto de entrada (0 puntos, $0 gastos, 0 visitas)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded"></div>
              <span className="font-medium">Plata:</span> Cliente frecuente (100 puntos, $500 gastos, 5 visitas)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded"></div>
              <span className="font-medium">Oro:</span> Cliente premium (300 puntos, $1500 gastos, 15 visitas)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded"></div>
              <span className="font-medium">Diamante:</span> Cliente VIP (500 puntos, $3000 gastos, 25 visitas)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded"></div>
              <span className="font-medium">Platino:</span> Cliente elite (1000 puntos, $5000 gastos, 50 visitas)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
