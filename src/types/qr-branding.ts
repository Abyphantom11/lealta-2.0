// Tipos para configuración de QR Branding
export interface QRBrandingConfig {
  // Configuración del marco
  marco: {
    enabled: boolean;
    colorPrimario: string;
    colorSecundario: string;
    grosorBorde: number;
    borderRadius: number;
  };
  
  // Configuración del header
  header: {
    mostrarLogo: boolean;
    logoUrl?: string;
    nombreEmpresa: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold' | 'black';
  };
  
  // Configuración del mensaje
  mensaje: {
    texto: string;
    emoji: string;
    fontSize: number;
    color: string;
  };
  
  // Información de contacto
  contacto: {
    mostrarTelefono: boolean;
    telefono?: string;
    mostrarEmail: boolean;
    email?: string;
    mostrarDireccion: boolean;
    direccion?: string;
  };
  
  // 📋 Configuración de campos mostrados
  camposMostrados: {
    nombreCliente: boolean;
    fecha: boolean;
    hora: boolean;
    numeroPersonas: boolean;
    mesa: boolean;
    promotor: boolean;
    observaciones: boolean;
    codigoReserva: boolean;
  };
  
  // 💬 Etiquetas personalizadas
  etiquetas: {
    nombreCliente: string;
    fecha: string;
    hora: string;
    numeroPersonas: string;
    mesa: string;
    promotor: string;
    observaciones: string;
    codigoReserva: string;
  };
  
  // Configuración del QR
  qr: {
    size: number;
    foregroundColor: string;
    backgroundColor: string;
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    incluirLogo: boolean;
    logoSize: number;
  };
  
  // Layout general
  layout: {
    width: number;
    height: number;
    backgroundColor: string;
    padding: number;
  };
}

// Valores por defecto
export const DEFAULT_QR_BRANDING: QRBrandingConfig = {
  marco: {
    enabled: true,
    colorPrimario: '#6366f1',
    colorSecundario: '#8b5cf6',
    grosorBorde: 4,
    borderRadius: 16,
  },
  header: {
    mostrarLogo: true,
    nombreEmpresa: 'Mi Negocio',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mensaje: {
    texto: '¡Te esperamos!',
    emoji: '🎉',
    fontSize: 20,
    color: '#6366f1',
  },
  contacto: {
    mostrarTelefono: true,
    mostrarEmail: true,
    mostrarDireccion: false,
  },
  camposMostrados: {
    nombreCliente: true,
    fecha: true,
    hora: true,
    numeroPersonas: true,
    mesa: false, // ⭐ OFF por defecto
    promotor: false,
    observaciones: false,
    codigoReserva: true,
  },
  etiquetas: {
    nombreCliente: 'Cliente',
    fecha: 'Fecha',
    hora: 'Hora',
    numeroPersonas: 'Personas',
    mesa: 'Mesa',
    promotor: 'Promotor',
    observaciones: 'Observaciones',
    codigoReserva: 'Código',
  },
  qr: {
    size: 300,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    errorCorrectionLevel: 'M',
    incluirLogo: false,
    logoSize: 20,
  },
  layout: {
    width: 600,
    height: 900,
    backgroundColor: '#ffffff',
    padding: 40,
  },
};

// Template para reserva de ejemplo (preview)
export const MOCK_RESERVA = {
  id: 'preview-123',
  cliente: {
    id: 'cliente-123',
    nombre: 'Juan Pérez',
    cedula: '8-888-8888',
    telefono: '+507 6000-0000',
    email: 'juan.perez@email.com',
  },
  fecha: '15 Oct 2025',
  hora: '20:00',
  numeroPersonas: 4,
  mesa: '5', // Opcional
  promotor: {
    id: 'promotor-123',
    nombre: 'María López',
  },
  observaciones: 'Mesa cerca de la ventana',
  qrToken: 'RES-PREVIEW-123',
  estado: 'CONFIRMED' as const,
};
