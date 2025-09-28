'use client';

import { useState, useEffect } from 'react';
import { Reserva, Cliente, Promotor, EstadoReserva, DashboardStats } from '../types/reservation';
import { toast } from 'sonner';

// Mock data para demostración
const mockClientes: Cliente[] = [
  { id: '1', nombre: 'José López', telefono: '+506 8888-1234', email: 'jose@email.com' },
  { id: '2', nombre: 'María Rodríguez', telefono: '+506 8888-5678', email: 'maria@email.com' },
  { id: '3', nombre: 'Carlos Jiménez', telefono: '+506 8888-9012', email: 'carlos@email.com' },
  { id: '4', nombre: 'Ana García', telefono: '+506 8888-1357', email: 'ana@email.com' },
  { id: '5', nombre: 'Luis Herrera', telefono: '+506 8888-2468', email: 'luis@email.com' },
];

const mockPromotores: Promotor[] = [
  { id: '1', nombre: 'Ana García' },
  { id: '2', nombre: 'Luis Herrera' },
  { id: '3', nombre: 'Sofia Vargas' },
];

const generateQRCode = () => {
  return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const generateMockReservas = (): Reserva[] => {
  const reservas: Reserva[] = [];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Datos específicos como en la imagen de Figma + reservas para hoy y mañana
  const reservasData = [
    // Reservas de hoy para testing
    {
      cliente: mockClientes[0], // José López
      fecha: today.toISOString().split('T')[0],
      hora: '10:00',
      numeroPersonas: 8,
      asistenciaActual: 8,
      estado: 'Confirmada' as EstadoReserva,
      promotor: mockPromotores[0], // Ana García
      razonVisita: 'Reunión de trabajo',
      beneficiosReserva: 'Mesa reservada'
    },
    {
      cliente: mockClientes[1], // María Rodríguez
      fecha: today.toISOString().split('T')[0],
      hora: '14:30',
      numeroPersonas: 4,
      asistenciaActual: 4,
      estado: 'En Progreso' as EstadoReserva,
      promotor: mockPromotores[1], // Luis Herrera
      razonVisita: 'Almuerzo familiar',
      beneficiosReserva: 'Descuento 15%'
    },
    // Reservas de mañana para testing
    {
      cliente: mockClientes[3], // Ana García
      fecha: tomorrow.toISOString().split('T')[0],
      hora: '19:00',
      numeroPersonas: 12,
      asistenciaActual: 0,
      estado: 'Confirmada' as EstadoReserva,
      promotor: mockPromotores[2], // Sofia Vargas
      razonVisita: 'Cena de cumpleaños',
      beneficiosReserva: 'Postre gratis'
    },
    {
      cliente: mockClientes[2], // Carlos Jiménez
      fecha: '2025-09-17',
      hora: '9:00',
      numeroPersonas: 18,
      asistenciaActual: 15,
      estado: 'Completada' as EstadoReserva,
      promotor: mockPromotores[2], // Sofia Vargas
      razonVisita: 'Celebración',
      beneficiosReserva: 'Descuento 20%'
    },
    {
      cliente: mockClientes[0], // José López  
      fecha: '2025-09-17',
      hora: '6:00',
      numeroPersonas: 5,
      asistenciaActual: 6,
      estado: 'No Show' as EstadoReserva,
      promotor: mockClientes[3], // Ana García (como promotor)
      razonVisita: 'Cumpleaños',
      beneficiosReserva: 'Bebida gratis'
    },
    {
      cliente: mockClientes[1], // María Rodríguez
      fecha: '2025-09-27',
      hora: '6:00', 
      numeroPersonas: 15,
      asistenciaActual: 3,
      estado: 'No Show' as EstadoReserva,
      promotor: mockPromotores[2], // Sofia Vargas
      razonVisita: 'Cumpleaños',
      beneficiosReserva: 'Bebida gratis'
    },
    {
      cliente: mockClientes[0], // José López
      fecha: '2025-09-25',
      hora: '9:00',
      numeroPersonas: 24,
      asistenciaActual: 22,
      estado: 'Confirmada' as EstadoReserva,
      promotor: mockClientes[4], // Luis Herrera (como promotor)
      razonVisita: 'Cumpleaños',
      beneficiosReserva: 'Postre cortesía'
    },
    {
      cliente: mockClientes[1], // María Rodríguez
      fecha: '2025-09-30',
      hora: '6:30',
      numeroPersonas: 21,
      asistenciaActual: 18,
      estado: 'Completada' as EstadoReserva,
      promotor: mockPromotores[2], // Sofia Vargas
      razonVisita: 'Celebración',
      beneficiosReserva: 'Mesa VIP'
    },
    {
      cliente: mockClientes[0], // José López
      fecha: '2025-10-10',
      hora: '16:30',
      numeroPersonas: 19,
      asistenciaActual: 8,
      estado: 'En Progreso' as EstadoReserva,
      promotor: mockClientes[3], // Ana García (como promotor)
      razonVisita: 'Evento social',
      beneficiosReserva: 'Postre cortesía'
    },
    {
      cliente: mockClientes[2], // Carlos Jiménez
      fecha: '2025-09-18',
      hora: '6:30',
      numeroPersonas: 10,
      asistenciaActual: 12,
      estado: 'Completada' as EstadoReserva,
      promotor: mockClientes[4], // Luis Herrera (como promotor)
      razonVisita: 'Reunión empresarial',
      beneficiosReserva: 'Postre cortesía'
    }
  ];

  reservasData.forEach((data, i) => {
    reservas.push({
      id: `res-${i + 1}`,
      cliente: data.cliente,
      numeroPersonas: data.numeroPersonas,
      razonVisita: data.razonVisita,
      beneficiosReserva: data.beneficiosReserva,
      promotor: data.promotor,
      fecha: data.fecha,
      hora: data.hora,
      codigoQR: generateQRCode(),
      asistenciaActual: data.asistenciaActual,
      estado: data.estado,
      fechaCreacion: new Date().toISOString(),
      registroEntradas: []
    });
  });
  
  return reservas;
};

export const useReservations = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    setReservas(generateMockReservas());
  }, []);

  const addReserva = async (reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'asistenciaActual' | 'estado' | 'fechaCreacion' | 'registroEntradas'>) => {
    try {
      const newReserva: Reserva = {
        ...reservaData,
        id: `res-${Date.now()}`,
        codigoQR: generateQRCode(),
        asistenciaActual: 0,
        estado: 'Activa',
        fechaCreacion: new Date().toISOString(),
        registroEntradas: []
      };
      
      setReservas(prev => [...prev, newReserva]);
      toast.success('Reserva creada exitosamente');
      return newReserva;
    } catch (error) {
      toast.error('Error al crear la reserva');
      throw error;
    }
  };

  const updateReserva = async (id: string, updates: Partial<Reserva>) => {
    try {
      setReservas(prev => 
        prev.map(reserva => 
          reserva.id === id ? { ...reserva, ...updates, fechaModificacion: new Date().toISOString() } : reserva
        )
      );

    } catch (error) {
      toast.error('Error al actualizar la reserva');
      throw error;
    }
  };

  const deleteReserva = async (id: string) => {
    try {
      setReservas(prev => prev.filter(reserva => reserva.id !== id));
      toast.success('Reserva eliminada exitosamente');
    } catch (error) {
      toast.error('Error al eliminar la reserva');
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
    const completadas = reservas.filter(r => r.estado === 'Activa');
    
    const totalAsistencias = completadas.reduce((acc, r) => acc + r.asistenciaActual, 0);
    const totalReservadas = completadas.reduce((acc, r) => acc + r.numeroPersonas, 0);
    const promedioAsistenciaCalc = totalReservadas > 0 ? (totalAsistencias / totalReservadas) * 100 : 0;
    
    return {
      totalReservas: reservas.length,
      totalAsistentes: totalAsistencias,
      promedioAsistencia: Math.round(promedioAsistenciaCalc * 10) / 10, // Redondear a 1 decimal
      reservasHoy: reservasHoy.length
    };
  };

  return {
    reservas,
    selectedDate,
    setSelectedDate,
    addReserva,
    updateReserva, 
    deleteReserva,
    getReservasByDate,
    getReservasHoy,
    getDashboardStats
  };
};
