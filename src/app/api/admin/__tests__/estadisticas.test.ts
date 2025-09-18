// Test para API endpoint crítico - Admin Stats
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/estadisticas/route';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    business: {
      findFirst: jest.fn(),
    },
    cliente: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    transaccion: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    producto: {
      findMany: jest.fn(),
    },
    consumo: {
      findMany: jest.fn(),
    },
    visitaDiaria: {
      findMany: jest.fn(),
    },
  })),
}));

// Mock Auth middleware
jest.mock('@/middleware/requireAuth', () => ({
  withAuth: jest.fn(),
  AuthConfigs: {},
}));

import { withAuth } from '@/middleware/requireAuth';

describe('/api/admin/estadisticas - CRITICAL Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful authentication
    getServerSession.mockResolvedValue({
      user: {
        id: 'user123',
        role: 'ADMIN',
        businessId: 'business123',
      },
    });

    // Mock business validation
    mockPrisma.business.findFirst.mockResolvedValue({
      id: 'business123',
      name: 'Test Business',
    });
  });

  describe('POST /admin/estadisticas', () => {
    it('should return basic stats for valid business', async () => {
      // Mock data responses
      mockPrisma.cliente.count.mockResolvedValue(150);
      mockPrisma.cliente.findMany.mockResolvedValue([
        { id: '1', cedula: '12345', puntos: 1000, nivel: 'GOLD' },
        { id: '2', cedula: '67890', puntos: 500, nivel: 'SILVER' },
      ]);
      
      mockPrisma.transaccion.count.mockResolvedValue(45);
      mockPrisma.transaccion.findMany.mockResolvedValue([
        { id: '1', monto: 25000, fecha: new Date() },
        { id: '2', monto: 35000, fecha: new Date() },
      ]);

      mockPrisma.visitaDiaria.findMany.mockResolvedValue([
        { fecha: new Date(), visitasTotal: 15 },
        { fecha: new Date(Date.now() - 86400000), visitasTotal: 12 },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/estadisticas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'business123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toHaveProperty('totalClientes');
      expect(data.stats).toHaveProperty('ventasMes');
      expect(data.stats).toHaveProperty('visitasHoy');
      expect(data.stats.totalClientes).toBe(150);
    });

    it('should handle unauthorized access', async () => {
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/estadisticas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'business123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('No autorizado');
    });

    it('should validate business ownership', async () => {
      mockPrisma.business.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/estadisticas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'invalid_business' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('No tienes permisos para acceder a este negocio');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.cliente.count.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/estadisticas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'business123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error interno del servidor');
    });

    it('should return correct analytics calculations', async () => {
      // Mock specific data for calculations
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      
      mockPrisma.cliente.count.mockResolvedValue(100);
      mockPrisma.transaccion.findMany.mockResolvedValue([
        { monto: 50000, fecha: today },
        { monto: 75000, fecha: lastMonth },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/estadisticas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: 'business123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.ventasMes).toBeGreaterThan(0);
      expect(typeof data.stats.ventasMes).toBe('number');
    });
  });
});
