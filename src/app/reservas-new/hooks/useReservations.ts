'use client';

import { useState, useEffect } from 'react';
import { Reserva, DashboardStats } from '../types/reservation';
import { toast } from 'sonner';

// Datos de ejemplo
const mockReservas: Reserva[] = [
  {
    id: "1",
    cliente: { 
      id: "c1",
      nombre: "María González", 
      telefono: "+506 8888-1234", 
      email: "maria.gonzalez@email.com" 
    },
    numeroPersonas: 4,
    razonVisita: "Reunión de trabajo",
    beneficiosReserva: "Mesa reservada",
    fecha: new Date().toISOString().split('T')[0],
    hora: "09:00",
    codigoQR: "QR001",
    asistenciaActual: 4,
    estado: "Activa",
    promotor: { id: "p1", nombre: "Dr. Ramírez" },
    fechaCreacion: new Date().toISOString(),
    registroEntradas: []
  },
  {
    id: "2", 
    cliente: { 
      id: "c2",
      nombre: "Carlos López", 
      telefono: "+506 8888-5678", 
      email: "carlos.lopez@email.com" 
    },
    numeroPersonas: 2,
    razonVisita: "Cena de aniversario",
    beneficiosReserva: "Mesa junto a la ventana",
    fecha: new Date().toISOString().split('T')[0],
    hora: "10:30",
    codigoQR: "QR002",
    asistenciaActual: 0,
    estado: "En Progreso",
    promotor: { id: "p2", nombre: "Dra. Herrera" },
    fechaCreacion: new Date().toISOString(),
    registroEntradas: []
  },
  {
    id: "3",
    cliente: { 
      id: "c3",
      nombre: "Ana Martínez", 
      telefono: "+506 8888-9012", 
      email: "ana.martinez@email.com" 
    },
    numeroPersonas: 6,
    razonVisita: "Celebración familiar",
    beneficiosReserva: "Mesa grande",
    fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    hora: "14:00", 
    codigoQR: "QR003",
    asistenciaActual: 6,
    estado: "Activa",
    promotor: { id: "p3", nombre: "Dr. Sánchez" },
    fechaCreacion: new Date().toISOString(),
    registroEntradas: []
  },
  {
    id: "4",
    cliente: { 
      id: "c4",
      nombre: "José Rodríguez", 
      telefono: "+506 8888-3456", 
      email: "jose.rodriguez@email.com" 
    },
    numeroPersonas: 3,
    razonVisita: "Almuerzo de negocios",
    beneficiosReserva: "Mesa privada",
    fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    hora: "11:00",
    codigoQR: "QR004",
    asistenciaActual: 3,
    estado: "En Camino",
    promotor: { id: "p4", nombre: "Dr. Vargas" },
    fechaCreacion: new Date().toISOString(),
    registroEntradas: []
  },
  {
    id: "5",
    cliente: { 
      id: "c5",
      nombre: "Carmen Silva", 
      telefono: "+506 8888-7890", 
      email: "carmen.silva@email.com" 
    },
    numeroPersonas: 2,
    razonVisita: "Cita romántica",
    beneficiosReserva: "Mesa íntima",
    fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    hora: "16:00",
    codigoQR: "QR005",
    asistenciaActual: 0,
    estado: "Reserva Caída",
    promotor: { id: "p5", nombre: "Dra. Morales" },
    fechaCreacion: new Date().toISOString(),
    registroEntradas: []
  }
];

export function useReservations() {
  const [reservas, setReservas] = useState<Reserva[]>([]);

  useEffect(() => {
    setReservas(mockReservas);
  }, []);

  const addReserva = async (reservaData: Omit<Reserva, 'id'>) => {
    try {
      const newReserva: Reserva = {
        ...reservaData,
        id: Date.now().toString(),
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
          reserva.id === id ? { ...reserva, ...updates } : reserva
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
    const activas = reservas.filter(r => r.estado === 'Activa');
    
    const totalAsistencias = activas.reduce((sum, r) => sum + r.asistenciaActual, 0);
    const totalEsperadas = reservas.reduce((sum, r) => sum + r.numeroPersonas, 0);
    const promedioAsistencia = totalEsperadas > 0 ? (totalAsistencias / totalEsperadas) * 100 : 0;
    
    return {
      totalReservas: reservas.length,
      totalAsistentes: totalAsistencias,
      promedioAsistencia: Math.round(promedioAsistencia),
      reservasHoy: reservasHoy.length
    };
  };

  return {
    reservas,
    addReserva,
    updateReserva, 
    deleteReserva,
    getReservasByDate,
    getReservasHoy,
    getDashboardStats
  };
}