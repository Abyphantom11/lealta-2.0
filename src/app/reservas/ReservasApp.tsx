'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { QrCode, FileText, Calendar as CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Importar todos los componentes originales
import { useReservasOptimized } from './hooks/useReservasOptimized';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { Reserva } from './types/reservation';
import { ReservationTable } from './components/ReservationTable';
import ReservationForm from './components/ReservationForm';
import { ReservationConfirmation } from './components/ReservationConfirmation';
import { QRScannerClean } from './components/QRScannerClean';
import ReportsGenerator from './components/ReportsGenerator';
import { DashboardStats } from './components/DashboardStats';
import { Header } from './components/Header';
import { PromotorManagement } from './components/PromotorManagement';
import { AIReservationModal } from './components/AIReservationModal';
import { ReservationEditModal } from './components/ReservationEditModal';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SinReservaTable } from './components/SinReservaTable';
import { SinReservaCounter } from './components/SinReservaCounter';
import { SinReserva } from './types/sin-reserva';
import EventsManagement from './components/EventsManagement';

// Importar estilos
import './globals.css';

interface ReservasAppProps {
  businessId?: string; // Opcional para compatibilidad con ambas rutas
}

type ViewMode = 'dashboard' | 'scanner' | 'reports';

/**
 * Componente principal del módulo de reservas
 * Usa TODOS los componentes originales con interfaz completa
 */
