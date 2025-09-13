// ========================================
// 📦 SECCIÓN: IMPORTS Y DEPENDENCIAS (1-18)
// ========================================
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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

// ========================================
// 🔧 SECCIÓN: INTERFACES Y TIPOS (19-100)
// ========================================

// Type for notifications
type NotificationType = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

// Types for customer info
interface CustomerInfo {
  id: string;
  nombre: string;
  cedula: string;
  puntos: number;
  email?: string;
  telefono?: string;
  nivel?: string;
  totalGastado?: number;
  frecuencia?: string;
  ultimaVisita?: string | null;
}

// Types for product data
interface Product {
  id?: string;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria?: string;
  name?: string; // Para compatibilidad con diferentes formatos
  price?: number; // Para compatibilidad con diferentes formatos
}

interface EditableProduct {
  name: string;
  price: number;
  line: string;
}

// Types for AI analysis results
interface AnalysisProduct {
  nombre: string;
  precio: number;
  cantidad: number;
  categoria?: string;
}

interface AIAnalysis {
  empleadoDetectado: string;
  productos: AnalysisProduct[];
  total: number;
  confianza: number;
}

interface AIResult {
  cliente: {
    id: string;
    nombre: string;
    cedula: string;
    puntos: number;
  };
  analisis: AIAnalysis;
  metadata: {
    businessId: string;
    empleadoId: string;
    imagenUrl: string;
  };
}

// Types for recent tickets and stats
interface RecentTicket {
  id: string;
  cliente: string;
  cedula: string;
  productos: string[];
  total: number;
  puntos: number;
  fecha: string;
  monto: number;
  items: string[];
  hora: string;
  tipo?: string;
}

interface TodayStats {
  ticketsProcessed: number;
  totalPoints: number;
  uniqueCustomers: number;
  totalAmount: number;
}

// Types for consumption data
interface ConsumoData {
  id?: string;
  cliente:
    | string
    | {
        cedula: string;
        nombre: string;
      };
  cedula: string;
  productos: Product[];
  total: number;
  puntos: number;
  fecha: string;
  tipo?: string;
}

