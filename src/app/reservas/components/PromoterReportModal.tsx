'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  X,
  TrendingUp,
  Users,
  UserCheck,
  Trophy,
  Award,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';

interface PromoterStat {
  promotorId: string;
  promotorName: string;
  totalRegistered: number;
  totalCheckedIn: number;
  totalPeople: number;
  guests: Array<{
    name: string;
    status: string;
    checkedInAt: string | null;
    guestCount: number;
  }>;
}

interface PromoterReportModalProps {
  readonly eventId: string;
  readonly eventName: string;
  readonly onClose: () => void;
}

export default function PromoterReportModal({ eventId, eventName, onClose }: Readonly<PromoterReportModalProps>) {
  const [loading, setLoading] = useState(true);
  const [promoters, setPromoters] = useState<PromoterStat[]>([]);
  const [totals, setTotals] = useState({
    totalPromoters: 0,
    totalRegistered: 0,
    totalCheckedIn: 0,
    totalPeople: 0
  });
  const [expandedPromoter, setExpandedPromoter] = useState<string | null>(null);

  useEffect(() => {
    loadPromoterStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const loadPromoterStats = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/promoter-stats`);
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setPromoters(data.promoters || []);
      setTotals(data.totals || {
        totalPromoters: 0,
        totalRegistered: 0,
        totalCheckedIn: 0,
        totalPeople: 0
      });
    } catch {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (promotorId: string) => {
    setExpandedPromoter(expandedPromoter === promotorId ? null : promotorId);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Award className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-700" />;
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Reporte de Promotores</h2>
                <p className="text-purple-100 text-sm">{eventName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-gray-500 font-medium">Promotores Activos</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">{totals.totalPromoters}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-500 font-medium">Registros</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">{totals.totalRegistered}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-green-600" />
                <p className="text-xs text-gray-500 font-medium">Asistieron</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">{totals.totalCheckedIn}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-indigo-600" />
                <p className="text-xs text-gray-500 font-medium">Total Personas</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">{totals.totalPeople}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          )}

          {!loading && promoters.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No hay datos de promotores
              </h3>
              <p className="text-gray-500">
                Aún no hay promotores con asistencias registradas para este evento
              </p>
            </div>
          )}

          {!loading && promoters.length > 0 && (
            <div className="space-y-3">
              {promoters.map((promoter, index) => (
                <div
                  key={promoter.promotorId}
                  className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Promoter Header */}
                  <button
                    onClick={() => toggleExpanded(promoter.promotorId)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(index) || (
                          <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">{promoter.promotorName}</p>
                        <p className="text-xs text-gray-500">
                          {promoter.totalCheckedIn} de {promoter.totalRegistered} asistieron
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <span className="text-xl font-bold text-green-600">
                            {promoter.totalCheckedIn}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{promoter.totalPeople} personas</p>
                      </div>
                      {expandedPromoter === promoter.promotorId ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Guest List */}
                  {expandedPromoter === promoter.promotorId && (
                    <div className="border-t bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Invitados ({promoter.guests.length})
                      </p>
                      <div className="space-y-1.5">
                        {promoter.guests.map((guest) => (
                          <div
                            key={`${guest.name}-${guest.checkedInAt || 'pending'}`}
                            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {guest.status === 'CHECKED_IN' ? (
                                <UserCheck className="w-4 h-4 text-green-600" />
                              ) : (
                                <Users className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="font-medium text-gray-700">{guest.name}</span>
                              {guest.guestCount > 1 && (
                                <span className="text-xs text-gray-500">
                                  ({guest.guestCount} personas)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {guest.status === 'CHECKED_IN' ? (
                                <>
                                  <span className="text-xs text-green-600 font-medium">
                                    Asistió
                                  </span>
                                  {guest.checkedInAt && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(guest.checkedInAt).toLocaleTimeString('es-EC', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">
                                  Registrado
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
