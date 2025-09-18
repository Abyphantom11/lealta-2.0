// Test para middleware crítico - requireAuth
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/requireAuth';

// Mock NextAuth para tests
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    business: {
      findFirst: jest.fn(),
    },
  })),
}));

import { getServerSession } from 'next-auth/next';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('requireAuth Middleware - SECURITY CRITICAL', () => {
  let mockRequest: NextRequest;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
    });
    
    mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
  });

  describe('Authentication Tests', () => {
    it('should reject unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await withAuth(mockRequest, mockHandler);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('No autorizado');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should accept valid authenticated session', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user123',
          email: 'admin@test.com',
          role: 'ADMIN',
          businessId: 'business123'
        }
      });

      await withAuth(mockRequest, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        userId: 'user123',
        email: 'admin@test.com',
        role: 'ADMIN',
        businessId: 'business123'
      });
    });

    it('should handle missing user in session', async () => {
      mockGetServerSession.mockResolvedValue({ user: null });

      const response = await withAuth(mockRequest, mockHandler);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('No autorizado');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Role-based Access Control', () => {
    it('should validate SUPERADMIN role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'super123',
          email: 'super@test.com',
          role: 'SUPERADMIN',
          businessId: null
        }
      });

      await withAuth(mockRequest, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        userId: 'super123',
        email: 'super@test.com',
        role: 'SUPERADMIN',
        businessId: null
      });
    });

    it('should validate ADMIN role with businessId', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin123',
          email: 'admin@business.com',
          role: 'ADMIN',
          businessId: 'business123'
        }
      });

      await withAuth(mockRequest, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        userId: 'admin123',
        email: 'admin@business.com',
        role: 'ADMIN',
        businessId: 'business123'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication service errors', async () => {
      mockGetServerSession.mockRejectedValue(new Error('Auth service down'));

      const response = await withAuth(mockRequest, mockHandler);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error interno del servidor');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});