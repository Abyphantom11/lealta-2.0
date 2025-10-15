import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { CustomCalendar } from "./ui/custom-calendar";
import { CalendarFullscreenModal } from "./ui/calendar-fullscreen-modal";
import { Eye, Calendar, User, Search, Plus, Trash2, Clock, Upload } from "lucide-react";
import { Reserva } from "../types/reservation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ReservationCard } from "./ReservationCard";
import ComprobanteUploadModal from "./ComprobanteUploadModal";
import { PromotorTableAutocomplete } from "./PromotorTableAutocomplete";
import { useReservaEditing } from "../hooks/useReservaEditing";

interface ReservationTableProps {
  businessId?: string;
  reservas: Reserva[];
  allReservas?: Reserva[]; // Todas las reservas sin filtrar (para calcular fechas con reservas)
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onViewReserva: (id: string) => void;
  onDeleteReserva: (id: string) => void;
  onEditReserva?: (reserva: Reserva) => void; // Nueva función para editar reserva en móvil
  onUploadComprobante: (id: string, archivo: File) => void;
  onRemoveComprobante?: (id: string) => void;
  onEstadoChange?: (id: string, estado: Reserva['estado']) => void;
  onMesaChange?: (id: string, mesa: string) => void;
  onHoraChange?: (id: string, hora: string) => void;
  onPromotorChange?: (reservationId: string, promotorId: string, promotorName: string) => Promise<void>;
  onDetallesChange?: (id: string, detalles: string[]) => void;
  onRazonVisitaChange?: (id: string, razon: string) => void;
  onBeneficiosChange?: (id: string, beneficios: string) => void;
}

