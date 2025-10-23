import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Clock } from "lucide-react";

interface HoraChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newHora: string) => Promise<void>;
  currentHora: string;
  clienteName: string;
}

export const HoraChangeModal = ({
  isOpen,
  onClose,
  currentHora,
  onConfirm,
  clienteName
}: HoraChangeModalProps) => {
  const [newHora, setNewHora] = useState(currentHora);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetear hora cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setNewHora(currentHora);
    }
  }, [isOpen, currentHora]);

  const handleConfirm = async () => {
    if (!newHora) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(newHora);
      onClose();
    } catch (error) {
      console.error('Error al cambiar hora:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Cambiar Hora de Reserva
          </DialogTitle>
          <DialogDescription>
            Cliente: <span className="font-semibold">{clienteName}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <label htmlFor="nueva-hora" className="block text-sm font-medium text-gray-700 mb-2">
            Nueva hora:
          </label>
          <input
            id="nueva-hora"
            type="time"
            value={newHora}
            onChange={(e) => setNewHora(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            autoFocus
          />
          <p className="mt-2 text-sm text-gray-500">
            Hora actual: <span className="font-semibold">{currentHora}</span>
          </p>
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
            disabled={isSubmitting || !newHora || newHora === currentHora}
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
