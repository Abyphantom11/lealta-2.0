// Custom hook for main staff data state management

import { useState, useRef } from 'react';
import { CustomerInfo } from '../types/customer.types';
import { AIResult, EditableProduct } from '../types/ai.types';
import { RecentTicket, TodayStats } from '../types/staff.types';

export const useStaffData = () => {
  // Estados principales
  const [cedula, setCedula] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para confirmación de IA
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editableData, setEditableData] = useState<{
    empleado: string;
    productos: EditableProduct[];
    total: number;
  } | null>(null);

  // Estados para registro de cliente
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerData, setRegisterData] = useState({
    cedula: '',
    nombre: '',
    telefono: '',
    email: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados para popup de datos del cliente
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientData, setSelectedClientData] = useState<any>(null);

  // Estados para registro manual
  const [modoManual, setModoManual] = useState(false);
  const [empleadoVenta, setEmpleadoVenta] = useState('');
  const [productos, setProductos] = useState<
    Array<{ id: string; nombre: string; cantidad: number }>
  >([{ id: '1', nombre: '', cantidad: 1 }]);
  const [totalManual, setTotalManual] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para configuración de puntos
  const [puntosPorDolar, setPuntosPorDolar] = useState(4);

  // Estados para UI mejorada
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  
  // Estados para búsqueda en tiempo real
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    ticketsProcessed: 0,
    totalPoints: 0,
    totalAmount: 0,
  });

  // Referencias
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Funciones auxiliares
  const showClientDetails = () => {
    if (customerInfo) {
      setSelectedClientData(customerInfo);
      setShowClientModal(true);
    }
  };

  const handleRegisterClient = (currentCedula: string) => {
    setRegisterData({
      cedula: currentCedula,
      nombre: '',
      telefono: '',
      email: '',
    });
    setShowRegisterModal(true);
  };

  // Funciones para productos
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

  const resetFormularioOCR = () => {
    setCedula('');
    setSelectedFile(null);
    setSelectedFiles([]);
    setPreview('');
    setCustomerInfo(null);
    setShowConfirmation(false);
    setAiResult(null);
    setEditableData(null);
  };

  return {
    // Estados
    cedula, setCedula,
    selectedFile, setSelectedFile,
    selectedFiles, setSelectedFiles,
    preview, setPreview,
    isProcessing, setIsProcessing,
    aiResult, setAiResult,
    showConfirmation, setShowConfirmation,
    editableData, setEditableData,
    showRegisterModal, setShowRegisterModal,
    registerData, setRegisterData,
    isRegistering, setIsRegistering,
    showClientModal, setShowClientModal,
    selectedClientData, setSelectedClientData,
    modoManual, setModoManual,
    empleadoVenta, setEmpleadoVenta,
    productos, setProductos,
    totalManual, setTotalManual,
    isSubmitting, setIsSubmitting,
    puntosPorDolar, setPuntosPorDolar,
    customerInfo, setCustomerInfo,
    isSearchingCustomer, setIsSearchingCustomer,
    searchResults, setSearchResults,
    showSearchResults, setShowSearchResults,
    recentTickets, setRecentTickets,
    todayStats, setTodayStats,
    fileInputRef,
    
    // Funciones
    showClientDetails,
    handleRegisterClient,
    agregarProducto,
    eliminarProducto,
    actualizarProducto,
    resetFormularioOCR,
  };
};
