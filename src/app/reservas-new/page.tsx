'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent } from './components/ui/dialog';
import { Plus, BarChart3, ScanLine } from 'lucide-react';
import { useReservations } from './hooks/useReservationsFigma';

import { ReservationTable } from './components/ReservationTable';
import ReservationForm from './components/ReservationForm';
import { QRScannerView } from './components/QRScannerViewNew';
import { QRCodeGeneratorEnhanced } from './components/QRCodeGeneratorEnhanced';
import { DashboardStats } from './components/DashboardStats';

import { ReportsPanel } from './components/ReportsPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { Reserva } from './types/reservation';
import { Toaster } from './components/ui/sonner';

export default function Page() {
  const {
    reservas,
    selectedDate,
    setSelectedDate,
    addReserva,
    updateReserva,
    getDashboardStats
  } = useReservations();

  const [showReservationForm, setShowReservationForm] = useState(false);

  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | undefined>();
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleCreateReserva = () => {
    setEditingReserva(undefined);
    setShowReservationForm(true);
  };

  const handleEditReserva = (reserva: Reserva) => {
    setEditingReserva(reserva);
    setShowReservationForm(true);
  };

  const handleViewReserva = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setShowQRGenerator(true);
  };

  const handleSubmitReserva = async (reservaData: Omit<Reserva, 'id'>) => {
    if (editingReserva) {
      await updateReserva(editingReserva.id, reservaData);
    } else {
      await addReserva(reservaData);
    }
    setShowReservationForm(false);
  };

  const handleQRScan = (qrCode: string) => {
    // Simplificado por ahora - en una implementación real buscarían por QR
    const reserva = reservas.find((r: Reserva) => r.id === qrCode);
    if (reserva) {
      updateReserva(reserva.id, { estado: 'Activa' as const });
      // Opcional: mostrar notificación de éxito
      console.log(`Reserva ${qrCode} confirmada exitosamente`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Reservas lealta</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="px-3 py-1">
            {getDashboardStats().totalReservas} reservas totales
          </Badge>
          <ThemeToggle />
          <Button 
            onClick={handleCreateReserva}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reserva
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="dashboard" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="dashboard" onClick={() => setActiveTab('dashboard')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="scan" onClick={() => setActiveTab('scan')}>
            <ScanLine className="mr-2 h-4 w-4" />
            Control Acceso
          </TabsTrigger>
          <TabsTrigger value="reports" onClick={() => setActiveTab('reports')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardStats stats={getDashboardStats()} />
          
          {/* Tabla de gestión ocupando todo el espacio disponible */}
          <ReservationTable
            reservas={reservas}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onEditReserva={(id: string) => {
              const reserva = reservas.find(r => r.id === id);
              if (reserva) handleEditReserva(reserva);
            }}
            onViewReserva={(id: string) => {
              const reserva = reservas.find(r => r.id === id);
              if (reserva) handleViewReserva(reserva);
            }}
            onEstadoChange={(id: string, nuevoEstado) => {
              updateReserva(id, { estado: nuevoEstado });
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
            <QRScannerView onScan={handleQRScan} />
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
      
      <Toaster position="bottom-right" />
    </div>
  );
}
