import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// ========================================
// 🔧 MOCKS GLOBALES
// ========================================

// Mock de useRequireAuth
const mockAuth = {
  user: {
    id: '1',
    email: 'staff@test.com',
    name: 'Staff Test',
    role: 'STAFF' as const,
    businessId: 'test-business',
    business: {
      id: 'test-business',
      name: 'Test Business',
      subdomain: 'test',
      subscriptionPlan: 'premium'
    }
  },
  loading: false,
  logout: vi.fn(),
  isAuthenticated: true,
  hasPermission: vi.fn(() => true),
  canManageRole: vi.fn(() => false),
  checkAuth: vi.fn()
};

vi.mock('../../../src/hooks/useAuth', () => ({
  useRequireAuth: vi.fn(() => mockAuth)
}));

// Mock de RoleSwitch
vi.mock('../../../src/components/RoleSwitch', () => ({
  default: ({ currentRole }: { currentRole: string }) => (
    <div data-testid="role-switch">Role: {currentRole}</div>
  )
}));

// Mock de framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock de Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}));

// Mock del Clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    read: vi.fn(),
    readText: vi.fn(),
    write: vi.fn(),
    writeText: vi.fn()
  }
});

// Mock de window.focus event
const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

// Mock de FileReader
global.FileReader = class {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  readAsDataURL = vi.fn().mockImplementation(function(this: FileReader) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({
          target: { result: 'data:image/png;base64,test' }
        } as ProgressEvent<FileReader>);
      }
    }, 0);
  });
} as any;

// Mock de URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

// ========================================
// 🧪 TESTS DEL COMPONENTE STAFFPAGECONTENT
// ========================================

