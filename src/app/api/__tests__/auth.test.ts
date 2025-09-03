/**
 * @jest-environment node
 */

// Mock Prisma module
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    location: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  }
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST as signInHandler } from '../auth/signin/route';
import { POST as signUpHandler } from '../auth/signup/route';
import { GET as meHandler } from '../auth/me/route';

// Mock Prisma methods
const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  business: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  location: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock bcrypt methods
const mockBcrypt = {
  compare: jest.fn(),
  hash: jest.fn(),
};

describe('Auth API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signin', () => {
    it('should authenticate user with valid credentials', async () => {
      // Mock user data
      const mockUser = {
        id: 'user_1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User',
        role: 'ADMIN',
        isActive: true,
        businessId: 'business_1',
        business: {
          id: 'business_1',
          name: 'Test Business',
          isActive: true,
        },
        loginAttempts: 0,
        lockedUntil: null,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3001/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await signInHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3001/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await signInHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Credenciales inválidas');
    });

    it('should handle account lockout after failed attempts', async () => {
      const mockUser = {
        id: 'user_1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        loginAttempts: 4,
        lockedUntil: null,
        isActive: true,
        business: { isActive: true },
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      const request = new NextRequest('http://localhost:3001/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await signInHandler(request);
      const data = await response.json();

      expect(response.status).toBe(423);
      expect(data.error).toContain('bloqueada');
    });
  });

  describe('POST /api/auth/signup', () => {
    it('should create new business and superadmin', async () => {
      const mockBusiness = {
        id: 'business_1',
        name: 'Test Business',
        subdomain: 'test-business',
      };

      const mockSuperAdmin = {
        id: 'user_1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'SUPERADMIN',
      };

      mockPrisma.business.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedPassword');
      mockPrisma.$transaction.mockResolvedValue({
        business: mockBusiness,
        superAdmin: mockSuperAdmin,
      });

      const request = new NextRequest('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          businessName: 'Test Business',
          subdomain: 'test-business',
          contactEmail: 'contact@test.com',
          adminName: 'Admin User',
          adminEmail: 'admin@test.com',
          adminPassword: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await signUpHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.business.name).toBe('Test Business');
    });

    it('should reject duplicate subdomain', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: 'existing_business',
        subdomain: 'test-business',
      });

      const request = new NextRequest('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          businessName: 'Test Business',
          subdomain: 'test-business',
          contactEmail: 'contact@test.com',
          adminName: 'Admin User',
          adminEmail: 'admin@test.com',
          adminPassword: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await signUpHandler(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('subdominio ya está en uso');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data with valid session', async () => {
      const mockUser = {
        id: 'user_1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        businessId: 'business_1',
        sessionToken: 'valid_token',
        sessionExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        business: {
          id: 'business_1',
          name: 'Test Business',
          isActive: true,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3001/api/auth/me', {
        method: 'GET',
        headers: {
          Cookie: `session=${JSON.stringify({
            userId: 'user_1',
            sessionToken: 'valid_token',
          })}`,
        },
      });

      const response = await meHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.email).toBe('test@example.com');
    });

    it('should reject expired session', async () => {
      const mockUser = {
        id: 'user_1',
        sessionExpires: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
        isActive: true,
        business: { isActive: true },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3001/api/auth/me', {
        method: 'GET',
        headers: {
          Cookie: `session=${JSON.stringify({
            userId: 'user_1',
            sessionToken: 'expired_token',
          })}`,
        },
      });

      const response = await meHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Sesión expirada');
    });
  });
});
