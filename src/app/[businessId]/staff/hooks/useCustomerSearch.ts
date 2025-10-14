// Custom hook for customer search functionality

import { useState, useCallback, useEffect } from 'react';
import { CustomerService } from '../services/customerService';

export const useCustomerSearch = (
  businessId: string,
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void
) => {
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const searchClients = useCallback(async (
    searchTerm: string,
    setSearchResults: (results: any[]) => void,
    setShowSearchResults: (show: boolean) => void,
    setIsSearchingCustomer: (searching: boolean) => void
  ) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearchingCustomer(true);
    console.log('🔎 Searching clients with term:', searchTerm, 'businessId:', businessId);
    
    try {
      const data = await CustomerService.searchClients(searchTerm);
      console.log('📊 Search results:', data);
      
      if (data.success && Array.isArray(data.clients)) {
        setSearchResults(data.clients);
        setShowSearchResults(data.clients.length > 0);
        
        if (data.clients.length > 0) {
          console.log('✅ Found clients:', data.clients.map((c: any) => `${c.nombre} (${c.cedula})`));
        } else {
          console.log('❌ No clients found for search term:', searchTerm);
        }
      } else {
        console.error('❌ Unexpected response format:', data);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error: any) {
      console.error('❌ Network error searching clients:', error);
      setSearchResults([]);
      setShowSearchResults(false);
      
      if (error.message.includes('401')) {
        showNotification('error', 'Sesión expirada. Por favor, vuelve a iniciar sesión.');
      } else if (error.message.includes('403')) {
        showNotification('error', 'No tienes permisos para buscar clientes.');
      } else {
        showNotification('error', 'Error en la búsqueda de clientes');
      }
    } finally {
      setIsSearchingCustomer(false);
    }
  }, [businessId, showNotification]);

  const selectClientFromSearch = useCallback((
    client: any,
    setCedula: (cedula: string) => void,
    setCustomerInfo: (info: any) => void,
    setShowSearchResults: (show: boolean) => void,
    setSearchResults: (results: any[]) => void
  ) => {
    console.log('👤 Selecting client from search:', client);
    
    setCedula(client.cedula);
    setCustomerInfo(CustomerService.mapSearchClientToCustomerInfo(client));
    setShowSearchResults(false);
    setSearchResults([]);
    
    showNotification('success', `Cliente ${client.nombre} seleccionado correctamente`);
  }, [showNotification]);

  const searchCustomer = useCallback(async (
    cedulaValue: string,
    setCustomerInfo: (info: any) => void,
    setIsSearchingCustomer: (searching: boolean) => void
  ) => {
    if (cedulaValue.length < 6) {
      setCustomerInfo(null);
      return;
    }

    setIsSearchingCustomer(true);
    try {
      const data = await CustomerService.verifyCustomer(cedulaValue);

      if (data.existe && data.cliente) {
        // Cliente encontrado en la base de datos
        const cliente = data.cliente;
        setCustomerInfo({
          id: cliente.cedula,
          cedula: cliente.cedula,
          nombre: cliente.nombre,
          email: cliente.email,
          telefono: cliente.telefono,
          puntos: cliente.puntos || 0,
          nivel: cliente.tarjetaFidelizacion?.nivel || 'Sin tarjeta',
          ultimaVisita: null,
          totalGastado: 0,
          frecuencia: `${cliente.visitas || 0} visitas registradas`,
        });

        console.log('✅ Cliente encontrado en base de datos:', cliente);
      } else {
        // Cliente no encontrado
        setCustomerInfo(null);
        console.log('❌ Cliente no encontrado - mostrando opción de registro');
      }
    } catch (error) {
      console.error('❌ Error buscando cliente:', error);
      showNotification('error', 'Error al buscar cliente en la base de datos');
      setCustomerInfo(null);
    } finally {
      setIsSearchingCustomer(false);
    }
  }, [showNotification]);

  const handleCedulaChange = useCallback((
    value: string,
    setCedula: (cedula: string) => void,
    setCustomerInfo: (info: any) => void,
    setSearchResults: (results: any[]) => void,
    setShowSearchResults: (show: boolean) => void,
    setIsSearchingCustomer: (searching: boolean) => void
  ) => {
    const cleanValue = value.trim();
    setCedula(cleanValue);

    // Limpiar timer anterior
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // Si hay menos de 2 caracteres, limpiar búsqueda
    if (cleanValue.length < 2) {
      setCustomerInfo(null);
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearchingCustomer(false);
      return;
    }

    // Buscar en tiempo real después de 300ms de pausa
    if (cleanValue.length >= 2) {
      setIsSearchingCustomer(true);
      const newTimer = setTimeout(() => {
        searchClients(cleanValue, setSearchResults, setShowSearchResults, setIsSearchingCustomer);
      }, 300);
      setSearchTimer(newTimer);
    }
  }, [searchTimer, searchClients]);

  // Limpiar timer al desmontar componente
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  return {
    searchClients,
    selectClientFromSearch,
    searchCustomer,
    handleCedulaChange,
  };
};
