'use client';

import React, { useState, useEffect } from 'react';
import notificationService from '@/lib/notificationService';
import { Clock, Star, Calendar } from 'lucide-react';

interface FavoritoDelDiaManagerProps {
  favoritos: FavoritoDelDia[];
  onUpdate: (favorito: FavoritoDelDia) => void;
  onDelete: (favoritoId: string) => void;
  onToggle: (favoritoId: string) => void;
}

interface FavoritoDelDia {
  id?: string;
  dia?: string;
  nombre?: string; // Nuevo campo para título
  descripcion?: string; // Nuevo campo para descripción
  imagenUrl?: string;
  horaPublicacion?: string;
  activo?: boolean;
}

// ❌ ELIMINADO: Hook obsoleto - usar useImageUpload unificado

/**
 * Componente para gestionar el favorito del día
 * Permite configurar favoritos destacados para cada día de la semana
 */
const FavoritoDelDiaManager: React.FC<FavoritoDelDiaManagerProps> = ({
  favoritos,
  onUpdate,
  onDelete,
  onToggle,
}) => {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [publishTime, setPublishTime] = useState('09:00');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagenUrl: '',
    horaPublicacion: '09:00',
  });
  const [uploading, setUploading] = useState(false);

  // ✅ Handler simplificado - upload directo sin hook
  const handleCarouselImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ✅ Validación igual que BrandingManager
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      notificationService.error({ message: 'Solo se permiten archivos JPG, PNG o WebP' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB igual que BrandingManager
      notificationService.error({ message: 'El archivo debe ser menor a 5MB' });
      return;
    }

    try {
      console.log('🔄 Favorito direct upload for day:', selectedDay);
      console.log('📁 Iniciando upload directo de imagen:', file.name);
      
      // ✅ UPLOAD DIRECTO - sin usar el estado del hook
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || `Error HTTP: ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.fileUrl;

      // ✅ Actualizar formData directamente
      setFormData(prev => ({ ...prev, imagenUrl: imageUrl }));
      notificationService.success({ message: '✅ Imagen del favorito actualizada' });
      
    } catch (error) {
      console.error('❌ Favorito direct upload error:', error);
      notificationService.error({ message: 'Error al procesar la imagen' });
    } finally {
      // Limpiar input para permitir cargar la misma imagen nuevamente
      event.target.value = '';
    }
  };

  // Días de la semana
  const diasSemana = [
    { value: 'lunes', label: 'L' },
    { value: 'martes', label: 'M' },
    { value: 'miercoles', label: 'X' },
    { value: 'jueves', label: 'J' },
    { value: 'viernes', label: 'V' },
    { value: 'sabado', label: 'S' },
    { value: 'domingo', label: 'D' },
  ];

  const diasCompletos = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  // Helper functions para evitar ternarios anidados
  const getSubmitButtonText = () => {
    if (uploading) return 'Subiendo...';
    return favoritoPorDia ? 'Actualizar Favorito' : 'Crear Favorito';
  };

  // Encontrar favorito para el día seleccionado
  const favoritoPorDia = Array.isArray(favoritos)
    ? favoritos.find(f => f.dia === selectedDay)
    : null;

  // Actualizar formulario cuando cambia el día seleccionado o favorito
  useEffect(() => {
    const favorito = Array.isArray(favoritos) ? favoritos.find(f => f.dia === selectedDay) : null;
    
    if (favorito) {
      setFormData({
        nombre: favorito.nombre || '',
        descripcion: favorito.descripcion || '',
        imagenUrl: favorito.imagenUrl || '',
        horaPublicacion: favorito.horaPublicacion || '09:00',
      });
      setPublishTime(favorito.horaPublicacion || '09:00');
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        imagenUrl: '',
        horaPublicacion: '09:00',
      });
      setPublishTime('09:00');
    }
  }, [selectedDay, favoritos]);

  // Limpiar upload cuando cambia el día - independiente
  useEffect(() => {
  }, [selectedDay, favoritoPorDia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const favoritoData: FavoritoDelDia = {
        ...favoritoPorDia,
        dia: selectedDay,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        imagenUrl: formData.imagenUrl, // Ya actualizada por el callback del upload
        horaPublicacion: publishTime,
        activo: favoritoPorDia?.activo ?? true,
      };

      console.log('🔄 Actualizando favorito:', {
        id: favoritoPorDia?.id,
        oldImage: favoritoPorDia?.imagenUrl,
        newImage: favoritoData.imagenUrl,
        data: favoritoData
      });

      onUpdate(favoritoData);
      notificationService.success({
        message: `Favorito del ${diasCompletos[selectedDay as keyof typeof diasCompletos]} ${favoritoPorDia ? 'actualizado' : 'creado'} exitosamente`
      });
    } catch (error) {
      console.error('Error al guardar favorito:', error);
      notificationService.error({ message: 'Error al guardar favorito' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Star className="w-5 h-5 mr-2" />
          Favorito del Día
        </h4>
        <p className="text-dark-400 text-sm mb-4">
          Configura favoritos destacados para cada día de la semana. Se
          publicarán automáticamente a la hora especificada.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Seleccionar Día
        </h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const tieneConfig = favoritos.some(
              f => f.dia === dia.value && f.imagenUrl
            );

            return (
              <button
                key={dia.value}
                onClick={() => setSelectedDay(dia.value)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors relative ${
                  selectedDay === dia.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                {dia.label}
                {tieneConfig && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario para el día seleccionado */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">
          Favorito para{' '}
          {diasCompletos[selectedDay as keyof typeof diasCompletos]}
        </h5>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre/Título del Favorito */}
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Título del Favorito
            </label>
            <input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={e =>
                setFormData(prev => ({ ...prev, nombre: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Platillo especial del día"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={e =>
                setFormData(prev => ({ ...prev, descripcion: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Descripción del favorito del día"
            />
          </div>

          {/* Hora de publicación */}
          <div>
            <label
              htmlFor="publishTime"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              <Clock className="w-4 h-4 inline mr-1" />
              Hora de Publicación
            </label>
            <input
              id="publishTime"
              type="time"
              value={publishTime}
              onChange={e => {
                setPublishTime(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  horaPublicacion: e.target.value,
                }));
              }}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              Se publicará automáticamente a esta hora en el día correspondiente
            </p>
          </div>

          {/* Upload de imagen */}

          {/* 🎯 IMAGEN DEL FAVORITO - Patrón exacto de BrandingManager */}
          <div>
            <label htmlFor="favorito-upload" className="block text-sm font-medium text-white mb-2">
              Imagen del Favorito
            </label>
            <p className="text-xs text-dark-400 mb-3">
              Formatos soportados: JPG, PNG, WebP. Tamaño máximo: 5MB
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              {/* Mostrar imagen actual O recién subida */}
              {(formData.imagenUrl || favoritoPorDia?.imagenUrl) && (
                <div className="relative group">
                  <img
                    src={formData.imagenUrl || favoritoPorDia?.imagenUrl}
                    alt="Favorito actual"
                    className="w-full h-32 object-cover rounded-lg border border-dark-600"
                    onError={(e) => {
                      // ✅ PROTECCIÓN: Mostrar placeholder si la imagen falla
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEyIiB5PSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSI4Ij5FcnJvcjwvdGV4dD4KPHN2Zz4K';
                      console.warn('❌ Error cargando imagen del favorito:', formData.imagenUrl || favoritoPorDia?.imagenUrl);
                    }}
                  />
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Favorito {diasCompletos[selectedDay as keyof typeof diasCompletos]}
                  </div>
                  {/* Botón para cambiar imagen superpuesto */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <input
                      type="file"
                      id="favorito-upload-change"
                      accept="image/*"
                      onChange={handleCarouselImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className="text-white text-xs">Cambiar imagen</span>
                  </div>
                </div>
              )}

              {/* Botón para agregar imagen - solo si NO hay imagen */}
              {!(formData.imagenUrl || favoritoPorDia?.imagenUrl) && (
                <div className="relative">
                  <input
                    type="file"
                    id="favorito-upload"
                    accept="image/*"
                    onChange={handleCarouselImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-32 border-2 border-dashed border-dark-600 rounded-lg flex flex-col items-center justify-center text-dark-400 hover:border-primary-500 hover:text-primary-400 transition-colors cursor-pointer">
                    <svg
                      className="w-6 h-6 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-xs">Agregar imagen</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-success-600 hover:bg-success-700 disabled:bg-success-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <Star className="w-4 h-4" />
              <span>{getSubmitButtonText()}</span>
            </button>

            {favoritoPorDia?.id && (
              <button
                type="button"
                onClick={() => {
                  const favoritoId = favoritoPorDia.id!;
                  notificationService.warning({
                    title: 'Confirmar eliminación',
                    message:
                      '¿Estás seguro de eliminar este favorito? Esta acción no se puede deshacer.',
                    duration: 0, // No se cierra automáticamente
                    onClose: () => {
                      onDelete(favoritoId);
                      notificationService.success({
                        message: 'Favorito del día eliminado correctamente',
                      });
                    },
                  });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </form>

        {/* Estado actual del favorito */}
        {favoritoPorDia && (
          <div className="mt-6 p-4 bg-dark-700 rounded-lg border border-dark-600">
            <div className="flex items-center justify-between mb-2">
              <h6 className="text-white font-medium">Estado Actual</h6>
              <button
                onClick={() => favoritoPorDia.id && onToggle(favoritoPorDia.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  favoritoPorDia.activo
                    ? 'bg-success-500/20 text-success-400 hover:bg-success-500/30'
                    : 'bg-dark-600 text-dark-400 hover:bg-dark-500'
                }`}
              >
                {favoritoPorDia.activo ? '✓ Activo' : '✕ Inactivo'}
              </button>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-dark-300">
                📅 Día:{' '}
                <span className="text-white font-medium">
                  {diasCompletos[selectedDay as keyof typeof diasCompletos]}
                </span>
              </p>
              <p className="text-dark-300">
                🕒 Hora:{' '}
                <span className="text-white font-medium">
                  {favoritoPorDia.horaPublicacion || '09:00'}
                </span>
              </p>
              <p className="text-dark-300">
                📝 Título:{' '}
                <span className="text-white font-medium">
                  {favoritoPorDia.nombre || 'Sin título'}
                </span>
              </p>
              <p className="text-dark-300">
                🖼️ Imagen:{' '}
                <span className="text-white font-medium">
                  {favoritoPorDia.imagenUrl ? 'Configurada' : 'No configurada'}
                </span>
              </p>
            </div>

            {/* Estado de visibilidad */}
            {favoritoPorDia.activo && (
              <div className="mt-3 p-3 rounded bg-dark-800">
                <h6 className="text-white text-xs font-medium mb-1">
                  Estado de visibilidad:
                </h6>
                {(() => {
                  // Verificar si hay un día simulado configurado
                  const diaSimulado = window.portalPreviewDay;
                  const esModoSimulacion = !!diaSimulado;

                  if (esModoSimulacion) {
                    const coincideSimulacion =
                      favoritoPorDia.dia === diaSimulado;

                    if (coincideSimulacion) {
                      return (
                        <p className="text-xs text-blue-400">
                          🔍 Simulando día:{' '}
                          {
                            diasCompletos[
                              diaSimulado as keyof typeof diasCompletos
                            ]
                          }{' '}
                          - Este favorito{' '}
                          {favoritoPorDia.activo
                            ? 'está configurado'
                            : 'está configurado pero inactivo'}{' '}
                          para este día
                        </p>
                      );
                    } else {
                      return (
                        <p className="text-xs text-yellow-400">
                          🔍 Simulando día:{' '}
                          {
                            diasCompletos[
                              diaSimulado as keyof typeof diasCompletos
                            ]
                          }{' '}
                          - Este favorito es para{' '}
                          {
                            diasCompletos[
                              favoritoPorDia.dia as keyof typeof diasCompletos
                            ]
                          }
                          , por lo que no se muestra
                        </p>
                      );
                    }
                  }

                  // Verificar si es el día actual
                  const diasSemana = [
                    'domingo',
                    'lunes',
                    'martes',
                    'miercoles',
                    'jueves',
                    'viernes',
                    'sabado',
                  ];
                  const hoy = new Date();
                  const diaActual = diasSemana[hoy.getDay()];
                  const esDiaActual = diaActual === favoritoPorDia.dia;

                  // Verificar hora de publicación
                  let horaOk = true;
                  if (favoritoPorDia.horaPublicacion) {
                    const [horas, minutos] = favoritoPorDia.horaPublicacion
                      .split(':')
                      .map(Number);
                    const horaPublicacionMinutos = horas * 60 + minutos;
                    const horaActualMinutos =
                      hoy.getHours() * 60 + hoy.getMinutes();
                    horaOk = horaActualMinutos >= horaPublicacionMinutos;
                  }

                  if (!favoritoPorDia.activo) {
                    return (
                      <p className="text-xs text-yellow-400">
                        ⚠️ Este favorito está configurado pero INACTIVO
                      </p>
                    );
                  } else if (!esDiaActual) {
                    return (
                      <p className="text-xs text-yellow-400">
                        ⚠️ Este favorito no se muestra hoy porque está
                        configurado para{' '}
                        {
                          diasCompletos[
                            favoritoPorDia.dia as keyof typeof diasCompletos
                          ]
                        }
                      </p>
                    );
                  } else if (!horaOk) {
                    return (
                      <p className="text-xs text-yellow-400">
                        ⏰ Este favorito se publicará automáticamente a las{' '}
                        {favoritoPorDia.horaPublicacion}
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-xs text-success-400">
                        ✅ Este favorito está activo y visible para los clientes
                      </p>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resumen semanal */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h6 className="text-white font-medium mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Resumen Semanal
        </h6>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {diasSemana.map(dia => {
            const favoritoDelDia = favoritos.find(f => f.dia === dia.value);
            const tieneImagen = favoritoDelDia?.imagenUrl;
            const estaActivo = favoritoDelDia?.activo;

            // Determina el estilo de la tarjeta según su estado
            const getCardStyle = () => {
              if (!tieneImagen) return 'border-dark-600 bg-dark-700';
              return estaActivo
                ? 'border-success-500 bg-success-500/10'
                : 'border-yellow-500 bg-yellow-500/10';
            };

            // Obtiene el mensaje de estado
            const getStatus = () => {
              if (!tieneImagen) return '❌ Sin configurar';
              return estaActivo
                ? '✅ Configurado y activo'
                : '⚠️ Configurado pero inactivo';
            };

            return (
              <div
                key={dia.value}
                className={`p-3 rounded-lg border ${getCardStyle()}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {diasCompletos[dia.value as keyof typeof diasCompletos]}
                  </span>
                  {favoritoDelDia && (
                    <span className="text-xs text-dark-300">
                      {favoritoDelDia.horaPublicacion}
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-400">{getStatus()}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FavoritoDelDiaManager;
