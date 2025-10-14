"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Users, Check } from "lucide-react";

interface Promotor {
  id: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  totalReservas: number;
}

interface PromotorAutocompleteProps {
  businessId: string;
  value?: string; // ID del promotor seleccionado
  onSelect: (promotorId: string, promotorNombre: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function PromotorAutocomplete({
  businessId,
  value,
  onSelect,
  label = "Promotor",
  placeholder = "Buscar promotor...",
  required = false,
}: Readonly<PromotorAutocompleteProps>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [filteredPromotores, setFilteredPromotores] = useState<Promotor[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPromotor, setSelectedPromotor] = useState<Promotor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
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

  // Cargar promotores al montar el componente
  useEffect(() => {
    loadPromotores();
  }, [loadPromotores]);

  // Seleccionar promotor por defecto si viene un value
  useEffect(() => {
    if (value && promotores.length > 0 && !selectedPromotor) {
      const promotor = promotores.find((p) => p.id === value);
      if (promotor) {
        setSelectedPromotor(promotor);
        setSearchTerm(promotor.nombre);
      }
    }
  }, [value, promotores, selectedPromotor]);

  // Filtrar promotores mientras se escribe
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setFilteredPromotores([]); // ✅ No mostrar nada si no hay búsqueda
    } else {
      const filtered = promotores.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPromotores(filtered);
    }
  }, [searchTerm, promotores]);

  // Cerrar dropdown al hacer click fuera
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

  const handleCreateNew = async () => {
    if (searchTerm.trim().length === 0) {
      toast.error('❌ Nombre requerido', {
        description: 'Por favor ingrese un nombre para el nuevo promotor'
      });
      return;
    }

    // Verificar si ya existe
    const existe = promotores.find(
      (p) => p.nombre.toLowerCase() === searchTerm.toLowerCase()
    );

    if (existe) {
      handleSelect(existe);
      return;
    }

    try {
      setIsCreating(true);
      
      const response = await fetch('/api/promotores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          nombre: searchTerm.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear promotor');
      }

      const data = await response.json();
      const nuevoPromotor = data.promotor;

      // Agregar a la lista
      setPromotores((prev) => [...prev, nuevoPromotor]);
      
      toast.success('✅ Promotor creado', {
        description: `${searchTerm.trim()} ha sido agregado`
      });
      
      // Seleccionar el nuevo promotor
      handleSelect(nuevoPromotor);
    } catch (error: any) {
      console.error('Error al crear promotor:', error);
      toast.error('❌ Error al crear promotor', {
        description: error.message
      });
    } finally {
      setIsCreating(false);
    }
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
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        
        {selectedPromotor && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="h-5 w-5 text-green-600" />
          </div>
        )}
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
              {/* Mostrar solo el primer resultado (más relevante) */}
              {filteredPromotores.length > 0 ? (
                <div className="py-1">
                  <button
                    key={filteredPromotores[0].id}
                    type="button"
                    onClick={() => handleSelect(filteredPromotores[0])}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {filteredPromotores[0].nombre}
                        </p>
                        {filteredPromotores[0].telefono && (
                          <p className="text-xs text-gray-500 truncate">
                            {filteredPromotores[0].telefono}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded group-hover:bg-gray-200 flex-shrink-0">
                      {filteredPromotores[0].totalReservas} reservas
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No se encontraron promotores</p>
                </div>
              )}

              {/* Opción para crear nuevo */}
              {searchTerm.trim().length > 0 &&
                !filteredPromotores.some(
                  (p) => p.nombre.toLowerCase() === searchTerm.toLowerCase()
                ) && (
                  <div className="border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      disabled={isCreating}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 text-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                      {isCreating ? (
                        <span>Creando...</span>
                      ) : (
                        <span>Crear promotor "{searchTerm}"</span>
                      )}
                    </button>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
