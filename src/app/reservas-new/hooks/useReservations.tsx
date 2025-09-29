'use client';

import { useState, useEffect } from 'react';
import { Reserva, DashboardStats } from '../types/reservation';
import { toast } from 'sonner';

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
    estado: 'En Progreso',
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

export function useReservations() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Fecha seleccionada para filtrar
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Reserva['estado'] | 'Todos'>('Todos'); // Filtro de estado

  useEffect(() => {
    loadReservasFromAPI();
  }, []);

  // Función para cargar reservas desde la API
  const loadReservasFromAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reservas');
      if (!response.ok) {
        throw new Error('Error al cargar las reservas');
      }
      const data = await response.json();
      setReservas(data.reservas || []);
    } catch (error) {
      console.error('Error loading reservas:', error);
      toast.error('❌ Error al cargar las reservas');
      // Fallback a datos mock en caso de error
      setReservas(mockReservas);
    } finally {
      setLoading(false);
    }
  };

  const addReserva = async (reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>) => {
    try {
      const response = await fetch('/api/reservas', {
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
          promotor: reservaData.promotor
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
      
      setReservas(prev => [...prev, newReserva]);
      toast.success('✨ Reserva creada exitosamente', {
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
      const response = await fetch(`/api/reservas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la reserva');
      }

      const data = await response.json();
      setReservas(prev => 
        prev.map(reserva => 
          reserva.id === id ? data.reserva : reserva
        )
      );

    } catch (error) {
      toast.error('❌ Error al actualizar la reserva', {
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
    const dateString = date.toISOString().split('T')[0];
    return reservas.filter(reserva => reserva.fecha === dateString);
  };

  const getReservasHoy = () => {
    const today = new Date().toISOString().split('T')[0];
    return reservas.filter(reserva => reserva.fecha === today);
  };

  const getDashboardStats = (): DashboardStats => {
    const hoy = new Date().toISOString().split('T')[0];
    const reservasHoy = reservas.filter(r => r.fecha === hoy);
    
    // Calcular totales
    const totalAsistentes = reservas.reduce((acc, r) => acc + r.asistenciaActual, 0);
    const reservasCompletadas = reservas.filter(r => r.estado === 'Activa' || r.estado === 'Reserva Caída');
    const totalReservados = reservasCompletadas.reduce((acc, r) => acc + r.numeroPersonas, 0);
    const promedioAsistencia = totalReservados > 0 ? (totalAsistentes / totalReservados) * 100 : 0;
    
    return {
      totalReservas: reservas.length,
      totalAsistentes,
      promedioAsistencia: Math.round(promedioAsistencia),
      reservasHoy: reservasHoy.length
    };
  };

  // Función para recargar reservas desde la API
  const loadReservas = async () => {
    await loadReservasFromAPI();
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
    loadReservas
  };
}
