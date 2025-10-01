'use client';

import { useState } from 'react';
import { Toaster } from 'sonner';
import { QrCode, FileText, Calendar as CalendarIcon } from 'lucide-react';

// Importar todos los componentes originales
import { useReservations } from './hooks/useReservations';
import { ReservationTable } from './components/ReservationTable';
import ReservationForm from './components/ReservationForm';
import { ReservationConfirmation } from './components/ReservationConfirmation';
import { QRScannerClean } from './components/QRScannerClean';
import ReportsGenerator from './components/ReportsGenerator';
import { DashboardStats } from './components/DashboardStats';
import { Header } from './components/Header';

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
  // Hook principal de reservas adaptado para businessId
  const {
    reservas,
    selectedDate,
    setSelectedDate,
    statusFilter,
    addReserva,
    updateReserva,
    deleteReserva,
    getReservasByDate,
    getDashboardStats,
    loadReservas,
    isSyncing,
    syncStatus,
    forceRefresh,
  } = useReservations(businessId);

  // Estados para modales y vistas
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservaForDetails, setSelectedReservaForDetails] = useState<any>(null);

  // Handlers para la tabla de reservas
  const handleViewReserva = (id: string) => {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
      setSelectedReservaForDetails(reserva);
      setShowDetailsModal(true);
    }
  };

  const handleDeleteReserva = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      await deleteReserva(id);
    }
  };

  const handleUploadComprobante = async (id: string, archivo: File) => {
    // Implementación pendiente: Subir archivo al servidor
    console.log('Subir comprobante para reserva:', id, archivo);
    // Aquí se implementará la lógica de upload cuando se configure el almacenamiento
  };

  const handleEstadoChange = async (id: string, nuevoEstado: any) => {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
      await updateReserva(id, { ...reserva, estado: nuevoEstado });
    }
  };

  const handleMesaChange = async (id: string, mesa: string) => {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
      await updateReserva(id, { ...reserva, mesa });
    }
  };

  const handleHoraChange = async (id: string, hora: string) => {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
      await updateReserva(id, { ...reserva, hora });
    }
  };

  const handleRazonVisitaChange = async (id: string, razon: string) => {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
      await updateReserva(id, { ...reserva, razonVisita: razon });
    }
  };

  const handleBeneficiosChange = async (id: string, beneficios: string) => {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
      await updateReserva(id, { ...reserva, beneficiosReserva: beneficios });
    }
  };

  const handlePromotorChange = async (id: string, promotor: string) => {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
      await updateReserva(id, { 
        ...reserva, 
        promotor: { id: reserva.promotor.id, nombre: promotor }
      });
    }
  };

  const handleDetallesChange = async (id: string, detalles: string[]) => {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
      await updateReserva(id, { ...reserva, detalles });
    }
  };

  const handleQRScan = async (qrCode: string) => {
    console.log('QR escaneado:', qrCode);
    // Recargar reservas después del escaneo
    await loadReservas();
  };

  const handleQRError = (error: string) => {
    console.error('Error en QR:', error);
  };

  // Datos calculados
  const reservasDelDia = getReservasByDate(selectedDate);
  const stats = getDashboardStats();

  // Filtrar reservas por estado (el searchTerm se maneja dentro de ReservationTable)
  const reservasFiltradas = reservasDelDia
    .filter(reserva => statusFilter === 'Todos' || reserva.estado === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      {/* Contenedor principal con padding */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header con título y botón de nueva reserva */}
        <Header 
          totalReservas={reservas.length}
          onCreateReserva={() => setShowForm(true)}
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
        </div>

        {/* Vista Dashboard */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            {/* Dashboard Stats */}
            <DashboardStats stats={stats} />

            {/* Tabla de reservas - Los filtros ya están dentro del componente */}
            <ReservationTable
              reservas={reservasFiltradas}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onViewReserva={handleViewReserva}
              onDeleteReserva={handleDeleteReserva}
              onUploadComprobante={handleUploadComprobante}
              onEstadoChange={handleEstadoChange}
              onMesaChange={handleMesaChange}
              onHoraChange={handleHoraChange}
              onRazonVisitaChange={handleRazonVisitaChange}
              onBeneficiosChange={handleBeneficiosChange}
              onPromotorChange={handlePromotorChange}
              onDetallesChange={handleDetallesChange}
            />
          </div>
        )}

        {/* Vista Scanner QR */}
        {viewMode === 'scanner' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Escanear Código QR</h2>
            <p className="text-gray-600 mb-6">
              Escanea el código QR de una reserva para registrar la asistencia
            </p>
            <QRScannerClean
              businessId={businessId}
              onScan={handleQRScan}
              onError={handleQRError}
              onRefreshNeeded={forceRefresh}
            />
          </div>
        )}

        {/* Vista Reportes */}
        {viewMode === 'reports' && (
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
            setShowForm(false);
          }}
          selectedDate={selectedDate}
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
    </div>
  );
}