"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PromotorSearchOnly } from "./PromotorSearchOnly";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";

interface AIReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reservaData: any) => Promise<void>;
  selectedDate?: Date;
  businessId: string;
}

interface ParsedData {
  clienteNombre?: string;
  clienteCedula?: string;
  clienteCorreo?: string;
  clienteTelefono?: string;
  clienteFechaNacimiento?: string; // 🆕 Nuevo campo
  numeroPersonas?: number;
  fecha?: string;
  hora?: string;
  confianza: number;
  camposFaltantes: string[];
  errores?: string[];
}

export function AIReservationModal({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
  businessId,
}: Readonly<AIReservationModalProps>) {
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteExistente, setClienteExistente] = useState<boolean>(false);
  const [isSearchingCliente, setIsSearchingCliente] = useState(false);

  // 🌍 Función utilitaria para formatear fecha sin timezone issues
  const formatDateLocal = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Estados editables para los campos detectados
  const [editableData, setEditableData] = useState({
    clienteNombre: "",
    clienteCedula: "DEFAULT-PHONE", // 🆕 Cédula por defecto
    clienteCorreo: "",
    clienteTelefono: "",
    clienteFechaNacimiento: "", // 🆕 Nuevo campo
    numeroPersonas: "1",
    fecha: selectedDate ? formatDateLocal(selectedDate) : "",
    hora: "",
    promotorId: "",
    promotorNombre: "",
  });

  // ✅ NUEVO: Buscar cliente existente automáticamente cuando IA detecta teléfono
  useEffect(() => {
    const searchExistingCliente = async () => {
      if (!parsedData?.clienteTelefono || parsedData.clienteTelefono.length < 8) {
        return;
      }

      setIsSearchingCliente(true);
      try {
        const response = await fetch(
          `/api/clientes/search?q=${encodeURIComponent(parsedData.clienteTelefono)}`,
          {
            headers: {
              'x-business-id': businessId,
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Error al buscar cliente');
        }

        const data = await response.json();
        
        // El endpoint devuelve un array de clientes
        if (Array.isArray(data) && data.length > 0) {
          // Buscar coincidencia exacta de teléfono
          const clienteExacto = data.find((c: any) => c.telefono === parsedData.clienteTelefono || c.phone === parsedData.clienteTelefono);
          
          if (clienteExacto) {
            setClienteExistente(true);
            
            // Auto-llenar con datos del cliente existente
            // IMPORTANTE: Mantener el teléfono del parsedData original
            const emailCliente = clienteExacto.correo || clienteExacto.email;
            const fechaNacimientoCliente = clienteExacto.fechaNacimiento || clienteExacto.fecha_nacimiento;
            
            setEditableData(prev => ({
              ...prev,
              clienteTelefono: parsedData.clienteTelefono || prev.clienteTelefono, // Asegurar que el teléfono esté presente
              clienteNombre: clienteExacto.nombre,
              clienteCorreo: emailCliente || prev.clienteCorreo,
              clienteFechaNacimiento: fechaNacimientoCliente || prev.clienteFechaNacimiento,
              clienteCedula: clienteExacto.cedula || parsedData.clienteTelefono || 'DEFAULT-PHONE', // Usar cédula existente o teléfono
            }));

            toast.success("✅ Cliente registrado detectado", {
              description: `${clienteExacto.nombre} - Datos auto-completados`,
              duration: 4000,
            });
          } else {
            setClienteExistente(false);
          }
        } else {
          setClienteExistente(false);
        }
      } catch (error) {
        console.error('Error buscando cliente:', error);
        setClienteExistente(false);
      } finally {
        setIsSearchingCliente(false);
      }
    };

    searchExistingCliente();
  }, [parsedData?.clienteTelefono, businessId]);

  const handleAnalyze = async () => {
    if (!inputText.trim() || inputText.trim().length < 10) {
      toast.error("El texto es demasiado corto", {
        description: "Escribe al menos 10 caracteres para analizar",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/reservas/ai-parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ 
          text: inputText,
          businessId: businessId // ✅ Agregar businessId al request
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al analizar el texto");
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error("No se pudo analizar el texto");
      }

      const data = result.data;
      setParsedData(data);

      // Actualizar campos editables con los datos detectados
      setEditableData({
        clienteNombre: data.clienteNombre || "",
        clienteCedula: data.clienteTelefono || "DEFAULT-PHONE", // 🆕 Usar teléfono como cédula por defecto
        clienteCorreo: data.clienteCorreo || "",
        clienteTelefono: data.clienteTelefono || "",
        clienteFechaNacimiento: data.clienteFechaNacimiento || "", // 🆕 Nuevo campo
        numeroPersonas: data.numeroPersonas?.toString() || "1",
        fecha: data.fecha || (selectedDate ? formatDateLocal(selectedDate) : ""),
        hora: data.hora || "",
        promotorId: "",
        promotorNombre: "",
      });

      toast.success("✨ Análisis completado", {
        description: `Confianza: ${Math.round(data.confianza * 100)}% - ${data.camposFaltantes.length} campos por completar`,
      });
    } catch (error) {
      console.error("Error analyzing text:", error);
      toast.error("Error al analizar", {
        description: error instanceof Error ? error.message : "Intenta de nuevo",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateReservation = async () => {
    // Validar campos obligatorios
    const camposFaltantes = [];
    if (!editableData.clienteNombre?.trim()) camposFaltantes.push('Nombre');
    if (!editableData.clienteTelefono?.trim()) camposFaltantes.push('Teléfono');
    if (!editableData.clienteFechaNacimiento?.trim()) camposFaltantes.push('Fecha de Nacimiento');
    // Email es opcional
    if (!editableData.fecha) camposFaltantes.push('Fecha');
    if (!editableData.hora) camposFaltantes.push('Hora');
    if (!editableData.promotorId?.trim()) camposFaltantes.push('Promotor');

    if (camposFaltantes.length > 0) {
      console.error('❌ [SUBMIT] Campos faltantes:', camposFaltantes);
      toast.error("❌ Campos incompletos", {
        description: `Falta completar: ${camposFaltantes.join(', ')}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reservaData = {
        cliente: {
          id: editableData.clienteTelefono, // 🆕 Usar teléfono como ID
          nombre: editableData.clienteNombre,
          email: editableData.clienteCorreo,
          telefono: editableData.clienteTelefono,
          fechaNacimiento: editableData.clienteFechaNacimiento, // 🆕 Incluir fecha de nacimiento
        },
        numeroPersonas: Number.parseInt(editableData.numeroPersonas, 10) || 1,
        razonVisita: "Reserva creada con IA",
        beneficiosReserva: "Sin observaciones",
        promotor: {
          id: editableData.promotorId,
          nombre: editableData.promotorNombre,
        },
        promotorId: editableData.promotorId,
        fecha: editableData.fecha,
        hora: editableData.hora,
        estado: 'En Progreso' as const,
        asistenciaActual: 0,
      };

      await onSubmit(reservaData);
      
      // Limpiar y cerrar
      handleReset();
      onClose();
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error("Error al crear reserva", {
        description: "Por favor intenta de nuevo",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setInputText("");
    setParsedData(null);
    setClienteExistente(false);
    setEditableData({
      clienteNombre: "",
      clienteCedula: "DEFAULT-PHONE",
      clienteCorreo: "",
      clienteTelefono: "",
      clienteFechaNacimiento: "", // 🆕 Incluir nuevo campo
      numeroPersonas: "1",
      fecha: selectedDate ? formatDateLocal(selectedDate) : "",
      hora: "",
      promotorId: "",
      promotorNombre: "",
    });
  };

  const getFieldStatus = (fieldName: string) => {
    if (!parsedData) return null;
    
    const value = editableData[fieldName as keyof typeof editableData];
    if (value && value.trim() !== "") {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    
    if (parsedData.camposFaltantes.includes(fieldName)) {
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    }
    
    return null; // No mostrar nada si el campo está vacío pero no es obligatorio
  };

  const getConfianzaColor = (confianza: number) => {
    if (confianza >= 0.8) return "text-green-600 bg-green-50";
    if (confianza >= 0.5) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getConfianzaText = (confianza: number) => {
    if (confianza >= 0.8) return "Alta";
    if (confianza >= 0.5) return "Media";
    return "Baja";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl max-h-[95vh] overflow-y-auto bg-white p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Nueva Reserva con IA
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Pega el mensaje del cliente y la IA extraerá los datos automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Área de texto para pegar mensaje */}
          <div className="space-y-2">
            <Label htmlFor="aiInput" className="text-sm font-medium text-gray-800">
              📋 Mensaje del Cliente
            </Label>
            <Textarea
              id="aiInput"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pega aquí el mensaje de WhatsApp, email o formulario del cliente...&#10;&#10;Ejemplo:&#10;Hola! Soy Maria Rodriguez&#10;Cedula: 8-987-6543&#10;Email: maria.r@gmail.com&#10;Tel: +507 6234-5678&#10;Quiero reservar para mañana a las 8pm&#10;Somos 4 personas"
              className="min-h-[120px] text-sm"
              disabled={isAnalyzing || !!parsedData}
            />
          </div>

          {/* Botón de analizar */}
          {!parsedData && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || inputText.trim().length < 10}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analizar con IA
                </>
              )}
            </Button>
          )}

          {/* Datos detectados */}
          {parsedData && (
            <>
              <div className={`p-4 rounded-lg border-2 ${getConfianzaColor(parsedData.confianza)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">
                    🎯 Confianza: {Math.round(parsedData.confianza * 100)}%
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfianzaColor(parsedData.confianza)}`}>
                    {getConfianzaText(parsedData.confianza)}
                  </span>
                </div>
                {parsedData.camposFaltantes.length > 0 && (
                  <p className="text-xs">
                    ⚠️ Faltan: {parsedData.camposFaltantes.join(", ")}
                  </p>
                )}
                {parsedData.errores && parsedData.errores.length > 0 && (
                  <p className="text-xs mt-1 text-red-600">
                    ❌ {parsedData.errores.join(", ")}
                  </p>
                )}
              </div>

              {/* Indicador de búsqueda de cliente */}
              {isSearchingCliente && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-700">Buscando cliente en base de datos...</span>
                </div>
              )}

              {/* Banner de cliente existente */}
              {clienteExistente && !isSearchingCliente && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-500 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-700">
                      ✅ Cliente ya registrado
                    </p>
                    <p className="text-xs text-green-600">
                      Datos del cliente detectados automáticamente. Solo completa fecha, hora y promotor.
                    </p>
                  </div>
                </div>
              )}

              {/* Formulario editable */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-900">
                  ✅ Datos Detectados (Editables)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center justify-between">
                      <span>Cédula *</span>
                      {getFieldStatus("Cédula")}
                    </Label>
                    <Input
                      value={editableData.clienteCedula}
                      onChange={(e) => setEditableData({ ...editableData, clienteCedula: e.target.value })}
                      placeholder="0-0000-0000"
                      className={`text-sm ${clienteExistente ? 'bg-green-50 border-green-300' : ''}`}
                      disabled={clienteExistente}
                    />
                    {clienteExistente && (
                      <p className="text-xs text-green-600">✓ Cliente identificado</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm flex items-center justify-between">
                      <span>Nombre Completo *</span>
                      {getFieldStatus("Nombre")}
                    </Label>
                    <Input
                      value={editableData.clienteNombre}
                      onChange={(e) => setEditableData({ ...editableData, clienteNombre: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      className={`text-sm ${clienteExistente ? 'bg-green-50 border-green-300' : ''}`}
                      disabled={clienteExistente}
                    />
                    {clienteExistente && (
                      <p className="text-xs text-green-600">✓ Dato del cliente registrado</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center justify-between">
                      <span>🎂 Fecha de Nacimiento *</span>
                      {getFieldStatus("Fecha de Nacimiento")}
                    </Label>
                    <Input
                      type="date"
                      value={editableData.clienteFechaNacimiento}
                      onChange={(e) => setEditableData({ ...editableData, clienteFechaNacimiento: e.target.value })}
                      className={`text-sm ${clienteExistente ? 'bg-green-50 border-green-300' : ''}`}
                      disabled={clienteExistente}
                    />
                    {clienteExistente && (
                      <p className="text-xs text-green-600">✓ Dato del cliente registrado</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm flex items-center justify-between">
                      <span>Email (opcional)</span>
                      {getFieldStatus("Email")}
                    </Label>
                    <Input
                      type="email"
                      value={editableData.clienteCorreo}
                      onChange={(e) => setEditableData({ ...editableData, clienteCorreo: e.target.value })}
                      placeholder="ejemplo@correo.com"
                      className={`text-sm ${clienteExistente ? 'bg-green-50 border-green-300' : ''}`}
                      disabled={clienteExistente}
                    />
                    {clienteExistente && (
                      <p className="text-xs text-green-600">✓ Dato del cliente registrado</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center justify-between">
                      <span>Fecha *</span>
                      {getFieldStatus("Fecha")}
                    </Label>
                    <Input
                      type="date"
                      value={editableData.fecha}
                      onChange={(e) => setEditableData({ ...editableData, fecha: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm flex items-center justify-between">
                      <span>Hora *</span>
                      {getFieldStatus("Hora")}
                    </Label>
                    <Input
                      type="time"
                      value={editableData.hora}
                      onChange={(e) => setEditableData({ ...editableData, hora: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Personas *
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={editableData.numeroPersonas}
                      onChange={(e) => setEditableData({ ...editableData, numeroPersonas: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <PromotorSearchOnly
                    businessId={businessId}
                    label="Promotor"
                    required={true}
                    onSelect={(promotorId, promotorNombre) => {
                      setEditableData({
                        ...editableData,
                        promotorId: promotorId,
                        promotorNombre: promotorNombre,
                      });
                    }}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Reintentar
                </Button>
                <Button
                  onClick={handleCreateReservation}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Crear Reserva
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
