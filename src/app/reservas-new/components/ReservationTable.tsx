import { useState, useRef, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { CustomCalendar } from "./ui/custom-calendar";
import { Eye, Calendar, User, Search, Plus } from "lucide-react";
import { Reserva } from "../types/reservation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ReservationCard } from "./ReservationCard";

interface ReservationTableProps {
  reservas: Reserva[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onViewReserva: (id: string) => void;
  onEstadoChange: (id: string, nuevoEstado: Reserva['estado']) => void;
  onMesaChange?: (id: string, mesa: string) => void;
  onFechaChange?: (id: string, fecha: string) => void;
  onHoraChange?: (id: string, hora: string) => void;
  onPersonasChange?: (id: string, personas: number) => void;
  onRazonVisitaChange?: (id: string, razon: string) => void;
  onBeneficiosChange?: (id: string, beneficios: string) => void;
  onPromotorChange?: (id: string, promotor: string) => void;
  onDetallesChange?: (id: string, detalles: string[]) => void;
}

export function ReservationTable({ 
  reservas, 
  selectedDate, 
  onDateSelect,
  onViewReserva, 
  onEstadoChange,
  onMesaChange,
  onFechaChange,
  onHoraChange,
  onPersonasChange,
  onRazonVisitaChange,
  onBeneficiosChange,
  onPromotorChange,
  onDetallesChange
}: Readonly<ReservationTableProps>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [detallesReservas, setDetallesReservas] = useState<Record<string, string[]>>({});
  const [reservasEditadas, setReservasEditadas] = useState<Record<string, Partial<Reserva>>>({});

  // Cargar datos editados desde localStorage al inicializar
  useEffect(() => {
    const datosGuardados = localStorage.getItem('reservas-editadas');
    if (datosGuardados) {
      try {
        const datos = JSON.parse(datosGuardados);
        setReservasEditadas(datos);
      } catch (error) {
        console.warn('Error al cargar datos guardados:', error);
      }
    }
  }, []);

  // Función para guardar cambios en localStorage y llamar al handler padre
  const guardarCambio = (reservaId: string, campo: string, valor: any) => {
    const nuevasEdiciones = {
      ...reservasEditadas,
      [reservaId]: {
        ...reservasEditadas[reservaId],
        [campo]: valor
      }
    };
    
    setReservasEditadas(nuevasEdiciones);
    localStorage.setItem('reservas-editadas', JSON.stringify(nuevasEdiciones));
    
    // Llamar al handler correspondiente
    const reservaCompleta = { ...reservas.find(r => r.id === reservaId), ...nuevasEdiciones[reservaId] };
    return reservaCompleta;
  };

  // Función para obtener el valor actual de un campo (editado o original)
  const obtenerValorCampo = (reservaId: string, campo: keyof Reserva): any => {
    const reservaOriginal = reservas.find(r => r.id === reservaId);
    const edicionesReserva = reservasEditadas[reservaId];
    
    if (edicionesReserva && edicionesReserva[campo] !== undefined) {
      return edicionesReserva[campo];
    }
    
    return reservaOriginal?.[campo];
  };

  // Función para inicializar detalles de una reserva
  const getDetallesReserva = (reservaId: string): string[] => {
    if (!detallesReservas[reservaId]) {
      // Inicializar sin campos, solo el botón + estará disponible
      const detallesIniciales: string[] = [];
      
      // Guardar en el estado para futuras referencias
      setDetallesReservas(prev => ({
        ...prev,
        [reservaId]: detallesIniciales
      }));
      
      return detallesIniciales;
    }
    return detallesReservas[reservaId];
  };

  // Función para agregar un nuevo campo de detalle
  const agregarDetalle = (reservaId: string, valor?: string) => {
    const nuevoValor = valor || '';
    setDetallesReservas(prev => ({
      ...prev,
      [reservaId]: [...getDetallesReserva(reservaId), nuevoValor]
    }));
    
    // Si se proporciona un valor, llamar inmediatamente al handler del padre
    if (valor && onDetallesChange) {
      const nuevosDetalles = [...getDetallesReserva(reservaId), nuevoValor];
      onDetallesChange(reservaId, nuevosDetalles);
    }
  };

  // Función para actualizar un detalle específico
  const actualizarDetalle = (reservaId: string, index: number, valor: string) => {
    const detalles = getDetallesReserva(reservaId);
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = valor;
    
    setDetallesReservas(prev => ({
      ...prev,
      [reservaId]: nuevosDetalles
    }));

    // Llamar al handler del componente padre si existe
    if (onDetallesChange) {
      onDetallesChange(reservaId, nuevosDetalles);
    }

    // Mantener compatibilidad con handlers específicos por ahora
    if (onRazonVisitaChange && index === 0) {
      onRazonVisitaChange(reservaId, valor);
    } else if (onBeneficiosChange && index === 1) {
      onBeneficiosChange(reservaId, valor);
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

  const filteredReservas = reservas.filter(reserva => {
    const matchesSearch = 
      reserva.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reserva.promotor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reserva.razonVisita.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por fecha - mostrar solo reservas del día seleccionado
    const matchesDate = reserva.fecha === format(selectedDate, 'yyyy-MM-dd');
    
    return matchesSearch && matchesDate;
  });

  // Obtener todas las fechas únicas que tienen reservas
  const reservedDates = [...new Set(reservas.map(reserva => reserva.fecha))];

  const getEstadoSelect = (reserva: Reserva) => {
    const getSelectClassName = (estado: Reserva['estado']) => {
      switch (estado) {
        case 'Activa':
          return "bg-green-500 border-green-600";
        case 'En Progreso':
          return "bg-yellow-500 border-yellow-600";
        case 'Reserva Caída':
          return "bg-red-500 border-red-600";
        case 'En Camino':
          return "bg-blue-500 border-blue-600";
        default:
          return "bg-green-500 border-green-600"; // Por defecto verde para "Activa"
      }
    };

    return (
      <select
        value={reserva.estado}
        onChange={(e) => onEstadoChange(reserva.id, e.target.value as Reserva['estado'])}
        className={`w-6 h-6 rounded-full border-2 cursor-pointer hover:scale-110 transition-all appearance-none ${getSelectClassName(reserva.estado)}`}
        style={{ 
          backgroundImage: 'none',
          fontSize: '0', // Oculta el texto completamente
          color: 'transparent',
          outline: 'none',
          textAlign: 'center',
          paddingLeft: '0',
          paddingRight: '0'
        }}
        title={reserva.estado} // Tooltip para mostrar el estado completo
      >
        <option value="Activa" style={{ fontSize: '14px', color: 'black', backgroundColor: 'white' }}>Activa</option>
        <option value="En Progreso" style={{ fontSize: '14px', color: 'black', backgroundColor: 'white' }}>En Progreso</option>
        <option value="Reserva Caída" style={{ fontSize: '14px', color: 'black', backgroundColor: 'white' }}>Caída</option>
        <option value="En Camino" style={{ fontSize: '14px', color: 'black', backgroundColor: 'white' }}>En Camino</option>
      </select>
    );
  };

  const getAsistenciaColor = (actual: number, reservado: number) => {
    const porcentaje = (actual / reservado) * 100;
    if (porcentaje >= 100) return "text-green-600 dark:text-green-400";
    if (porcentaje >= 80) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  return (
    <Card className="rounded-md border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 pb-2">
        <CardTitle className="text-lg font-semibold">Reservas</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {/* Filtros simples */}
        <div className="flex items-center gap-4 p-4 pb-2 border-b">
          {/* Buscador */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por cliente, promotor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selector de fecha */}
          <div className="relative" ref={datePickerRef}>
            <button
              className={`min-h-[44px] px-4 py-2 border border-gray-300 rounded-md cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 bg-white text-black font-medium ${showDatePicker ? 'bg-blue-100 border-blue-300' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Calendario toggled:', !showDatePicker);
                setShowDatePicker(!showDatePicker);
              }}
              type="button"
              style={{ zIndex: 10, position: 'relative' }}
            >
              <Calendar className="mr-2 h-4 w-4 inline" />
              {showDatePicker ? 'Cerrar calendario' : 'Filtrar fecha'}
            </button>
            
            {showDatePicker && (
              <div 
                className="absolute top-full right-0 mt-2 z-[100] bg-white border border-gray-300 rounded-lg shadow-xl"
                style={{ 
                  minWidth: '280px',
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

          {/* Mostrar fecha seleccionada */}
          <div className="text-sm text-muted-foreground">
            Mostrando: {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
          </div>
        </div>
        {/* Vista de tabla para desktop */}
        <div className="hidden lg:block">
          {/* ...tabla actual... */}
          <div className="border-b bg-muted/10">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/10 h-10">
                  <TableHead className="font-medium text-foreground text-xs py-2 text-center align-middle w-20">Mesa</TableHead>
                  <TableHead className="font-medium text-foreground text-xs py-2 text-center align-middle w-44">Cliente</TableHead>
                  <TableHead className="font-medium text-foreground text-xs py-2 text-center align-middle w-36">Fecha/Hora</TableHead>
                  <TableHead className="font-medium text-foreground text-xs py-2 text-center align-middle w-24">Personas</TableHead>
                  <TableHead className="font-medium text-foreground text-xs py-2 text-center align-middle w-20">Estado</TableHead>
                  <TableHead className="font-medium text-foreground text-xs py-2 text-center align-middle w-40">Detalles</TableHead>
                  <TableHead className="font-medium text-foreground text-xs py-2 text-center align-middle w-36">Referencia</TableHead>
                  <TableHead className="font-medium text-foreground text-xs py-2 text-center align-middle w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          
          {/* Contenido scrolleable con altura fija */}
          <div className="flex-1 overflow-auto" style={{ minHeight: '600px', maxHeight: '600px' }}>
            <Table>
              <TableBody>
                {filteredReservas.map((reserva) => (
                  <TableRow key={reserva.id} className="hover:bg-muted/30 h-12">
                    {/* Mesa - Editable */}
                    <TableCell className="py-2 text-center align-middle w-20">
                      <div className="flex justify-center items-center">
                        <Input 
                          value={obtenerValorCampo(reserva.id, 'mesa') || ""}
                          placeholder=""
                          className="w-16 h-6 text-xs border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 text-center px-1 font-medium rounded-md shadow-sm"
                          onChange={(e) => {
                            guardarCambio(reserva.id, 'mesa', e.target.value);
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
                    <TableCell className="py-2 text-center align-middle w-44">
                      <div className="flex items-center justify-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium text-xs truncate max-w-36">{reserva.cliente.nombre}</p>
                      </div>
                    </TableCell>
                    
                    {/* Fecha/Hora - Editables */}
                    <TableCell className="py-2 text-center align-middle w-36">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <Input
                            type="date"
                            value={obtenerValorCampo(reserva.id, 'fecha') || ""}
                            className="w-28 h-6 text-xs border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 text-center px-1 rounded-md shadow-sm"
                            onChange={(e) => {
                              guardarCambio(reserva.id, 'fecha', e.target.value);
                            }}
                            onBlur={(e) => {
                              if (onFechaChange) {
                                onFechaChange(reserva.id, e.target.value);
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-center">
                          <Input
                            type="time"
                            value={obtenerValorCampo(reserva.id, 'hora') || ""}
                            className="w-20 h-6 text-xs border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 text-center px-1 rounded-md shadow-sm"
                            onChange={(e) => {
                              guardarCambio(reserva.id, 'hora', e.target.value);
                            }}
                            onBlur={(e) => {
                              if (onHoraChange) {
                                onHoraChange(reserva.id, e.target.value);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Personas - Asistentes/Total (Solo lectura) */}
                    <TableCell className="py-2 text-center align-middle w-24">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`font-medium text-xs ${getAsistenciaColor(reserva.asistenciaActual, reserva.numeroPersonas)}`}>
                          {reserva.asistenciaActual}/{reserva.numeroPersonas}
                        </span>
                        {reserva.asistenciaActual > reserva.numeroPersonas && (
                          <span className="text-orange-600 dark:text-orange-400 text-xs">
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
                            className="w-36 h-6 text-xs border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 text-center px-2 rounded-md shadow-sm"
                            onBlur={(e) => {
                              actualizarDetalle(reserva.id, index, e.target.value);
                            }}
                          />
                        ))}
                        {/* Campo principal siempre visible con botón + al lado */}
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            key={`${reserva.id}-nuevo-detalle`}
                            defaultValue=""
                            placeholder="Nuevo detalle"
                            className="w-28 h-6 text-xs border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 text-center px-2 rounded-md shadow-sm"
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const input = document.querySelector(`input[key="${reserva.id}-nuevo-detalle"]`) as HTMLInputElement;
                              if (input && input.value.trim()) {
                                agregarDetalle(reserva.id, input.value);
                                input.value = '';
                              }
                            }}
                            className="w-6 h-6 p-0 hover:bg-muted/20 rounded-full"
                            title="Agregar detalle"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Referencia (Promotor/Persona que concretó) - Editable */}
                    <TableCell className="py-2 text-center align-middle w-36">
                      <div className="flex flex-col items-center justify-center">
                        <Input
                          value={obtenerValorCampo(reserva.id, 'promotor')?.nombre || ''}
                          placeholder="Promotor"
                          className="w-32 h-6 text-xs border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 text-center px-2 font-medium rounded-md shadow-sm"
                          onChange={(e) => {
                            guardarCambio(reserva.id, 'promotor', { id: 'temp', nombre: e.target.value });
                          }}
                          onBlur={(e) => {
                            if (onPromotorChange) {
                              onPromotorChange(reserva.id, e.target.value);
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                    
                    {/* Acciones */}
                    <TableCell className="py-2 text-center align-middle w-20">
                      <div className="flex justify-center items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewReserva(reserva.id)}
                          title="Ver detalles de la reserva"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Filas vacías para mantener altura consistente */}
                {Array.from({ length: Math.max(0, 20 - filteredReservas.length) }).map((_, index) => (
                  <TableRow key={`empty-row-${filteredReservas.length}-${index}`} className="h-12">
                    <TableCell colSpan={8} className="text-transparent">.</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            

          </div>
        </div>
        
        {/* Vista de tarjetas para móvil/tablet */}
        <div className="lg:hidden space-y-3 p-3">
          {filteredReservas.map((reserva) => (
            <ReservationCard
              key={reserva.id}
              reserva={reserva}
              onView={() => onViewReserva(reserva.id)}
            />
          ))}

        </div>
      </CardContent>
    </Card>
  );
}

export default ReservationTable;