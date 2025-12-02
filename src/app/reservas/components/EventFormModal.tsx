'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Users, Image, Palette, Loader2, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id?: string;
  name: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  maxCapacity: number;
  imageUrl?: string;
  primaryColor: string;
  requirePhone: boolean;
  requireEmail: boolean;
  status?: string;
}

interface EventFormModalProps {
  readonly businessId: string;
  readonly event: Event | null;
  readonly onClose: () => void;
  readonly onSave: () => void;
}

export default function EventFormModal({ businessId, event, onClose, onSave }: Readonly<EventFormModalProps>) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventDate: '',
    startTime: '21:00',
    endTime: '',
    maxCapacity: 100,
    imageUrl: '',
    primaryColor: '#6366f1',
    requirePhone: true,
    requireEmail: false
  });

  // Load existing event data
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description || '',
        eventDate: event.eventDate.split('T')[0],
        startTime: event.startTime,
        endTime: event.endTime || '',
        maxCapacity: event.maxCapacity,
        imageUrl: event.imageUrl || '',
        primaryColor: event.primaryColor,
        requirePhone: event.requirePhone,
        requireEmail: event.requireEmail
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.eventDate || !formData.startTime || !formData.maxCapacity) {
      toast.error('Completa los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      const url = event ? `/api/events/${event.id}` : '/api/events';
      const method = event ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessId
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }

      const data = await res.json();
      
      toast.success(event ? 'Evento actualizado' : 'Evento creado');
      
      if (!event && data.registrationUrl) {
        toast.info(`Link de registro: ${data.registrationUrl}`, { duration: 5000 });
      }
      
      onSave();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar evento');
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#0ea5e9', // Sky
    '#000000', // Black
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 cursor-default border-0"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {event ? 'Editar Evento' : 'Nuevo Evento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Event name */}
          <div>
            <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del evento *
            </label>
            <input
              id="event-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: Fiesta de Año Nuevo 2025"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="event-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Información adicional del evento..."
            />
          </div>

          {/* Date and time */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha *
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                required
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Inicio *
              </label>
              <input
                id="start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">
                Fin
              </label>
              <input
                id="end-time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label htmlFor="max-capacity" className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Capacidad máxima *
            </label>
            <input
              id="max-capacity"
              type="number"
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: Number.parseInt(e.target.value) || 0 })}
              required
              min={1}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              El registro se cerrará automáticamente cuando se alcance este límite
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-4 h-4 inline mr-1" aria-hidden="true" />
              Imagen de fondo del evento
            </label>
            
            {/* Image preview or upload area */}
            {formData.imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                    setFormData({ ...formData, imageUrl: '' });
                    toast.error('URL de imagen no válida');
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                    title="Cambiar imagen"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-sm">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">Subir imagen</span>
                    <span className="text-xs text-gray-400">PNG, JPG hasta 5MB</span>
                  </>
                )}
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                if (file.size > 5 * 1024 * 1024) {
                  toast.error('La imagen debe ser menor a 5MB');
                  return;
                }
                
                setUploadingImage(true);
                try {
                  const formDataUpload = new FormData();
                  formDataUpload.append('file', file);
                  formDataUpload.append('folder', 'events');
                  
                  const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formDataUpload
                  });
                  
                  if (!res.ok) throw new Error('Error al subir imagen');
                  
                  const data = await res.json();
                  setFormData({ ...formData, imageUrl: data.url });
                  toast.success('Imagen subida');
                } catch {
                  toast.error('Error al subir imagen');
                } finally {
                  setUploadingImage(false);
                  e.target.value = '';
                }
              }}
            />
            
            {/* Manual URL input as alternative */}
            <div className="mt-2">
              <input
                id="image-url"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="O pega una URL de imagen..."
              />
            </div>
          </div>

          {/* Primary color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Color del QR
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, primaryColor: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    formData.primaryColor === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Required fields */}
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Datos requeridos para registro
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requirePhone}
                onChange={(e) => setFormData({ ...formData, requirePhone: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-600">Teléfono obligatorio</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireEmail}
                onChange={(e) => setFormData({ ...formData, requireEmail: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-600">Email obligatorio</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              )}
              {!loading && (event ? 'Guardar cambios' : 'Crear evento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
