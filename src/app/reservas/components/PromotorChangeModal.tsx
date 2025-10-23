import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { User, UserX } from "lucide-react";
import { PromotorAutocomplete } from "./PromotorAutocomplete";

interface PromotorChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (promotorId: string, promotorName: string) => Promise<void>;
  businessId: string;
  currentPromotorId?: string;
  currentPromotorName: string;
  clienteName: string;
}

export const PromotorChangeModal = ({
  isOpen,
  onClose,
  onConfirm,
  businessId,
  currentPromotorId,
  currentPromotorName,
  clienteName
}: PromotorChangeModalProps) => {
  const [selectedPromotorId, setSelectedPromotorId] = useState<string | undefined>(currentPromotorId);
  const [selectedPromotorName, setSelectedPromotorName] = useState<string>(currentPromotorName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetear cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedPromotorId(currentPromotorId);
      setSelectedPromotorName(currentPromotorName);
    }
  }, [isOpen, currentPromotorId, currentPromotorName]);

  const handlePromotorSelect = (promotorId: string, promotorName: string) => {
    setSelectedPromotorId(promotorId);
    setSelectedPromotorName(promotorName);
  };

  // ✨ Limpiar promotor (sin promotor)
  const handleClearPromotor = () => {
    setSelectedPromotorId(undefined);
    setSelectedPromotorName('');
  };

  const handleConfirm = async () => {
    // Permitir confirmar incluso sin promotor (limpiar)
    if (selectedPromotorId === currentPromotorId) return;
    
    setIsSubmitting(true);
    try {
      // Si no hay promotor seleccionado, enviar valores vacíos
      const promotorId = selectedPromotorId || '';
      const promotorName = selectedPromotorName || 'Sistema';
      
      await onConfirm(promotorId, promotorName);
      onClose();
    } catch (error) {
      console.error('Error al cambiar promotor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanged = selectedPromotorId !== currentPromotorId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Cambiar Promotor
          </DialogTitle>
          <DialogDescription>
            Cliente: <span className="font-semibold">{clienteName}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <label htmlFor="promotor-search" className="block text-sm font-medium text-gray-700 mb-2">
            Buscar y seleccionar promotor:
          </label>
          <PromotorAutocomplete
            businessId={businessId}
            onSelect={handlePromotorSelect}
            onClear={handleClearPromotor}
            value={selectedPromotorId}
            allowEmpty={true}
            placeholder="Buscar promotor o dejar vacío..."
          />
          
          {/* Botón para quitar promotor */}
          {currentPromotorId && (
            <button
              type="button"
              onClick={handleClearPromotor}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <UserX className="h-4 w-4" />
              Quitar promotor (dejar sin promotor)
            </button>
          )}
          
          {/* Información del cambio */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Promotor actual:</span>
              <span className="font-semibold text-gray-900">{currentPromotorName || 'Sistema'}</span>
            </div>
            
            {hasChanged && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Nuevo promotor:</span>
                <span className="font-semibold text-green-600">
                  {selectedPromotorName || 'Sistema (sin promotor)'}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !hasChanged}
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar Cambio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
