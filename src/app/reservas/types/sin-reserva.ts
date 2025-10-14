export interface SinReserva {
  id: string;
  businessId: string;
  numeroPersonas: number;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
  registradoPor?: string;
  notas?: string;
  createdAt: string;
}
