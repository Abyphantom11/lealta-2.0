'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireAuth } from '../../../hooks/useAuth';
import { motion } from 'framer-motion';
import {
  Camera, User, FileText, Clock
} from 'lucide-react';
import RoleSwitch from '../../../components/RoleSwitch';

// Import services
import { CustomerService, type SearchClient } from './services/customerService';
import { StatsService } from './services/statsService';
import { ConsumoService } from './services/consumoService';

// Import types
import type { CustomerInfo } from './types/customer.types';
import type { TodayStats, RecentTicket } from './types/staff.types';

// Import components
import { AIConfirmationModal } from './components/AIConfirmationModal';
import CustomerSearchForm from './components/CustomerSearchForm';
import StatsDisplay from './components/StatsDisplay';
import OCRUploadForm from './components/OCRUploadForm';

// ========================================
// INTERFACES PARA ESTE COMPONENTE
// ========================================

interface EditableProduct {
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: string;
}

interface EditableData {
  empleado: string;
  productos: EditableProduct[];
  total: number;
}

interface AIResult {
  cliente: CustomerInfo;
  analisis: {
    empleadoDetectado: string;
    productos: EditableProduct[];
    total: number;
    confianza: number;
  };
  metadata: {
    businessId: string;
    empleadoId: string;
    imagenUrl: string;
    isBatchProcess?: boolean;
    totalImages?: number;
    successfulImages?: number;
    sameReceipt?: boolean;
  };
}

// Helper functions for notification styling
type NotificationTypeLocal = 'success' | 'error' | 'info';

const getNotificationBgColor = (type: NotificationTypeLocal) => {
  switch (type) {
    case 'success': return 'bg-green-800/95 border-green-500/30';
    case 'error': return 'bg-red-800/95 border-red-500/30';
    default: return 'bg-blue-800/95 border-blue-500/30';
  }
};

const getNotificationDotColor = (type: NotificationTypeLocal) => {
  switch (type) {
    case 'success': return 'bg-green-400';
    case 'error': return 'bg-red-400';
    default: return 'bg-blue-400';
  }
};

