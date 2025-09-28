import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CustomCalendar } from "./ui/custom-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

import { Edit, Eye, Search, Users, Calendar, User, CalendarDays } from "lucide-react";
import { Reserva } from "../types/reservation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReservationTableProps {
  reservas: Reserva[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEditReserva: (id: string) => void;
  onViewReserva: (id: string) => void;
  onEstadoChange: (id: string, nuevoEstado: Reserva['estado']) => void;
}

export function ReservationTable({ reservas, selectedDate, onDateSelect, onEditReserva, onViewReserva, onEstadoChange }: Readonly<ReservationTableProps>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [filterByDate, setFilterByDate] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Efecto para manejar la apertura del popover
  useEffect(() => {
    // No necesitamos hacer nada especial con nuestro nuevo calendario personalizado
  }, [popoverOpen]);

  const filteredReservas = reservas.filter(reserva => {
    const matchesSearch = 
      reserva.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reserva.promotor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reserva.razonVisita.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterEstado === "all" || reserva.estado === filterEstado;
    
    // Filtro por fecha si está activado - convertir ambas fechas al mismo formato
    const matchesDate = !filterByDate || reserva.fecha === format(selectedDate, 'yyyy-MM-dd');
    
    return matchesSearch && matchesFilter && matchesDate;
  });

  const getEstadoSelect = (reserva: Reserva) => {
    const getSelectClassName = (estado: Reserva['estado']) => {
      switch (estado) {
        case 'Activa':
          return "bg-green-500 text-white border-green-600";
        case 'En Progreso':
          return "bg-yellow-500 text-white border-yellow-600";
        case 'Reserva Caída':
          return "bg-red-500 text-white border-red-600";
        case 'En Camino':
          return "bg-blue-500 text-white border-blue-600";
        default:
          return "bg-green-500 text-white border-green-600"; // Por defecto verde para "Activa"
      }
    };

    return (
      <select
        value={reserva.estado}
        onChange={(e) => onEstadoChange(reserva.id, e.target.value as Reserva['estado'])}
        className={`px-2 py-1 text-xs rounded-md border-2 font-medium min-w-[100px] cursor-pointer hover:opacity-90 transition-opacity ${getSelectClassName(reserva.estado)}`}
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'white\' viewBox=\'0 0 16 16\'%3e%3cpath d=\'m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z\'/%3e%3c/svg%3e")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 4px center',
          backgroundSize: '12px',
          paddingRight: '20px'
        }}
      >
        <option value="Activa" style={{ backgroundColor: 'white', color: 'black' }}>Activa</option>
        <option value="En Progreso" style={{ backgroundColor: 'white', color: 'black' }}>En Progreso</option>
        <option value="Reserva Caída" style={{ backgroundColor: 'white', color: 'black' }}>Reserva Caída</option>
        <option value="En Camino" style={{ backgroundColor: 'white', color: 'black' }}>En Camino</option>
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Reservas
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            {filteredReservas.length} reserva{filteredReservas.length !== 1 ? 's' : ''}
            {filterByDate && (
              <span className="ml-1 text-primary">
                - {format(selectedDate, "dd/MM/yyyy", { locale: es })}
              </span>
            )}
          </div>
        </CardTitle>
        
        <div className="flex gap-2 items-center mt-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, promotor o razón..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          
          <select 
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-2 py-1 border rounded bg-background text-xs h-8"
          >
            <option value="all">Todos los estados</option>
            <option value="Activa">Activa</option>
            <option value="En Progreso">En Progreso</option>  
            <option value="Reserva Caída">Reserva Caída</option>
            <option value="En Camino">En Camino</option>
          </select>

          {/* Filtro de Fecha */}
          <div className="relative">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={filterByDate ? "default" : "outline"}
                  size="sm"
                  className={`h-8 px-2 text-xs ${filterByDate ? 'bg-primary text-primary-foreground' : ''}`}
                  onClick={() => {
                    console.log("Botón fecha clickeado");
                    setPopoverOpen(!popoverOpen);
                    setShowDatePicker(!showDatePicker);
                  }}
                >
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  {filterByDate ? format(selectedDate, "dd/MM", { locale: es }) : "Fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end" sideOffset={5} style={{ minWidth: '280px' }}>
                <div className="p-3">
                  <CustomCalendar
                    selectedDate={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        onDateSelect(date);
                        setFilterByDate(true);
                        setPopoverOpen(false);
                        setShowDatePicker(false);
                      }
                    }}
                    locale={es}
                    className="w-full"
                  />
                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          onDateSelect(today);
                          setFilterByDate(true);
                          setPopoverOpen(false);
                          setShowDatePicker(false);
                        }}
                      >
                        Hoy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          onDateSelect(tomorrow);
                          setFilterByDate(true);
                          setPopoverOpen(false);
                          setShowDatePicker(false);
                        }}
                      >
                        Mañana
                      </Button>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFilterByDate(false);
                        setPopoverOpen(false);
                        setShowDatePicker(false);
                      }}
                    >
                      Mostrar todas
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Fallback: DatePicker alternativo */}
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 z-50 bg-white border rounded-lg shadow-lg" style={{ minWidth: '280px' }}>
                <div className="p-3">
                  <CustomCalendar
                    selectedDate={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        onDateSelect(date);
                        setFilterByDate(true);
                        setShowDatePicker(false);
                      }
                    }}
                    locale={es}
                  />
                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          onDateSelect(today);
                          setFilterByDate(true);
                          setShowDatePicker(false);
                        }}
                      >
                        Hoy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          onDateSelect(tomorrow);
                          setFilterByDate(true);
                          setShowDatePicker(false);
                        }}
                      >
                        Mañana
                      </Button>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFilterByDate(false);
                        setShowDatePicker(false);
                      }}
                    >
                      Mostrar todas
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/10 h-8">
                <TableHead className="font-medium text-foreground text-xs py-2">Cliente</TableHead>
                <TableHead className="font-medium text-foreground text-xs py-2">Fecha/Hora</TableHead>
                <TableHead className="font-medium text-foreground text-xs py-2">Personas</TableHead>
                <TableHead className="font-medium text-foreground text-xs py-2">Asistencia</TableHead>
                <TableHead className="font-medium text-foreground text-xs py-2">Promotor</TableHead>
                <TableHead className="font-medium text-foreground text-xs py-2">Estado</TableHead>
                <TableHead className="font-medium text-foreground text-xs py-2">Razón</TableHead>
                <TableHead className="font-medium text-foreground text-xs py-2">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservas.map((reserva) => (
                <TableRow key={reserva.id} className="hover:bg-muted/30 h-10">
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-xs">{reserva.cliente.nombre}</p>
                        {reserva.cliente.telefono && (
                          <p className="text-xs text-muted-foreground">{reserva.cliente.telefono}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="text-xs">{format(new Date(reserva.fecha + 'T00:00:00'), "dd/MM/yyyy", { locale: es })}</p>
                        <p className="text-xs text-muted-foreground">{reserva.hora}</p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-center">
                      <span className="font-medium">{reserva.numeroPersonas}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-center">
                      <span className={`font-medium ${getAsistenciaColor(reserva.asistenciaActual, reserva.numeroPersonas)}`}>
                        {reserva.asistenciaActual}/{reserva.numeroPersonas}
                      </span>
                      {reserva.asistenciaActual > reserva.numeroPersonas && (
                        <span className="text-orange-600 dark:text-orange-400 text-sm ml-1">
                          (+{reserva.asistenciaActual - reserva.numeroPersonas})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>{reserva.promotor.nombre}</TableCell>
                  
                  <TableCell>{getEstadoSelect(reserva)}</TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="text-sm">{reserva.razonVisita}</p>
                      <p className="text-xs text-muted-foreground">{reserva.beneficiosReserva}</p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewReserva(reserva.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditReserva(reserva.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredReservas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron reservas que coincidan con los filtros
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}