export function ReservationTable({ 
  businessId = 'golom',
  reservas, 
  allReservas,
  selectedDate, 
  onDateSelect,
  onViewReserva,
  onDeleteReserva,
  onEditReserva,
  onUploadComprobante,
  onRemoveComprobante,
  onEstadoChange,
  onMesaChange,
  onHoraChange,
  onPromotorChange,
  onDetallesChange,
  onRazonVisitaChange,
  onBeneficiosChange,
}: Readonly<ReservationTableProps>) {
  // 🎯 Hook unificado de edición (reemplaza toda la lógica de localStorage)
  const { updateField, getFieldValue } = useReservaEditing({ businessId });
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para el dialog de upload
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedReservaId, setSelectedReservaId] = useState<string | null>(null);

  // 🔄 Función para obtener el valor actual de un campo (simplificada)
  const obtenerValorCampo = (reservaId: string, campo: keyof Reserva): any => {
    const reservaOriginal = allReservas?.find(r => r.id === reservaId) || reservas.find(r => r.id === reservaId);
    if (!reservaOriginal) return undefined;
    
    // Usar el hook unificado para obtener el valor (incluye ediciones locales optimistas)
    return getFieldValue(reservaId, campo, reservaOriginal[campo]);
  };

  // Función para inicializar detalles de una reserva
  const getDetallesReserva = useCallback((reservaId: string): string[] => {
    // 🎯 SIEMPRE usar el hook para obtener los detalles más actuales
    const reservaOriginal = reservas.find(r => r.id === reservaId);
    const detallesActuales = getFieldValue(reservaId, 'detalles', reservaOriginal?.detalles || []);
    
    // ✅ Solo log cuando realmente hay cambios para evitar spam
    const hasChanges = JSON.stringify(reservaOriginal?.detalles) !== JSON.stringify(detallesActuales);
    if (hasChanges) {
      console.log('🔍 getDetallesReserva - CAMBIO DETECTADO:', { 
        reservaId, 
        detallesOriginales: JSON.stringify(reservaOriginal?.detalles),
        detallesActuales: JSON.stringify(detallesActuales),
        timestamp: new Date().toISOString()
      });
    }
    
    return detallesActuales;
  }, [reservas, getFieldValue]);

  // Función para agregar un nuevo campo de detalle
  const agregarDetalle = useCallback((reservaId: string, valor?: string) => {
    const nuevoValor = valor || '';
    const detallesActuales = getDetallesReserva(reservaId);
    const nuevosDetalles = [...detallesActuales, nuevoValor];
    
    // 🎯 Actualizar usando SOLO el hook unificado
    updateField(reservaId, 'detalles', nuevosDetalles);
  }, [getDetallesReserva, updateField]);

  // Función para actualizar un detalle específico
  const actualizarDetalle = useCallback((reservaId: string, index: number, valor: string) => {
    const detalles = getDetallesReserva(reservaId);
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = valor;
    
    // 🎯 Actualizar usando SOLO el hook unificado
    updateField(reservaId, 'detalles', nuevosDetalles);
  }, [getDetallesReserva, updateField]);
  
  // Función para manejar el upload de comprobante
  const handleUploadComprobante = async (file: File) => {
    if (!selectedReservaId || !file) return;
    
    try {
      // Llamar a la función del componente padre
      onUploadComprobante(selectedReservaId, file);
      
      // Cerrar el modal
      setShowUploadDialog(false);
      toast.success('✅ Comprobante subido exitosamente');
      
    } catch (error) {
      console.error('Error al subir comprobante:', error);
      toast.error('❌ Error al subir comprobante');
      throw error; // Re-throw para que el modal lo maneje
    }
  };
  
  // Función para quitar el comprobante de pago
  const handleRemoveComprobante = async () => {
    if (!selectedReservaId) return;
    
    try {
      // Llamar al endpoint DELETE para eliminar el comprobante
      const response = await fetch(`/api/reservas/${selectedReservaId}/comprobante`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar comprobante');
      }

      // Recargar reservas para actualizar el estado
      if (onRemoveComprobante) {
        onRemoveComprobante(selectedReservaId);
      }

      toast.success('✅ Comprobante eliminado');
      setShowUploadDialog(false);
    } catch (error: any) {
      console.error('Error al eliminar comprobante:', error);
      toast.error('❌ Error al eliminar comprobante');
    }
  };
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Cerrar el calendario cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Usar allReservas para búsqueda (todas las reservas sin filtro de fecha)
  // y reservas para el filtro por fecha cuando no hay búsqueda
  const baseReservas = allReservas || reservas;

  const filteredReservas = (Array.isArray(baseReservas) ? baseReservas : []).filter(reserva => {
    // Si hay término de búsqueda, buscar en nombre de cliente o promotor
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesCliente = reserva.cliente.nombre.toLowerCase().includes(searchLower);
      const matchesPromotor = (reserva.promotor?.nombre || '').toLowerCase().includes(searchLower);
      
      // Cuando hay búsqueda, mostrar TODAS las fechas que coincidan
      return matchesCliente || matchesPromotor;
    }
    
    // Sin búsqueda, filtrar solo por fecha seleccionada
    const matchesDate = reserva.fecha === format(selectedDate, 'yyyy-MM-dd');
    return matchesDate;
  });

  // Obtener todas las fechas únicas que tienen reservas
  // Usar allReservas si está disponible, sino usar reservas (fallback para compatibilidad)
  const reservasParaFechas = allReservas || reservas;
  const reservedDates = [...new Set((Array.isArray(reservasParaFechas) ? reservasParaFechas : []).map(reserva => reserva.fecha))];

  const getEstadoSelect = (reserva: Reserva) => {
    const getSelectClassName = (estado: Reserva['estado']) => {
      switch (estado) {
        case 'En Progreso':
          return "bg-amber-500 border-amber-600";
        case 'Activa':
          return "bg-green-500 border-green-600";
        case 'Reserva Caída':
          return "bg-red-500 border-red-600";
        case 'En Camino':
          return "bg-blue-500 border-blue-600";
        case 'Cancelado':
          return "bg-gray-500 border-gray-600";
        default:
          return "bg-amber-500 border-amber-600";
      }
    };

    return (
      <select
        value={reserva.estado}
        onChange={(e) => {
          const nuevoEstado = e.target.value as Reserva['estado'];
          updateField(reserva.id, 'estado', nuevoEstado);
          if (onEstadoChange) {
            onEstadoChange(reserva.id, nuevoEstado);
          }
        }}
        className={`w-6 h-6 rounded-full border-2 cursor-pointer hover:scale-110 appearance-none ${getSelectClassName(reserva.estado)}`}
        style={{ 
          backgroundImage: 'none',
          fontSize: '0',
          color: 'transparent',
          outline: 'none',
          textAlign: 'center',
          paddingLeft: '0',
          paddingRight: '0'
        }}
        title={reserva.estado}
      >
        <option value="En Progreso" style={{ fontSize: '14px', color: 'black', backgroundColor: 'white' }}>En Progreso</option>
        <option value="Activa" style={{ fontSize: '14px', color: 'black', backgroundColor: 'white' }}>Activa</option>
        <option value="Reserva Caída" style={{ fontSize: '14px', color: 'black', backgroundColor: 'white' }}>Caída</option>
        <option value="En Camino" style={{ fontSize: '14px', color: 'black', backgroundColor: 'white' }}>En Camino</option>
        <option value="Cancelado" style={{ fontSize: '14px', color: 'black', backgroundColor: 'white' }}>Cancelado</option>
      </select>
    );
  };

  const getAsistenciaColor = (actual: number, reservado: number) => {
    const porcentaje = (actual / reservado) * 100;
    if (porcentaje >= 100) return "text-green-600";
    if (porcentaje >= 80) return "text-yellow-600";
    return "text-muted-foreground";
  };

  return (
    <>
      <Card className="rounded-md border shadow-sm mx-auto max-w-7xl bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900">Reservas</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {/* Filtros simples */}
        <div className="flex items-center gap-4 p-4 pb-2 border-b border-gray-200">
          {/* Buscador */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por cliente, promotor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Selector de fecha */}
          <div className="relative" ref={datePickerRef}>
            <button
              className={`min-h-[44px] md:min-h-[36px] px-3 md:px-3 py-1.5 md:py-1.5 text-xs md:text-sm border border-gray-300 rounded-md cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 bg-white text-black font-medium ${showDatePicker ? 'bg-blue-100 border-blue-300' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Calendario toggled:', !showDatePicker);
                setShowDatePicker(!showDatePicker);
              }}
              type="button"
              style={{ zIndex: 10, position: 'relative' }}
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4 inline" />
              {showDatePicker ? 'Cerrar calendario' : 'Filtrar fecha'}
            </button>
            
            {/* Desktop: Popover normal */}
            {showDatePicker && (
              <div 
                className="hidden lg:block absolute top-full right-0 mt-2 z-[100] bg-white border border-gray-300 rounded-lg shadow-xl"
                style={{ 
                  minWidth: '320px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
              >
                <CustomCalendar
                  selectedDate={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      console.log('Fecha seleccionada:', date);
                      onDateSelect(date);
                      setShowDatePicker(false);
                    }
                  }}
                  locale={es}
                  reservedDates={reservedDates}
                />
              </div>
            )}
          </div>
          
          {/* Mobile: Modal fullscreen */}
          <div className="lg:hidden">
            <CalendarFullscreenModal
              isOpen={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                onDateSelect(date);
                setShowDatePicker(false);
              }}
              reservedDates={reservedDates}
            />
          </div>

          {/* Mostrar fecha seleccionada o modo búsqueda */}
          <div className="text-sm text-muted-foreground">
            {searchTerm.trim() ? (
              <span>Buscando: <strong>{searchTerm}</strong> (mostrando todas las fechas)</span>
            ) : (
              <span>Mostrando: {format(selectedDate, 'dd/MM/yyyy', { locale: es })}</span>
            )}
          </div>
        </div>
        {/* Vista de tabla para desktop */}
        <div className="hidden lg:block px-4 pb-4">
          {/* Contenedor con altura fija para mantener diseño consistente */}
          <div 
            className={`flex-1 ${filteredReservas.length > 10 ? 'overflow-auto' : 'overflow-hidden'} rounded-lg border border-gray-200 bg-white`} 
            style={{ 
              minHeight: '480px', // Altura fija para al menos ~10 filas (48px cada una)
              maxHeight: '480px'
            }}
          >
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 bg-white h-10 sticky top-0 z-10">
                  <TableHead className="font-medium text-gray-900 text-xs py-2 text-center align-middle w-24">Fecha</TableHead>
                  <TableHead className="font-medium text-gray-900 text-xs py-2 text-center align-middle w-20">Mesa</TableHead>
                  <TableHead className="font-medium text-gray-900 text-xs py-2 text-center align-middle w-44">Cliente</TableHead>
                  <TableHead className="font-medium text-gray-900 text-xs py-2 text-center align-middle w-32">Hora</TableHead>
                  <TableHead className="font-medium text-gray-900 text-xs py-2 text-center align-middle w-24">Asist/Total</TableHead>
                  <TableHead className="font-medium text-gray-900 text-xs py-2 text-center align-middle w-20">Estado</TableHead>
                  <TableHead className="font-medium text-gray-900 text-xs py-2 text-center align-middle w-36">Detalles</TableHead>
                  <TableHead className="font-medium text-gray-900 text-xs py-2 text-center align-middle w-36">Promotor</TableHead>
                  <TableHead className="font-medium text-gray-900 text-xs py-2 text-center align-middle w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservas.map((reserva) => (
                  <TableRow key={reserva.id} className="hover:bg-white h-12 border-gray-200 bg-white">
                    {/* Fecha - Solo lectura */}
                    <TableCell className="py-2 text-center align-middle w-24">
                      <span className="text-xs font-medium text-gray-700">
                        {format(new Date(reserva.fecha + 'T00:00:00'), 'dd/MM', { locale: es })}
                      </span>
                    </TableCell>
                    {/* Mesa - Editable */}
                    <TableCell className="py-2 text-center align-middle w-20">
                      <div className="flex justify-center items-center">
                        <Input 
                          value={obtenerValorCampo(reserva.id, 'mesa') || ""}
                          placeholder=""
                          className="w-16 h-6 text-xs border-2 border-gray-300 bg-white hover:bg-white focus:bg-white focus:border-blue-500 text-center px-1 font-medium rounded-md shadow-sm text-gray-900"
                          onChange={(e) => {
                            updateField(reserva.id, 'mesa', e.target.value);
                          }}
                          onBlur={(e) => {
                            if (onMesaChange) {
                              onMesaChange(reserva.id, e.target.value);
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                    
                    {/* Cliente */}
                    <TableCell className={`py-2 text-center align-middle w-44 ${
                      obtenerValorCampo(reserva.id, 'comprobanteSubido') ? 'bg-fuchsia-50' : ''
                    }`}>
                      <div className="flex flex-col items-center justify-center gap-1">
                        {obtenerValorCampo(reserva.id, 'comprobanteSubido') && (
                          <span className="text-xs font-semibold text-fuchsia-600 bg-fuchsia-100 px-2 py-0.5 rounded-full">
                            Pago en reserva
                          </span>
                        )}
                        <div className="flex items-center justify-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <p className="font-medium text-xs truncate max-w-36 text-gray-900">{reserva.cliente.nombre}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Hora - Solo lectura con botón */}
                    <TableCell className="py-2 text-center align-middle w-40">
                      <div className="flex items-center justify-center gap-1">
                        <div className="relative">
                          <input
                            type="time"
                            value={obtenerValorCampo(reserva.id, 'hora') || reserva.hora}
                            onChange={(e) => {
                              console.log('⏰ Cambiando hora en escritorio:', {
                                reservaId: reserva.id,
                                nuevaHora: e.target.value,
                                horaAnterior: obtenerValorCampo(reserva.id, 'hora') || reserva.hora
                              });
                              
                              updateField(reserva.id, 'hora', e.target.value);
                              if (onHoraChange) {
                                onHoraChange(reserva.id, e.target.value);
                              }
                            }}
                            className="absolute inset-0 w-6 h-6 opacity-0 cursor-pointer"
                            title="Cambiar hora"
                          />
                          <div className="w-6 h-6 p-0 hover:bg-muted/20 rounded-full flex items-center justify-center">
                            <Clock className="h-3 w-3 text-gray-700" />
                          </div>
                        </div>
                        <div className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-center min-w-[90px] text-gray-900">
                          {obtenerValorCampo(reserva.id, 'hora') || reserva.hora}
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Personas - Asistentes/Total con % (Solo lectura) */}
                    <TableCell className="py-2 text-center align-middle w-28">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`font-medium text-xs ${getAsistenciaColor(reserva.asistenciaActual, reserva.numeroPersonas)}`}>
                          {reserva.asistenciaActual}/{reserva.numeroPersonas}
                        </span>
                        <span className={`text-xs ${getAsistenciaColor(reserva.asistenciaActual, reserva.numeroPersonas)}`}>
                          ({Math.round((reserva.asistenciaActual / reserva.numeroPersonas) * 100)}%)
                        </span>
                        {reserva.asistenciaActual > reserva.numeroPersonas && (
                          <span className="text-orange-600 text-xs">
                            (+{reserva.asistenciaActual - reserva.numeroPersonas})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Estado - Dropdown más pequeño */}
                    <TableCell className="py-2 text-center align-middle w-20">
                      <div className="flex justify-center items-center">
                        <div className="w-16">
                          {getEstadoSelect(reserva)}
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Detalles - Campo siempre visible con botón + */}
                    <TableCell className="py-2 text-center align-middle w-40">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {getDetallesReserva(reserva.id).map((detalle, index) => (
                          <Input
                            key={`${reserva.id}-detalle-${index}`}
                            defaultValue={detalle}
                            placeholder=""
                            className="w-36 h-6 text-xs border-2 border-gray-300 bg-white hover:bg-gray-100 focus:bg-white focus:border-blue-500 text-center px-2 rounded-md shadow-sm text-gray-900"
                            onBlur={(e) => {
                              actualizarDetalle(reserva.id, index, e.target.value);
                            }}
                          />
                        ))}
                        {/* Campo principal siempre visible con botón + al lado */}
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            id={`${reserva.id}-nuevo-detalle`} // ✅ Usar id en lugar de key
                            defaultValue=""
                            placeholder="Nuevo detalle"
                            className="w-28 h-6 text-xs border-2 border-gray-300 bg-white hover:bg-gray-100 focus:bg-white focus:border-blue-500 text-center px-2 rounded-md shadow-sm text-gray-900"
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                agregarDetalle(reserva.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                agregarDetalle(reserva.id, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`${reserva.id}-nuevo-detalle`) as HTMLInputElement;
                              if (input?.value.trim()) {
                                agregarDetalle(reserva.id, input.value);
                                input.value = '';
                                input.focus(); // Enfocar para seguir agregando
                              } else {
                                input?.focus(); // Si está vacío, solo enfocar
                              }
                            }}
                            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer transition-colors border border-gray-300 bg-white"
                            title="Agregar detalle"
                          >
                            <Plus className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Promotor - Editable con Autocomplete */}
                    <TableCell className="py-2 text-center align-middle w-36">
                      <div className="flex flex-col items-center justify-center">
                        {onPromotorChange ? (
                          <PromotorTableAutocomplete
                            businessId={businessId}
                            reservationId={reserva.id}
                            currentPromotorId={obtenerValorCampo(reserva.id, 'promotor')?.id}
                            currentPromotorName={obtenerValorCampo(reserva.id, 'promotor')?.nombre || ''}
                            onUpdate={onPromotorChange}
                          />
                        ) : (
                          <span className="text-xs text-gray-600">
                            {obtenerValorCampo(reserva.id, 'promotor')?.nombre || '-'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Acciones */}
                    <TableCell className="py-2 text-center align-middle w-32">
                      <div className="flex justify-center items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewReserva(reserva.id)}
                          title="Ver detalles de la reserva"
                          className="border-gray-300 hover:bg-white text-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReservaId(reserva.id);
                            setShowUploadDialog(true);
                          }}
                          title={
                            obtenerValorCampo(reserva.id, 'comprobanteSubido') 
                              ? "Ver/Cambiar comprobante de pago"
                              : "Subir comprobante de pago"
                          }
                          className={
                            obtenerValorCampo(reserva.id, 'comprobanteSubido')
                              ? "text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 border-fuchsia-200 hover:border-fuchsia-300"
                              : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                          }
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteReserva(reserva.id)}
                          title="Eliminar reserva"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Filas vacías para mantener al menos 10 espacios siempre */}
                {Array.from({ length: Math.max(0, 10 - filteredReservas.length) }).map((_, index) => (
                  <TableRow key={`empty-row-${filteredReservas.length}-${index}`} className="h-12 border-gray-200">
                    <TableCell colSpan={8} className="text-transparent">.</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Vista de tarjetas para móvil/tablet */}
        <div className="lg:hidden space-y-3 p-3">
          {filteredReservas.length > 0 ? (
            filteredReservas.map((reserva) => {
              // 🔄 Crear reserva con datos actualizados (usando la misma lógica que la tabla de escritorio)
              const reservaActualizada: Reserva = {
                ...reserva,
                hora: obtenerValorCampo(reserva.id, 'hora') || reserva.hora,
                estado: obtenerValorCampo(reserva.id, 'estado') || reserva.estado,
                mesa: obtenerValorCampo(reserva.id, 'mesa') || reserva.mesa,
                detalles: obtenerValorCampo(reserva.id, 'detalles') || reserva.detalles,
              };
              
              // 🔑 Crear un hash único para forzar re-render cuando cambien los datos
              const dataHash = `${reservaActualizada.hora}-${reservaActualizada.estado}-${reservaActualizada.mesa}-${JSON.stringify(reservaActualizada.detalles)}`;
              
              return (
                <ReservationCard
                  key={`${reserva.id}-${dataHash}`} // 🔑 Hash único para forzar re-render
                  reserva={reservaActualizada}
                  onView={() => onViewReserva(reserva.id)}
                  onEdit={onEditReserva ? () => onEditReserva(reservaActualizada) : undefined}
                />
              );
            })
          ) : (
            <div className="text-center py-12 px-4 min-h-[400px] flex flex-col items-center justify-center">
              <div className="text-gray-500 text-lg mb-2">
                📅
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin reservas
              </h3>
              <p className="text-sm text-gray-500 max-w-sm text-center">
                No hay reservas para la fecha seleccionada. Selecciona otra fecha para ver las reservas disponibles.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Modal para subir comprobante */}
    <ComprobanteUploadModal
      isOpen={showUploadDialog}
      onClose={() => {
        setShowUploadDialog(false);
        setSelectedReservaId(null);
      }}
      onUpload={handleUploadComprobante}
      onRemoveComprobante={handleRemoveComprobante}
      reservaId={selectedReservaId || ''}
      clienteNombre={
        selectedReservaId 
          ? reservas.find(r => r.id === selectedReservaId)?.cliente.nombre || 'Cliente'
          : 'Cliente'
      }
      comprobanteExistente={
        selectedReservaId 
          ? (reservas.find(r => r.id === selectedReservaId)?.comprobanteUrl || null)
          : null
      }
    />
    </>
  );
}

export default ReservationTable;