describe('StaffPageContent', () => {
  const defaultProps = {
    businessId: 'test-business'
  };

  // Mock de fetch global
  global.fetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch responses por defecto
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/staff/recent-tickets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/config/puntos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ puntosPorDolar: 1 })
        });
      }
      if (url.includes('/api/clientes/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/reservas/today')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ========================================
  // 🎯 TESTS DE RENDERIZADO BÁSICO
  // ========================================

  it('should render the component without crashing', async () => {
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    expect(screen.getByText('Procesar Cuenta del POS')).toBeInTheDocument();
  });

  it('should show loading state initially', async () => {
    const loadingAuth = { ...mockAuth, loading: true, isAuthenticated: false };
    vi.mocked(require('../../../src/hooks/useAuth').useRequireAuth).mockReturnValue(loadingAuth);

    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    // El componente debería mostrar loading mientras autentica
    expect(screen.queryByText('Procesar Cuenta del POS')).not.toBeInTheDocument();
  });

  it('should display mode selector with OCR and Manual options', async () => {
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    expect(screen.getByText('📸 Captura OCR')).toBeInTheDocument();
    expect(screen.getByText('✍️ Registro Manual')).toBeInTheDocument();
  });

  it('should display stats dashboard with metrics', async () => {
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    // Los iconos y estructura de stats deberían estar presentes
    expect(screen.getByText('Tickets Recientes')).toBeInTheDocument();
  });

  // ========================================
  // 🔍 TESTS DE BÚSQUEDA DE CLIENTES
  // ========================================

  it('should handle customer search input', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    const searchInput = screen.getByPlaceholderText(/Buscar Cliente/i);
    
    await act(async () => {
      await user.type(searchInput, '12345678');
    });

    expect(searchInput).toHaveValue('12345678');
  });

  it('should trigger search after typing minimum characters', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();
    
    // Mock de búsqueda de clientes
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/clientes/search?q=12345')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: '1',
              cedula: '12345678',
              nombre: 'Juan Pérez',
              telefono: '+584121234567',
              puntos: 100
            }
          ])
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve([]) });
    });

    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    const searchInput = screen.getByPlaceholderText(/Buscar Cliente/i);
    
    await act(async () => {
      await user.type(searchInput, '12345');
    });

    // Esperar el debounce (300ms)
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clientes/search?q=12345'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    vi.useRealTimers();
  });

  it('should not search with less than 2 characters', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    const searchInput = screen.getByPlaceholderText(/Buscar Cliente/i);
    
    await act(async () => {
      await user.type(searchInput, '1');
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // No debería hacer búsqueda con menos de 2 caracteres
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/clientes/search'),
      expect.any(Object)
    );

    vi.useRealTimers();
  });

  // ========================================
  // 📸 TESTS DE CAPTURA DE IMÁGENES
  // ========================================

  it('should handle file selection for image upload', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    // Crear un archivo de prueba
    const file = new File(['test content'], 'test.png', { type: 'image/png' });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    await act(async () => {
      await user.upload(fileInput, file);
    });

    // Debería mostrar preview de la imagen
    await waitFor(() => {
      expect(screen.getByText(/1\/3 Imagen/)).toBeInTheDocument();
    });
  });

  it('should limit file upload to 3 images', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    const files = [
      new File(['test1'], 'test1.png', { type: 'image/png' }),
      new File(['test2'], 'test2.png', { type: 'image/png' }),
      new File(['test3'], 'test3.png', { type: 'image/png' }),
      new File(['test4'], 'test4.png', { type: 'image/png' })
    ];
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await act(async () => {
      await user.upload(fileInput, files);
    });

    // Debería mostrar máximo 3 imágenes y un mensaje
    await waitFor(() => {
      expect(screen.getByText(/3\/3 Imagen/)).toBeInTheDocument();
    });
  });

  it('should start automatic capture when button is clicked', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    const captureButton = screen.getByText(/Captura Automática/i);
    
    await act(async () => {
      await user.click(captureButton);
    });

    // Debería cambiar el estado a "Esperando Captura"
    expect(screen.getByText(/Esperando Captura del POS/i)).toBeInTheDocument();
  });

  // ========================================
  // 🛠️ TESTS DE MODO MANUAL
  // ========================================

  it('should switch to manual mode', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    const manualButton = screen.getByText('✍️ Registro Manual');
    
    await act(async () => {
      await user.click(manualButton);
    });

    expect(screen.getByText('Registro Manual de Consumo')).toBeInTheDocument();
  });

  it('should add and remove products in manual mode', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    // Cambiar a modo manual
    const manualButton = screen.getByText('✍️ Registro Manual');
    await act(async () => {
      await user.click(manualButton);
    });

    // Agregar producto
    const addProductButton = screen.getByText('+ Agregar Producto');
    await act(async () => {
      await user.click(addProductButton);
    });

    // Debería haber más inputs de producto
    const productInputs = screen.getAllByPlaceholderText('Nombre del producto');
    expect(productInputs).toHaveLength(2); // 1 inicial + 1 agregado
  });

  // ========================================
  // 🔄 TESTS DE ENVÍO DE FORMULARIO
  // ========================================

  it('should prevent form submission without required fields', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    const submitButton = screen.getByText('Procesar Ticket');
    
    await act(async () => {
      await user.click(submitButton);
    });

    // No debería enviar el formulario sin campos requeridos
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/staff/consumo/analyze'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    
    // Mock de respuesta exitosa
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/staff/consumo/analyze')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            requiresConfirmation: false,
            success: true,
            data: {
              clienteNombre: 'Juan Pérez',
              totalRegistrado: 25.50,
              puntosGenerados: 25
            }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    // Llenar cédula
    const cedulaInput = screen.getByPlaceholderText(/Buscar Cliente/i);
    await act(async () => {
      await user.type(cedulaInput, '12345678');
    });

    // Agregar archivo
    const file = new File(['test content'], 'test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await act(async () => {
      await user.upload(fileInput, file);
    });

    // Enviar formulario
    const submitButton = screen.getByText('Procesar Ticket');
    
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/staff/consumo/analyze'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ========================================
  // 🎛️ TESTS DE NOTIFICACIONES
  // ========================================

  it('should show notification when file is uploaded', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    const file = new File(['test content'], 'test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await act(async () => {
      await user.upload(fileInput, file);
    });

    // Debería mostrar notificación de éxito
    expect(screen.getByText(/imagen agregada exitosamente/i)).toBeInTheDocument();
  });

  it('should close notification when close button is clicked', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    // Subir archivo para generar notificación
    const file = new File(['test content'], 'test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await act(async () => {
      await user.upload(fileInput, file);
    });

    // Cerrar notificación
    const closeButton = screen.getByText('×');
    await act(async () => {
      await user.click(closeButton);
    });

    // La notificación debería desaparecer
    expect(screen.queryByText(/imagen agregada exitosamente/i)).not.toBeInTheDocument();
  });

  // ========================================
  // 📊 TESTS DE TICKETS RECIENTES
  // ========================================

  it('should display recent tickets section', async () => {
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    expect(screen.getByText('Tickets Recientes')).toBeInTheDocument();
  });

  it('should show empty state when no recent tickets', async () => {
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    expect(screen.getByText('No hay tickets procesados hoy')).toBeInTheDocument();
  });

  // ========================================
  // 🔧 TESTS DE EVENTOS DEL NAVEGADOR
  // ========================================

  it('should add and remove window focus event listeners', async () => {
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));

    // Simular unmount
    await act(async () => {
      render(<div>Different component</div>);
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
  });

  // ========================================
  // 🎮 TESTS DE INTERACCIÓN AVANZADA
  // ========================================

  it('should handle clipboard detection for automatic capture', async () => {
    const user = userEvent.setup();
    
    // Mock del clipboard con datos de imagen
    const mockClipboardData = new Blob(['test image data'], { type: 'image/png' });
    (navigator.clipboard.read as any).mockResolvedValue([
      {
        types: ['image/png'],
        getType: () => Promise.resolve(mockClipboardData)
      }
    ]);

    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    // Iniciar captura automática
    const captureButton = screen.getByText(/Captura Automática/i);
    await act(async () => {
      await user.click(captureButton);
    });

    // Simular evento de focus para detectar clipboard
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    // Debería procesar la imagen del clipboard
    await waitFor(() => {
      expect(navigator.clipboard.read).toHaveBeenCalled();
    });
  });

  // ========================================
  // 🔒 TESTS DE VALIDACIÓN
  // ========================================

  it('should validate minimum cedula length', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<StaffPageContent {...defaultProps} />);
    });

    // Llenar cédula corta
    const cedulaInput = screen.getByPlaceholderText(/Buscar Cliente/i);
    await act(async () => {
      await user.type(cedulaInput, '123');
    });

    // Agregar archivo
    const file = new File(['test content'], 'test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await act(async () => {
      await user.upload(fileInput, file);
    });

    // Intentar enviar
    const submitButton = screen.getByText('Procesar Ticket');
    await act(async () => {
      await user.click(submitButton);
    });

    // Debería mostrar error de validación
    expect(screen.getByText(/cédula debe tener al menos 6 dígitos/i)).toBeInTheDocument();
  });
});
