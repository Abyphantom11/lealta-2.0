// Test para middleware crítico - requireAuth
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/middleware/requireAuth';

// Mock del módulo de seguridad
vi.mock('@/middleware/security', () => ({
  validateUserSession: vi.fn(),
  hasPermission: vi.fn(),
}));

import { validateUserSession, hasPermission } from '@/middleware/security';

describe('requireAuth Middleware - SECURITY CRITICAL', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRequest = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
    });
  });

  describe('Authentication Tests', () => {
    it('should reject unauthenticated requests', async () => {
      // Mock: No session cookie
      vi.spyOn(mockRequest.cookies, 'get').mockReturnValue(undefined);

      const result = await requireAuth(mockRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        const data = await result.response.json();
        expect(result.response.status).toBe(401);
        expect(data.error).toBe('Authentication required');
      }
    });

    it('should accept valid authenticated session', async () => {
      // Mock: Valid session cookie
      vi.spyOn(mockRequest.cookies, 'get').mockReturnValue({
        name: 'session',
        value: 'valid-token-123'
      } as any);

      // Mock: Valid user session
      vi.mocked(validateUserSession).mockResolvedValue({
        userId: 'user123',
        email: 'admin@test.com',
        role: 'admin',
        businessId: 'business123'
      } as any);

      vi.mocked(hasPermission).mockReturnValue(true);

      const result = await requireAuth(mockRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.userId).toBe('user123');
        expect(result.session.role).toBe('admin');
      }
    });

    it('should handle missing user in session', async () => {
      // Mock: No session cookie
      vi.spyOn(mockRequest.cookies, 'get').mockReturnValue(undefined);

      const result = await requireAuth(mockRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        const data = await result.response.json();
        expect(result.response.status).toBe(401);
        expect(data.error).toBe('Authentication required');
      }
    });
  });

  describe('Role-based Access Control', () => {
    it('should validate SUPERADMIN role', async () => {
      vi.spyOn(mockRequest.cookies, 'get').mockReturnValue({
        name: 'session',
        value: 'super-token-123'
      } as any);

      vi.mocked(validateUserSession).mockResolvedValue({
        userId: 'super123',
        email: 'super@test.com',
        role: 'superadmin',
        businessId: null
      } as any);

      vi.mocked(hasPermission).mockReturnValue(true);

      const result = await requireAuth(mockRequest, {
        allowedRoles: ['superadmin']
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.role).toBe('superadmin');
      }
    });

    it('should validate ADMIN role with businessId', async () => {
      vi.spyOn(mockRequest.cookies, 'get').mockReturnValue({
        name: 'session',
        value: 'admin-token-123'
      } as any);

      vi.mocked(validateUserSession).mockResolvedValue({
        userId: 'admin123',
        email: 'admin@business.com',
        role: 'admin',
        businessId: 'business123'
      } as any);

      vi.mocked(hasPermission).mockReturnValue(true);

      const result = await requireAuth(mockRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.session.businessId).toBe('business123');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication service errors', async () => {
      vi.spyOn(mockRequest.cookies, 'get').mockReturnValue({
        name: 'session',
        value: 'token-123'
      } as any);

      vi.mocked(validateUserSession).mockRejectedValue(new Error('Auth service down'));

      const result = await requireAuth(mockRequest);

      // When validation fails, it should return 401 (no valid session)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
      }
    });
  });
});