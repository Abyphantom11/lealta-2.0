'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from '../../components/motion';
import { useRequireAuth } from '../../hooks/useAuth';
import RoleSwitch from '../../components/RoleSwitch';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  User,
  LogOut,
  History,
  TrendingUp,
  Users,
  FileText,
  Clock,
  Award,
  X,
  Zap,
} from 'lucide-react';

// Type for notifications
type NotificationType = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

export default function StaffPage() {
  const { user, loading, logout, isAuthenticated } = useRequireAuth('STAFF');

  // Estados principales
  const [cedula, setCedula] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<NotificationType>(null);
  const [preview, setPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Estados para confirmación de IA
  const [aiResult, setAiResult] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editableData, setEditableData] = useState<{
    empleado: string;
    productos: Array<{ name: string; price: number; line: string }>;
    total: number;
  } | null>(null);

  // Estados para registro manual
  const [modoManual, setModoManual] = useState(false);
  const [empleadoVenta, setEmpleadoVenta] = useState('');
  const [productos, setProductos] = useState<
    Array<{ id: string; nombre: string; cantidad: number }>
  >([{ id: '1', nombre: '', cantidad: 1 }]);
  const [totalManual, setTotalManual] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para UI mejorada (sin cámara)
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({
    ticketsProcessed: 12,
    totalPoints: 256,
    uniqueCustomers: 8,
    totalAmount: 180.5,
  });

  // Referencias para el input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadRecentTickets();
  }, []);

  // Función para buscar información del cliente en la base de datos REAL
  const searchCustomer = async (cedulaValue: string) => {
    if (cedulaValue.length < 6) {
      setCustomerInfo(null);
      return;
    }

    setIsSearchingCustomer(true);
    try {
      // Llamar a la API real de verificación de clientes
      const response = await fetch('/api/cliente/verificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cedula: cedulaValue }),
      });

      if (!response.ok) {
        throw new Error('Error al consultar cliente');
      }

      const data = await response.json();

      if (data.existe && data.cliente) {
        // Cliente encontrado en la base de datos
        const cliente = data.cliente;
        setCustomerInfo({
          cedula: cliente.cedula,
          nombre: cliente.nombre,
          email: null, // La API actual no devuelve email, se puede extender
          telefono: null, // La API actual no devuelve teléfono, se puede extender
          puntos: cliente.puntos || 0,
          nivel: determineCustomerLevel(cliente.puntos || 0),
          ultimaVisita: null, // Se puede agregar a la API si se necesita
          totalGastado: 0, // Se puede calcular desde las transacciones si se necesita
          frecuencia: `${cliente.visitas || 0} visitas registradas`,
        });

        console.log('✅ Cliente encontrado en base de datos:', cliente);
      } else {
        // Cliente no encontrado - nuevo cliente
        setCustomerInfo({
          cedula: cedulaValue,
          nombre: 'Cliente Nuevo',
          email: null,
          telefono: null,
          puntos: 0,
          nivel: 'Bronze',
          ultimaVisita: null,
          totalGastado: 0,
          frecuencia: 'Primera visita',
        });

        console.log('ℹ️ Cliente nuevo - no encontrado en base de datos');
      }
    } catch (error) {
      console.error('❌ Error buscando cliente:', error);
      showNotification('error', 'Error al buscar cliente en la base de datos');
      setCustomerInfo(null);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // Funciones para modo manual
  const agregarProducto = () => {
    const nuevoId = (productos.length + 1).toString();
    setProductos([...productos, { id: nuevoId, nombre: '', cantidad: 1 }]);
  };

  const eliminarProducto = (id: string) => {
    if (productos.length > 1) {
      setProductos(productos.filter(p => p.id !== id));
    }
  };

  const actualizarProducto = (
    id: string,
    campo: 'nombre' | 'cantidad',
    valor: string | number
  ) => {
    setProductos(
      productos.map(p => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  };

  const submitConsumoManual = async () => {
    if (
      !cedula ||
      !empleadoVenta ||
      !totalManual ||
      productos.some(p => !p.nombre.trim())
    ) {
      showNotification(
        'error',
        'Por favor completa todos los campos requeridos'
      );
      return;
    }

    if (!customerInfo) {
      showNotification('error', 'Primero debes buscar y verificar el cliente');
      return;
    }

    setIsSubmitting(true);

    try {
      const consumoData = {
        cedula: cedula,
        empleadoVenta: empleadoVenta,
        productos: productos.filter(p => p.nombre.trim()),
        totalManual: parseFloat(totalManual),
      };

      const response = await fetch('/api/staff/consumo/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consumoData),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          'success',
          `✅ Consumo registrado: $${data.data.total} - ${data.data.cliente.puntosNuevos} puntos`
        );

        // Limpiar formulario
        setEmpleadoVenta('');
        setProductos([{ id: '1', nombre: '', cantidad: 1 }]);
        setTotalManual('');
        setCedula('');
        setCustomerInfo(null);

        // Recargar tickets recientes y estadísticas en tiempo real
        loadRecentTickets();

        // Agregar el nuevo ticket a la lista local inmediatamente para feedback inmediato
        const nuevoTicket = {
          id: Date.now(),
          cedula: data.data.cliente.nombre,
          cliente: data.data.cliente.nombre,
          monto: data.data.total,
          puntos: data.data.cliente.puntosNuevos,
          hora: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          items: data.data.productos.map((p: any) => p.nombre),
          tipo: 'MANUAL',
        };

        setRecentTickets(prev => [nuevoTicket, ...prev.slice(0, 4)]);
      } else {
        showNotification('error', `Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error registrando consumo:', error);
      showNotification('error', 'Error de conexión al registrar consumo');
    } finally {
      setIsSubmitting(false);
    }
  };
  const determineCustomerLevel = (
    puntos: number
  ): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' => {
    if (puntos >= 500) return 'Platinum';
    if (puntos >= 300) return 'Gold';
    if (puntos >= 100) return 'Silver';
    return 'Bronze';
  };

  // Función para cargar tickets recientes desde la API
  const loadRecentTickets = async () => {
    try {
      const response = await fetch('/api/admin/estadisticas?periodo=today');
      const data = await response.json();

      if (data.success && data.estadisticas.consumosRecientes) {
        const ticketsFormateados = data.estadisticas.consumosRecientes
          .slice(0, 5)
          .map((consumo: any) => ({
            id: consumo.id,
            cedula: consumo.cliente.cedula,
            cliente: consumo.cliente.nombre,
            monto: consumo.total,
            puntos: consumo.puntos,
            hora: new Date(consumo.fecha).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            items: Array.isArray(consumo.productos)
              ? consumo.productos.map((p: any) => p.nombre)
              : ['Productos procesados'],
            tipo: consumo.tipo,
          }));

        setRecentTickets(ticketsFormateados);

        // Actualizar estadísticas del día también
        const stats = data.estadisticas.resumen;
        setTodayStats({
          ticketsProcessed: stats.totalConsumos,
          totalPoints: stats.totalPuntos,
          uniqueCustomers: stats.clientesUnicos,
          totalAmount: stats.totalMonto,
        });
      }
    } catch (error) {
      console.error('Error loading recent tickets:', error);
      // Mantener datos mock como fallback
      setRecentTickets([]);
    }
  };

  // Función para abrir la herramienta de recorte de Windows
  const openSnippingTool = () => {
    showNotification(
      'info',
      '💡 Presiona Win + Shift + S para abrir la herramienta de recorte, captura tu POS y luego sube la imagen aquí'
    );

    // Mostrar instrucciones adicionales en la consola para debugging
    console.log('Instrucciones para captura:');
    console.log('1. Presiona Win + Shift + S');
    console.log('2. Selecciona el área de la cuenta en tu POS');
    console.log('3. La captura se guarda en el portapapeles');
    console.log('4. Pégala en Paint o guárdala como archivo');
    console.log('5. Usa "Subir Captura" para cargar la imagen');
  };

  // Estado para capturas automáticas
  const [isWaitingForCapture, setIsWaitingForCapture] = useState(false);
  const [captureStartTime, setCaptureStartTime] = useState<number>(0);
  const [lastClipboardCheck, setLastClipboardCheck] = useState<string | null>(
    null
  );

  // Función para abrir herramienta de recorte y esperar captura
  const startAutomaticCapture = async () => {
    if (isWaitingForCapture) {
      // Si ya está esperando, cancelar
      setIsWaitingForCapture(false);
      setCaptureStartTime(0);
      setLastClipboardCheck(null);
      showNotification('info', '❌ Captura automática cancelada');
      return;
    }

    // Iniciar proceso de captura
    setIsWaitingForCapture(true);
    setCaptureStartTime(Date.now());
    setLastClipboardCheck(null);

    // Mostrar instrucciones claras
    showNotification(
      'info',
      '🎯 Modo captura activo. Ve a tu POS y usa Win + Shift + S. Luego regresa a Lealta'
    );

    // Instrucciones detalladas en consola
    console.log('=== CAPTURA AUTOMÁTICA INICIADA ===');
    console.log('1. Ve a tu sistema POS');
    console.log('2. Presiona Win + Shift + S');
    console.log('3. Selecciona el área de la cuenta');
    console.log('4. REGRESA A LEALTA para que se detecte');
    console.log('IMPORTANTE: Debes regresar a Lealta después de capturar');

    // Timeout de 5 minutos para dar tiempo suficiente
    setTimeout(() => {
      if (isWaitingForCapture) {
        setIsWaitingForCapture(false);
        setCaptureStartTime(0);
        setLastClipboardCheck(null);
        showNotification(
          'info',
          '⏰ Tiempo de captura expirado. Inténtalo de nuevo'
        );
      }
    }, 300000); // 5 minutos
  };

  // Función para detectar cuando el usuario regresa a la ventana
  const handleWindowFocus = async () => {
    if (!isWaitingForCapture) return;

    console.log('👀 Ventana enfocada - verificando portapapeles...');

    // Esperar un momento para que el portapapeles se actualice
    setTimeout(async () => {
      await checkClipboardForImage();
    }, 500);
  };

  // Agregar listener para cuando la ventana gana foco
  useEffect(() => {
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isWaitingForCapture, handleWindowFocus]);

  // Función para verificar si debe procesar la imagen
  const shouldProcessImage = (
    currentTime: number,
    currentClipboardId: string
  ): boolean => {
    const timeCondition = currentTime > captureStartTime + 2000; // 2 segundos mínimo
    const newImageCondition = currentClipboardId !== lastClipboardCheck;
    return timeCondition && newImageCondition;
  };

  // Función para procesar la imagen capturada
  const processClipboardImage = async (blob: Blob, currentTime: number) => {
    const file = new File([blob], `captura-pos-${currentTime}.png`, {
      type: blob.type,
    });

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Finalizar proceso
    setIsWaitingForCapture(false);
    setCaptureStartTime(0);
    setLastClipboardCheck(null);

    showNotification('success', '🎉 ¡Captura del POS detectada y cargada!');
    console.log('✅ Captura procesada exitosamente');
  };

  // Función para leer imagen del portapapeles
  const checkClipboardForImage = async () => {
    if (!isWaitingForCapture) return false;

    try {
      if (!navigator.clipboard?.read) {
        console.log('API del portapapeles no disponible');
        return false;
      }

      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);

            // Crear un hash simple del blob para detectar cambios
            const blobText = await blob
              .text()
              .catch(() => blob.size.toString());
            const currentClipboardId = `${blob.size}-${blob.type}-${blobText.slice(0, 50)}`;
            const currentTime = Date.now();

            if (shouldProcessImage(currentTime, currentClipboardId)) {
              setLastClipboardCheck(currentClipboardId);
              await processClipboardImage(blob, currentTime);
              return true;
            } else if (currentClipboardId === lastClipboardCheck) {
              console.log(
                '📎 Misma imagen en portapapeles, esperando nueva captura...'
              );
            } else {
              console.log('⏳ Esperando tiempo mínimo antes de procesar...');
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error leyendo portapapeles:', error);
      return false;
    }
  };

  // Función para mostrar notificaciones
  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      showNotification('info', 'Captura cargada exitosamente');
    } else {
      showNotification(
        'error',
        'Por favor selecciona un archivo de imagen válido para la captura'
      );
    }
  };

  // Debounce timer para la búsqueda automática
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleCedulaChange = (value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/\D/g, '');
    setCedula(numericValue);

    // Limpiar timer anterior
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // Si hay menos de 4 dígitos, limpiar info del cliente
    if (numericValue.length < 4) {
      setCustomerInfo(null);
      setIsSearchingCustomer(false);
      return;
    }

    // Buscar automáticamente después de 500ms de pausa en escritura
    if (numericValue.length >= 4) {
      setIsSearchingCustomer(true);
      const newTimer = setTimeout(() => {
        searchCustomer(numericValue);
      }, 500);
      setSearchTimer(newTimer);
    }
  };

  // Limpiar timer al desmontar componente
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !cedula) {
      showNotification(
        'error',
        'Por favor complete todos los campos requeridos'
      );
      return;
    }

    if (cedula.length < 6) {
      showNotification('error', 'La cédula debe tener al menos 6 dígitos');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('cedula', cedula);
      formData.append('locationId', 'default-location');
      formData.append('empleadoId', 'current-user-id'); // In real app, get from session

      const response = await fetch('/api/staff/consumo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // En lugar de guardar directamente, mostrar confirmación
        setAiResult(data);
        setEditableData({
          empleado: data.empleadoDetectado || 'No detectado',
          productos: data.productos || [],
          total: data.total || 0,
        });
        setShowConfirmation(true);
        showNotification('info', '🤖 IA procesó el ticket. Revisa y confirma los datos.');
      } else {
        showNotification('error', `Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      showNotification(
        'error',
        'Error de conexión: No se pudo procesar la solicitud'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Funciones para confirmación de IA
  const confirmarDatosIA = async () => {
    if (!editableData || !aiResult) return;

    setIsProcessing(true);
    try {
      // Crear el consumo con los datos confirmados/editados
      const consumoData = {
        cedula: cedula,
        empleadoVenta: editableData.empleado,
        productos: editableData.productos.map((p, index) => ({
          id: String(index + 1),
          nombre: p.name,
          cantidad: 1,
          precio: p.price,
        })),
        totalManual: editableData.total,
        ocrText: aiResult.ocrText,
        ticketImageUrl: aiResult.ticketImageUrl,
      };

      const response = await fetch('/api/staff/consumo/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consumoData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        showNotification('success', '✅ Consumo confirmado y registrado');

        // Actualizar estadísticas del día
        setTodayStats(prev => ({
          ...prev,
          ticketsProcessed: prev.ticketsProcessed + 1,
          totalPoints: prev.totalPoints + (data.puntos || 0),
          totalAmount: prev.totalAmount + (editableData.total || 0),
        }));

        // Agregar a tickets recientes
        const newTicket = {
          id: Date.now(),
          cedula,
          cliente: customerInfo?.nombre || 'Cliente',
          monto: editableData.total || 0,
          puntos: data.puntos || 0,
          hora: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          items: editableData.productos?.map((p: any) => p.name) || [],
        };
        setRecentTickets(prev => [newTicket, ...prev.slice(0, 4)]);

        // Limpiar formulario después de confirmación exitosa
        resetFormularioOCR();
      } else {
        showNotification('error', `Error al confirmar: ${data.error}`);
      }
    } catch (error) {
      console.error('Error confirmando datos:', error);
      showNotification('error', 'Error de conexión al confirmar');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelarConfirmacion = () => {
    setShowConfirmation(false);
    setAiResult(null);
    setEditableData(null);
    setIsProcessing(false);
    showNotification('info', 'Confirmación cancelada. Puedes capturar otra imagen.');
  };

  const resetFormularioOCR = () => {
    setCedula('');
    setSelectedFile(null);
    setPreview('');
    setCustomerInfo(null);
    setShowConfirmation(false);
    setAiResult(null);
    setEditableData(null);
  };

  const actualizarDatoEditable = (campo: string, valor: any) => {
    if (!editableData) return;
    
    setEditableData({
      ...editableData,
      [campo]: valor,
    });
  };

  const actualizarProductoEditable = (index: number, campo: string, valor: any) => {
    if (!editableData) return;
    
    const nuevosProductos = [...editableData.productos];
    nuevosProductos[index] = {
      ...nuevosProductos[index],
      [campo]: valor,
    };
    
    // Recalcular total automáticamente
    const nuevoTotal = nuevosProductos.reduce((sum, p) => sum + (p.price || 0), 0);
    
    setEditableData({
      ...editableData,
      productos: nuevosProductos,
      total: nuevoTotal,
    });
  };

  const eliminarProductoEditable = (index: number) => {
    if (!editableData || editableData.productos.length <= 1) return;
    
    const nuevosProductos = editableData.productos.filter((_, i) => i !== index);
    const nuevoTotal = nuevosProductos.reduce((sum, p) => sum + (p.price || 0), 0);
    
    setEditableData({
      ...editableData,
      productos: nuevosProductos,
      total: nuevoTotal,
    });
  };

  const agregarProductoEditable = () => {
    if (!editableData) return;
    
    setEditableData({
      ...editableData,
      productos: [
        ...editableData.productos,
        { name: '', price: 0, line: 'Agregado manualmente' }
      ],
    });
  };

  const getNotificationClasses = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'info':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getCustomerLevelClasses = (nivel: string) => {
    switch (nivel) {
      case 'Gold':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Silver':
        return 'bg-gray-500/20 text-gray-400';
      case 'Bronze':
      default:
        return 'bg-amber-600/20 text-amber-400';
    }
  };

  // Mostrar loading mientras se verifica autenticación
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          <p className="text-white mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      {/* Notification Component */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 max-w-sm ${getNotificationClasses(notification.type)}`}
        >
          {notification.type === 'success' && (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {notification.type === 'error' && (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {notification.type === 'info' && (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-white hover:text-gray-200 text-lg leading-none"
          >
            ×
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-dark-900/50 backdrop-blur-sm border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-500/10 p-3 rounded-lg">
                <FileText className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Panel Staff</h1>
                <p className="text-dark-400">
                  Procesar tickets y gestionar clientes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <RoleSwitch currentRole="STAFF" currentPath="/staff" />
              <div className="flex items-center space-x-3 bg-dark-800/50 px-4 py-2 rounded-lg">
                <User className="w-5 h-5 text-primary-400" />
                <span className="text-white font-medium">
                  {user?.name || 'Staff'}
                </span>
                <button
                  onClick={logout}
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Selector de modo */}
        <div className="flex justify-center mb-8">
          <div className="bg-dark-800/50 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setModoManual(false)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                !modoManual
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              📸 Captura OCR
            </button>
            <button
              onClick={() => setModoManual(true)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                modoManual
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              ✍️ Registro Manual
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Tickets Hoy</p>
                <p className="text-2xl font-bold text-white">
                  {todayStats.ticketsProcessed}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Puntos Dados</p>
                <p className="text-2xl font-bold text-white">
                  {todayStats.totalPoints}
                </p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Clientes</p>
                <p className="text-2xl font-bold text-white">
                  {todayStats.uniqueCustomers}
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Total Ventas</p>
                <p className="text-2xl font-bold text-white">
                  ${todayStats.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            {!modoManual ? (
              // Modo OCR (existente)
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Camera className="w-6 h-6 mr-2 text-primary-400" />
                  Procesar Cuenta del POS
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Input Cédula */}
                  <div>
                    <label
                      htmlFor="cedula"
                      className="block text-sm font-medium text-dark-300 mb-2"
                    >
                      Cédula del Cliente
                    </label>
                    <div className="relative">
                      <input
                        id="cedula"
                        type="text"
                        value={cedula}
                        onChange={e => handleCedulaChange(e.target.value)}
                        placeholder="Ingrese la cédula..."
                        className="w-full p-4 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        maxLength={12}
                      />
                      {isSearchingCustomer && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info del Cliente */}
                  <AnimatePresence>
                    {customerInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-dark-700/50 border border-dark-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-white">
                            {customerInfo.nombre}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCustomerLevelClasses(customerInfo.nivel)}`}
                          >
                            {customerInfo.nivel}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-dark-400">
                              Puntos Actuales:
                            </span>
                            <span className="text-yellow-400 font-medium ml-2">
                              {customerInfo.puntos}
                            </span>
                          </div>
                          <div>
                            <span className="text-dark-400">
                              Total Gastado:
                            </span>
                            <span className="text-green-400 font-medium ml-2">
                              ${customerInfo.totalGastado}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-dark-400">Estado:</span>
                            <span className="text-blue-400 font-medium ml-2">
                              {customerInfo.frecuencia}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Captura de Pantalla del POS */}
                  <div>
                    <span className="block text-sm font-medium text-dark-300 mb-4">
                      Captura de la Cuenta del POS
                    </span>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-300">
                          <p className="font-medium mb-1">
                            🚀 Captura Automática - Flujo Optimizado
                          </p>
                          <ul className="space-y-1 text-xs">
                            <li>
                              • <strong>Paso 1:</strong> Haz clic en "Captura
                              Automática Inteligente"
                            </li>
                            <li>
                              • <strong>Paso 2:</strong> Ve a tu sistema POS
                            </li>
                            <li>
                              • <strong>Paso 3:</strong> Presiona{' '}
                              <kbd className="px-1 py-0.5 bg-blue-600/20 rounded">
                                Win + Shift + S
                              </kbd>{' '}
                              y captura la cuenta
                            </li>
                            <li>
                              • <strong>Paso 4:</strong>{' '}
                              <span className="text-yellow-300 font-medium">
                                ¡REGRESA A LEALTA!
                              </span>
                            </li>
                            <li>
                              • <strong>¡AUTOMÁTICO!</strong> La imagen se
                              detecta al regresar 🎉
                            </li>
                          </ul>
                          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300">
                            <strong>💡 Importante:</strong> Debes regresar a
                            Lealta después de capturar para que se detecte
                            automáticamente.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Captura */}
                    <div className="space-y-4 mb-4">
                      {/* Botón de Captura Automática Mejorada */}
                      <button
                        type="button"
                        onClick={startAutomaticCapture}
                        className={`w-full flex items-center justify-center space-x-2 p-4 rounded-lg transition-all ${
                          isWaitingForCapture
                            ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {isWaitingForCapture ? (
                          <>
                            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                            <span>🎯 Esperando Captura del POS...</span>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">
                              Regresa después de capturar
                            </span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            <span>🚀 Captura Automática Inteligente</span>
                          </>
                        )}
                      </button>

                      {/* Botones tradicionales */}
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={openSnippingTool}
                          className="flex-1 flex items-center justify-center space-x-2 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                        >
                          <Camera className="w-5 h-5" />
                          <span>Win + Shift + S</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center space-x-2 p-4 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                        >
                          <Upload className="w-5 h-5" />
                          <span>Subir Captura</span>
                        </button>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Preview */}
                    {preview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-dark-700 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={preview}
                          alt="Preview"
                          width={400}
                          height={256}
                          className="w-full h-64 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreview('');
                            setSelectedFile(null);
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                          ✓ Captura Lista
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing || !selectedFile || !cedula}
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-dark-700 disabled:to-dark-700 disabled:text-dark-400 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Procesar Ticket</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              // Modo Manual (nuevo)
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-primary-400" />
                  Registro Manual de Consumo
                </h2>

                <div className="space-y-6">
                  {/* Input Cédula */}
                  <div>
                    <label
                      htmlFor="cedula-manual"
                      className="block text-sm font-medium text-dark-300 mb-2"
                    >
                      Cédula del Cliente *
                    </label>
                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <input
                          id="cedula-manual"
                          type="text"
                          value={cedula}
                          onChange={e => handleCedulaChange(e.target.value)}
                          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Ingrese la cédula (búsqueda automática)"
                          maxLength={12}
                          required
                        />
                        {isSearchingCustomer && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => searchCustomer(cedula)}
                        disabled={isSearchingCustomer || !cedula}
                        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        {isSearchingCustomer ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Buscando...</span>
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4" />
                            <span>Buscar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Info del Cliente */}
                  <AnimatePresence>
                    {customerInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-dark-700/50 border border-dark-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-white">
                            {customerInfo.nombre}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCustomerLevelClasses(customerInfo.nivel)}`}
                          >
                            {customerInfo.nivel}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-dark-400">
                              Puntos Actuales:
                            </span>
                            <span className="text-yellow-400 font-medium ml-2">
                              {customerInfo.puntos}
                            </span>
                          </div>
                          <div>
                            <span className="text-dark-400">
                              Total Gastado:
                            </span>
                            <span className="text-green-400 font-medium ml-2">
                              ${customerInfo.totalGastado}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Empleado POS */}
                  <div>
                    <label
                      htmlFor="empleado-pos"
                      className="block text-sm font-medium text-dark-300 mb-2"
                    >
                      Empleado del POS (quien hizo la venta) *
                    </label>
                    <input
                      id="empleado-pos"
                      type="text"
                      value={empleadoVenta}
                      onChange={e => setEmpleadoVenta(e.target.value)}
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nombre del empleado POS"
                      required
                    />
                  </div>

                  {/* Productos */}
                  <div>
                    <label
                      htmlFor="productos-manual"
                      className="block text-sm font-medium text-dark-300 mb-2"
                    >
                      Productos Consumidos *
                    </label>
                    <div className="space-y-3">
                      {productos.map((producto) => (
                        <div
                          key={producto.id}
                          className="flex space-x-3 items-center"
                        >
                          <div className="flex-1">
                            <input
                              type="text"
                              value={producto.nombre}
                              onChange={e =>
                                actualizarProducto(
                                  producto.id,
                                  'nombre',
                                  e.target.value
                                )
                              }
                              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Nombre del producto"
                              required
                            />
                          </div>
                          <div className="w-20">
                            <input
                              type="number"
                              min="1"
                              value={producto.cantidad}
                              onChange={e =>
                                actualizarProducto(
                                  producto.id,
                                  'cantidad',
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          {productos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => eliminarProducto(producto.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={agregarProducto}
                        className="w-full py-2 border-2 border-dashed border-dark-600 rounded-lg text-dark-400 hover:text-white hover:border-primary-500 transition-colors"
                      >
                        + Agregar Producto
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div>
                    <label
                      htmlFor="total-manual"
                      className="block text-sm font-medium text-dark-300 mb-2"
                    >
                      Total de la Cuenta *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
                        $
                      </span>
                      <input
                        id="total-manual"
                        type="number"
                        step="0.01"
                        min="0"
                        value={totalManual}
                        onChange={e => setTotalManual(e.target.value)}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-8 pr-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Botón Guardar */}
                  <button
                    type="button"
                    onClick={submitConsumoManual}
                    disabled={
                      isSubmitting ||
                      !cedula ||
                      !empleadoVenta ||
                      !totalManual ||
                      productos.some(p => !p.nombre.trim())
                    }
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Guardar Consumo</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Tickets Recientes y Resultado */}
          <div className="space-y-6">
            {/* Resultado */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      ✅ Procesado
                    </h3>
                    <button
                      onClick={() => setResult(null)}
                      className="text-dark-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Total:</span>
                      <span className="text-white font-semibold">
                        ${result.total}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Puntos ganados:</span>
                      <span className="text-yellow-400 font-semibold">
                        +{result.puntos}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Estado:</span>
                      <span className="text-green-400">Completado</span>
                    </div>
                  </div>

                  {result.productos && result.productos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-green-500/20">
                      <h4 className="text-sm font-medium text-dark-300 mb-2">
                        Productos detectados:
                      </h4>
                      <div className="space-y-1">
                        {result.productos.map((item: any, index: number) => (
                          <div
                            key={`${item.name || 'producto'}-${index}`}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-dark-400">
                              {item.name || `Producto ${index + 1}`}
                            </span>
                            <span className="text-white">
                              ${item.price || 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tickets Recientes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <History className="w-5 h-5 mr-2 text-primary-400" />
                Tickets Recientes
              </h3>

              <div className="space-y-3">
                {recentTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="bg-dark-700/50 border border-dark-600 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">
                            {ticket.cliente}
                          </p>
                          {ticket.tipo && (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                ticket.tipo === 'MANUAL'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-green-500/20 text-green-400'
                              }`}
                            >
                              {ticket.tipo}
                            </span>
                          )}
                        </div>
                        <p className="text-dark-400 text-sm">{ticket.cedula}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">
                          $
                          {typeof ticket.monto === 'number'
                            ? ticket.monto.toFixed(2)
                            : ticket.monto}
                        </p>
                        <p className="text-yellow-400 text-sm">
                          +{ticket.puntos} pts
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-dark-400 text-xs">
                        {ticket.items.slice(0, 2).join(', ')}
                      </p>
                      <p className="text-dark-400 text-xs">{ticket.hora}</p>
                    </div>
                  </div>
                ))}

                {recentTickets.length === 0 && (
                  <div className="text-center py-8 text-dark-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay tickets procesados hoy</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Instrucciones */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-warning-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-dark-300">
                  <p className="font-medium text-white mb-2">Instrucciones:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Verificar la cédula del cliente</li>
                    <li>Mostrar la cuenta en tu POS</li>
                    <li>Capturar pantalla de la cuenta completa</li>
                    <li>Procesar ANTES del pago</li>
                    <li>Confirmar total con el cliente</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Vista de confirmación de IA */}
      {showConfirmation && editableData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-amber-400" />
              🤖 Revisar Datos Detectados por IA
            </h3>
            <button
              onClick={cancelarConfirmacion}
              className="text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 mb-4">
            <p className="text-amber-300 text-sm">
              ⚠️ La IA procesó el ticket. <strong>Revisa los datos antes de confirmar</strong> para asegurar precisión.
            </p>
          </div>

          <div className="space-y-4">
            {/* Empleado detectado */}
            <div>
              <label htmlFor="empleado-detectado" className="block text-sm font-medium text-dark-300 mb-2">
                Empleado del POS
              </label>
              <input
                id="empleado-detectado"
                type="text"
                value={editableData.empleado}
                onChange={(e) => actualizarDatoEditable('empleado', e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Corrige el nombre si es necesario"
              />
            </div>

            {/* Productos detectados */}
            <div>
              <label htmlFor="productos-detectados" className="block text-sm font-medium text-dark-300 mb-2">
                Productos Detectados
              </label>
              <div id="productos-detectados" className="space-y-2">
                {editableData.productos.map((producto, index) => (
                  <div key={`producto-${index}-${producto.name}`} className="flex space-x-2 items-center bg-dark-700/50 rounded-lg p-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={producto.name}
                        onChange={(e) => actualizarProductoEditable(index, 'name', e.target.value)}
                        className="w-full bg-dark-800 border border-dark-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Nombre del producto"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        value={producto.price}
                        onChange={(e) => actualizarProductoEditable(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full bg-dark-800 border border-dark-600 rounded px-3 py-2 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Precio"
                      />
                    </div>
                    {editableData.productos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarProductoEditable(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={agregarProductoEditable}
                  className="w-full py-2 border-2 border-dashed border-amber-500/30 rounded-lg text-amber-400 hover:text-amber-300 hover:border-amber-500/50 transition-colors text-sm"
                >
                  + Agregar Producto
                </button>
              </div>
            </div>

            {/* Total detectado */}
            <div>
              <label htmlFor="total-detectado" className="block text-sm font-medium text-dark-300 mb-2">
                Total Detectado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">$</span>
                <input
                  id="total-detectado"
                  type="number"
                  step="0.01"
                  value={editableData.total}
                  onChange={(e) => actualizarDatoEditable('total', parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-8 pr-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-dark-400 mt-1">
                Puntos a otorgar: <span className="text-yellow-400 font-medium">{Math.floor(editableData.total * 2)}</span>
              </p>
            </div>
          </div>

          {/* Botones de confirmación */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={confirmarDatosIA}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Confirmando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>✅ Confirmar y Registrar</span>
                </>
              )}
            </button>
            <button
              onClick={cancelarConfirmacion}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <X className="w-5 h-5" />
              <span>❌ Cancelar</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
