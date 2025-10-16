import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Users, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

interface PersonasAjusteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPersonas: number) => Promise<void>;
  currentPersonas: number;
  clienteName: string;
}

export function PersonasAjusteModal({
  isOpen,
  onClose,
  onConfirm,
  currentPersonas,
  clienteName,
}: Readonly<PersonasAjusteModalProps>) {
  const [personas, setPersonas] = useState<number>(currentPersonas);
  const [isLoading, setIsLoading] = useState(false);

  // Reset cuando se abra el modal o cambie currentPersonas
  useEffect(() => {
    if (isOpen) {
      setPersonas(currentPersonas);
    }
  }, [isOpen, currentPersonas]);

  const handleIncrement = () => {
    setPersonas(prev => Math.min(prev + 1, 99)); // Max 99 personas
  };

  const handleDecrement = () => {
    setPersonas(prev => Math.max(prev - 1, 1)); // Min 1 persona
  };

  const handleConfirm = async () => {
    if (personas === currentPersonas) {
      toast.info("No hay cambios para guardar");
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(personas);
      toast.success(`Número de personas actualizado a ${personas}`);
      onClose();
    } catch (error) {
      console.error("Error al actualizar personas:", error);
      toast.error("Error al actualizar el número de personas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPersonas(currentPersonas); // Reset al cerrar
      onClose();
    }
  };

  const difference = personas - currentPersonas;
  const showDifference = difference !== 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 -m-6 p-6 mb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-gray-900 text-lg font-semibold">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            Ajustar Número de Personas
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Ajusta el número de personas para la reserva de <span className="font-medium text-gray-900">{clienteName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Número actual */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Número actual de personas</div>
            <div className="text-2xl font-bold text-gray-900">{currentPersonas}</div>
          </div>

          {/* Controlador de incremento/decremento */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleDecrement}
              disabled={personas <= 1 || isLoading}
              className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 disabled:opacity-30"
            >
              <Minus className="h-6 w-6 text-gray-700" />
            </Button>

            <div className="w-32 text-center">
              <div className="text-5xl font-bold text-purple-600 mb-1">{personas}</div>
              <div className="text-sm text-gray-500">persona{personas === 1 ? '' : 's'}</div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleIncrement}
              disabled={personas >= 99 || isLoading}
              className="w-14 h-14 rounded-full border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 disabled:opacity-30"
            >
              <Plus className="h-6 w-6 text-gray-700" />
            </Button>
          </div>

          {/* Diferencia */}
          {showDifference && (
            <div className={`text-center p-3 rounded-lg ${
              difference > 0 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="text-sm font-medium">
                {difference > 0 ? (
                  <span className="text-green-700">
                    +{difference} persona{Math.abs(difference) === 1 ? '' : 's'} más
                  </span>
                ) : (
                  <span className="text-orange-700">
                    {difference} persona{Math.abs(difference) === 1 ? '' : 's'} menos
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 pt-4 border-t border-gray-100">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading || personas === currentPersonas}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-md"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              'Confirmar Cambio'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
