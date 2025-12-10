'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import PromoterReportModal from './PromoterReportModal';
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Search,
  Download,
  QrCode,
  MoreVertical,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  TrendingUp
} from 'lucide-react';

interface Event {
  id: string;
  name: string;
  eventDate: string;
  startTime: string;
  maxCapacity: number;
  primaryColor: string;
  registrationUrl: string;
}

interface Guest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  guestCount: number;
  qrToken: string;
  status: 'REGISTERED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW';
  checkedInAt?: string;
  checkedInBy?: string;
  createdAt: string;
  Promotor?: {
    id: string;
    nombre: string;
  };
  referralCode?: string;
}

interface Stats {
  total: number;
  totalPeople: number;
  registered: number;
  checkedIn: number;
  cancelled: number;
}

interface EventGuestListProps {
  readonly event: Event;
  readonly onBack: () => void;
}

const statusConfig = {
  REGISTERED: { label: 'Registrado', color: 'bg-blue-100 text-blue-700', icon: Clock },
  CHECKED_IN: { label: 'Asistió', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
  NO_SHOW: { label: 'No asistió', color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
};

export default function EventGuestList({ event, onBack }: Readonly<EventGuestListProps>) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showPromoterReport, setShowPromoterReport] = useState(false);

  // Load guests
  const loadGuests = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/guests`);
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setGuests(data.guests || []);
      setStats(data.stats);
    } catch {
      toast.error('Error al cargar invitados');
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Manual check-in
  const handleCheckIn = async (guestId: string, guest: Guest) => {
    try {
      const res = await fetch('/api/events/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: guest.qrToken })
      });
      
      const data = await res.json();
      
      if (data.alreadyCheckedIn) {
        toast.info(`${guest.name} ya había registrado su entrada`);
      } else if (data.success) {
        toast.success(`✅ ${guest.name} registrado`);
      } else {
        toast.error(data.error || 'Error al registrar entrada');
        return;
      }
      
      loadGuests();
    } catch {
      toast.error('Error al registrar entrada');
    }
    setActiveMenu(null);
  };

  // Cancel registration - unused for now
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCancel = async (_guestId: string) => {
    if (!confirm('¿Cancelar este registro?')) return;
    
    // For now, we'll use a simple approach - you can add a dedicated API later
    toast.info('Función en desarrollo');
    setActiveMenu(null);
  };

  // Delete guest - unused for now
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = async (_guestId: string) => {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    toast.info('Función en desarrollo');
    setActiveMenu(null);
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Nombre', 'Teléfono', 'Email', 'Personas', 'Estado', 'Fecha Registro', 'Check-in'];
    const rows = guests.map(g => [
      g.name,
      g.phone || '',
      g.email || '',
      g.guestCount.toString(),
      statusConfig[g.status].label,
      format(new Date(g.createdAt), 'dd/MM/yyyy HH:mm'),
      g.checkedInAt ? format(new Date(g.checkedInAt), 'dd/MM/yyyy HH:mm') : ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitados-${event.name.split(/\s+/).join('-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Lista exportada');
  };

  // Copy registration link
  const copyLink = () => {
    navigator.clipboard.writeText(event.registrationUrl);
    toast.success('Link copiado');
  };

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone?.includes(searchTerm) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const eventDate = new Date(event.eventDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{event.name}</h2>
            <p className="text-sm text-gray-500">
              {format(eventDate, "EEEE d 'de' MMMM, yyyy", { locale: es })} • {event.startTime}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPromoterReport(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Reporte Promotores</span>
          </button>
          <button
            onClick={loadGuests}
            className="p-2 border rounded-lg hover:bg-gray-50"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Copy className="w-4 h-4" />
            Copiar link
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Registros</p>
                <p className="text-xl font-bold text-gray-800">
                  {stats.total}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    ({stats.totalPeople} personas)
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Asistieron</p>
                <p className="text-xl font-bold text-gray-800">{stats.checkedIn}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-xl font-bold text-gray-800">{stats.registered}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <UserX className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacidad</p>
                <p className="text-xl font-bold text-gray-800">
                  {stats.totalPeople}/{event.maxCapacity}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration link banner */}
      <div 
        className="rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: `${event.primaryColor}10` }}
      >
        <div className="flex items-center gap-3">
          <QrCode className="w-6 h-6" style={{ color: event.primaryColor }} />
          <div>
            <p className="font-medium text-gray-800">Link de registro</p>
            <p className="text-sm text-gray-600 break-all">{event.registrationUrl}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="px-3 py-1.5 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Copiar
          </button>
          <button
            onClick={() => window.open(event.registrationUrl, '_blank')}
            className="px-3 py-1.5 text-white rounded-lg text-sm font-medium"
            style={{ backgroundColor: event.primaryColor }}
          >
            Abrir
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
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
          <option value="all">Todos</option>
          <option value="REGISTERED">Registrados</option>
          <option value="CHECKED_IN">Asistieron</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>

      {/* Guest list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading && (
          <div className="p-8 text-center text-gray-500">
            Cargando invitados...
          </div>
        )}

        {!loading && filteredGuests.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {guests.length === 0 
                ? 'Aún no hay registros' 
                : 'No se encontraron invitados con esos filtros'}
            </p>
          </div>
        )}

        {!loading && filteredGuests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invitado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Promotor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Personas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredGuests.map((guest) => {
                  const config = statusConfig[guest.status];
                  const StatusIcon = config.icon;

                  return (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{guest.name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(guest.createdAt), "d MMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {guest.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Phone className="w-3.5 h-3.5" />
                              {guest.phone}
                            </div>
                          )}
                          {guest.email && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Mail className="w-3.5 h-3.5" />
                              {guest.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {guest.Promotor ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span className="text-sm font-medium text-purple-700">
                              {guest.Promotor.nombre}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Directo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full font-medium text-gray-700">
                          {guest.guestCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </div>
                        {guest.checkedInAt && (
                          <p className="text-xs text-center text-gray-500 mt-1">
                            {format(new Date(guest.checkedInAt), "HH:mm")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {guest.status === 'REGISTERED' && (
                            <button
                              onClick={() => handleCheckIn(guest.id, guest)}
                              className="mr-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                            >
                              Check-in
                            </button>
                          )}
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenu(activeMenu === guest.id ? null : guest.id)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                            {activeMenu === guest.id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-10">
                                {guest.status === 'REGISTERED' && (
                                  <button
                                    onClick={() => handleCheckIn(guest.id, guest)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-green-600"
                                  >
                                    ✓ Registrar entrada
                                  </button>
                                )}
                                <button
                                  onClick={() => handleCancel(guest.id)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-yellow-600"
                                >
                                  ⏸ Cancelar registro
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => handleDelete(guest.id)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
                                >
                                  🗑 Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Close dropdown */}
      {activeMenu && (
        <button
          type="button"
          className="fixed inset-0 z-0 cursor-default bg-transparent border-0"
          onClick={() => setActiveMenu(null)}
          aria-label="Cerrar menú"
        />
      )}

      {/* Promoter Report Modal */}
      {showPromoterReport && (
        <PromoterReportModal
          eventId={event.id}
          eventName={event.name}
          onClose={() => setShowPromoterReport(false)}
        />
      )}
    </div>
  );
}
