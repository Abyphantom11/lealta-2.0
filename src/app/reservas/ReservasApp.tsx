'use client';

import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { QrCode, FileText, Calendar as CalendarIcon, Users } from 'lucide-react';

// Importar todos los componentes originales
import { useReservasOptimized } from './hooks/useReservasOptimized';
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
    updateReserva: updateReservaOptimized,
    refetchReservas,
    updateReservaAsistencia, // ✅ Nueva función optimistic
    isCreating,
    isUpdating,
    isDeleting,
  } = useReservasOptimized({ 
    businessId, 
    enabled: true, 
    includeStats: true 
  });

  // Estados adicionales para compatibilidad con componentes existentes
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const statusFilter = 'Todos'; // Valor fijo por ahora, se puede hacer dinámico después

  // 🔍 Monitorear cambios en las reservas del hook principal
  useEffect(() => {
    // Log simplificado solo para errores si es necesario
  }, [reservas]);

  // 🔄 FUNCIONES ADAPTADORAS (para compatibilidad con componentes existentes)
  const addReserva = createReserva;
  const updateReserva = updateReservaOptimized;
  const loadReservas = refetchReservas;
  
  // ✅ OPTIMISTIC REFRESH: Actualización inmediata + refetch en background
  const forceRefreshOptimistic = useCallback((reservaId?: string, nuevaAsistencia?: number) => {
    // 1. Si tenemos datos específicos, actualizar inmediatamente
    if (reservaId && nuevaAsistencia !== undefined) {
      updateReservaAsistencia(reservaId, nuevaAsistencia);
      toast.success('✓ Asistencia actualizada', { duration: 1500 });
    }
    
    // 2. Refetch en background para confirmar
    refetchReservas().catch(() => {
      toast.error('❌ Error al sincronizar');
    });
  }, [updateReservaAsistencia, refetchReservas]);
  
  // Mantener forceRefresh original para otros casos
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

  // Función para obtener reservas por fecha
  const getReservasByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservas.filter((reserva: Reserva) => {
      const reservaDate = new Date(reserva.fecha).toISOString().split('T')[0];
      return reservaDate === dateStr;
    });
  };

  // Función para obtener estadísticas del dashboard
  const getDashboardStats = () => {
    return dashboardStats || {
      total: reservas.length,
      confirmadas: reservas.filter((r: any) => r.estado === 'Confirmada').length,
      pendientes: reservas.filter((r: any) => r.estado === 'Pendiente').length,
      canceladas: reservas.filter((r: any) => r.estado === 'Cancelada').length,
    };
  };

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
  
  // Estados para sin reserva
  const [showSinReserva, setShowSinReserva] = useState(false); // Toggle entre reservas y sin reserva
  const [sinReservas, setSinReservas] = useState<SinReserva[]>([]);
  const [loadingSinReservas, setLoadingSinReservas] = useState(false);

  // Cargar registros sin reserva
  const loadSinReservas = async () => {
    if (!businessId) return;
    
    setLoadingSinReservas(true);
    try {
      const response = await fetch(`/api/sin-reserva?businessId=${businessId}`);
      if (!response.ok) throw new Error('Error al cargar registros');
      
      const data = await response.json();
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
      
      if (saltarRefetch) {
        console.log('🚫 OMITIENDO refetch - Reserva editada recientemente:', {
          minutosDesdeModificacion: minutosDesdeModificacion.toFixed(1),
          fechaModificacion: reserva.fechaModificacion,
          razon: 'Evitar sobrescribir cache actualizado con datos obsoletos'
        });
      } else {
        console.log('⏳ Refrescando datos antes de abrir modal...');
        await refetchReservas();
        
        // 🔍 ESPERAR un momento para que React procese el estado actualizado
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 🔍 Buscar la reserva más fresca después del refetch
      console.log('🔍 Estado de reservas después del refetch:', {
        totalReservas: reservas.length,
        reservasBuscada: reservas.find((r: Reserva) => r.id === reserva.id),
        todasLasHoras: reservas.map((r: Reserva) => ({ id: r.id, hora: r.hora }))
      });
      
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
      window.dispatchEvent(new CustomEvent('modal-force-update', { 
        detail: { 
          reservaId: id, 
          updates: { estado: nuevoEstado } 
        } 
      }));
    }
  };

  const handleMesaChange = async (id: string, mesa: string) => {
    console.log('🏠 ReservasApp - Cambiando mesa desde escritorio:', { id, mesa });
    await updateReserva(id, { mesa });
    
    // 🔄 Forzar actualización del modal si está abierto
    if (showEditModal && selectedReservaForEdit?.id === id) {
      setSelectedReservaForEdit(prev => prev ? { ...prev, mesa } : null);
      window.dispatchEvent(new CustomEvent('modal-force-update', { 
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
      window.dispatchEvent(new CustomEvent('modal-force-update', { 
        detail: { 
          reservaId: id, 
          updates: { hora } 
        } 
      }));
    }
  };

  const handleRazonVisitaChange = async (id: string, razon: string) => {
    await updateReserva(id, { razonVisita: razon });
  };

  const handleBeneficiosChange = async (id: string, beneficios: string) => {
    await updateReserva(id, { beneficiosReserva: beneficios });
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

  const handleDetallesChange = async (id: string, detalles: string[]) => {
    await updateReserva(id, { detalles });
  };

  const handleQRScan = async (qrCode: string) => {
    console.log('🔍 QR escaneado:', qrCode);
    
    try {
      // 1. Obtener información de la reserva escaneada
      const qrInfoResponse = await fetch('/api/reservas/qr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode,
          action: 'info',
          businessId: businessId || 'default-business-id'
        })
      });

      if (!qrInfoResponse.ok) {
        throw new Error('Error al obtener información del QR');
      }

      const qrInfo = await qrInfoResponse.json();
      console.log('📋 Info de QR:', qrInfo);

      // 2. Obtener la asistencia actual de la base de datos
      const asistenciaActual = qrInfo.incrementCount || 0;
      
      // 3. Actualizar inmediatamente la tabla (optimistic update)
      forceRefreshOptimistic(qrInfo.reservaId, asistenciaActual);
      
      // 4. Mostrar notificación de éxito
      toast.success(
        `✅ Reserva de ${qrInfo.cliente?.nombre || 'Cliente'} - ${asistenciaActual}/${qrInfo.maxAsistencia} personas`,
        { 
          duration: 3000,
          className: 'bg-green-600 text-white border-0',
        }
      );
      
      console.log('✅ Tabla actualizada automáticamente para reserva:', qrInfo.reservaId, 'nueva asistencia:', asistenciaActual);
      
    } catch (error) {
      console.error('❌ Error procesando QR scan:', error);
      // Fallback: recargar todas las reservas si hay error
      await loadReservas();
    }
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

            {/* Toggle Reservas / Sin Reserva - Centrado */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setShowSinReserva(false)}
                  className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                    !showSinReserva
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📋 Reservas
                </button>
                <button
                  onClick={() => setShowSinReserva(true)}
                  className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                    showSinReserva
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  👥 Sin Reserva
                </button>
              </div>
            </div>

            {/* Tabla de reservas O Sin Reserva */}
            {!showSinReserva ? (
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
                onRazonVisitaChange={handleRazonVisitaChange}
                onBeneficiosChange={handleBeneficiosChange}
                onPromotorChange={handlePromotorChange}
                onDetallesChange={handleDetallesChange}
              />
            ) : (
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
                onRefreshNeeded={forceRefreshOptimistic}
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
            await addReserva(reservaData);
            // ✅ Cambiar fecha seleccionada a la fecha de la nueva reserva para que aparezca en la tabla
            const fechaReserva = new Date(reservaData.fecha + 'T00:00:00');
            setSelectedDate(fechaReserva);
            setShowForm(false);
          }}
          selectedDate={selectedDate}
          businessId={businessId || 'default'} // ✅ NUEVO: pasar businessId
        />
      )}

      {/* Modal de reserva con IA */}
      {showAIForm && (
        <AIReservationModal
          isOpen={showAIForm}
          onClose={() => setShowAIForm(false)}
          onSubmit={async (reservaData) => {
            await addReserva(reservaData);
            // ✅ Cambiar fecha seleccionada a la fecha de la nueva reserva para que aparezca en la tabla
            const fechaReserva = new Date(reservaData.fecha + 'T00:00:00');
            setSelectedDate(fechaReserva);
            setShowAIForm(false);
          }}
          selectedDate={selectedDate}
          businessId={businessId || 'default'}
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
    </div>
  );
}