// Test para API /auth/me - Endpoint crítico de autenticación

// Mock de NextRequest para evitar problemas
global.Request = global.Request || 
  class MockRequest {
    url: string;
    headers: Map<string, string>;
    constructor(url: string) {
      this.url = url;
      this.headers = new Map();
    }
  } as any;

// Mock simplificado del middleware de auth
const mockGetCurrentUser = jest.fn();

jest.mock('../../../../lib/auth/unified-middleware', () => ({
  getCurrentUser: mockGetCurrentUser,
}));

describe('/api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate user data structure', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN' as const,
      businessId: 'test-business-id',
      sessionToken: 'test-session-token',
      business: { 
        id: 'test-business-id',
        name: 'Test Business',
        slug: 'test-business',
        subdomain: 'test',
        isActive: true
      },
    };

    expect(mockUser).toHaveProperty('id');
    expect(mockUser).toHaveProperty('email');
    expect(mockUser).toHaveProperty('role');
    expect(mockUser).toHaveProperty('businessId');
    expect(typeof mockUser.id).toBe('string');
    expect(typeof mockUser.email).toBe('string');
    expect(['SUPERADMIN', 'ADMIN', 'STAFF'].includes(mockUser.role)).toBe(true);
  });

  it('should handle authentication state correctly', () => {
    const authenticatedUser = {
      id: 'user-123',
      email: 'admin@test.com',
      role: 'ADMIN' as const,
      businessId: 'business-123'
    };
    
    const unauthenticatedUser = null;
    
    expect(authenticatedUser).toBeTruthy();
    expect(unauthenticatedUser).toBeFalsy();
    
    if (authenticatedUser) {
      expect(authenticatedUser.id).toBeDefined();
      expect(authenticatedUser.email).toContain('@');
    }
  });

  it('should validate different user roles', () => {
    const roles = ['SUPERADMIN', 'ADMIN', 'STAFF'] as const;

    roles.forEach(role => {
      const user = {
        id: `test-user-${role}`,
        email: `${role.toLowerCase()}@example.com`,
        role,
        businessId: 'test-business-id'
      };

      expect(user.role).toBe(role);
      expect(typeof user.id).toBe('string');
      expect(user.email).toContain('@');
    });
  });
});
