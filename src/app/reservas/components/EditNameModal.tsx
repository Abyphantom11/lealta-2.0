'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EditNameModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (newName: string) => Promise<void>;
  readonly currentName: string;
}

export function EditNameModal({ isOpen, onClose, onConfirm, currentName }: Readonly<EditNameModalProps>) {
  const [newName, setNewName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newName.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    if (newName.trim() === currentName.trim()) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(newName.trim());
      onClose();
    } catch (error) {
      console.error('Error al actualizar nombre:', error);
      alert('Error al actualizar el nombre. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar nombre del cliente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del cliente"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            Este cambio se reflejará en la base de datos del cliente.
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
