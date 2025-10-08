"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  TrendingUp,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Promotor {
  id: string;
  nombre: string;
  activo: boolean;
  _count?: {
    reservations: number;
  };
}

interface PromotorStats {
  promotorId: string;
  nombre: string;
  totalReservas: number;
  asistieron: number;
  noAsistieron: number;
  tasaAsistencia: number;
}

interface PromotorManagementProps {
  businessId: string;
  onClose: () => void;
}

export function PromotorManagement({ businessId, onClose }: Readonly<PromotorManagementProps>) {
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [stats, setStats] = useState<PromotorStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPromotor, setSelectedPromotor] = useState<Promotor | null>(null);
  const [promotorToDelete, setPromotorToDelete] = useState<Promotor | null>(null);
  const [view, setView] = useState<'list' | 'stats'>('list');
  const [nombre, setNombre] = useState("");

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    loadPromotores();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadPromotores = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/promotores?businessId=${businessId}`);
      if (!response.ok) throw new Error('Error al cargar promotores');
      const data = await response.json();
      setPromotores(data.promotores || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const response = await fetch(`/api/promotores/stats?businessId=${businessId}&month=${month}&year=${year}`);
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      const data = await response.json();
      setStats(data.promotores || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreate = async () => {
    if (!nombre.trim()) {
      toast.error('❌ El nombre es obligatorio');
      return;
    }
    try {
      const response = await fetch('/api/promotores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, nombre: nombre.trim(), activo: true }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      toast.success('✅ Promotor creado exitosamente', {
        description: `${nombre.trim()} ha sido agregado a la lista`
      });
      await loadPromotores();
      setShowCreateModal(false);
      setNombre("");
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('Error stack:', error.stack);
      toast.error('❌ Error al crear promotor', {
        description: error.message
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedPromotor || !nombre.trim()) return;
    try {
      const response = await fetch(`/api/promotores/${selectedPromotor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, nombre: nombre.trim() }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar promotor');
      }
      toast.success('✅ Promotor actualizado', {
        description: `${nombre.trim()} ha sido actualizado`
      });
      await loadPromotores();
      setShowEditModal(false);
      setSelectedPromotor(null);
      setNombre("");
    } catch (error: any) {
      toast.error('❌ Error al actualizar', {
        description: error.message
      });
    }
  };

  const handleDelete = async (promotor: Promotor) => {
    // Abrir modal de confirmación
    setPromotorToDelete(promotor);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!promotorToDelete) return;
    
    try {
      const response = await fetch(`/api/promotores/${promotorToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar promotor');
      }
      
      await response.json(); // Consume response
      
      toast.success('🗑️ Promotor eliminado', {
        description: `${promotorToDelete.nombre} ha sido eliminado exitosamente`
      });
      
      await loadPromotores();
      setShowDeleteConfirm(false);
      setPromotorToDelete(null);
    } catch (error: any) {
      toast.error('❌ Error al eliminar', {
        description: error.message
      });
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPromotorToDelete(null);
  };

  const openEditModal = (promotor: Promotor) => {
    setSelectedPromotor(promotor);
    setNombre(promotor.nombre);
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedPromotor(null);
    setNombre("");
  };

  const filteredPromotores = promotores.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // Overlay con bloqueo de scroll del fondo
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Modal Container - Más compacto y con altura controlada */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header - Fijo */}
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-white" />
            <h2 className="text-xl font-bold text-white">Gestión de Promotores</h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs - Fijo */}
        <div className="flex border-b bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setView('list')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              view === 'list' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="inline-block h-4 w-4 mr-2" />
            Promotores
          </button>
          <button
            onClick={() => setView('stats')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              view === 'stats' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="inline-block h-4 w-4 mr-2" />
            Estadísticas
          </button>
        </div>

        {/* Content - Scrolleable */}
        <div className="flex-1 overflow-y-auto">
          {view === 'list' ? (
            <div className="p-4 space-y-3">
              {/* Barra de búsqueda y botón - Sticky en la parte superior */}
              <div className="sticky top-0 bg-white z-10 pb-3 -mx-4 px-4 pt-0 shadow-sm">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="Buscar promotor..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="pl-9 h-9 text-sm" 
                    />
                  </div>
                  <Button 
                    onClick={() => setShowCreateModal(true)} 
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nuevo
                  </Button>
                </div>
              </div>

              {/* Lista de promotores - Más compacta */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
                  <p className="mt-4 text-gray-600 text-sm">Cargando promotores...</p>
                </div>
              ) : filteredPromotores.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-base font-medium mb-2">No hay promotores</p>
                  <p className="text-sm">Cree su primer promotor para clasificar el origen de las reservas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPromotores.map((promotor) => (
                    <div 
                      key={promotor.id} 
                      className="p-3 rounded-lg border border-gray-200 bg-white hover:shadow-sm hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{promotor.nombre}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-blue-600 flex-shrink-0">
                            {promotor._count?.reservations || 0} reservas
                          </span>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => openEditModal(promotor)} 
                              className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors" 
                              title="Editar nombre"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(promotor)} 
                              className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Estadísticas del Mes Actual</h3>
                <p className="text-xs text-gray-600">Efectividad de cada medio/fuente de reservas</p>
              </div>

              {stats.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-base font-medium mb-2">No hay estadísticas</p>
                  <p className="text-sm">Las estadísticas aparecerán cuando haya reservas completadas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.map((stat, index) => (
                    <div key={stat.promotorId} className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            #{index + 1}
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900">{stat.nombre}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{stat.tasaAsistencia.toFixed(1)}%</p>
                          <p className="text-xs text-gray-500">Asistencia</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-base font-bold text-gray-900">{stat.totalReservas}</p>
                          <p className="text-xs text-gray-600">Total</p>
                        </div>
                        <div>
                          <p className="text-base font-bold text-green-600">{stat.asistieron}</p>
                          <p className="text-xs text-gray-600">Asistieron</p>
                        </div>
                        <div>
                          <p className="text-base font-bold text-red-600">{stat.noAsistieron}</p>
                          <p className="text-xs text-gray-600">No asistieron</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar - z-index mayor */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {showCreateModal ? 'Nuevo Promotor' : 'Editar Promotor'}
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              {showCreateModal ? 'Ingrese el nombre del medio o fuente de la reserva' : 'Modifique el nombre del promotor'}
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="nombre" className="text-sm">
                  Nombre del Promotor <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="nombre" 
                  type="text" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  placeholder="Ej: Instagram, Facebook, WhatsApp, etc." 
                  required 
                  autoFocus 
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nombre se usará para clasificar de dónde vienen las reservas
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={closeModal} variant="outline" className="flex-1 h-9 text-sm">
                Cancelar
              </Button>
              <Button 
                onClick={showCreateModal ? handleCreate : handleEdit} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
              >
                {showCreateModal ? 'Crear' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && promotorToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  ¿Está seguro de eliminar &quot;{promotorToDelete.nombre}&quot;?
                </h3>
                <p className="text-sm text-gray-600">
                  Esta acción no se puede deshacer. Las reservas asociadas mantendrán su referencia.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={cancelDelete} 
                variant="outline" 
                className="flex-1 h-9 text-sm"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmDelete} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9 text-sm"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