export default function StaffPage() {
  const { user, loading, logout, isAuthenticated } = useRequireAuth('STAFF');

  // ========================================
  // 🎛️ SECCIÓN: ESTADOS PRINCIPALES (135-200)
  // ========================================

  // Estados principales
  const [cedula, setCedula] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<NotificationType>(null);
  const [preview, setPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ConsumoData | null>(null);

  // Estados para confirmación de IA
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editableData, setEditableData] = useState<{
    empleado: string;
    productos: EditableProduct[];
    total: number;
  } | null>(null);

  // Función para mostrar notificaciones
  const showNotification = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 5000);
    },
    []
  );

  // Estados para registro manual
  const [modoManual, setModoManual] = useState(false);
  const [empleadoVenta, setEmpleadoVenta] = useState('');
  const [productos, setProductos] = useState<
    Array<{ id: string; nombre: string; cantidad: number }>
  >([{ id: '1', nombre: '', cantidad: 1 }]);
  const [totalManual, setTotalManual] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para configuración de puntos
  const [puntosPorDolar, setPuntosPorDolar] = useState(4); // Valor por defecto

  // Estados para UI mejorada (sin cámara)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    ticketsProcessed: 12,
    totalPoints: 256,
    uniqueCustomers: 8,
    totalAmount: 180.5,
  });

  // Referencias para el input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug para el cuadro de confirmación
  useEffect(() => {
    console.log('🎨 Estado de confirmación cambió:', {
      showConfirmation,
      editableData,
    });
  }, [showConfirmation, editableData]);

  // ========================================
  // 🔍 SECCIÓN: FUNCIONES DE BÚSQUEDA Y CLIENTE (202-300)
  // ========================================

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
          id: cliente.cedula, // Usar cédula como ID
          cedula: cliente.cedula,
          nombre: cliente.nombre,
          email: undefined, // La API actual no devuelve email, se puede extender
          telefono: undefined, // La API actual no devuelve teléfono, se puede extender
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
          id: cedulaValue, // Usar cédula como ID
          cedula: cedulaValue,
          nombre: 'Cliente Nuevo',
          email: undefined,
          telefono: undefined,
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
        const nuevoTicket: RecentTicket = {
          id: Date.now().toString(),
          cedula: data.data.cliente.cedula || '',
          cliente: data.data.cliente.nombre || '',
          productos: data.data.productos.map((p: Product) => p.nombre),
          total: data.data.total,
          puntos: data.data.cliente.puntosNuevos,
          fecha: new Date().toISOString().split('T')[0],
          monto: data.data.total,
          items: data.data.productos.map((p: Product) => p.nombre),
          hora: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
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

  // ========================================
  // 🔧 SECCIÓN: FUNCIONES AUXILIARES (375-450)
  // ========================================

  const determineCustomerLevel = (
    puntos: number
  ): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' => {
    if (puntos >= 500) return 'Platinum';
    if (puntos >= 300) return 'Gold';
    if (puntos >= 100) return 'Silver';
    return 'Bronze';
  };

  // Función para cargar tickets recientes desde la API
  const loadRecentTickets = useCallback(async () => {
    try {
      console.log('🔄 Cargando estadísticas desde API...');
      const response = await fetch('/api/admin/estadisticas?periodo=today');
      const data = await response.json();

      console.log('📊 Respuesta de estadísticas:', {
        success: data.success,
        hasEstadisticas: !!data.estadisticas,
        hasConsumos: !!data.estadisticas?.consumosRecientes,
        resumen: data.estadisticas?.resumen
      });

      if (data.success && data.estadisticas) {
        // Actualizar estadísticas del día
        const stats = data.estadisticas.resumen;
        const newStats = {
          ticketsProcessed: stats.totalConsumos || 0,
          totalPoints: stats.totalPuntos || 0,
          uniqueCustomers: stats.clientesUnicos || 0,
          totalAmount: stats.totalMonto || 0,
        };
        
        setTodayStats(newStats);

        // Solo actualizar tickets recientes si existen
        if (data.estadisticas.consumosRecientes && data.estadisticas.consumosRecientes.length > 0) {
        const ticketsFormateados = data.estadisticas.consumosRecientes
          .slice(0, 5)
          .map((consumo: ConsumoData) => ({
            id: consumo.id,
            cedula:
              typeof consumo.cliente === 'object'
                ? consumo.cliente.cedula
                : consumo.cedula,
            cliente:
              typeof consumo.cliente === 'object'
                ? consumo.cliente.nombre
                : consumo.cliente,
            monto: consumo.total,
            puntos: consumo.puntos,
            hora: new Date(consumo.fecha).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            items: Array.isArray(consumo.productos)
              ? consumo.productos.map((p: Product) => p.nombre)
              : ['Productos procesados'],
            tipo: consumo.tipo,
          }));

        setRecentTickets(ticketsFormateados);
        } else {
          setRecentTickets([]);
        }
      } else {
        console.warn('⚠️ No se pudieron cargar estadísticas:', data);
        // Mantener valores por defecto si no hay datos
      }
    } catch (error) {
      console.error('❌ Error loading recent tickets:', error);
      // Mantener datos mock como fallback pero con logs para debug
      console.log('📊 Manteniendo valores por defecto del staff');
      setRecentTickets([]);
    }
  }, []);

  // Función para cargar configuración de puntos
  const loadPuntosConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/puntos');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.puntosPorDolar) {
          setPuntosPorDolar(data.data.puntosPorDolar);
          console.log('✅ Configuración de puntos cargada en staff desde API:', data.data.puntosPorDolar);
        }
      }
    } catch (error) {
      console.error('⚠️ Error cargando configuración de puntos desde API, usando valor por defecto:', error);
      // Mantener valor por defecto de 4
    }
  }, []);

  // Efecto para cargar datos iniciales (movido después de las declaraciones de funciones)
  useEffect(() => {
    loadRecentTickets();
    loadPuntosConfig();
  }, [loadRecentTickets, loadPuntosConfig]);

  // Función para mostrar instrucciones de captura optimizadas
  const openSnippingTool = () => {
    showNotification(
      'info',
      '💡 Usa Win + PrtScr para captura automática, o Win + Shift + S para seleccionar área específica'
    );

    // Mostrar instrucciones mejoradas en la consola
    console.log('=== INSTRUCCIONES DE CAPTURA OPTIMIZADAS ===');
    console.log('🚀 MÉTODO RÁPIDO (Recomendado):');
    console.log('1. Ve a tu POS');
    console.log('2. Presiona Win + Print Screen');
    console.log('3. ¡LISTO! Se guarda automáticamente');
    console.log('4. Regresa a Lealta y pega con Ctrl+V');
    console.log('');
    console.log('📐 MÉTODO PRECISIÓN (Área específica):');
    console.log('1. Presiona Win + Shift + S');
    console.log('2. Selecciona el área del ticket en tu POS');
    console.log('3. Regresa a Lealta y pega con Ctrl+V');
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

    // Mostrar instrucciones mejoradas
    showNotification(
      'info',
      '🎯 Modo captura activo. Ve a tu POS y usa Win + PrtScr o Win + Shift + S. Luego regresa a Lealta'
    );

    // Instrucciones detalladas en consola
    console.log('=== CAPTURA AUTOMÁTICA INICIADA ===');
    console.log('🚀 OPCIÓN 1 - Win + Print Screen (MÁS RÁPIDO):');
    console.log('1. Ve a tu sistema POS');
    console.log('2. Presiona Win + Print Screen');
    console.log('3. ¡Se guarda automáticamente en portapapeles!');
    console.log('4. Regresa a Lealta (se detecta automáticamente)');
    console.log('');
    console.log('📐 OPCIÓN 2 - Win + Shift + S (ÁREA ESPECÍFICA):');
    console.log('1. Ve a tu sistema POS');
    console.log('2. Presiona Win + Shift + S');
    console.log('3. Selecciona el área del ticket');
    console.log('4. Regresa a Lealta (se detecta automáticamente)');
    console.log('');
    console.log(
      '⚡ IMPORTANTE: NO necesitas guardar archivo, solo regresa a Lealta'
    );

    // Timeout de 5 minutos para dar tiempo suficiente
    setTimeout(() => {
      if (isWaitingForCapture) {
        setIsWaitingForCapture(false);
        setCaptureStartTime(0);
        setLastClipboardCheck(null);
        showNotification(
          'info',
          '⏰ Tiempo de captura expirado. Inténtalo de nuevo.'
        );
      }
    }, 300000); // 5 minutos
  };

  // ========================================
  // 📸 SECCIÓN: FUNCIONES DE CAPTURA Y PROCESAMIENTO (515-650)
  // ========================================

  // Función para verificar si debe procesar la imagen
  const shouldProcessImage = useCallback(
    (currentTime: number, currentClipboardId: string): boolean => {
      const timeCondition = currentTime > captureStartTime + 2000; // 2 segundos mínimo
      const newImageCondition = currentClipboardId !== lastClipboardCheck;
      return timeCondition && newImageCondition;
    },
    [captureStartTime, lastClipboardCheck]
  );

  // Función para procesar la imagen capturada
  const processClipboardImage = useCallback(
    async (blob: Blob, currentTime: number) => {
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
    },
    [showNotification]
  );

  // Función para leer imagen del portapapeles
  const checkClipboardForImage = useCallback(async () => {
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
  }, [
    isWaitingForCapture,
    processClipboardImage,
    shouldProcessImage,
    lastClipboardCheck,
  ]);

  // Función para detectar cuando el usuario regresa a la ventana
  const handleWindowFocus = useCallback(async () => {
    if (!isWaitingForCapture) return;

    console.log('👀 Ventana enfocada - verificando portapapeles...');

    // Esperar un momento para que el portapapeles se actualice
    setTimeout(async () => {
      await checkClipboardForImage();
    }, 500);
  }, [isWaitingForCapture, checkClipboardForImage]);

  // Agregar listener para cuando la ventana gana foco
  useEffect(() => {
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isWaitingForCapture, handleWindowFocus]);

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
    showNotification('info', '📸 Subiendo imagen y procesando con IA...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('cedula', cedula);
      formData.append('businessId', user?.businessId || '');
      formData.append('empleadoId', user?.id || '');

      // Aumentar timeout para procesamiento con IA
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

      // Usar el nuevo endpoint de análisis (NO guarda, solo analiza)
      const response = await fetch('/api/staff/consumo/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      console.log('🔍 Respuesta del servidor:', data);
      console.log('🔍 response.ok:', response.ok);
      console.log('🔍 data.requiresConfirmation:', data.requiresConfirmation);

      if (response.ok && data.requiresConfirmation) {
        console.log('✅ Mostrando cuadro de confirmación...');
        // Mostrar datos para confirmación
        setAiResult(data.data);
        setEditableData({
          empleado: data.data.analisis.empleadoDetectado || 'No detectado',
          productos: data.data.analisis.productos.map((p: AnalysisProduct) => ({
            name: p.nombre,
            price: p.precio,
            line: `${p.nombre} x${p.cantidad} - $${p.precio.toFixed(2)}`,
          })),
          total: data.data.analisis.total,
        });
        setShowConfirmation(true);
        console.log('🔍 showConfirmation establecido a true');
        showNotification(
          'success',
          `🤖 IA procesó el ticket con ${data.data.analisis.confianza}% de confianza. Revisa y confirma los datos.`
        );
      } else {
        console.log('❌ No se cumplió la condición para mostrar confirmación');
        showNotification(
          'error',
          `Error al procesar: ${data.error || 'Respuesta inesperada'}`
        );
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        showNotification(
          'error',
          '⏰ El procesamiento tomó demasiado tiempo. Intenta de nuevo.'
        );
      } else {
        showNotification(
          'error',
          'Error de conexión: No se pudo procesar la solicitud'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ========================================
  // ✅ SECCIÓN: FUNCIONES DE CONFIRMACIÓN (745-850)
  // ========================================

  // Funciones para confirmación de IA
  const confirmarDatosIA = async () => {
    if (!editableData || !aiResult) return;

    setIsProcessing(true);
    try {
      // Enviar datos confirmados al endpoint de confirmación
      const confirmationData = {
        clienteId: aiResult.cliente.id,
        businessId: aiResult.metadata.businessId,
        empleadoId: aiResult.metadata.empleadoId,
        productos: editableData.productos.map((p: EditableProduct) => ({
          nombre: p.name,
          cantidad: 1, // Por ahora asumimos cantidad 1
          precio: p.price,
          categoria: 'otro', // Categoría por defecto
        })),
        total: editableData.total,
        puntos: Math.floor(editableData.total * puntosPorDolar), // Puntos dinámicos basados en configuración
        empleadoDetectado: editableData.empleado,
        confianza: aiResult.analisis.confianza / 100, // Convertir a decimal
        imagenUrl: aiResult.metadata.imagenUrl,
        metodoPago: 'efectivo',
        notas: `Confirmado por staff - Confianza IA: ${aiResult.analisis.confianza}%`,
      };

      const response = await fetch('/api/staff/consumo/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(confirmationData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.data);
        showNotification(
          'success',
          '✅ Consumo confirmado y registrado exitosamente'
        );

        // Actualizar estadísticas del día
        setTodayStats(prev => ({
          ...prev,
          ticketsProcessed: prev.ticketsProcessed + 1,
          totalPoints: prev.totalPoints + data.data.puntosGenerados,
          totalAmount: prev.totalAmount + data.data.totalRegistrado,
        }));

        // Agregar a tickets recientes
        const newTicket: RecentTicket = {
          id: data.data.consumoId?.toString() || Date.now().toString(),
          cedula: data.data.clienteCedula || '',
          cliente: data.data.clienteNombre || '',
          productos:
            editableData.productos?.map((p: EditableProduct) => p.name) || [],
          total: data.data.totalRegistrado,
          puntos: data.data.puntosGenerados,
          fecha: new Date().toISOString().split('T')[0],
          monto: data.data.totalRegistrado,
          items:
            editableData.productos?.map((p: EditableProduct) => p.name) || [],
          hora: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          tipo: 'IA',
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
    showNotification(
      'info',
      'Confirmación cancelada. Puedes capturar otra imagen.'
    );
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

  const getNotificationClasses = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-dark-800/95 backdrop-blur-sm border border-green-500/30 bg-gradient-to-r from-green-900/20 to-emerald-900/20 text-white';
      case 'error':
        return 'bg-dark-800/95 backdrop-blur-sm border border-red-500/30 bg-gradient-to-r from-red-900/20 to-rose-900/20 text-white';
      case 'info':
      default:
        return 'bg-dark-800/95 backdrop-blur-sm border border-blue-500/30 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 text-white';
    }
  };

  const getCustomerLevelClasses = (nivel: string | undefined) => {
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

  const getConfianzaColor = (confianza: number) => {
    if (confianza >= 80) return 'text-green-400';
    if (confianza >= 60) return 'text-yellow-400';
    return 'text-red-400';
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
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className={`fixed top-6 right-6 p-4 rounded-xl shadow-2xl z-50 max-w-sm ${getNotificationClasses(notification.type)}`}
        >
          <div className="flex items-start space-x-3">
            {notification.type === 'success' && (
              <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0" />
            )}
            {notification.type === 'error' && (
              <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
            )}
            {notification.type === 'info' && (
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-white text-sm font-medium leading-relaxed">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================
    🎨 SECCIÓN: RENDER PRINCIPAL - HEADER Y NAVEGACIÓN (925-1000)
    ======================================== */}

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

        {/* ========================================
    📋 SECCIÓN: FORMULARIOS PRINCIPALES (1056-1300)
    ======================================== */}

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
                            🚀 Captura Automática - Flujo SúPER Optimizado
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
                              • <strong>Paso 3 (RÁPIDO):</strong> Presiona{' '}
                              <kbd className="px-1 py-0.5 bg-green-600/20 rounded text-green-300">
                                Win + PrtScr
                              </kbd>{' '}
                              para captura completa
                            </li>
                            <li>
                              • <strong>Paso 3 (PRECISO):</strong> Presiona{' '}
                              <kbd className="px-1 py-0.5 bg-blue-600/20 rounded">
                                Win + Shift + S
                              </kbd>{' '}
                              para seleccionar área
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

                      {/* Destacar opciones de captura */}
                      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                        <p className="text-white font-medium mb-2 text-center">
                          🎯 Elige tu método de captura preferido:
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-green-400">🚀</span>
                              <span className="text-green-300 font-bold">
                                MÁS RÁPIDO
                              </span>
                            </div>
                            <p className="text-green-200 text-xs">
                              <kbd className="bg-green-600/30 px-1 py-0.5 rounded">
                                Win + PrtScr
                              </kbd>
                              <br />
                              Captura completa instantánea
                            </p>
                          </div>
                          <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-blue-400">📐</span>
                              <span className="text-blue-300 font-bold">
                                MÁS PRECISO
                              </span>
                            </div>
                            <p className="text-blue-200 text-xs">
                              <kbd className="bg-blue-600/30 px-1 py-0.5 rounded">
                                Win + Shift + S
                              </kbd>
                              <br />
                              Selecciona área específica
                            </p>
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
                            <span>🚀 Captura Automática (Win + PrtScr)</span>
                          </>
                        )}
                      </button>

                      {/* Botones tradicionales */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={openSnippingTool}
                          className="flex-1 flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Win + PrtScr</span>
                        </button>

                        <button
                          type="button"
                          onClick={openSnippingTool}
                          className="flex-1 flex items-center justify-center space-x-2 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Win + Shift + S</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center space-x-2 p-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm"
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
                      {productos.map(producto => (
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
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colores"
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

          {/* ========================================
    📊 SECCIÓN: SIDEBAR Y RESULTADOS (1590-1750)
    ======================================== */}

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
                        {result.productos.map(
                          (item: Product, index: number) => (
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
                          )
                        )}
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

      {/* ========================================
    📝 SECCIÓN: MODAL DE CONFIRMACIÓN IA (1760-1874)
    ======================================== */}

      {/* Modal de confirmación de IA */}
      {showConfirmation && editableData && aiResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 border border-yellow-500/50 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center">
                🤖 <span className="ml-2">DATOS DETECTADOS POR IA</span>
              </h3>
              <button
                onClick={cancelarConfirmacion}
                disabled={isProcessing}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Alerta de revisión */}
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-center font-medium">
                ⚠️ <strong>Revisa los datos antes de confirmar</strong> para
                asegurar precisión
              </p>
            </div>

            {/* Contenido principal */}
            <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl mb-6 border border-gray-700">
              {/* Cliente y Empleado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm uppercase tracking-wider">
                    Cliente
                  </p>
                  <p className="text-white text-xl font-bold">
                    {aiResult.cliente.nombre}
                  </p>
                  <p className="text-gray-400">
                    Cédula: {aiResult.cliente.cedula}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm uppercase tracking-wider">
                    Empleado POS
                  </p>
                  <p className="text-white text-xl font-bold">
                    {editableData.empleado || 'No detectado'}
                  </p>
                </div>
              </div>

              {/* Productos */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm uppercase tracking-wider mb-3">
                  Productos detectados
                </p>
                <div className="bg-gray-900/50 rounded-lg border border-gray-600 overflow-hidden">
                  {editableData.productos.map(
                    (p: EditableProduct, i: number) => (
                      <div
                        key={`producto-${p.name}-${i}`}
                        className="flex justify-between items-center py-3 px-4 border-b border-gray-700 last:border-b-0"
                      >
                        <span className="text-gray-300 flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                          {p.name}
                        </span>
                        <span className="text-green-400 font-mono text-lg font-bold">
                          ${p.price.toFixed(2)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-white text-3xl font-bold">
                    ${editableData.total.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm uppercase tracking-wider">
                    Puntos
                  </p>
                  <p className="text-green-400 text-3xl font-bold">
                    {Math.floor(editableData.total * puntosPorDolar)}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-400 text-sm uppercase tracking-wider">
                    Confianza IA
                  </p>
                  <p
                    className={`text-3xl font-bold ${getConfianzaColor(aiResult.analisis.confianza)}`}
                  >
                    {aiResult.analisis.confianza}%
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={confirmarDatosIA}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>CONFIRMAR Y GUARDAR</span>
                  </>
                )}
              </button>
              <button
                onClick={cancelarConfirmacion}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              >
                <X className="w-6 h-6" />
                <span>CANCELAR</span>
              </button>
            </div>

            {/* Tip */}
            <p className="text-center text-gray-500 text-sm mt-6 flex items-center justify-center space-x-2">
              <span>💡</span>
              <span>
                Si los datos no son correctos, cancela y vuelve a capturar la
                imagen
              </span>
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
