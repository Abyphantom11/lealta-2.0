'use client';

import * as React from 'react';
import { Button } from './components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './components/ui/tooltip';

// Componente de prueba para aislar el problema de forwardRef
export default function RadixUITest() {
  return (
    <div className="p-4">
      <h1>Test de Radix UI forwardRef</h1>
      
      {/* Caso 1: Button normal (debería funcionar) */}
      <div className="mb-4">
        <h2>Button normal:</h2>
        <Button variant="outline" size="sm">
          Normal Button
        </Button>
      </div>
      
      {/* Caso 2: Button con Tooltip usando asChild (aquí está el problema) */}
      <div className="mb-4">
        <h2>Button con Tooltip (asChild):</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                Button con Tooltip
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Este es el tooltip</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Caso 3: Button con Tooltip SIN asChild (alternativa) */}
      <div className="mb-4">
        <h2>Button con Tooltip (sin asChild):</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" size="sm">
                Button sin asChild
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tooltip sin asChild</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
