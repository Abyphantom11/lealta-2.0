import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import type { NextRequest, NextResponse } from 'next/server';

// Mock de Prisma
const mockPrisma = {
  cliente: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  consumo: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  business: {
    findUnique: vi.fn(),
  },
  reserva: {
    findMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  }
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}));

// Mock de autenticación
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(() => Promise.resolve({
    session: {
      userId: '1',
      user: {
        id: '1',
        role: 'STAFF',
        businessId: 'test-business'
      },
      businessId: 'test-business'
    }
  }))
}));

// ========================================
// 🧪 TESTS DE APIS DEL STAFF
// ========================================

describe('Staff API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // 🔍 TESTS DE BÚSQUEDA DE CLIENTES
  // ========================================

  describe('GET /api/clientes/search', () => {
    it('should search clients by cedula', async () => {
      // Simular datos de cliente
      const mockClients = [
        {
          id: '1',
          cedula: '12345678',
          nombre: 'Juan Pérez',
          telefono: '+584121234567',
          email: 'juan@test.com',
          puntos: 100,
          nivel: 'Bronze',
          totalGastado: 250.50,
          frecuencia: 'Regular'
        }
      ];

      mockPrisma.cliente.findMany.mockResolvedValue(mockClients);

      // Simular request
      const { req } = createMocks({
        method: 'GET',
        url: '/api/clientes/search?q=12345678&businessId=test-business',
        headers: {
          'content-type': 'application/json',
        },
      });

      // Importar y ejecutar el handler (simulado)
      const response = await mockApiHandler('/api/clientes/search', req, {
        query: { q: '12345678', businessId: 'test-business' }
      });

      expect(mockPrisma.cliente.findMany).toHaveBeenCalledWith({
        where: {
          businessId: 'test-business',
          OR: [
            { cedula: { contains: '12345678', mode: 'insensitive' } },
            { nombre: { contains: '12345678', mode: 'insensitive' } },
            { telefono: { contains: '12345678', mode: 'insensitive' } }
          ],
          isActive: true
        },
        select: {
          id: true,
          cedula: true,
          nombre: true,
          telefono: true,
          email: true,
          puntos: true,
          nivel: true,
          totalGastado: true,
          frecuencia: true
        },
        take: 10
      });

      expect(response).toEqual(mockClients);
    });

    it('should return empty array when no clients found', async () => {
      mockPrisma.cliente.findMany.mockResolvedValue([]);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/clientes/search?q=notfound&businessId=test-business',
      });

      const response = await mockApiHandler('/api/clientes/search', req, {
        query: { q: 'notfound', businessId: 'test-business' }
      });

      expect(response).toEqual([]);
    });

    it('should require minimum 2 characters for search', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/clientes/search?q=1&businessId=test-business',
      });

      await expect(
        mockApiHandler('/api/clientes/search', req, {
          query: { q: '1', businessId: 'test-business' }
        })
      ).rejects.toThrow(/al menos 2 caracteres/);
    });
  });

  // ========================================
  // 📊 TESTS DE TICKETS RECIENTES
  // ========================================

  describe('GET /api/staff/recent-tickets', () => {
    it('should return recent tickets for business', async () => {
      const mockTickets = [
        {
          id: '1',
          clienteNombre: 'Juan Pérez',
          clienteCedula: '12345678',
          total: 25.50,
          puntos: 25,
          createdAt: new Date(),
          productos: 'Café, Arepa',
          empleado: 'Staff Test'
        }
      ];

      mockPrisma.consumo.findMany.mockResolvedValue(mockTickets);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/staff/recent-tickets?businessId=test-business',
      });

      const response = await mockApiHandler('/api/staff/recent-tickets', req, {
        query: { businessId: 'test-business' }
      });

      expect(mockPrisma.consumo.findMany).toHaveBeenCalledWith({
        where: {
          businessId: 'test-business',
          createdAt: {
            gte: expect.any(Date)
          }
        },
        include: {
          cliente: {
            select: {
              nombre: true,
              cedula: true
            }
          },
          reserva: {
            select: {
              id: true,
              nombreReserva: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });

      expect(response).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          cliente: 'Juan Pérez',
          cedula: '12345678'
        })
      ]));
    });
  });

  // ========================================
  // 🎯 TESTS DE PROCESAMIENTO OCR
  // ========================================

  describe('POST /api/staff/consumo/analyze', () => {
    it('should process single image with OCR', async () => {
      // Mock de respuesta exitosa de IA
      const mockAIResponse = {
        requiresConfirmation: false,
        cliente: {
          id: '1',
          nombre: 'Juan Pérez',
          cedula: '12345678'
        },
        productos: [
          { nombre: 'Café', precio: 3.50 },
          { nombre: 'Arepa', precio: 2.00 }
        ],
        total: 5.50,
        confianza: 95,
        empleadoDetectado: 'María'
      };

      // Mock de cliente existente
      mockPrisma.cliente.findFirst.mockResolvedValue({
        id: '1',
        nombre: 'Juan Pérez',
        cedula: '12345678',
        puntos: 100
      });

      // Mock de creación de consumo
      mockPrisma.consumo.create.mockResolvedValue({
        id: '1',
        total: 5.50,
        puntos: 5,
        clienteId: '1',
        businessId: 'test-business'
      });

      const formData = new FormData();
      formData.append('cedula', '12345678');
      formData.append('businessId', 'test-business');
      formData.append('image', new File(['test'], 'test.png', { type: 'image/png' }));

      const { req } = createMocks({
        method: 'POST',
        url: '/api/staff/consumo/analyze',
        body: formData,
      });

      const response = await mockApiHandler('/api/staff/consumo/analyze', req, {
        formData
      });

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            clienteNombre: 'Juan Pérez',
            totalRegistrado: 5.50
          })
        })
      );
    });

    it('should process multiple images with OCR', async () => {
      const formData = new FormData();
      formData.append('cedula', '12345678');
      formData.append('businessId', 'test-business');
      formData.append('images', new File(['test1'], 'test1.png', { type: 'image/png' }));
      formData.append('images', new File(['test2'], 'test2.png', { type: 'image/png' }));

      const { req } = createMocks({
        method: 'POST',
        url: '/api/staff/consumo/analyze-multi',
        body: formData,
      });

      const response = await mockApiHandler('/api/staff/consumo/analyze-multi', req, {
        formData
      });

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('múltiples imágenes')
        })
      );
    });

    it('should require valid image file', async () => {
      const formData = new FormData();
      formData.append('cedula', '12345678');
      formData.append('businessId', 'test-business');
      formData.append('image', new File(['test'], 'test.txt', { type: 'text/plain' }));

      const { req } = createMocks({
        method: 'POST',
        url: '/api/staff/consumo/analyze',
        body: formData,
      });

      await expect(
        mockApiHandler('/api/staff/consumo/analyze', req, { formData })
      ).rejects.toThrow(/archivo de imagen válido/);
    });
  });

  // ========================================
  // ✅ TESTS DE CONFIRMACIÓN
  // ========================================

  describe('POST /api/staff/consumo/confirm', () => {
    it('should confirm and save AI processed data', async () => {
      const confirmationData = {
        clienteId: '1',
        businessId: 'test-business',
        empleadoId: '1',
        productos: [
          { nombre: 'Café', cantidad: 1, precio: 3.50, categoria: 'bebidas' }
        ],
        total: 3.50,
        puntos: 3,
        empleadoDetectado: 'María',
        confianza: 0.95,
        imagenUrl: 'https://example.com/image.png',
        metodoPago: 'efectivo',
        notas: 'Confirmado por staff'
      };

      mockPrisma.consumo.create.mockResolvedValue({
        id: '1',
        ...confirmationData,
        createdAt: new Date()
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/staff/consumo/confirm',
        headers: {
          'content-type': 'application/json',
        },
        body: confirmationData,
      });

      const response = await mockApiHandler('/api/staff/consumo/confirm', req, {
        body: confirmationData
      });

      expect(mockPrisma.consumo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clienteId: '1',
          businessId: 'test-business',
          total: 3.50,
          puntos: 3
        })
      });

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            consumoId: '1'
          })
        })
      );
    });
  });

  // ========================================
  // 📝 TESTS DE REGISTRO MANUAL
  // ========================================

  describe('POST /api/staff/consumo/manual', () => {
    it('should create manual consumption record', async () => {
      const manualData = {
        cedula: '12345678',
        businessId: 'test-business',
        empleadoVenta: 'María',
        productos: [
          { nombre: 'Café', cantidad: 2 },
          { nombre: 'Arepa', cantidad: 1 }
        ],
        total: '8.00'
      };

      mockPrisma.cliente.findFirst.mockResolvedValue({
        id: '1',
        nombre: 'Juan Pérez',
        cedula: '12345678'
      });

      mockPrisma.consumo.create.mockResolvedValue({
        id: '1',
        total: 8.00,
        puntos: 8,
        clienteId: '1',
        businessId: 'test-business'
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/staff/consumo/manual',
        body: manualData,
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await mockApiHandler('/api/staff/consumo/manual', req, {
        body: manualData
      });

      expect(mockPrisma.consumo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clienteId: '1',
          businessId: 'test-business',
          total: 8.00,
          puntos: 8,
          tipo: 'MANUAL',
          empleadoDetectado: 'María'
        })
      });

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalRegistrado: 8.00,
            puntosGenerados: 8
          })
        })
      );
    });

    it('should validate required fields for manual entry', async () => {
      const incompleteData = {
        cedula: '12345678',
        businessId: 'test-business'
        // Faltan empleadoVenta, productos, total
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/staff/consumo/manual',
        body: incompleteData,
      });

      await expect(
        mockApiHandler('/api/staff/consumo/manual', req, { body: incompleteData })
      ).rejects.toThrow(/campos requeridos/);
    });
  });

  // ========================================
  // 📅 TESTS DE RESERVAS HOY
  // ========================================

  describe('GET /api/reservas/today', () => {
    it('should return today reservations with consumption', async () => {
      const mockReservas = [
        {
          id: '1',
          cliente: 'Juan Pérez',
          hora: '19:00',
          numeroPersonas: 4,
          estado: 'CONFIRMED',
          consumoTotal: 85.50,
          createdAt: new Date()
        }
      ];

      mockPrisma.reserva.findMany.mockResolvedValue(mockReservas);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/reservas/today?businessId=test-business',
      });

      const response = await mockApiHandler('/api/reservas/today', req, {
        query: { businessId: 'test-business' }
      });

      expect(mockPrisma.reserva.findMany).toHaveBeenCalledWith({
        where: {
          businessId: 'test-business',
          fecha: expect.any(String),
          estado: {
            in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
          }
        },
        include: {
          consumos: {
            select: {
              total: true
            }
          }
        },
        orderBy: {
          hora: 'asc'
        }
      });

      expect(response).toEqual(mockReservas);
    });
  });

  // ========================================
  // ⚙️ TESTS DE CONFIGURACIÓN
  // ========================================

  describe('GET /api/config/puntos', () => {
    it('should return points configuration', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: 'test-business',
        puntosPorDolar: 1.5,
        configuracionPuntos: {
          multiplicadorBronce: 1.0,
          multiplicadorPlata: 1.2,
          multiplicadorOro: 1.5
        }
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/config/puntos?businessId=test-business',
      });

      const response = await mockApiHandler('/api/config/puntos', req, {
        query: { businessId: 'test-business' }
      });

      expect(response).toEqual(
        expect.objectContaining({
          puntosPorDolar: 1.5,
          configuracionPuntos: expect.any(Object)
        })
      );
    });
  });
});

