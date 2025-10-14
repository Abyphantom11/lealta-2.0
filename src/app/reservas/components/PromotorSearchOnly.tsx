"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Users, Check, Search } from "lucide-react";

interface Promotor {
  id: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  totalReservas: number;
}

interface PromotorSearchOnlyProps {
  businessId: string;
  value?: string;
  onSelect: (promotorId: string, promotorNombre: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Buscador simple de promotores (sin creación)
 * La creación se hace desde el panel de Gestión de Promotores
 */
export function PromotorSearchOnly({
  businessId,
  value,
  onSelect,
  label = "Promotor",
  placeholder = "Buscar promotor...",
  required = false,
}: Readonly<PromotorSearchOnlyProps>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [filteredPromotores, setFilteredPromotores] = useState<Promotor[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPromotor, setSelectedPromotor] = useState<Promotor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadPromotores = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/promotores?businessId=${businessId}&activo=true`);
      
      if (!response.ok) {
        throw new Error('Error al cargar promotores');
      }

      const data = await response.json();
      setPromotores(data.promotores || []);
      setFilteredPromotores(data.promotores || []);
    } catch (error) {
      console.error('Error al cargar promotores:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadPromotores();
  }, [loadPromotores]);

  useEffect(() => {
    if (value && promotores.length > 0 && !selectedPromotor) {
      const promotor = promotores.find((p) => p.id === value);
      if (promotor) {
        setSelectedPromotor(promotor);
        setSearchTerm(promotor.nombre);
      }
    }
  }, [value, promotores, selectedPromotor]);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setFilteredPromotores(promotores);
    } else {
      const filtered = promotores.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPromotores(filtered);
    }
  }, [searchTerm, promotores]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (promotor: Promotor) => {
    setSelectedPromotor(promotor);
    setSearchTerm(promotor.nombre);
    setShowDropdown(false);
    onSelect(promotor.id, promotor.nombre);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedPromotor(null);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <Label htmlFor="promotor-search" className="text-sm font-medium text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="promotor-search"
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="min-h-[44px] text-gray-900 placeholder:text-gray-500 pr-10"
          required={required}
          disabled={isLoading}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {selectedPromotor ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full" />
              <p className="mt-2 text-sm">Cargando promotores...</p>
            </div>
          ) : (
            <>
              {filteredPromotores.length > 0 ? (
                <div className="py-1">
                  {filteredPromotores.map((promotor) => (
                    <button
                      key={promotor.id}
                      type="button"
                      onClick={() => handleSelect(promotor)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {promotor.nombre}
                          </p>
                          {promotor.telefono && (
                            <p className="text-xs text-gray-500 truncate">
                              {promotor.telefono}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded group-hover:bg-gray-200 flex-shrink-0">
                        {promotor.totalReservas || 0} reservas
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 mb-2">
                    No se encontraron promotores
                  </p>
                  <p className="text-xs text-gray-400">
                    Use el panel de <strong>Gestión de Promotores</strong> para crear nuevos
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
