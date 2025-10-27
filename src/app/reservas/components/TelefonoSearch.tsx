"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Search, CheckCircle2, AlertCircle } from "lucide-react";

interface ClienteData {
  id: string;
  cedula: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaNacimiento?: string;
}

interface TelefonoSearchProps {
  businessId: string;
  value: string;
  onChange: (telefono: string) => void;
  onClienteFound: (cliente: ClienteData | null) => void;
  disabled?: boolean;
}

export function TelefonoSearch({
  businessId,
  value,
  onChange,
  onClienteFound,
  disabled = false,
}: TelefonoSearchProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'not-found'>('idle');
  const [clienteNombre, setClienteNombre] = useState<string>('');

  const getInputClassName = () => {
    const baseClass = 'min-h-[44px] text-gray-900 placeholder:text-gray-500 pr-10';
    if (searchStatus === 'found') {
      return `${baseClass} border-green-500 bg-green-50`;
    }
    if (searchStatus === 'not-found') {
      return `${baseClass} border-blue-500`;
    }
    return baseClass;
  };

  // Debounce la búsqueda para no hacer requests en cada tecla
  useEffect(() => {
    const buscarCliente = async (telefono: string) => {
      setIsSearching(true);
      try {
        console.log('🔍 Buscando cliente por teléfono:', telefono);
        
        const response = await fetch(
          `/api/clientes/search?q=${encodeURIComponent(telefono)}`,
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
        console.log('📞 Respuesta búsqueda por teléfono:', data);
        
        // El endpoint devuelve un array de clientes
        if (Array.isArray(data) && data.length > 0) {
          // Buscar coincidencia exacta de teléfono
          const clienteExacto = data.find((c: any) => c.telefono === telefono || c.phone === telefono);
          
          if (clienteExacto) {
            console.log('✅ Cliente encontrado por teléfono:', clienteExacto);
            setSearchStatus('found');
            setClienteNombre(clienteExacto.nombre);
            
            // Convertir al formato esperado
            const clienteFormateado: ClienteData = {
              id: clienteExacto.id || clienteExacto.telefono,
              cedula: clienteExacto.cedula || telefono, // Usar teléfono si no tiene cédula
              nombre: clienteExacto.nombre,
              email: clienteExacto.correo || clienteExacto.email || '',
              telefono: clienteExacto.telefono || clienteExacto.phone,
              fechaNacimiento: clienteExacto.fechaNacimiento || clienteExacto.fecha_nacimiento || ''
            };
            
            onClienteFound(clienteFormateado);
          } else {
            // No hay coincidencia exacta
            console.log('⚠️ No se encontró cliente con teléfono exacto');
            setSearchStatus('not-found');
            setClienteNombre('');
            onClienteFound(null);
          }
        } else {
          // No hay resultados
          console.log('📞 No se encontraron clientes con ese teléfono');
          setSearchStatus('not-found');
          setClienteNombre('');
          onClienteFound(null);
        }
      } catch (error) {
        console.error('❌ Error buscando cliente por teléfono:', error);
        setSearchStatus('idle');
        setClienteNombre('');
        onClienteFound(null);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (value.trim().length >= 8) { // Teléfonos suelen tener al menos 8 dígitos
        buscarCliente(value.trim());
      } else {
        // Limpiar estado si el teléfono es muy corto
        setSearchStatus('idle');
        setClienteNombre('');
        onClienteFound(null);
      }
    }, 500); // Esperar 500ms después del último cambio

    return () => clearTimeout(timeoutId);
  }, [value, businessId, onClienteFound]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        📞 Teléfono *
      </Label>
      <div className="relative">
        <Input
          type="tel"
          value={value}
          onChange={handleInputChange}
          placeholder="+507 6000-0000"
          className={getInputClassName()}
          disabled={disabled}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isSearching ? (
            <Search className="h-4 w-4 text-gray-400 animate-pulse" />
          ) : searchStatus === 'found' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : searchStatus === 'not-found' ? (
            <AlertCircle className="h-4 w-4 text-blue-500" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Indicadores de estado */}
      {searchStatus === 'found' && clienteNombre && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" />
          ✅ Cliente encontrado: <strong>{clienteNombre}</strong>
        </p>
      )}
      
      {searchStatus === 'not-found' && value.trim().length >= 8 && (
        <p className="text-sm text-blue-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Cliente nuevo - Complete los datos adicionales
        </p>
      )}
      
      {value.trim().length > 0 && value.trim().length < 8 && (
        <p className="text-xs text-gray-500">
          Ingrese al menos 8 dígitos para buscar
        </p>
      )}
    </div>
  );
}
