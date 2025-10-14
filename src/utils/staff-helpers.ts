// Staff helpers para testing
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount);
}

export function calculatePoints(amount: number, multiplier: number = 1): number {
  return Math.floor(amount * multiplier);
}

export function validateCedula(cedula: string): boolean {
  return /^\d{8,10}$/.test(cedula);
}
