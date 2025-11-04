'use client';

import { useState, useEffect, useCallback } from 'react';
import { Reserva, DashboardStats } from '../types/reservation';
import { toast } from 'sonner';
import { convertirFechaAString } from '@/lib/timezone-utils';

// Datos de ejemplo compatibles con la referencia
const mockReservas: Reserva[] = [
  {
    id: 'res-001',
    cliente: {
      id: 'cli-001',
      nombre: 'Carlos Jiménez',
      telefono: '+506 8888-9012',
      email: 'carlos.jimenez@email.com'
    },
    numeroPersonas: 18,
    razonVisita: 'Celebración',
    beneficiosReserva: 'Descuento 20%',
    promotor: { id: 'prom-001', nombre: 'Sofia Vargas' },
    fecha: '2025-09-17',
    hora: '9:00',
    codigoQR: 'QR-001',
    asistenciaActual: 15,
    estado: 'Activa',
    fechaCreacion: '2025-09-15T10:00:00Z',
    mesa: '',
    registroEntradas: [
      { timestamp: '2025-09-17T09:00:00Z', cantidad: 15, metodo: 'QR' }
    ]
  },
  {
    id: 'res-002',
    cliente: {
      id: 'cli-002',
      nombre: 'José López',
      telefono: '+506 8888-1234',
      email: 'jose.lopez@email.com'
    },
    numeroPersonas: 5,
    razonVisita: 'Cumpleaños',
    beneficiosReserva: 'Bebida gratis',
    promotor: { id: 'prom-002', nombre: 'Ana García' },
    fecha: '2025-09-17',
    hora: '6:00',
    codigoQR: 'QR-002',
    asistenciaActual: 6,
    estado: 'Reserva Caída',
    fechaCreacion: '2025-09-16T14:00:00Z',
    mesa: '',
    registroEntradas: []
  },
  {
    id: 'res-003',
    cliente: {
      id: 'cli-003',
      nombre: 'María Rodríguez',
      telefono: '+506 8888-5678',
      email: 'maria.rodriguez@email.com'
    },
    numeroPersonas: 15,
    razonVisita: 'Cumpleaños',
    beneficiosReserva: 'Bebida gratis',
    promotor: { id: 'prom-001', nombre: 'Sofia Vargas' },
    fecha: '2025-09-27',
    hora: '6:00',
    codigoQR: 'QR-003',
    asistenciaActual: 3,
    estado: 'Reserva Caída',
    fechaCreacion: '2025-09-25T16:00:00Z',
    mesa: '',
    registroEntradas: []
  },
  {
    id: 'res-004',
    cliente: {
      id: 'cli-004',
      nombre: 'José López',
      telefono: '+506 8888-1234',
      email: 'jose.lopez@email.com'
    },
    numeroPersonas: 24,
    razonVisita: 'Cumpleaños',
    beneficiosReserva: 'Postre cortesía',
    promotor: { id: 'prom-003', nombre: 'Luis Herrera' },
    fecha: '2025-09-25',
    hora: '9:00',
    codigoQR: 'QR-004',
    asistenciaActual: 22,
    estado: 'Activa',
    fechaCreacion: '2025-09-23T11:00:00Z',
    mesa: '',
    registroEntradas: []
  },
  {
    id: 'res-005',
    cliente: {
      id: 'cli-005',
      nombre: 'María Rodríguez',
      telefono: '+506 8888-5678',
      email: 'maria.rodriguez@email.com'
    },
    numeroPersonas: 21,
    razonVisita: 'Celebración',
    beneficiosReserva: 'Mesa VIP',
    promotor: { id: 'prom-001', nombre: 'Sofia Vargas' },
    fecha: '2025-09-30',
    hora: '6:30',
    codigoQR: 'QR-005',
    asistenciaActual: 18,
    estado: 'Activa',
    fechaCreacion: '2025-09-28T13:00:00Z',
    mesa: '',
    registroEntradas: [
      { timestamp: '2025-09-30T18:30:00Z', cantidad: 18, metodo: 'QR' }
    ]
  },
  {
    id: 'res-006',
    cliente: {
      id: 'cli-006',
      nombre: 'José López',
      telefono: '+506 8888-1234',
      email: 'jose.lopez@email.com'
    },
    numeroPersonas: 19,
    razonVisita: 'Evento social',
    beneficiosReserva: 'Postre cortesía',
    promotor: { id: 'prom-002', nombre: 'Ana García' },
    fecha: '2025-10-10',
    hora: '16:30',
    codigoQR: 'QR-006',
    asistenciaActual: 8,
    estado: 'En Camino',
    fechaCreacion: '2025-10-08T09:00:00Z',
    registroEntradas: [
      { timestamp: '2025-10-10T16:30:00Z', cantidad: 8, metodo: 'QR' }
    ]
  },
  {
    id: 'res-007',
    cliente: {
      id: 'cli-007',
      nombre: 'Carlos Jiménez',
      telefono: '+506 8888-9012',
      email: 'carlos.jimenez@email.com'
    },
    numeroPersonas: 10,
    razonVisita: 'Reunión empresarial',
    beneficiosReserva: '',
    promotor: { id: 'prom-003', nombre: 'Luis Herrera' },
    fecha: '2025-09-18',
    hora: '6:30',
    codigoQR: 'QR-007',
    asistenciaActual: 12,
    estado: 'En Camino',
    fechaCreacion: '2025-09-16T12:00:00Z',
    registroEntradas: [
      { timestamp: '2025-09-18T18:30:00Z', cantidad: 12, metodo: 'QR' }
    ]
  }
];

