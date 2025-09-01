// Hook personalizado para la gestión de clientes
import { useState, useCallback, useEffect } from 'react';
import { Cliente } from '../../../types/admin';
import { 
  ClienteFormData, 
  ClienteSearchParams, 
  ClienteOperationResult,
  ClientHistoryItem
} from '../../../types/admin/clients';
import logger from '../../../lib/logger';

export function useClients() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchParams, setSearchParams] = useState<ClienteSearchParams>({
    page: 1,
    limit: 10
  });

  // Función para buscar clientes
  const fetchClientes = useCallback(async (params: ClienteSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      // Construir la URL con los parámetros de búsqueda
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.append('query', params.query);
      if (params.nivel) queryParams.append('nivel', params.nivel);
      if (params.minPuntos) queryParams.append('minPuntos', params.minPuntos.toString());
      if (params.maxPuntos) queryParams.append('maxPuntos', params.maxPuntos.toString());
      queryParams.append('page', params.page.toString());
      queryParams.append('limit', params.limit.toString());
      
      const response = await fetch(`/api/admin/clientes?${queryParams.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setClientes(data.clientes || []);
        setTotalCount(data.total || 0);
        setSearchParams(params);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cargar los clientes');
        logger.error('Error al cargar clientes:', errorData);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar los clientes: ${message}`);
      logger.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener un cliente por su cédula
  const getClienteById = useCallback(async (cedula: string): Promise<Cliente | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/clientes/${cedula}`);
      
      if (response.ok) {
        const data = await response.json();
        const cliente = data.cliente;
        setSelectedCliente(cliente);
        return cliente;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cargar el cliente');
        logger.error('Error al cargar cliente:', errorData);
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar el cliente: ${message}`);
      logger.error('Error al cargar cliente:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener el historial de un cliente
  const getClienteHistory = useCallback(async (cedula: string): Promise<ClientHistoryItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/clientes/${cedula}/historial`);
      
      if (response.ok) {
        const data = await response.json();
        return data.historial || [];
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cargar el historial del cliente');
        logger.error('Error al cargar historial:', errorData);
        return [];
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar el historial del cliente: ${message}`);
      logger.error('Error al cargar historial:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para guardar un cliente
  const saveCliente = useCallback(async (cliente: ClienteFormData): Promise<ClienteOperationResult> => {
    setLoading(true);
    try {
      // Determinar si es una actualización o creación
      const isUpdate = Boolean(cliente.cedula && clientes.some(c => c.cedula === cliente.cedula));
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate 
        ? `/api/admin/clientes/${cliente.cedula}` 
        : '/api/admin/clientes';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cliente),
      });

      if (response.ok) {
        const result = await response.json();
        // Actualizar el estado con el cliente guardado
        fetchClientes(searchParams);
        if (selectedCliente && selectedCliente.cedula === cliente.cedula) {
          setSelectedCliente(result.cliente);
        }
        return {
          success: true,
          message: isUpdate ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente',
          cliente: result.cliente
        };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al guardar el cliente');
        logger.error('Error al guardar cliente:', errorData);
        return {
          success: false,
          message: 'Error al guardar el cliente',
          error: errorData.message
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al guardar el cliente: ${message}`);
      logger.error('Error al guardar cliente:', error);
      return {
        success: false,
        message: 'Error al guardar el cliente',
        error: message
      };
    } finally {
      setLoading(false);
    }
  }, [clientes, fetchClientes, searchParams, selectedCliente]);

  // Función para actualizar los puntos de un cliente
  const updatePuntos = useCallback(async (
    cedula: string, 
    puntos: number, 
    motivo: string
  ): Promise<ClienteOperationResult> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/clientes/${cedula}/puntos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puntos,
          motivo
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Actualizar el estado
        if (selectedCliente && selectedCliente.cedula === cedula) {
          getClienteById(cedula);
        }
        fetchClientes(searchParams);
        return {
          success: true,
          message: 'Puntos actualizados correctamente',
          cliente: result.cliente
        };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al actualizar los puntos');
        logger.error('Error al actualizar puntos:', errorData);
        return {
          success: false,
          message: 'Error al actualizar los puntos',
          error: errorData.message
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al actualizar los puntos: ${message}`);
      logger.error('Error al actualizar puntos:', error);
      return {
        success: false,
        message: 'Error al actualizar los puntos',
        error: message
      };
    } finally {
      setLoading(false);
    }
  }, [fetchClientes, getClienteById, searchParams, selectedCliente]);

  // Cargar los clientes inicialmente
  useEffect(() => {
    fetchClientes(searchParams);
  }, [fetchClientes, searchParams]);

  return {
    clientes,
    selectedCliente,
    loading,
    error,
    totalCount,
    fetchClientes,
    getClienteById,
    getClienteHistory,
    saveCliente,
    updatePuntos
  };
}
