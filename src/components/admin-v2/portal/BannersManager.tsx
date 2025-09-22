'use client';

import React, { useState, useEffect, useMemo } from 'react';
import notificationService from '@/lib/notificationService';
import { Clock, Eye, EyeOff, Trash2, Save } from 'lucide-react';

interface BannersManagerProps {
  banners: Banner[];
  onAdd: (banner: Banner) => void;
  onUpdate: (id: string, banner: Partial<Banner>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

interface Banner {
  id?: string;
  dia?: string;
  titulo?: string;
  descripcion?: string;
  imagenUrl?: string;
  horaPublicacion?: string;
  activo?: boolean;
}

// ❌ ELIMINADO: Hook personalizado obsoleto - usar useImageUpload unificado

/**
 * Componente para gestionar banners diarios del portal
 * Permite configurar banners específicos para cada día de la semana
 */
const BannersManager: React.FC<BannersManagerProps> = ({
  banners,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}) => {
  // Estados locales
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [publishTime, setPublishTime] = useState('04:00');
  const [formData, setFormData] = useState({
    dia: 'lunes',
    titulo: '',
    descripcion: '',
    imagenUrl: '',
    horaPublicacion: '04:00',
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
      console.log('🔄 Banner direct upload for day:', selectedDay);
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
      notificationService.success({ message: '✅ Imagen del banner actualizada' });
      
    } catch (error) {
      console.error('❌ Banner direct upload error:', error);
      notificationService.error({ message: 'Error al procesar la imagen' });
    } finally {
      // Limpiar input para permitir cargar la misma imagen nuevamente
      event.target.value = '';
    }
  };

  // Helper functions para evitar ternarios anidados
  const getButtonText = () => {
    if (uploading) return 'Guardando...';
    return bannerPorDia ? 'Actualizar' : 'Crear';
  };

  const getBannerCardStyle = (banner: Banner | undefined) => {
    if (!banner) return 'border-dark-600 bg-dark-700';
    return banner.activo
      ? 'border-success-500 bg-success-500/10'
      : 'border-yellow-500 bg-yellow-500/10';
  };

  const getBannerStatus = (banner: Banner | undefined) => {
    if (!banner) return '❌ Sin configurar';
    return banner.activo
      ? '✅ Configurado y activo'
      : '⚠️ Configurado pero inactivo';
  };

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

  // ✅ ESTABILIZAR bannerPorDia con useMemo para evitar recálculo innecesario
  const bannerPorDia = useMemo(() => 
    banners.find((b: Banner) => b.dia === selectedDay),
    [banners, selectedDay]
  );

  // ✅ CREAR DEPENDENCIAS ESTABLES para useEffect
  const bannerFormData = useMemo(() => ({
    id: bannerPorDia?.id,
    titulo: bannerPorDia?.titulo || '',
    descripcion: bannerPorDia?.descripcion || '',
    imagenUrl: bannerPorDia?.imagenUrl || '',
    horaPublicacion: bannerPorDia?.horaPublicacion || '04:00',
  }), [bannerPorDia]);

  // Actualizar formulario cuando cambia el día o el banner
  useEffect(() => {
    if (bannerPorDia) {
      setFormData({
        dia: selectedDay,
        titulo: bannerFormData.titulo,
        descripcion: bannerFormData.descripcion,
        imagenUrl: bannerFormData.imagenUrl,
        horaPublicacion: bannerFormData.horaPublicacion,
      });
      setPublishTime(bannerFormData.horaPublicacion);
    } else {
      setFormData({
        dia: selectedDay,
        titulo: '',
        descripcion: '',
        imagenUrl: '',
        horaPublicacion: '04:00',
      });
      setPublishTime('04:00');
    }
  }, [selectedDay, bannerPorDia, bannerFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const dataToSubmit: Banner = {
        id: bannerPorDia?.id || `banner_${selectedDay}_${Date.now()}`,
        dia: selectedDay,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        imagenUrl: formData.imagenUrl, // Ya actualizada por el callback del upload
        horaPublicacion: publishTime,
        activo: bannerPorDia?.activo ?? true,
      };

      if (bannerPorDia) {
        console.log('🔄 Actualizando banner existente:', {
          id: bannerPorDia.id,
          oldImage: bannerPorDia.imagenUrl,
          newImage: dataToSubmit.imagenUrl
        });
        // ✅ Pasar solo las propiedades que cambiaron (Partial<Banner>)
        const updates: Partial<Banner> = {
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          imagenUrl: formData.imagenUrl,
          horaPublicacion: publishTime,
        };
        onUpdate(bannerPorDia.id!, updates);
        notificationService.success({
          message: `Banner del ${diasCompletos[selectedDay as keyof typeof diasCompletos]} actualizado exitosamente`
        });
      } else {
        console.log('➕ Creando nuevo banner:', dataToSubmit);
        onAdd(dataToSubmit);
        notificationService.success({
          message: `Banner del ${diasCompletos[selectedDay as keyof typeof diasCompletos]} creado exitosamente`
        });
      }
    } catch (error) {
      console.error('Error al guardar banner:', error);
      notificationService.error({ message: 'Error al guardar banner' });
    } finally {
      setUploading(false);
    }
  };

  const handleDayChange = (newDay: string) => {
    setSelectedDay(newDay);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Banner Diario</h4>
        <p className="text-dark-400 text-sm mb-4">
          Configura banners para cada día de la semana. Se publicarán
          automáticamente a la hora especificada.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">Seleccionar Día</h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const tieneBanner = banners.some(
              (b: Banner) => b.dia === dia.value
            );
            return (
              <button
                key={dia.value}
                onClick={() => handleDayChange(dia.value)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors relative ${
                  selectedDay === dia.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                {dia.label}
                {tieneBanner && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario para el día seleccionado */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">
          Banner para {diasCompletos[selectedDay as keyof typeof diasCompletos]}
        </h5>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label
              htmlFor="titulo"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Título del Banner
            </label>
            <input
              id="titulo"
              type="text"
              value={formData.titulo}
              onChange={e =>
                setFormData(prev => ({ ...prev, titulo: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Evento especial del día"
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
              placeholder="Descripción del evento o promoción"
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
              onChange={e => setPublishTime(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              Se publicará automáticamente a esta hora (horario de operación:
              6pm - 3am)
            </p>
          </div>

          {/* Imagen del banner */}
          {/* 🎯 IMAGEN DEL BANNER - Patrón exacto de BrandingManager */}
          <div>
            <label htmlFor="banner-upload" className="block text-sm font-medium text-white mb-2">
              Imagen del Banner
            </label>
            <p className="text-xs text-dark-400 mb-3">
              Formatos soportados: JPG, PNG, WebP. Tamaño máximo: 2MB
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              {/* Mostrar imagen actual O recién subida */}
              {(formData.imagenUrl || bannerPorDia?.imagenUrl) && (
                <div className="relative group">
                  <img
                    src={formData.imagenUrl || bannerPorDia?.imagenUrl}
                    alt="Banner actual"
                    className="w-full h-32 object-cover rounded-lg border border-dark-600"
                    onError={(e) => {
                      // ✅ PROTECCIÓN: Mostrar placeholder si la imagen falla
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEyIiB5PSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSI4Ij5FcnJvcjwvdGV4dD4KPHN2Zz4K';
                      console.warn('❌ Error cargando imagen del banner:', formData.imagenUrl || bannerPorDia?.imagenUrl);
                    }}
                  />
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Banner {diasCompletos[selectedDay as keyof typeof diasCompletos]}
                  </div>
                  {/* Botón para cambiar imagen superpuesto */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <input
                      type="file"
                      id="banner-upload-change"
                      accept="image/*"
                      onChange={handleCarouselImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className="text-white text-xs">Cambiar imagen</span>
                  </div>
                </div>
              )}

              {/* Botón para agregar imagen - solo si NO hay imagen */}
              {!(formData.imagenUrl || bannerPorDia?.imagenUrl) && (
                <div className="relative">
                  <input
                    type="file"
                    id="banner-upload"
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
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-success-600 hover:bg-success-700 disabled:bg-success-400 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{getButtonText()}</span>
            </button>

            {bannerPorDia?.id && (
              <>
                <button
                  type="button"
                  onClick={() => bannerPorDia.id && onToggle(bannerPorDia.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    bannerPorDia.activo
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-dark-600 hover:bg-dark-500 text-dark-300'
                  }`}
                >
                  {bannerPorDia.activo ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span>{bannerPorDia.activo ? 'Desactivar' : 'Activar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const bannerId = bannerPorDia.id!;
                    notificationService.warning({
                      title: 'Confirmar eliminación',
                      message:
                        '¿Estás seguro de eliminar este banner? Esta acción no se puede deshacer.',
                      duration: 0, // No se cierra automáticamente
                      onClose: () => {
                        onDelete(bannerId);
                        notificationService.success({
                          message: 'Banner eliminado correctamente',
                        });
                      },
                    });
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </>
            )}
          </div>
        </form>

        {/* Estado actual del banner */}
        {bannerPorDia && (
          <div className="mt-6 p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">
                Estado Actual:
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  bannerPorDia.activo
                    ? 'bg-success-500/20 text-success-400'
                    : 'bg-dark-600 text-dark-300'
                }`}
              >
                {bannerPorDia.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="space-y-1 text-sm text-dark-300">
              <p>
                📅 Día:{' '}
                {diasCompletos[selectedDay as keyof typeof diasCompletos]}
              </p>
              <p>🕒 Hora: {bannerPorDia.horaPublicacion}</p>
              <p>📝 Título: {bannerPorDia.titulo || 'Sin título'}</p>
              <p>
                🖼️ Imagen:{' '}
                {bannerPorDia.imagenUrl ? 'Configurada' : 'No configurada'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resumen de todos los banners */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">Resumen Semanal</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {diasSemana.map(dia => {
            const banner = banners.find((b: Banner) => b.dia === dia.value);
            return (
              <div
                key={dia.value}
                className={`p-3 rounded-lg border ${getBannerCardStyle(banner)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {diasCompletos[dia.value as keyof typeof diasCompletos]}
                  </span>
                  {banner && (
                    <span className="text-xs text-dark-300">
                      {banner.horaPublicacion}
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-400">
                  {getBannerStatus(banner)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BannersManager;
