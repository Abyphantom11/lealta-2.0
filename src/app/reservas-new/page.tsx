'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent } from './components/ui/dialog';
import { BarChart3, ScanLine } from 'lucide-react';
import { useReservations } from './hooks/useReservations';

import { ReservationTable } from './components/ReservationTable';
import ReservationForm from './components/ReservationForm';
import QRScannerWrapper from './components/QRScannerWrapper';
import { QRCodeGeneratorEnhanced } from './components/QRCodeGeneratorEnhanced';
import { DashboardStats } from './components/DashboardStats';
import { ReservationConfirmation } from './components/ReservationConfirmation';

import { ReportsPanel } from './components/ReportsPanel';
import { Header } from './components/Header';
import { Reserva } from './types/reservation';
import { Toaster } from './components/ui/sonner';

export default function Page() {
  const {
    reservas,
    addReserva,
    updateReserva,
    getDashboardStats
  } = useReservations();

  // Estado local para fecha seleccionada
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [showReservationForm, setShowReservationForm] = useState(false);

  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showQRView, setShowQRView] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | undefined>();
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [qrReserva, setQrReserva] = useState<Reserva | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleCreateReserva = () => {
    setEditingReserva(undefined);
    setShowReservationForm(true);
  };

  const handleViewReserva = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setShowQRGenerator(true);
  };

  const handleSubmitReserva = async (reservaData: Omit<Reserva, 'id' | 'codigoQR' | 'estado' | 'fechaCreacion' | 'registroEntradas'>) => {
    if (editingReserva) {
      await updateReserva(editingReserva.id, reservaData);
    } else {
      await addReserva(reservaData);
    }
    setShowReservationForm(false);
  };

  const handleQRScan = async (qrCode: string) => {
    try {
      // El procesamiento del QR ya se hace en el componente QRScannerFunctional
      // Aquí solo necesitamos mostrar mensaje de éxito
      console.log(`QR ${qrCode} procesado exitosamente`);
    } catch (error) {
      console.error('Error handling QR scan:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header 
        totalReservas={getDashboardStats().totalReservas}
        onCreateReserva={handleCreateReserva}
      />
      
      <Tabs defaultValue="dashboard" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto mb-6 sm:mb-8">
          <TabsList className="grid grid-cols-3 w-full min-w-[320px] sm:w-auto h-12 sm:h-10">
            <TabsTrigger 
              value="dashboard" 
              onClick={() => setActiveTab('dashboard')}
              className="text-xs sm:text-sm min-h-[44px] sm:min-h-[40px] flex items-center justify-center px-2"
            >
              <BarChart3 className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Panel</span>
            </TabsTrigger>
            <TabsTrigger 
              value="scan" 
              onClick={() => setActiveTab('scan')}
              className="text-xs sm:text-sm min-h-[44px] sm:min-h-[40px] flex items-center justify-center px-2"
            >
              <ScanLine className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Escáner</span>
              <span className="sm:hidden">QR</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              onClick={() => setActiveTab('reports')}
              className="text-xs sm:text-sm min-h-[44px] sm:min-h-[40px] flex items-center justify-center px-2"
            >
              <BarChart3 className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Reportes</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardStats stats={getDashboardStats()} />
          
          {/* Tabla de gestión ocupando todo el espacio disponible */}
          <ReservationTable
            reservas={reservas}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onViewReserva={(id: string) => {
              const reserva = reservas.find(r => r.id === id);
              if (reserva) handleViewReserva(reserva);
            }}
            onEstadoChange={(id: string, nuevoEstado) => {
              updateReserva(id, { estado: nuevoEstado });
            }}
            onMesaChange={(id: string, mesa: string) => {
              updateReserva(id, { mesa });
            }}
            onFechaChange={(id: string, fecha: string) => {
              updateReserva(id, { fecha });
            }}
            onHoraChange={(id: string, hora: string) => {
              updateReserva(id, { hora });
            }}
            onPersonasChange={(id: string, personas: number) => {
              updateReserva(id, { numeroPersonas: personas });
            }}
            onRazonVisitaChange={(id: string, razon: string) => {
              updateReserva(id, { razonVisita: razon });
            }}
            onBeneficiosChange={(id: string, beneficios: string) => {
              updateReserva(id, { beneficiosReserva: beneficios });
            }}
            onPromotorChange={(id: string, promotor: string) => {
              updateReserva(id, { promotor: { id: 'temp', nombre: promotor } });
            }}
            onDetallesChange={(id: string, detalles: string[]) => {
              // Por ahora, usar los primeros dos detalles para razonVisita y beneficiosReserva
              const [razonVisita = '', beneficiosReserva = ''] = detalles;
              updateReserva(id, { razonVisita, beneficiosReserva });
            }}
          />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Reportes de Actividad</h2>
            <ReportsPanel />
          </div>
        </TabsContent>
        
        <TabsContent value="scan" className="space-y-6">
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Control de Acceso</h2>
            <QRScannerWrapper onScan={handleQRScan} />
          </div>
        </TabsContent>
      </Tabs>
      
      <ReservationForm
        isOpen={showReservationForm}
        onClose={() => setShowReservationForm(false)}
        onSubmit={handleSubmitReserva}
      />
      

      
      {showQRGenerator && selectedReserva && (
        <Dialog open={showQRGenerator} onOpenChange={() => setShowQRGenerator(false)}>
          <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white">
            <QRCodeGeneratorEnhanced
              reserva={selectedReserva}
              initialValue={selectedReserva.id}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para mostrar QR de reserva existente */}
      <ReservationConfirmation
        isOpen={showQRView}
        onClose={() => {
          setShowQRView(false);
          setQrReserva(null);
        }}
        reserva={qrReserva}
        onQRGenerated={(qrData, qrToken) => {
          console.log('QR generado:', { qrData, qrToken });
        }}
      />
      
      <Toaster position="bottom-right" />
    </div>
  );
}
