'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Plus,
  Calendar,
  Users,
  Link as LinkIcon,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Copy,
  UserCheck,
  ExternalLink,
  Search
} from 'lucide-react';
import EventFormModal from './EventFormModal';
import EventGuestList from './EventGuestList';

interface Event {
  id: string;
  name: string;
  description?: string;
  slug: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  maxCapacity: number;
  currentCount: number;
  imageUrl?: string;
  primaryColor: string;
  requirePhone: boolean;
  requireEmail: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalViews: number;
  guestCount: number;
  registrationUrl: string;
  createdAt: string;
}

interface EventsManagementProps {
  readonly businessId: string;
}

const statusConfig = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  ACTIVE: { label: 'Activo', color: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  CLOSED: { label: 'Cerrado', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  IN_PROGRESS: { label: 'En curso', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  COMPLETED: { label: 'Completado', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' }
};

export default function EventsManagement({ businessId }: EventsManagementProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load events
  const loadEvents = async () => {
    try {
      const res = await fetch(`/api/events?businessId=${businessId}`);
      if (!res.ok) throw new Error('Error loading events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  // Delete event
  const handleDelete = async (eventId: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      toast.success('Evento eliminado');
      loadEvents();
    } catch {
      toast.error('Error al eliminar evento');
    }
  };

  // Update event status
  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Error');
      toast.success('Estado actualizado');
      loadEvents();
    } catch {
      toast.error('Error al actualizar estado');
    }
    setActiveMenu(null);
  };

  // Copy link
  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado al portapapeles');
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (selectedEvent) {
    return (
      <EventGuestList
        event={selectedEvent}
        onBack={() => {
          setSelectedEvent(null);
          loadEvents();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Lista de Invitados</h2>
          <p className="text-sm text-gray-500">Crea eventos y gestiona registros con QR</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Evento
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="ACTIVE">Activo</option>
          <option value="CLOSED">Cerrado</option>
          <option value="IN_PROGRESS">En curso</option>
          <option value="COMPLETED">Completado</option>
        </select>
      </div>

      {/* Events grid */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {events.length === 0 ? 'No hay eventos' : 'No se encontraron eventos'}
          </h3>
          <p className="text-gray-500 mb-6">
            {events.length === 0 
              ? 'Crea tu primer evento para comenzar a recibir registros'
              : 'Prueba con otros filtros de búsqueda'}
          </p>
          {events.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Crear Evento
            </button>
          )}
        </div>
      )}

      {!loading && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const config = statusConfig[event.status];
            const eventDate = new Date(event.eventDate);

            return (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Event image or color header */}
                <div 
                  className="h-24 relative"
                  style={{ 
                    backgroundColor: event.imageUrl ? 'transparent' : event.primaryColor,
                    backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                  </div>
                  {/* Menu */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => setActiveMenu(activeMenu === event.id ? null : event.id)}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-white"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                    {activeMenu === event.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setShowForm(true);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" /> Editar
                        </button>
                        <button
                          onClick={() => copyLink(event.registrationUrl)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" /> Copiar link
                        </button>
                        <button
                          onClick={() => window.open(event.registrationUrl, '_blank')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" /> Ver página
                        </button>
                        <hr className="my-1" />
                        {event.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusChange(event.id, 'ACTIVE')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-green-600"
                          >
                            ✓ Activar registro
                          </button>
                        )}
                        {event.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusChange(event.id, 'CLOSED')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-yellow-600"
                          >
                            ⏸ Cerrar registro
                          </button>
                        )}
                        <hr className="my-1" />
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 truncate">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{format(eventDate, "d MMM yyyy", { locale: es })}</span>
                    <span>•</span>
                    <span>{event.startTime}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{event.guestCount}/{event.maxCapacity}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span>{event.totalViews} vistas</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                    >
                      <UserCheck className="w-4 h-4" />
                      Ver invitados
                    </button>
                    <button
                      onClick={() => copyLink(event.registrationUrl)}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      title="Copiar link"
                    >
                      <LinkIcon className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {activeMenu && (
        <button 
          type="button"
          className="fixed inset-0 z-0 cursor-default bg-transparent border-0"
          onClick={() => setActiveMenu(null)}
          onKeyDown={(e) => e.key === 'Escape' && setActiveMenu(null)}
          aria-label="Cerrar menú"
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <EventFormModal
          businessId={businessId}
          event={editingEvent}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingEvent(null);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}
