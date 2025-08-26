'use client';

import { useState, useRef, useEffect } from 'react';
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
  X
} from 'lucide-react';

// Type aliases
type NotificationType = 'success' | 'error' | 'info';
type NotificationState = {type: NotificationType, message: string} | null;

export default function StaffPage() {
  // Función para obtener las clases CSS del nivel del cliente
  const getCustomerLevelClasses = (nivel: string) => {
    if (nivel === 'Gold') return 'bg-yellow-500/20 text-yellow-400';
    if (nivel === 'Silver') return 'bg-gray-500/20 text-gray-400';
    return 'bg-amber-600/20 text-amber-400';
  };

  const { user, loading, logout, isAuthenticated } = useRequireAuth('STAFF');
  
  // Estados principales
  const [cedula, setCedula] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<NotificationState>(null);
  const [preview, setPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Estados para cámara y UI mejorada
  const [cameraMode, setCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({
    ticketsProcessed: 12,
    totalPoints: 256,
    uniqueCustomers: 8,
    totalAmount: 180.50
  });
  
  // Referencias para la cámara
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadRecentTickets();
  }, []);

  // Función para buscar información del cliente
  const searchCustomer = async (cedulaValue: string) => {
    if (cedulaValue.length < 6) {
      setCustomerInfo(null);
      return;
    }

    setIsSearchingCustomer(true);
    try {
      // Simular búsqueda de cliente (reemplazar con API real)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (cedulaValue === '12345678') {
        setCustomerInfo({
          cedula: cedulaValue,
          nombre: 'Juan Carlos Pérez',
          email: 'juan@email.com',
          telefono: '+1234567890',
          puntos: 150,
          nivel: 'Gold',
          ultimaVisita: '2025-08-20',
          totalGastado: 450.00,
          frecuencia: 'Cliente frecuente'
        });
      } else {
        setCustomerInfo({
          cedula: cedulaValue,
          nombre: 'Cliente Nuevo',
          email: null,
          telefono: null,
          puntos: 0,
          nivel: 'Bronze',
          ultimaVisita: null,
          totalGastado: 0,
          frecuencia: 'Primera visita'
        });
      }
    } catch (error) {
      console.error('Error searching customer:', error);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // Función para cargar tickets recientes
  const loadRecentTickets = async () => {
    // Simular carga de tickets recientes (reemplazar con API real)
    setRecentTickets([
      {
        id: 1,
        cedula: '12345678',
        cliente: 'Juan Pérez',
        monto: 25.50,
        puntos: 26,
        hora: '14:30',
        items: ['Café Americano', 'Croissant']
      },
      {
        id: 2,
        cedula: '87654321',
        cliente: 'María García',
        monto: 18.00,
        puntos: 18,
        hora: '13:45',
        items: ['Latte', 'Muffin']
      },
      {
        id: 3,
        cedula: '11223344',
        cliente: 'Carlos López',
        monto: 32.00,
        puntos: 32,
        hora: '12:20',
        items: ['Almuerzo Ejecutivo']
      }
    ]);
  };

  // Función para iniciar la cámara
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Cámara trasera preferida
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setCameraMode(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      showNotification('error', 'No se pudo acceder a la cámara');
    }
  };

  // Función para detener la cámara
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraMode(false);
  };

  // Función para capturar imagen de la cámara
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'ticket-capture.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreview(canvas.toDataURL());
            stopCamera();
            showNotification('success', 'Imagen capturada exitosamente');
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  // Función para mostrar notificaciones
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      showNotification('info', 'Imagen cargada exitosamente');
    } else {
      showNotification('error', 'Por favor selecciona un archivo de imagen válido');
    }
  };

  const handleCedulaChange = (value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/\D/g, '');
    setCedula(numericValue);
    
    // Buscar cliente automáticamente
    if (numericValue.length >= 6) {
      searchCustomer(numericValue);
    } else {
      setCustomerInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !cedula) {
      showNotification('error', 'Por favor complete todos los campos requeridos');
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
        setResult(data);
        showNotification('success', 'Ticket procesado exitosamente');
        
        // Actualizar estadísticas del día
        setTodayStats(prev => ({
          ...prev,
          ticketsProcessed: prev.ticketsProcessed + 1,
          totalPoints: prev.totalPoints + (data.puntos || 0),
          totalAmount: prev.totalAmount + (data.total || 0)
        }));
        
        // Agregar a tickets recientes
        const newTicket = {
          id: Date.now(),
          cedula,
          cliente: customerInfo?.nombre || 'Cliente',
          monto: data.total || 0,
          puntos: data.puntos || 0,
          hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          items: data.productos?.map((p: any) => p.name) || []
        };
        setRecentTickets(prev => [newTicket, ...prev.slice(0, 4)]);
        
        // Reset form
        setCedula('');
        setSelectedFile(null);
        setPreview('');
        setCustomerInfo(null);
      } else {
        showNotification('error', `Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      showNotification('error', 'Error de conexión: No se pudo procesar la solicitud');
    } finally {
      setIsProcessing(false);
    }
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

  // Limpiar cámara al desmontar el componente
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {notification.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
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
                <p className="text-dark-400">Procesar tickets y gestionar clientes</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <RoleSwitch currentRole="STAFF" currentPath="/staff" />
              <div className="flex items-center space-x-3 bg-dark-800/50 px-4 py-2 rounded-lg">
                <User className="w-5 h-5 text-primary-400" />
                <span className="text-white font-medium">{user?.name || 'Staff'}</span>
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
                <p className="text-2xl font-bold text-white">{todayStats.ticketsProcessed}</p>
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
                <p className="text-2xl font-bold text-white">{todayStats.totalPoints}</p>
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
                <p className="text-2xl font-bold text-white">{todayStats.uniqueCustomers}</p>
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
                <p className="text-2xl font-bold text-white">${todayStats.totalAmount.toFixed(2)}</p>
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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Camera className="w-6 h-6 mr-2 text-primary-400" />
                Procesar Ticket
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input Cédula */}
                <div>
                  <label htmlFor="cedula-input" className="block text-sm font-medium text-dark-300 mb-2">
                    Cédula del Cliente
                  </label>
                  <div className="relative">
                    <input
                      id="cedula-input"
                      type="text"
                      value={cedula}
                      onChange={(e) => handleCedulaChange(e.target.value)}
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
                        <h3 className="font-medium text-white">{customerInfo.nombre}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCustomerLevelClasses(customerInfo.nivel)}`}>
                          {customerInfo.nivel}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-dark-400">Puntos Actuales:</span>
                          <span className="text-yellow-400 font-medium ml-2">{customerInfo.puntos}</span>
                        </div>
                        <div>
                          <span className="text-dark-400">Total Gastado:</span>
                          <span className="text-green-400 font-medium ml-2">${customerInfo.totalGastado}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-dark-400">Estado:</span>
                          <span className="text-blue-400 font-medium ml-2">{customerInfo.frecuencia}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Captura de Imagen */}
                <div>
                  <span className="block text-sm font-medium text-dark-300 mb-4">
                    Imagen del Ticket
                  </span>
                  
                  {/* Botones de Captura */}
                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={cameraMode}
                      className="flex-1 flex items-center justify-center space-x-2 p-4 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:text-dark-400 text-white rounded-lg transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Tomar Foto</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center space-x-2 p-4 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Subir Archivo</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Camera Mode */}
                  <AnimatePresence>
                    {cameraMode && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative bg-black rounded-lg overflow-hidden mb-4"
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-64 object-cover"
                        >
                          <track kind="captions" label="Descripción del video" />
                        </video>
                        
                        {/* Camera Overlay */}
                        <div className="absolute inset-0 border-2 border-dashed border-primary-400 opacity-50 m-8"></div>
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                          Alinea el ticket dentro del marco
                        </div>
                        
                        {/* Camera Controls */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                          <button
                            type="button"
                            onClick={captureImage}
                            className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full transition-colors"
                          >
                            <Camera className="w-6 h-6" />
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Preview */}
                  {preview && !cameraMode && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative bg-dark-700 rounded-lg overflow-hidden"
                    >
                      <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
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
                        ✓ Imagen Lista
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
                    <h3 className="text-lg font-semibold text-white">✅ Procesado</h3>
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
                      <span className="text-white font-semibold">${result.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Puntos ganados:</span>
                      <span className="text-yellow-400 font-semibold">+{result.puntos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Estado:</span>
                      <span className="text-green-400">Completado</span>
                    </div>
                  </div>

                  {result.productos && result.productos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-green-500/20">
                      <h4 className="text-sm font-medium text-dark-300 mb-2">Productos detectados:</h4>
                      <div className="space-y-1">
                        {result.productos.map((item: any, index: number) => (
                          <div key={`${item.name || 'producto'}-${index}`} className="flex justify-between text-sm">
                            <span className="text-dark-400">{item.name || `Producto ${index + 1}`}</span>
                            <span className="text-white">${item.price || 'N/A'}</span>
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
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-dark-700/50 border border-dark-600 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-medium">{ticket.cliente}</p>
                        <p className="text-dark-400 text-sm">{ticket.cedula}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">${ticket.monto}</p>
                        <p className="text-yellow-400 text-sm">+{ticket.puntos} pts</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-dark-400 text-xs">{ticket.items.slice(0, 2).join(', ')}</p>
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
                    <li>Usar la cámara para mejor calidad</li>
                    <li>Procesar ANTES del pago</li>
                    <li>Confirmar total con el cliente</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Canvas para captura (invisible) */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