export function useReservations(businessId?: string) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Fecha seleccionada para filtrar
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Reserva['estado'] | 'Todos'>('Todos'); // Filtro de estado
  
  // Estados para sincronización en tiempo real
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string>(new Date().toISOString());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'checking' | 'updating'>('idle');

  // Función para cargar reservas desde la API
  const loadReservasFromAPI = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Usar ruta con businessId como query parameter
      const apiUrl = businessId ? `/api/reservas?businessId=${businessId}` : '/api/reservas';
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Error al cargar las reservas');
      }
      const data = await response.json();
      setReservas(data.reservas || []);
      setLastUpdateTimestamp(new Date().toISOString());
    } catch (error) {
      console.error('Error loading reservas:', error);
      if (!silent) {
        toast.error('❌ Error al cargar las reservas');
      }
      // Fallback a datos mock en caso de error
      setReservas(mockReservas);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [businessId]);

  // Función para verificar si hay actualizaciones (polling inteligente)
  const checkForUpdates = useCallback(async () => {
    if (!businessId) return;
    
    try {
      setSyncStatus('checking');
      const response = await fetch(
        `/api/reservas/check-updates?businessId=${businessId}&since=${lastUpdateTimestamp}`
      );
      
      if (!response.ok) {
        console.error('Error verificando actualizaciones');
        setSyncStatus('idle');
        return;
      }

      const data = await response.json();
      
      if (data.hasChanges) {
        setSyncStatus('updating');
        setIsSyncing(true);
        
        // Cargar datos completos solo si hay cambios
        await loadReservasFromAPI(true); // silent = true
        
        toast.success(`✨ ${data.changedCount || 0} reserva(s) actualizada(s)`, {
          duration: 2000,
          className: 'bg-blue-600 text-white border-0',
        });
        
        setIsSyncing(false);
      }
      
      setSyncStatus('idle');
    } catch (error) {
      console.error('Error en checkForUpdates:', error);
      setSyncStatus('idle');
      setIsSyncing(false);
    }
  }, [businessId, lastUpdateTimestamp, loadReservasFromAPI]);

  // 🔥 OPTIMIZACIÓN: Polling inteligente con intervalo adaptativo MEJORADO
  useEffect(() => {
    if (!businessId) return;

    // Carga inicial
    loadReservasFromAPI();

    // 🎯 REDUCIR EDGE REQUESTS: Polling cada 30 segundos (antes 8 segundos)
    const pollingInterval = setInterval(() => {
      // Solo hacer polling si la ventana está visible
      if (!document.hidden) {
        checkForUpdates();
      }
    }, 30000); // 🔥 30 segundos (reducción de -75% requests)

    return () => {
      clearInterval(pollingInterval);
    };
  }, [businessId, checkForUpdates, loadReservasFromAPI]);

  // 🎯 OPTIMIZACIÓN: Pausar polling cuando el tab no está visible + refetch inteligente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab vuelve a estar visible → verificar solo si han pasado más de 30 segundos
        const timeSinceLastUpdate = Date.now() - new Date(lastUpdateTimestamp).getTime();
        const shouldCheck = timeSinceLastUpdate > 30000; // 30 segundos de threshold
        
        if (shouldCheck) {
          checkForUpdates();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkForUpdates, lastUpdateTimestamp]);

  const addReserva = async (reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>) => {
    try {
      const apiUrl = businessId ? `/api/reservas?businessId=${businessId}` : '/api/reservas';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cliente: reservaData.cliente,
          numeroPersonas: reservaData.numeroPersonas,
          asistenciaActual: reservaData.asistenciaActual,
          fecha: reservaData.fecha,
          hora: reservaData.hora,
          razonVisita: reservaData.razonVisita,
          beneficiosReserva: reservaData.beneficiosReserva,
          promotor: reservaData.promotor,
          promotorId: reservaData.promotor?.id // ✅ Enviar explícitamente el promotorId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`;
        console.error('Error del servidor:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const newReserva: Reserva = data.reserva;
      
      setReservas(prev => {
        const nuevasReservas = [...prev, newReserva];
        // ✅ Ordenar por orden de creación (más antiguas primero)
        return nuevasReservas.sort((a, b) => {
          const fechaCreacionA = new Date(a.fechaCreacion).getTime();
          const fechaCreacionB = new Date(b.fechaCreacion).getTime();
          return fechaCreacionA - fechaCreacionB;
        });
      });
      
      // Toast dinámico según si es express o normal
      const isExpress = reservaData.razonVisita?.includes('⚡ Reserva Express');
      toast.success(isExpress ? '⚡ Reserva Express creada' : '✨ Reserva creada exitosamente', {
        className: 'bg-green-600 text-white border-0',
        style: {
          backgroundColor: '#16a34a !important',
          color: 'white !important',
          border: 'none !important',
        },
      });
      return newReserva;
    } catch (error) {
      toast.error('❌ Error al crear la reserva', {
        className: 'bg-red-600 text-white border-0',
        style: {
          backgroundColor: '#dc2626 !important',
          color: 'white !important',
          border: 'none !important',
        },
      });
      throw error;
    }
  };

  const updateReserva = async (id: string, updates: Partial<Reserva>) => {
    try {
      // ✅ Validar que tenemos businessId antes de proceder
      if (!businessId) {
        const error = 'BusinessId es requerido para actualizar reservas';
        console.error('❌ Error de validación:', error);
        toast.error(`❌ ${error}`, {
          className: 'bg-red-600 text-white border-0',
          style: {
            backgroundColor: '#dc2626 !important',
            color: 'white !important',
            border: 'none !important',
          },
        });
        throw new Error(error);
      }

      // 🎯 Actualización optimista para cambios de estado (para UI instantánea)
      if (updates.estado) {
        setReservas(prev => 
          prev.map(reserva => 
            reserva.id === id ? { ...reserva, estado: updates.estado! } : reserva
          )
        );
      }

      const queryString = `?businessId=${businessId}`;
      const apiUrl = `/api/reservas/${id}${queryString}`;
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // 🔄 Revertir actualización optimista en caso de error
        if (updates.estado) {
          setReservas(prev => 
            prev.map(reserva => 
              reserva.id === id ? { ...reserva, estado: reserva.estado } : reserva
            )
          );
        }
        
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Actualizar con datos completos del servidor
      setReservas(prev => 
        prev.map(reserva => 
          reserva.id === id ? data.reserva : reserva
        )
      );

    } catch (error) {
      console.error('❌ Error en updateReserva:', error);
      toast.error(`❌ Error al actualizar: ${error instanceof Error ? error.message : 'Error desconocido'}`, {
        className: 'bg-red-600 text-white border-0',
        style: {
          backgroundColor: '#dc2626 !important',
          color: 'white !important',
          border: 'none !important',
        },
      });
      throw error;
    }
  };

  const deleteReserva = async (id: string) => {
    try {
      // 1. Llamar al API para eliminar de la base de datos
      const response = await fetch(`/api/reservas/${id}?businessId=${businessId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la reserva');
      }

      // 2. Actualizar estado local solo si la eliminación en el servidor fue exitosa
      setReservas(prev => prev.filter(reserva => reserva.id !== id));
      
      toast.success('🗑️ Reserva eliminada exitosamente', {
        className: 'bg-red-600 text-white border-0',
        style: {
          backgroundColor: '#dc2626 !important',
          color: 'white !important',
          border: 'none !important',
        },
      });
      
    } catch (error) {
      console.error('❌ Error eliminando reserva:', error);
      toast.error('❌ Error al eliminar la reserva', {
        className: 'bg-red-600 text-white border-0',
        style: {
          backgroundColor: '#dc2626 !important',
          color: 'white !important',
          border: 'none !important',
        },
      });
      throw error;
    }
  };

  const getReservasByDate = (date: Date) => {
    const dateString = convertirFechaAString(date);
    return reservas.filter(reserva => reserva.fecha === dateString);
  };

  const getReservasHoy = () => {
    const today = convertirFechaAString(new Date());
    return reservas.filter(reserva => reserva.fecha === today);
  };

  const getDashboardStats = (): DashboardStats => {
    const hoy = new Date();
    const hoyStr = convertirFechaAString(hoy);
    const mesActual = hoy.getMonth(); // 0-11
    const añoActual = hoy.getFullYear();
    
    // Filtrar solo reservas del mes actual usando comparación de strings
    const reservasDelMes = reservas.filter(r => {
      // r.fecha viene en formato 'YYYY-MM-DD'
      const [año, mes] = r.fecha.split('-').map(Number);
      return mes === (mesActual + 1) && año === añoActual;
    });
    
    const reservasHoy = reservasDelMes.filter(r => r.fecha === hoyStr);
    
    // Calcular totales SOLO del mes actual
    const totalAsistentes = reservasDelMes.reduce((acc, r) => acc + r.asistenciaActual, 0);
    const reservasCompletadas = reservasDelMes.filter(r => r.estado === 'Activa' || r.estado === 'Reserva Caída');
    const totalReservados = reservasCompletadas.reduce((acc, r) => acc + r.numeroPersonas, 0);
    const promedioAsistencia = totalReservados > 0 ? (totalAsistentes / totalReservados) * 100 : 0;
    
    return {
      totalReservas: reservasDelMes.length,
      totalAsistentes,
      promedioAsistencia: Math.round(promedioAsistencia),
      reservasHoy: reservasHoy.length
    };
  };

  // Función para recargar reservas desde la API
  const loadReservas = async () => {
    await loadReservasFromAPI();
  };

  // Función para forzar verificación manual
  const forceRefresh = async () => {
    setIsSyncing(true);
    await loadReservasFromAPI();
    setIsSyncing(false);
    toast.success('✓ Actualizado', { duration: 1500 });
  };

  return {
    reservas,
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    loading,
    addReserva,
    updateReserva, 
    deleteReserva,
    getReservasByDate,
    getReservasHoy,
    getDashboardStats,
    loadReservas,
    // Nuevos estados de sincronización
    isSyncing,
    syncStatus,
    lastUpdateTimestamp,
    forceRefresh,
  };
}
