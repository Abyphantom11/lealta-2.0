"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Check, ChevronDown } from "lucide-react";

interface Promotor {
  id: string;
  nombre: string;
}

interface PromotorTableAutocompleteProps {
  businessId: string;
  reservationId: string;
  currentPromotorId?: string;
  currentPromotorName?: string;
  onUpdate: (reservationId: string, promotorId: string, promotorName: string) => Promise<void>;
}

export function PromotorTableAutocomplete({
  businessId,
  reservationId,
  currentPromotorId,
  currentPromotorName,
  onUpdate,
}: Readonly<PromotorTableAutocompleteProps>) {
  const [searchTerm, setSearchTerm] = useState(currentPromotorName || "");
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [filteredPromotores, setFilteredPromotores] = useState<Promotor[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPromotor, setSelectedPromotor] = useState<Promotor | null>(
    currentPromotorId && currentPromotorName
      ? { id: currentPromotorId, nombre: currentPromotorName }
      : null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasValidSelection, setHasValidSelection] = useState(!!currentPromotorId);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar promotores
  const loadPromotores = useCallback(async () => {
    try {
      const response = await fetch(`/api/promotores?businessId=${businessId}&activo=true`);
      
      if (!response.ok) {
        throw new Error('Error al cargar promotores');
      }

      const data = await response.json();
      setPromotores(data.promotores || []);
    } catch (error) {
      console.error('Error al cargar promotores:', error);
      toast.error('❌ Error al cargar promotores');
    }
  }, [businessId]);

  useEffect(() => {
    loadPromotores();
  }, [loadPromotores]);

  // Actualizar nombre cuando cambia el prop (solo si es diferente y no estamos editando)
  useEffect(() => {
    if (currentPromotorName && !showDropdown) {
      setSearchTerm(currentPromotorName);
      if (currentPromotorId && currentPromotorName) {
        setSelectedPromotor({ id: currentPromotorId, nombre: currentPromotorName });
        setHasValidSelection(true);
      } else {
        setSelectedPromotor(null);
        setHasValidSelection(false);
      }
    }
  }, [currentPromotorName, currentPromotorId, showDropdown]);

  // Filtrar promotores mientras se escribe
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setFilteredPromotores([]); // ✅ No mostrar nada si no hay texto
    } else {
      const filtered = promotores.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPromotores(filtered);
    }
  }, [searchTerm, promotores]);

  const handleBlur = useCallback(() => {
    setShowDropdown(false);
    
    // Si no hay selección válida, revertir al valor anterior
    if (!hasValidSelection || !selectedPromotor) {
      const wasEdited = searchTerm !== currentPromotorName;
      setSearchTerm(currentPromotorName || "");
      setSelectedPromotor(
        currentPromotorId && currentPromotorName
          ? { id: currentPromotorId, nombre: currentPromotorName }
          : null
      );
      setHasValidSelection(!!currentPromotorId);
      
      // Solo mostrar error si el usuario intentó cambiar pero no seleccionó nada válido
      if (wasEdited && searchTerm.trim().length > 0) {
        toast.error('❌ Promotor no válido', {
          description: 'Debe seleccionar un promotor de la lista'
        });
      }
    }
  }, [hasValidSelection, selectedPromotor, currentPromotorName, currentPromotorId, searchTerm]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleBlur();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleBlur]);

  const handleSelect = async (promotor: Promotor) => {
    setSelectedPromotor(promotor);
    setSearchTerm(promotor.nombre);
    setShowDropdown(false);
    setHasValidSelection(true);

    // Actualizar en el servidor
    if (promotor.id !== currentPromotorId) {
      try {
        setIsUpdating(true);
        await onUpdate(reservationId, promotor.id, promotor.nombre);
        toast.success('✅ Promotor actualizado', {
          description: `Asignado a ${promotor.nombre}`
        });
      } catch (error) {
        console.error('❌ Error al actualizar promotor:', error);
        toast.error('❌ Error al actualizar promotor');
        // Revertir cambio
        setSearchTerm(currentPromotorName || "");
        setSelectedPromotor(
          currentPromotorId && currentPromotorName
            ? { id: currentPromotorId, nombre: currentPromotorName }
            : null
        );
        setHasValidSelection(!!currentPromotorId);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleFocus = () => {
    setShowDropdown(true);
    inputRef.current?.select();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setHasValidSelection(false);
    setShowDropdown(true);

    // Buscar coincidencia exacta
    const exactMatch = promotores.find(
      (p) => p.nombre.toLowerCase() === newValue.toLowerCase()
    );
    if (exactMatch) {
      setHasValidSelection(true);
      setSelectedPromotor(exactMatch);
    } else {
      setSelectedPromotor(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredPromotores.length > 0) {
      e.preventDefault();
      handleSelect(filteredPromotores[0]);
    } else if (e.key === 'Escape') {
      handleBlur();
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Seleccionar promotor"
          disabled={isUpdating}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className={`
            w-32 h-6 text-xs border-2 text-center px-2 pr-6 font-medium rounded-md shadow-sm
            ${isUpdating ? 'bg-gray-100 cursor-wait' : 'bg-white hover:bg-gray-50'}
            ${hasValidSelection 
              ? 'border-green-300 text-gray-900' 
              : 'border-gray-300 text-gray-500'
            }
            focus:bg-white focus:border-blue-500
          `}
        />
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-48 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-32 overflow-y-auto">
          {filteredPromotores.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 text-center">
              No se encontraron promotores
            </div>
          ) : (
            // Mostrar solo el primer resultado (el más relevante)
            <button
              key={filteredPromotores[0].id}
              type="button"
              onClick={() => handleSelect(filteredPromotores[0])}
              className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 flex items-center justify-between group"
            >
              <span className={`font-medium ${
                selectedPromotor?.id === filteredPromotores[0].id ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {filteredPromotores[0].nombre}
              </span>
              {selectedPromotor?.id === filteredPromotores[0].id && (
                <Check className="h-3 w-3 text-blue-600" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
