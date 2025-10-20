import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Cliente {
  id: string;
  nombre: string;
  cedula: string;
  correo?: string | null;
  telefono?: string | null;
  puntos: number;
}

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onClienteUpdated: () => void;
}

export default function EditClientModal({ isOpen, onClose, cliente, onClienteUpdated }: EditClientModalProps) {
  const [formData, setFormData] = useState({
    nombre: cliente?.nombre || '',
    cedula: cliente?.cedula || '',
    correo: cliente?.correo || '',
    telefono: cliente?.telefono || '',
    puntos: cliente?.puntos || 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar form data cuando cambia el cliente
  if (cliente && formData.cedula !== cliente.cedula) {
    setFormData({
      nombre: cliente.nombre,
      cedula: cliente.cedula,
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      puntos: cliente.puntos
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/clientes/${cliente.cedula}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          nuevaCedula: formData.cedula !== cliente.cedula ? formData.cedula : undefined,
          correo: formData.correo || null,
          telefono: formData.telefono || null,
          puntos: formData.puntos
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error actualizando cliente');
      }

      onClienteUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!cliente) return;
    
    if (!window.confirm(`¿Estás seguro de eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/clientes/${cliente.cedula}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error eliminando cliente');
      }

      onClienteUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (!cliente) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Editar Cliente</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula
                  </label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puntos
                  </label>
                  <input
                    type="number"
                    value={formData.puntos}
                    onChange={(e) => setFormData({ ...formData, puntos: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Eliminar
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
