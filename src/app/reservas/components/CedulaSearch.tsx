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
}

interface CedulaSearchProps {
  businessId: string;
  value: string;
  onChange: (cedula: string) => void;
  onClienteFound: (cliente: ClienteData | null) => void;
  disabled?: boolean;
}

export function CedulaSearch({
  businessId,
  value,
  onChange,
  onClienteFound,
  disabled = false,
}: CedulaSearchProps) {
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
    const timeoutId = setTimeout(() => {
      if (value.trim().length >= 3) {
        buscarCliente(value.trim());
      } else {
        setSearchStatus('idle');
        setClienteNombre('');
        onClienteFound(null);
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const buscarCliente = async (cedula: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/clientes/search?q=${encodeURIComponent(cedula)}`,
        {
          headers: {
            'x-business-id': businessId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al buscar cliente');
      }

      const data = await response.json();
      
      // El endpoint devuelve un array de clientes
      if (Array.isArray(data) && data.length > 0) {
        // Buscar coincidencia exacta de cédula
        const clienteExacto = data.find((c: ClienteData) => c.cedula === cedula);
        
        if (clienteExacto) {
          setSearchStatus('found');
          setClienteNombre(clienteExacto.nombre);
          onClienteFound({
            id: clienteExacto.id,
            cedula: clienteExacto.cedula,
            nombre: clienteExacto.nombre,
            email: clienteExacto.correo,
            telefono: clienteExacto.telefono,
          });
        } else {
          setSearchStatus('not-found');
          setClienteNombre('');
          onClienteFound(null);
        }
      } else {
        setSearchStatus('not-found');
        setClienteNombre('');
        onClienteFound(null);
      }
    } catch (error) {
      console.error('Error buscando cliente:', error);
      setSearchStatus('idle');
      setClienteNombre('');
      onClienteFound(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="clienteCedula" className="text-sm font-medium text-gray-800">
        Cédula * {searchStatus === 'found' && <span className="text-green-600 text-xs">(Cliente registrado)</span>}
      </Label>
      <div className="relative">
        <Input
          id="clienteCedula"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0-0000-0000"
          className={getInputClassName()}
          disabled={disabled}
          required
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isSearching && (
            <Search className="h-4 w-4 text-gray-400 animate-pulse" />
          )}
          {!isSearching && searchStatus === 'found' && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
          {!isSearching && searchStatus === 'not-found' && (
            <AlertCircle className="h-5 w-5 text-blue-600" />
          )}
        </div>
      </div>
      {searchStatus === 'found' && clienteNombre && (
        <p className="text-xs text-green-600 font-medium">
          ✓ Cliente encontrado: {clienteNombre}
        </p>
      )}
      {searchStatus === 'not-found' && value.trim().length >= 3 && (
        <p className="text-xs text-blue-600">
          Cliente nuevo - Complete los datos para registrarlo
        </p>
      )}
    </div>
  );
}
