'use client';

import React, { useState } from 'react';
import {
  ConfigContextType,
  PortalConfig,
} from '../../../../types/admin/config';

interface ConfigPanelProps {
  configContext: ConfigContextType;
}

export const ConfigPanel: React.FC<Readonly<ConfigPanelProps>> = ({
  configContext,
}) => {
  const { config, loading, error, saveConfig, uploadImage } = configContext;

  const [activeTab, setActiveTab] = useState<string>('general');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [localConfig, setLocalConfig] = useState<Partial<PortalConfig> | null>(
    config
  );

  // Efecto para actualizar el estado local cuando cambia la configuración
  React.useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  // Función para manejar cambios en los campos
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section?: string
  ) => {
    const { name, value } = e.target;

    if (!localConfig) return;

    if (section) {
      setLocalConfig({
        ...localConfig,
        [section]: {
          ...((localConfig[section] as object) || {}),
          [name]: value,
        },
      });
    } else {
      setLocalConfig({
        ...localConfig,
        [name]: value,
      });
    }
  };

  // Función para manejar cambios de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // Función para subir la imagen
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      const imageUrl = await uploadImage(selectedImage, 'logo');

      if (localConfig) {
        setLocalConfig({
          ...localConfig,
          logoUrl: imageUrl,
        });
      }

      setSelectedImage(null);
    } catch (err) {
      console.error('Error al subir imagen:', err);
    }
  };

  // Función para guardar la configuración
  const handleSaveConfig = async () => {
    if (!localConfig) return;

    try {
      await saveConfig(localConfig as PortalConfig);
    } catch (err) {
      console.error('Error al guardar configuración:', err);
    }
  };

  // Renderizar el contenido según la pestaña activa
  const renderTabContent = () => {
    if (!localConfig) return null;

    switch (activeTab) {
      case 'general':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Configuración General
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="nombreNegocio"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre del Negocio
                </label>
                <input
                  id="nombreNegocio"
                  type="text"
                  name="nombreNegocio"
                  value={localConfig.nombreNegocio || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="descripcionNegocio"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Descripción del Negocio
                </label>
                <textarea
                  id="descripcionNegocio"
                  name="descripcionNegocio"
                  value={localConfig.descripcionNegocio || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <label
                  htmlFor="direccion"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Dirección
                </label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={localConfig.direccion || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="telefono"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Teléfono
                </label>
                <input
                  id="telefono"
                  type="text"
                  name="telefono"
                  value={localConfig.telefono || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="correo"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Correo Electrónico
                </label>
                <input
                  id="correo"
                  type="email"
                  name="correo"
                  value={localConfig.correo || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="horario"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Horario
                </label>
                <input
                  id="horario"
                  type="text"
                  name="horario"
                  value={localConfig.horario || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Personalización y Branding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="colorPrimario"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Color Primario
                </label>
                <div className="flex">
                  <input
                    type="color"
                    id="colorPrimario"
                    name="colorPrimario"
                    value={localConfig.colorPrimario || '#ffffff'}
                    onChange={handleInputChange}
                    className="h-10 w-10 rounded-md border"
                  />
                  <input
                    type="text"
                    value={localConfig.colorPrimario || '#ffffff'}
                    onChange={handleInputChange}
                    name="colorPrimario"
                    className="ml-2 w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="colorSecundario"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Color Secundario
                </label>
                <div className="flex">
                  <input
                    type="color"
                    id="colorSecundario"
                    name="colorSecundario"
                    value={localConfig.colorSecundario || '#ffffff'}
                    onChange={handleInputChange}
                    className="h-10 w-10 rounded-md border"
                  />
                  <input
                    type="text"
                    value={localConfig.colorSecundario || '#ffffff'}
                    onChange={handleInputChange}
                    name="colorSecundario"
                    className="ml-2 w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="logo"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Logo
                </label>
                <div className="flex flex-col gap-2">
                  {localConfig.logoUrl && (
                    <div className="relative h-32 w-32 border rounded-md overflow-hidden">
                      <img
                        src={localConfig.logoUrl}
                        alt="Logo"
                        className="object-contain h-full w-full"
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border rounded-md"
                  />

                  {selectedImage && (
                    <button
                      onClick={handleImageUpload}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2 self-start"
                    >
                      Subir Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'social':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Redes Sociales</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="facebook"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Facebook
                </label>
                <input
                  id="facebook"
                  type="text"
                  name="facebook"
                  value={localConfig.redesSociales?.facebook || ''}
                  onChange={e => handleInputChange(e, 'redesSociales')}
                  className="w-full p-2 border rounded-md"
                  placeholder="https://facebook.com/tu-pagina"
                />
              </div>

              <div>
                <label
                  htmlFor="instagram"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Instagram
                </label>
                <input
                  id="instagram"
                  type="text"
                  name="instagram"
                  value={localConfig.redesSociales?.instagram || ''}
                  onChange={e => handleInputChange(e, 'redesSociales')}
                  className="w-full p-2 border rounded-md"
                  placeholder="https://instagram.com/tu-cuenta"
                />
              </div>

              <div>
                <label
                  htmlFor="twitter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Twitter
                </label>
                <input
                  id="twitter"
                  type="text"
                  name="twitter"
                  value={localConfig.redesSociales?.twitter || ''}
                  onChange={e => handleInputChange(e, 'redesSociales')}
                  className="w-full p-2 border rounded-md"
                  placeholder="https://twitter.com/tu-cuenta"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Configuración del Sistema</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex mb-6 border-b">
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'general' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'branding' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          Branding
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'social' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          Redes Sociales
        </button>
      </div>

      {localConfig ? (
        <div className="mb-6">{renderTabContent()}</div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Cargando configuración...</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveConfig}
          disabled={loading}
          className={`py-2 px-4 rounded ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};