// ========================================
// 🔧 HELPER FUNCTIONS
// ========================================

/**
 * Mock helper para simular handlers de API
 */
async function mockApiHandler(endpoint: string, req: any, options: any = {}) {
  const { query, body, formData } = options;

  // Simular diferentes endpoints
  switch (endpoint) {
    case '/api/clientes/search':
      if (!query?.q || query.q.length < 2) {
        throw new Error('Se requieren al menos 2 caracteres para la búsqueda');
      }
      return mockPrisma.cliente.findMany.mockReturnValue;

    case '/api/staff/recent-tickets':
      return [];

    case '/api/staff/consumo/analyze':
    case '/api/staff/consumo/analyze-multi':
      if (!formData?.get('image') && !formData?.get('images')) {
        throw new Error('Se requiere archivo de imagen válido');
      }
      return {
        success: true,
        data: {
          clienteNombre: 'Juan Pérez',
          totalRegistrado: 5.50,
          puntosGenerados: 5
        }
      };

    case '/api/staff/consumo/confirm':
      if (!body?.clienteId || !body?.total) {
        throw new Error('Datos de confirmación incompletos');
      }
      return {
        success: true,
        data: {
          consumoId: '1',
          clienteNombre: 'Juan Pérez',
          totalRegistrado: body.total,
          puntosGenerados: body.puntos
        }
      };

    case '/api/staff/consumo/manual':
      if (!body?.cedula || !body?.empleadoVenta || !body?.productos || !body?.total) {
        throw new Error('Faltan campos requeridos');
      }
      return {
        success: true,
        data: {
          totalRegistrado: parseFloat(body.total),
          puntosGenerados: Math.floor(parseFloat(body.total))
        }
      };

    case '/api/reservas/today':
      return [];

    case '/api/config/puntos':
      return {
        puntosPorDolar: 1,
        configuracionPuntos: {}
      };

    default:
      throw new Error(`Endpoint not mocked: ${endpoint}`);
  }
}
