/**
 * 🎯 TEST FIXTURES - DATOS DE PRUEBA PARA E2E
 * Datos consistentes para todos los tests
 */

export const TEST_USERS = {
  admin: {
    cafedani: {
      email: 'admin@cafedani.com',
      password: 'admin123',
      businessId: 'cafedani',
      role: 'ADMIN'
    },
    arepa: {
      email: 'admin@arepa.com', 
      password: 'admin123',
      businessId: 'arepa',
      role: 'ADMIN'
    }
  },
  staff: {
    cafedani: {
      email: 'staff@cafedani.com',
      password: 'staff123', 
      businessId: 'cafedani',
      role: 'STAFF'
    }
  },
  superadmin: {
    email: 'super@lealta.com',
    password: 'super123',
    role: 'SUPERADMIN'
  }
};

export const TEST_CLIENTS = {
  juan: {
    nombre: 'Juan Test',
    cedula: '12345678',
    telefono: '3001234567',
    email: 'juan@test.com'
  },
  maria: {
    nombre: 'María Test',
    cedula: '87654321', 
    telefono: '3009876543',
    email: 'maria@test.com'
  },
  carlos: {
    nombre: 'Carlos Test',
    cedula: '11223344',
    telefono: '3005566778',
    email: 'carlos@test.com'
  }
};

export const TEST_PRODUCTS = {
  cafe: {
    name: 'Café Test E2E',
    price: '8000',
    category: 'Bebidas',
    description: 'Café de prueba para tests E2E'
  },
  sandwich: {
    name: 'Sandwich Test',
    price: '12000', 
    category: 'Comida',
    description: 'Sandwich de prueba'
  },
  postre: {
    name: 'Postre Test',
    price: '6000',
    category: 'Postres', 
    description: 'Postre de prueba'
  }
};

export const TEST_RESERVATIONS = {
  cena: {
    clientName: 'Cliente Reserva Test',
    phone: '3009876543',
    mesa: '5',
    personas: 4,
    notas: 'Mesa para cena romántica'
  },
  almuerzo: {
    clientName: 'Cliente Almuerzo',
    phone: '3001112233',
    mesa: '2', 
    personas: 2,
    notas: 'Almuerzo de negocios'
  }
};

export const TEST_BUSINESS = {
  cafedani: {
    id: 'cafedani',
    name: 'Café Dani',
    subdomain: 'cafedani',
    url: '/cafedani'
  },
  arepa: {
    id: 'arepa',
    name: 'Arepa & Co',
    subdomain: 'arepa', 
    url: '/arepa'
  }
};

export const TEST_CONSUMOS = {
  pequeno: {
    monto: '5000',
    expectedPoints: 1 // 5000/4000 = 1.25 → 1 punto
  },
  mediano: {
    monto: '15000', 
    expectedPoints: 4 // 15000/4000 = 3.75 → 4 puntos
  },
  grande: {
    monto: '25000',
    expectedPoints: 6 // 25000/4000 = 6.25 → 6 puntos
  }
};

export const PERFORMANCE_THRESHOLDS = {
  pageLoadTime: 3000, // 3 segundos máximo
  firstContentfulPaint: 1500, // 1.5 segundos máximo
  timeToInteractive: 3000, // 3 segundos máximo
  apiResponseTime: 1000 // 1 segundo máximo
};

export const TEST_URLS = {
  home: '/',
  login: '/login',
  adminDashboard: (businessId: string) => `/${businessId}/admin`,
  staffPOS: (businessId: string) => `/${businessId}/staff`, 
  clientPortal: (businessId: string) => `/${businessId}/cliente`,
  menu: (businessId: string) => `/${businessId}/admin/menu`,
  clientes: (businessId: string) => `/${businessId}/admin/clientes`,
  reservas: (businessId: string) => `/${businessId}/admin/reservas`,
  reportes: (businessId: string) => `/${businessId}/admin/reportes`
};

/**
 * 🔧 HELPER FUNCTIONS PARA TESTS
 */
export const testHelpers = {
  /**
   * Genera fecha futura para reservas
   */
  getFutureDate: (daysFromNow: number = 1): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  },

  /**
   * Genera número de cédula único
   */
  generateUniqueCedula: (): string => {
    return Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  },

  /**
   * Genera número de teléfono único  
   */
  generateUniquePhone: (): string => {
    return '300' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  },

  /**
   * Genera email único
   */
  generateUniqueEmail: (): string => {
    const timestamp = Date.now();
    return `test${timestamp}@example.com`;
  },

  /**
   * Calcula puntos esperados según monto
   */
  calculateExpectedPoints: (monto: number, pointsPerPeso: number = 4000): number => {
    return Math.floor(monto / pointsPerPeso);
  },

  /**
   * Formatea precio para comparación
   */
  formatPrice: (amount: string): string => {
    const num = parseInt(amount);
    return `$${num.toLocaleString('es-CO')}`;
  },

  /**
   * Espera a que un elemento desaparezca (útil para loaders)
   */
  waitForElementToDisappear: async (page: any, selector: string, timeout: number = 5000) => {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout });
    } catch {
      // El elemento ya no está visible, continuar
    }
  }
};

/**
 * 🎯 SELECTORES COMUNES
 */
export const COMMON_SELECTORS = {
  // Loading states
  loader: '[data-testid="loader"]',
  spinner: '.animate-spin',
  loadingText: 'text=Cargando...',
  
  // Success/Error messages
  successMessage: '[data-testid="success-message"]',
  errorMessage: '[data-testid="error-message"]',
  toast: '[data-testid="toast"]',
  
  // Navigation
  backButton: '[data-testid="back-button"]',
  closeButton: '[data-testid="close-button"]',
  confirmButton: '[data-testid="confirm-button"]',
  cancelButton: '[data-testid="cancel-button"]',
  
  // Forms
  submitButton: '[data-testid="submit-button"]',
  resetButton: '[data-testid="reset-button"]',
  
  // Modals
  modal: '[data-testid="modal"]',
  modalOverlay: '[data-testid="modal-overlay"]',
  modalClose: '[data-testid="modal-close"]'
};