export default function StaffPageContent({ businessId }: { businessId: string }) {
  const { user, loading } = useRequireAuth('STAFF');
  const isAuthenticated = !loading && !!user;

  // ========================================
  // ESTADO PRINCIPAL
  // ========================================
  
  // Form state
  const [cedula, setCedula] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // UI state
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationTypeLocal;
  } | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Customer state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [searchResults, setSearchResults] = useState<CustomerInfo[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  
  // AI Confirmation state
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editableData, setEditableData] = useState<EditableData | null>(null);
  
  
  // Stats state
  const [todayStats, setTodayStats] = useState<TodayStats>({
    ticketsProcessed: 0,
    totalPoints: 0,
    totalAmount: 0,
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [puntosPorDolar, setPuntosPorDolar] = useState(4);

  // ========================================
  // FUNCIONES UTILITARIAS
  // ========================================

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const resetForm = () => {
    setCedula('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCustomerInfo(null);
    setShowConfirmation(false);
    setAiResult(null);
    setEditableData(null);
  };

  // ========================================
  // FUNCIONES DE BÚSQUEDA DE CLIENTES
  // ========================================

  const searchClients = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearchingCustomer(false);
      return;
    }

    try {
      setIsSearchingCustomer(true);
      const response = await CustomerService.searchClients(searchTerm);
      
      if (response.success && response.clients) {
        const mappedResults: CustomerInfo[] = response.clients.map((client: SearchClient) => 
          CustomerService.mapSearchClientToCustomerInfo(client)
        );
        setSearchResults(mappedResults);
        setShowSearchResults(mappedResults.length > 0);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
      showNotification('error', 'Error al buscar clientes');
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearchingCustomer(false);
    }
  }, [showNotification]);

  const handleCedulaChange = (value: string) => {
    const cleanValue = value.trim();
    setCedula(cleanValue);

    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    if (cleanValue.length < 2) {
      setCustomerInfo(null);
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearchingCustomer(false);
      return;
    }

    if (cleanValue.length >= 2) {
      const newTimer = setTimeout(() => {
        searchClients(cleanValue);
      }, 300);
      setSearchTimer(newTimer);
    }
  };

  const selectClientFromSearch = (client: CustomerInfo) => {
    setCedula(client.cedula);
    setCustomerInfo(client);
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearchingCustomer(false);
  };

  // ========================================
  // FUNCIONES DE DATOS Y ESTADÍSTICAS
  // ========================================

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      // Cargar estadísticas y tickets recientes
      const statsResponse = await StatsService.loadRecentTickets();
      if (statsResponse.stats) {
        setTodayStats(statsResponse.stats);
      }
      if (statsResponse.tickets) {
        setRecentTickets(statsResponse.tickets);
      }

      // Cargar configuración de puntos
      const puntosConfig = await StatsService.loadPuntosConfig();
      setPuntosPorDolar(puntosConfig);
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Error al cargar datos');
    }
  }, [isAuthenticated, showNotification]);

  // ========================================
  // FUNCIONES DE ARCHIVOS
  // ========================================

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== fileArray.length) {
      showNotification('error', 'Solo se permiten archivos de imagen');
    }

    setSelectedFiles(validFiles);

    // Crear URLs de preview
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Limpiar URL del objeto removido
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  // ========================================
  // FUNCIONES DE PROCESAMIENTO
  // ========================================

  const processImages = async () => {
    if (selectedFiles.length === 0) {
      showNotification('error', 'Selecciona al menos una imagen');
      return;
    }

    if (!customerInfo) {
      showNotification('error', 'Selecciona un cliente primero');
      return;
    }

    try {
      setIsProcessing(true);
      
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });
      formData.append('cedula', cedula);
      formData.append('businessId', businessId);
      formData.append('empleadoId', user?.id || '');

      const response = await ConsumoService.processImageTicket(
        formData, 
        selectedFiles.length > 1
      );

      if (response.requiresConfirmation && response.data) {
        // Preparar datos para confirmación
        const aiData: AIResult = {
          cliente: customerInfo,
          analisis: response.data.analisis,
          metadata: response.data.metadata
        };
        
        setAiResult(aiData);
        setEditableData({
          empleado: response.data.analisis.empleadoDetectado,
          productos: response.data.analisis.productos,
          total: response.data.analisis.total
        });
        setShowConfirmation(true);
      } else {
        // Procesamiento directo exitoso
        showNotification('success', 'Ticket procesado exitosamente');
        resetForm();
        loadData(); // Recargar estadísticas
      }
    } catch (error) {
      console.error('Error processing images:', error);
      showNotification('error', 'Error al procesar las imágenes');
    } finally {
      setIsProcessing(false);
    }
  };

  // ========================================
  // FUNCIONES DE CONFIRMACIÓN AI
  // ========================================

  const confirmAIData = async () => {
    if (!aiResult || !editableData || !customerInfo) return;

    try {
      setIsProcessing(true);

      const confirmationData = {
        clienteId: customerInfo.id,
        businessId: businessId,
        empleadoId: user?.id || '',
        productos: editableData.productos,
        total: editableData.total,
        puntos: Math.floor(editableData.total * puntosPorDolar),
        empleadoDetectado: editableData.empleado,
        confianza: aiResult.analisis.confianza,
        imagenUrl: aiResult.metadata.imagenUrl,
        metodoPago: 'efectivo',
        notas: ''
      };

      await ConsumoService.confirmAIData(confirmationData);
      
      showNotification('success', 'Consumo registrado exitosamente');
      setShowConfirmation(false);
      resetForm();
      loadData(); // Recargar estadísticas
      
    } catch (error) {
      console.error('Error confirming AI data:', error);
      showNotification('error', 'Error al confirmar los datos');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setAiResult(null);
    setEditableData(null);
  };

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
      document.removeEventListener('mousedown', handleClickOutside);
      // Limpiar URLs de preview al desmontar
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [searchTimer, previewUrls]);

  // ========================================
  // RENDER
  // ========================================

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
      {/* Notification System */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className={`fixed top-6 right-6 p-4 rounded-xl shadow-2xl z-[60] max-w-sm backdrop-blur-sm border ${getNotificationBgColor(notification.type)}`}
        >
          <div className="flex items-start space-x-3">
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getNotificationDotColor(notification.type)}`} />
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

      {/* Header */}
      <div className="bg-dark-900/50 backdrop-blur-sm border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-500/10 p-3 rounded-lg">
                <FileText className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Panel Staff Modular</h1>
                <p className="text-dark-400">Procesamiento de tickets con arquitectura modular</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <RoleSwitch
                currentRole={user?.role || 'STAFF'}
                currentPath={`/${businessId}/staff`}
                businessId={businessId}
              />
              <div className="flex items-center space-x-3 bg-dark-800/50 px-4 py-2 rounded-lg">
                <User className="w-5 h-5 text-primary-400" />
                <span className="text-white font-medium">{user?.name || 'Staff'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Mode Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-dark-800/50 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setModoManual(false)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                !modoManual ? 'bg-primary-600 text-white shadow-lg' : 'text-dark-300 hover:text-white'
              }`}
            >
              📱 Captura OCR
            </button>
            <button
              onClick={() => setModoManual(true)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                modoManual ? 'bg-primary-600 text-white shadow-lg' : 'text-dark-300 hover:text-white'
              }`}
            >
              ✍️ Registro Manual
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="mb-8">
          <StatsDisplay stats={todayStats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Column */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Camera className="w-6 h-6 mr-2 text-primary-400" />
                {modoManual ? 'Registro Manual' : 'Procesamiento OCR'}
              </h2>
              
              <div className="space-y-6">
                {/* Customer Search Form */}
                <CustomerSearchForm
                  cedula={cedula}
                  onCedulaChange={handleCedulaChange}
                  customerInfo={customerInfo}
                  searchResults={searchResults}
                  showSearchResults={showSearchResults}
                  isSearchingCustomer={isSearchingCustomer}
                  onSelectClient={selectClientFromSearch}
                  onShowRegister={() => showNotification('info', 'Función de registro no disponible en esta versión')}
                  onShowClientDetails={() => showNotification('info', 'Función de detalles no disponible en esta versión')}
                />

                {/* OCR Upload Form or Manual Form */}
                {!modoManual ? (
                  <OCRUploadForm
                    selectedFiles={selectedFiles}
                    onFilesSelect={handleFileSelect}
                    onRemoveFile={removeFile}
                    onProcess={processImages}
                    isProcessing={isProcessing}
                    disabled={!customerInfo}
                  />
                ) : (
                  <div className="text-center py-12 bg-dark-700/30 rounded-lg">
                    <h3 className="text-white font-medium mb-2">Manual Entry Form</h3>
                    <p className="text-dark-400 text-sm">
                      Formulario manual en desarrollo
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Recent Tickets */}
          <div>
            <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-500/10 p-2 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Tickets Recientes</h3>
              </div>

              {recentTickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-dark-400">No hay tickets procesados hoy</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-dark-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">{ticket.cliente}</p>
                          <p className="text-dark-400 text-xs">Cédula: {ticket.cedula}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">${ticket.total.toFixed(2)}</p>
                          <p className="text-yellow-400 text-xs">+{ticket.puntos} pts</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Confirmation Modal */}
      <AIConfirmationModal
        showConfirmation={showConfirmation}
        aiResult={aiResult}
        editableData={editableData}
        isProcessing={isProcessing}
        onConfirm={confirmAIData}
        onCancel={cancelConfirmation}
        onEdit={(field: string, value: any) => {
          if (editableData) {
            if (field === 'empleado') {
              setEditableData({
                ...editableData,
                empleado: value
              });
            } else if (field.startsWith('productos')) {
              // Handle product edits
              const [, index, productField] = field.split('.');
              const productIndex = parseInt(index);
              if (editableData.productos && editableData.productos[productIndex]) {
                const updatedProducts = [...editableData.productos];
                updatedProducts[productIndex] = {
                  ...updatedProducts[productIndex],
                  [productField]: value
                };
                setEditableData({
                  ...editableData,
                  productos: updatedProducts,
                  total: updatedProducts.reduce((sum, p) => sum + (p.precio * p.cantidad), 0)
                });
              }
            }
          }
        }}
      />
    </div>
  );
}