export default function ReservasApp({ businessId }: Readonly<ReservasAppProps>) {
  // Detectar si estamos en móvil
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Hook principal de reservas optimizado con React Query
  const {
    reservas,
    stats: dashboardStats,
    isLoading,
    createReserva,
    updateReserva,
    updateReservaOptimized, // ✅ Nueva función optimistic
    refetchReservas,
    registrarAsistencia, // 🔥 Mutation para asistencia con optimistic update
    isCreating,
    isUpdating,
    isDeleting,
  } = useReservasOptimized({ 
    businessId, 
    enabled: !!businessId, // Solo habilitar si hay businessId válido
    includeStats: true 
  });

  // 🔄 Hook de sincronización en tiempo real (SSE)
  const { isConnected, status: sseStatus } = useRealtimeSync({
    businessId: businessId || '',
    enabled: !!businessId,
    showToasts: true,
    autoUpdateCache: true
  });

  // ✅ CÁLCULO INICIAL DEL DÍA COMERCIAL (antes del primer render)
  // Calcular de forma síncrona la fecha inicial basada en la hora de Ecuador
  const getInitialDate = useMemo(() => {
    try {
      const now = new Date();
      
      // Obtener componentes de fecha/hora en Ecuador
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(now);
      const year = Number.parseInt(parts.find(p => p.type === 'year')?.value || '2025');
      const month = Number.parseInt(parts.find(p => p.type === 'month')?.value || '1');
      const day = Number.parseInt(parts.find(p => p.type === 'day')?.value || '1');
      const hour = Number.parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      
      console.log('📅 [ReservasApp] Parsing fecha Ecuador:', { year, month, day, hour });
      
      const currentDate = new Date(year, month - 1, day);
      
      // Si es antes de las 4 AM, usar el día anterior
      if (hour < 4) {
        currentDate.setDate(currentDate.getDate() - 1);
        console.log('📅 [ReservasApp] Es antes de 4 AM, usando día anterior:', format(currentDate, 'yyyy-MM-dd'));
      } else {
        console.log('📅 [ReservasApp] Es después de 4 AM, usando día actual:', format(currentDate, 'yyyy-MM-dd'));
      }
      
      return currentDate;
    } catch (error) {
      console.error('❌ Error calculando fecha inicial:', error);
      // Fallback a fecha actual
      return new Date();
    }
  }, []);

  // Estados adicionales para compatibilidad con componentes existentes
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);
  const statusFilter = 'Todos'; // Valor fijo por ahora, se puede hacer dinámico después

  // 🔍 Monitorear cambios en las reservas del hook principal (silenciado para reducir ruido)

  // 🔄 FUNCIONES ADAPTADORAS (para compatibilidad con componentes existentes)
  const addReserva = createReserva;
  const loadReservas = refetchReservas;
  
  // ✅ Refetch manual solo cuando sea explícitamente necesario
  const forceRefresh = useCallback(async () => {
    try {
      await refetchReservas();
      toast.success('✓ Datos actualizados', { duration: 1500 });
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      toast.error('❌ Error al actualizar datos');
    }
  }, [refetchReservas]);
  
  const isSyncing = isLoading || isCreating || isUpdating || isDeleting;
  
  // Extraer lógica del status para evitar ternario anidado
  let syncStatus = 'idle';
  if (isSyncing) {
    syncStatus = 'updating';
  } else if (isLoading) {
    syncStatus = 'checking';
  }

  // 🌍 Función utilitaria para formatear fecha sin timezone issues
  const formatDateLocal = useCallback((date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  // ⚡ OPTIMIZACIÓN: useMemo para evitar recalcular filtros en cada render
  const getReservasByDate = useCallback((date: Date) => {
    const dateStr = formatDateLocal(date);
    return reservas.filter((reserva: Reserva) => {
      return reserva.fecha === dateStr; // Comparación directa sin conversiones
    });
  }, [reservas, formatDateLocal]);

  // ⚡ OPTIMIZACIÓN: Memoizar cálculo de estadísticas
  const getDashboardStats = useCallback(() => {
    return dashboardStats || {
      total: reservas.length,
      confirmadas: reservas.filter((r: any) => r.estado === 'Confirmada').length,
      pendientes: reservas.filter((r: any) => r.estado === 'Pendiente').length,
      canceladas: reservas.filter((r: any) => r.estado === 'Cancelada').length,
    };
  }, [dashboardStats, reservas]);

  // Estados para modales y vistas
  const [showForm, setShowForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservaForDetails, setSelectedReservaForDetails] = useState<any>(null);
  const [showPromotorManagement, setShowPromotorManagement] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservaForEdit, setSelectedReservaForEdit] = useState<Reserva | null>(null);
  
  // 🔄 Sincronizar selectedReservaForEdit cuando se actualicen las reservas y el modal esté abierto
  useEffect(() => {
    if (showEditModal && selectedReservaForEdit) {
      const reservaActualizada = reservas.find((r: Reserva) => r.id === selectedReservaForEdit.id);
      
      if (reservaActualizada) {
        const hasChanges = JSON.stringify(selectedReservaForEdit) !== JSON.stringify(reservaActualizada);
        
        if (hasChanges) {
          setSelectedReservaForEdit(reservaActualizada);
        }
      }
    }
  }, [reservas, showEditModal, selectedReservaForEdit]);
  
  // Estados para sin reserva y eventos
  const [activeTab, setActiveTab] = useState<'reservas' | 'sinReserva' | 'eventos'>('reservas');
  const [sinReservas, setSinReservas] = useState<SinReserva[]>([]);
  const [loadingSinReservas, setLoadingSinReservas] = useState(false);

  // Cargar registros sin reserva
  const loadSinReservas = async () => {
    console.log('🔍 [loadSinReservas] BusinessId:', businessId);
    if (!businessId || businessId.trim() === '') {
      console.warn('⚠️ [loadSinReservas] No businessId válido, saltando carga');
      setSinReservas([]); // Limpiar datos previos
      return;
    }
    
    setLoadingSinReservas(true);
    try {
      const url = `/api/sin-reserva?businessId=${businessId}`;
      console.log('🌐 [loadSinReservas] Fetching:', url);
      
      const response = await fetch(url);
      console.log('📡 [loadSinReservas] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [loadSinReservas] Error response:', errorText);
        throw new Error(`Error al cargar registros: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 [loadSinReservas] Data received:', data);
      setSinReservas(data.registros || []);
    } catch (error) {
      console.error('Error cargando sin reservas:', error);
      toast.error('Error al cargar registros sin reserva');
    } finally {
      setLoadingSinReservas(false);
    }
  };

  // Eliminar registro sin reserva
  const handleDeleteSinReserva = async (id: string) => {
    try {
      const response = await fetch(`/api/sin-reserva?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Error al eliminar');
      
      toast.success('✅ Registro eliminado');
      loadSinReservas(); // Recargar
    } catch (error) {
      console.error('Error eliminando:', error);
      toast.error('❌ Error al eliminar registro');
    }
  };

  // Cargar sin reservas cuando cambia businessId
  useEffect(() => {
    if (businessId) {
      loadSinReservas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  // Handlers para la tabla de reservas
  const handleViewReserva = (id: string) => {
    const reserva = reservas.find((r: Reserva) => r.id === id);
    if (reserva) {
      setSelectedReservaForDetails(reserva);
      setShowDetailsModal(true);
    }
  };

  const handleDeleteReserva = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta reserva?\n\nEsta acción no se puede deshacer.')) {
      try {
        const response = await fetch(`/api/reservas/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Error al eliminar la reserva');
        }

        // Recargar las reservas para reflejar la eliminación
        await loadReservas();
        
        toast.success('✅ Reserva eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar reserva:', error);
        toast.error('❌ Error al eliminar la reserva');
      }
    }
  };

  const handleEditReserva = async (reserva: Reserva) => {
    try {
      // OPTIMIZACIÓN: NO hacer refetch si la reserva fue editada recientemente
      // porque puede sobrescribir datos frescos con datos obsoletos de BD
      const tiempoUltimaModificacion = new Date(reserva.fechaModificacion || 0).getTime();
      const tiempoActual = Date.now();
      const minutosDesdeModificacion = (tiempoActual - tiempoUltimaModificacion) / 1000 / 60;
      
      const saltarRefetch = minutosDesdeModificacion < 2; // No refetch si se modificó en los últimos 2 minutos
      
      if (!saltarRefetch) {
        await refetchReservas();
        
        // 🔍 ESPERAR un momento para que React procese el estado actualizado
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 🔍 Buscar la reserva más fresca después del refetch
      const reservaFresca = reservas.find((r: Reserva) => r.id === reserva.id) || reserva;
      
      setSelectedReservaForEdit(reservaFresca);
      setShowEditModal(true);
    } catch (error) {
      console.error('❌ Error al refrescar datos antes del modal:', error);
      // Fallback: usar los datos que tenemos
      setSelectedReservaForEdit(reserva);
      setShowEditModal(true);
    }
  };

  const handleUploadComprobante = async (id: string, archivo: File) => {
    try {
      const formData = new FormData();
      formData.append('file', archivo);

      const response = await fetch(`/api/reservas/${id}/comprobante`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir comprobante');
      }

      const data = await response.json();
      
      // Actualizar la reserva en el estado local
      await loadReservas();
      
      toast.success('✅ Comprobante subido exitosamente');
      return data.url;
    } catch (error: any) {
      console.error('Error al subir comprobante:', error);
      toast.error(`❌ ${error.message}`);
      throw error;
    }
  };

  const handleEstadoChange = async (id: string, nuevoEstado: any) => {
    console.log('📊 ReservasApp - Cambiando estado desde escritorio:', { id, nuevoEstado });
    await updateReserva(id, { estado: nuevoEstado });
    
    // 🔄 Forzar actualización del modal si está abierto
    if (showEditModal && selectedReservaForEdit?.id === id) {
      setSelectedReservaForEdit(prev => prev ? { ...prev, estado: nuevoEstado } : null);
      globalThis.dispatchEvent(new CustomEvent('modal-force-update', { 
        detail: { 
          reservaId: id, 
          updates: { estado: nuevoEstado } 
        } 
      }));
    }
  };

  const handleMesaChange = async (id: string, mesa: string) => {
    await updateReserva(id, { mesa });
    
    // 🔄 Forzar actualización del modal si está abierto
    if (showEditModal && selectedReservaForEdit?.id === id) {
      setSelectedReservaForEdit(prev => prev ? { ...prev, mesa } : null);
      globalThis.dispatchEvent(new CustomEvent('modal-force-update', { 
        detail: { 
          reservaId: id, 
          updates: { mesa } 
        } 
      }));
    }
  };

  const handleHoraChange = async (id: string, hora: string) => {
    console.log('⏰ ReservasApp - Cambiando hora desde escritorio:', { id, hora });
    await updateReserva(id, { hora });
    
    // 🔄 Si el modal está abierto para esta reserva, forzar actualización INMEDIATA
    if (showEditModal && selectedReservaForEdit?.id === id) {
      console.log('� Modal abierto - Disparando force update inmediato');
      
      // Actualizar selectedReservaForEdit inmediatamente
      setSelectedReservaForEdit(prev => prev ? { ...prev, hora } : null);
      
      // Disparar evento para el modal
      globalThis.dispatchEvent(new CustomEvent('modal-force-update', { 
        detail: { 
          reservaId: id, 
          updates: { hora } 
        } 
      }));
    }
  };

  const handlePromotorChange = async (id: string, promotorId: string, promotorNombre: string) => {
    try {
      await updateReserva(id, { 
        promotor: { id: promotorId, nombre: promotorNombre },
        promotorId: promotorId // ✅ Enviar también el promotorId para que se guarde en la DB
      });
    } catch (error) {
      console.error('❌ Error en handlePromotorChange:', error);
      throw error;
    }
  };

  const handlePersonasChange = async (id: string, newPersonas: number) => {
    try {
      console.log('👥 Cambiando número de personas:', { id, newPersonas });
      
      // Usar la función optimizada del hook
      await updateReservaOptimized(id, { numeroPersonas: newPersonas });
      
      console.log('✅ Número de personas actualizado');
    } catch (error) {
      console.error('❌ Error al cambiar número de personas:', error);
      toast.error('Error al actualizar el número de personas');
      throw error;
    }
  };

  const handleNameChange = async (reservaId: string, clienteId: string, newName: string) => {
    try {
      // Actualizar el nombre directamente en la reserva (customerName)
      const response = await fetch(`/api/reservas/${reservaId}?businessId=${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerName: newName 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || 'Error al actualizar el nombre');
      }

      // Refrescar las reservas para obtener el nombre actualizado
      await refetchReservas();

      // 🔄 Forzar actualización de la tarjeta específica
      globalThis.dispatchEvent(new CustomEvent('force-card-refresh', { 
        detail: { reservaId } 
      }));

      toast.success('Nombre actualizado correctamente');
      console.log('✅ Nombre del cliente actualizado');
    } catch (error) {
      console.error('❌ Error al cambiar nombre:', error);
      toast.error('Error al actualizar el nombre');
      throw error;
    }
  };

  const handleFechaChange = async (id: string, nuevaFecha: Date) => {
    const fechaAnterior = selectedDate;
    const reservaAnterior = reservas.find((r: Reserva) => r.id === id);
    
    try {
      // 🌍 FIX: Usar función utilitaria para formatear fecha sin UTC
      const fechaFormateada = formatDateLocal(nuevaFecha);
      
      console.log('🔄 SIMPLIFICADO - Cambiando fecha (TIMEZONE AWARE):', {
        reservaId: id,
        de: reservaAnterior?.fecha,
        a: fechaFormateada,
        fechaSeleccionadaOriginal: nuevaFecha.toString(),
        metodo: 'fecha-local-sin-utc'
      });
      
      // Usar la función optimizada del hook
      await updateReservaOptimized(id, { fecha: fechaFormateada });
      
      // Navegar inmediatamente a la nueva fecha
      setSelectedDate(nuevaFecha);
      
      // Toast simple
      toast.success(
        `Reserva movida a ${format(nuevaFecha, "dd 'de' MMMM", { locale: es })}`,
        {
          action: {
            label: `Volver a ${format(fechaAnterior, 'dd/MM', { locale: es })}`,
            onClick: () => setSelectedDate(fechaAnterior)
          },
          duration: 4000
        }
      );
    } catch (error) {
      console.error('❌ Error al cambiar fecha:', error);
      toast.error('Error al cambiar la fecha');
      throw error;
    }
  };

  // ✅ Handler llamado por QRScannerClean cuando detecta un QR
  // QRScannerClean maneja el flujo completo internamente:
  // 1. Detecta QR y llama este handler
  // 2. Obtiene info del endpoint y muestra diálogo de confirmación
  // 3. Usuario confirma → QRScannerClean llama registrarAsistencia (mutation) → optimistic update ✅
  const handleQRScan = async (qrCode: string) => {
    console.log('🔍 QR escaneado:', qrCode);
  };

  const handleQRError = (error: string) => {
    console.error('Error en QR:', error);
  };

  // Datos calculados
  const reservasDelDia = getReservasByDate(selectedDate);
  const currentStats = getDashboardStats();

  // Filtrar reservas por estado (el searchTerm se maneja dentro de ReservationTable)
  const reservasFiltradas = reservasDelDia
    .filter((reserva: Reserva) => statusFilter === 'Todos' || reserva.estado === statusFilter);

  // ⚠️ VALIDACIÓN: Si no hay businessId válido, mostrar mensaje de carga o redirección
  if (!businessId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Detectando su negocio...</h2>
          <p className="text-gray-500">
            Espere mientras verificamos su sesión y redirigimos al panel de reservas correspondiente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      {/* ✅ Notificador de actualizaciones en tiempo real - DESHABILITADO temporalmente para evitar conflictos */}
      {/* <RealtimeUpdateNotifier 
        businessId={businessId || 'default-business-id'}
        onUpdateDetected={refetchReservas}
        enabled={true}
      /> */}
      
      {/* Contenedor principal con padding */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header con título y botón de nueva reserva */}
        <Header 
          totalReservas={reservas.length}
          onCreateReserva={() => setShowForm(true)}
          onCreateAIReserva={() => setShowAIForm(true)}
        />

        {/* Indicador de sincronización en tiempo real */}
        <div className="mb-4 flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-2 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            {syncStatus === 'checking' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span>Verificando actualizaciones...</span>
              </div>
            )}
            {syncStatus === 'updating' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Actualizando reservas...</span>
              </div>
            )}
            {syncStatus === 'idle' && !isSyncing && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Sincronizado</span>
              </div>
            )}
          </div>

          {/* Botón de refrescar manual */}
          <button
            onClick={forceRefresh}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refrescar ahora"
          >
            <svg 
              className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isSyncing ? 'Actualizando...' : 'Refrescar'}</span>
          </button>
        </div>

        {/* Navegación de tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
              viewMode === 'dashboard'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setViewMode('scanner')}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
              viewMode === 'scanner'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <QrCode className="h-4 w-4" />
            Scanner QR
          </button>
          
          {/* Tab Reportes - Solo en desktop */}
          {!isMobile && (
            <button
              onClick={() => setViewMode('reports')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                viewMode === 'reports'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              Reportes
            </button>
          )}
          
          {/* Botón de Gestión de Promotores - Solo en desktop */}
          {!isMobile && (
            <button
              onClick={() => setShowPromotorManagement(true)}
              className="flex items-center gap-2 px-4 py-2 font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-t-lg transition-colors ml-auto"
            >
              <Users className="h-4 w-4" />
              Gestión de Promotores
            </button>
          )}
        </div>

        {/* Vista Dashboard */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            {/* Dashboard Stats */}
            <DashboardStats stats={currentStats} />

            {/* Toggle Reservas / Sin Reserva / Eventos - Centrado */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-center">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('reservas')}
                  className={`px-4 py-2.5 rounded-md font-medium transition-all ${
                    activeTab === 'reservas'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📋 Reservas
                </button>
                <button
                  onClick={() => setActiveTab('sinReserva')}
                  className={`px-4 py-2.5 rounded-md font-medium transition-all ${
                    activeTab === 'sinReserva'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  👥 Sin Reserva
                </button>
                <button
                  onClick={() => setActiveTab('eventos')}
                  className={`px-4 py-2.5 rounded-md font-medium transition-all ${
                    activeTab === 'eventos'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🎉 Lista Invitados
                </button>
              </div>
            </div>

            {/* Contenido según tab activo */}
            {activeTab === 'reservas' && (
              <ReservationTable
                businessId={businessId}
                reservas={reservasFiltradas}
                allReservas={reservas}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onViewReserva={handleViewReserva}
                onDeleteReserva={handleDeleteReserva}
                onEditReserva={handleEditReserva}
                onUploadComprobante={handleUploadComprobante}
                onEstadoChange={handleEstadoChange}
                onMesaChange={handleMesaChange}
                onHoraChange={handleHoraChange}
                onPromotorChange={handlePromotorChange}
                updateReservaOptimized={updateReservaOptimized}
                onFechaChange={handleFechaChange}
                onPersonasChange={handlePersonasChange}
                onNameChange={handleNameChange}
              />
            )}
            
            {activeTab === 'sinReserva' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                {loadingSinReservas ? (
                  <div className="text-center py-12 text-gray-500">
                    Cargando registros...
                  </div>
                ) : (
                  <SinReservaTable
                    registros={sinReservas}
                    selectedDate={selectedDate}
                    onDelete={handleDeleteSinReserva}
                  />
                )}
              </div>
            )}
            
            {activeTab === 'eventos' && businessId && (
              <EventsManagement businessId={businessId} />
            )}
          </div>
        )}

        {/* Vista Scanner QR */}
        {viewMode === 'scanner' && (
          <div className="space-y-6">
            {/* Contador Sin Reserva */}
            <SinReservaCounter
              businessId={businessId || 'default-business-id'}
              selectedDate={selectedDate}
              onRegistroCreado={loadSinReservas}
            />

            {/* Scanner QR */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Escanear Código QR</h2>
              <p className="text-gray-600 mb-6">
                Escanea el código QR de una reserva para registrar la asistencia
              </p>
              <QRScannerClean
                businessId={businessId}
                onScan={handleQRScan}
                onError={handleQRError}
                registrarAsistencia={registrarAsistencia}
              />
            </div>
          </div>
        )}

        {/* Vista Reportes - Solo en desktop */}
        {viewMode === 'reports' && !isMobile && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ReportsGenerator 
              businessId={businessId || 'default-business-id'}
              businessName="Negocio Demo" 
            />
          </div>
        )}
      </div>

      {/* Modal de formulario de reserva */}
      {showForm && (
        <ReservationForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={async (reservaData) => {
            try {
              console.log('🚀 [ReservasApp] Iniciando creación de reserva:', reservaData);
              await addReserva(reservaData);
              // ✅ El optimistic update ya maneja la actualización inmediata
              // Solo cambiar fecha seleccionada si es diferente para que el usuario vea su reserva
              const fechaReserva = new Date(reservaData.fecha + 'T00:00:00');
              if (formatDateLocal(fechaReserva) !== formatDateLocal(selectedDate)) {
                console.log('📅 [ReservasApp] Cambiando fecha seleccionada a:', formatDateLocal(fechaReserva));
                setSelectedDate(fechaReserva);
              }
              setShowForm(false);
              toast.success('✅ Reserva creada exitosamente', {
                description: `${reservaData.cliente.nombre} - ${reservaData.fecha} ${reservaData.hora}`
              });
            } catch (error) {
              console.error('❌ Error creando reserva:', error);
              toast.error('❌ Error al crear reserva', {
                description: 'Por favor intenta de nuevo'
              });
            }
          }}
          selectedDate={selectedDate}
          businessId={businessId || 'default'} // ✅ NUEVO: pasar businessId
          isSubmitting={isCreating} // 🆕 Pasar estado de carga
        />
      )}

      {/* Modal de reserva con IA */}
      {showAIForm && (
        <AIReservationModal
          isOpen={showAIForm}
          onClose={() => setShowAIForm(false)}
          onSubmit={async (reservaData) => {
            try {
              console.log('🤖 [ReservasApp] Iniciando creación de reserva IA:', reservaData);
              await addReserva(reservaData);
              // ✅ El optimistic update ya maneja la actualización inmediata
              // Solo cambiar fecha seleccionada si es diferente para que el usuario vea su reserva
              const fechaReserva = new Date(reservaData.fecha + 'T00:00:00');
              if (formatDateLocal(fechaReserva) !== formatDateLocal(selectedDate)) {
                console.log('📅 [ReservasApp] Cambiando fecha seleccionada a:', formatDateLocal(fechaReserva));
                setSelectedDate(fechaReserva);
              }
              setShowAIForm(false);
              toast.success('✅ Reserva IA creada exitosamente', {
                description: `${reservaData.cliente.nombre} - ${reservaData.fecha} ${reservaData.hora}`
              });
            } catch (error) {
              console.error('❌ Error creando reserva IA:', error);
              toast.error('❌ Error al crear reserva IA', {
                description: 'Por favor intenta de nuevo'
              });
            }
          }}
          selectedDate={selectedDate}
          businessId={businessId || 'default'}
          isSubmitting={isCreating} // 🆕 Pasar estado de carga
        />
      )}

      {/* Modal de detalles de reserva con QR */}
      {showDetailsModal && selectedReservaForDetails && (
        <ReservationConfirmation
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReservaForDetails(null);
          }}
          reserva={selectedReservaForDetails}
        />
      )}

      {/* Panel de Gestión de Promotores */}
      {showPromotorManagement && businessId && (
        <PromotorManagement
          businessId={businessId}
          onClose={() => setShowPromotorManagement(false)}
        />
      )}

      {/* Modal de edición de reserva para móvil */}
      {showEditModal && selectedReservaForEdit && (
        <ReservationEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReservaForEdit(null);
          }}
          reserva={selectedReservaForEdit}
          businessId={businessId}
          onUpdate={updateReserva}
          onDelete={handleDeleteReserva}
        />
      )}

      {/* Debug: Mostrar warning si no hay businessId */}
      {showPromotorManagement && !businessId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
            <p className="text-gray-700">
              No se puede abrir la gestión de promotores porque no hay un businessId válido.
            </p>
            <button
              onClick={() => setShowPromotorManagement(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 🔥 INDICADOR DE TIEMPO REAL - TEMPORALMENTE DESHABILITADO
      {isSSEConnected && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 backdrop-blur-sm">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Tiempo Real</span>
              <span className="text-xs opacity-90">
                {realtimeStatus === 'connected' ? 'Conectado' : 
                 realtimeStatus === 'connecting' ? 'Conectando...' :
                 realtimeStatus === 'reconnecting' ? 'Reconectando...' : 'Activo'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ INDICADOR DE RECONEXIÓN - TEMPORALMENTE DESHABILITADO
      {isRealtimeEnabled && realtimeStatus === 'reconnecting' && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
            <span className="text-sm font-medium">Reconectando...</span>
          </div>
        </div>
      )}
      */}
    </div>
  );
}