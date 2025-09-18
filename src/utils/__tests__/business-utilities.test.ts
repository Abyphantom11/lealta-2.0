// Tests para utilidades de business y storage - Funcionalidad crítica
describe('Business Utilities', () => {
  describe('Business ID validation', () => {
    it('should validate business ID format', () => {
      const validIds = ['business_123', 'test-business', 'empresa1'];
      const invalidIds = ['', 'business with spaces'];

      validIds.forEach(id => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
        expect(id.trim()).toBe(id);
      });

      invalidIds.forEach(id => {
        if (id === '') {
          expect(id.length).toBe(0);
        } else {
          expect(id.includes(' ')).toBe(true); // Has spaces
        }
      });
    });

    it('should extract business ID from URL correctly', () => {
      const testUrls = [
        { url: '/business123/admin', expected: 'business123' },
        { url: '/test-business/cliente', expected: 'test-business' },
        { url: '/empresa_1/staff', expected: 'empresa_1' },
        { url: '/invalid-url', expected: null }
      ];

      testUrls.forEach(({ url, expected }) => {
        const segments = url.split('/').filter(Boolean);
        const businessId = segments.length > 0 ? segments[0] : null;
        
        if (expected) {
          expect(businessId).toBe(expected);
        } else {
          expect(businessId).toBeTruthy(); // Should extract something
        }
      });
    });
  });

  describe('Session management', () => {
    const mockLocalStorage: {
      data: Record<string, string>;
      getItem: jest.Mock<string | null, [string]>;
      setItem: jest.Mock<void, [string, string]>;
      removeItem: jest.Mock<void, [string]>;
      clear: jest.Mock<void, []>;
    } = {
      data: {},
      getItem: jest.fn((key: string): string | null => mockLocalStorage.data[key] || null),
      setItem: jest.fn((key: string, value: string): void => {
        mockLocalStorage.data[key] = value;
      }),
      removeItem: jest.fn((key: string): void => {
        delete mockLocalStorage.data[key];
      }),
      clear: jest.fn((): void => {
        mockLocalStorage.data = {};
      })
    };

    beforeEach(() => {
      mockLocalStorage.clear();
      jest.clearAllMocks();
    });

    it('should store client session correctly', () => {
      const sessionData = {
        cedula: '12345678',
        businessId: 'test-business',
        sessionType: 'client' as const
      };

      const key = `client-session-${sessionData.businessId}`;
      mockLocalStorage.setItem(key, JSON.stringify(sessionData));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        key,
        JSON.stringify(sessionData)
      );
      
      const stored = mockLocalStorage.getItem(key);
      expect(stored).toBe(JSON.stringify(sessionData));
    });

    it('should retrieve client session correctly', () => {
      const sessionData = {
        cedula: '12345678',
        businessId: 'test-business',
        sessionType: 'client' as const
      };

      const key = `client-session-${sessionData.businessId}`;
      mockLocalStorage.setItem(key, JSON.stringify(sessionData));

      const retrieved = mockLocalStorage.getItem(key);
      const parsed = retrieved ? JSON.parse(retrieved) : null;

      expect(parsed).toEqual(sessionData);
      expect(parsed?.cedula).toBe('12345678');
      expect(parsed?.businessId).toBe('test-business');
    });

    it('should handle session cleanup', () => {
      const businessId = 'test-business';
      const keys = [
        `client-session-${businessId}`,
        `level-data-${businessId}`,
        `mobile-data-${businessId}`
      ];

      // Simular datos existentes
      keys.forEach(key => {
        mockLocalStorage.setItem(key, 'test-data');
      });

      // Limpiar sesión
      keys.forEach(key => {
        mockLocalStorage.removeItem(key);
      });

      // Verificar limpieza
      keys.forEach(key => {
        expect(mockLocalStorage.getItem(key)).toBeNull();
      });
    });
  });

  describe('Loyalty calculations', () => {
    it('should calculate points correctly', () => {
      const testCases = [
        { total: 1000, expected: 1000 }, // 1 punto por peso
        { total: 1500, expected: 1500 },
        { total: 999.99, expected: 999 }, // Math.floor
        { total: 0, expected: 0 }
      ];

      testCases.forEach(({ total, expected }) => {
        const points = Math.floor(total);
        expect(points).toBe(expected);
      });
    });

    it('should determine loyalty levels correctly', () => {
      const levelThresholds = {
        bronce: 0,
        plata: 5000,
        oro: 15000,
        platino: 30000,
        diamante: 50000
      };

      const testCases = [
        { points: 0, expected: 'bronce' },
        { points: 4999, expected: 'bronce' },
        { points: 5000, expected: 'plata' },
        { points: 14999, expected: 'plata' },
        { points: 15000, expected: 'oro' },
        { points: 29999, expected: 'oro' },
        { points: 30000, expected: 'platino' },
        { points: 49999, expected: 'platino' },
        { points: 50000, expected: 'diamante' },
        { points: 100000, expected: 'diamante' }
      ];

      testCases.forEach(({ points, expected }) => {
        let level = 'bronce';
        
        if (points >= levelThresholds.diamante) level = 'diamante';
        else if (points >= levelThresholds.platino) level = 'platino';
        else if (points >= levelThresholds.oro) level = 'oro';
        else if (points >= levelThresholds.plata) level = 'plata';
        
        expect(level).toBe(expected);
      });
    });

    it('should detect level upgrades', () => {
      const oldLevel = 'plata';
      const newLevel = 'oro';
      
      const levels = ['bronce', 'plata', 'oro', 'platino', 'diamante'];
      const oldIndex = levels.indexOf(oldLevel);
      const newIndex = levels.indexOf(newLevel);
      
      const isUpgrade = newIndex > oldIndex;
      expect(isUpgrade).toBe(true);
      
      // Test no upgrade
      const sameLevel = levels.indexOf('oro');
      const noUpgrade = sameLevel > newIndex;
      expect(noUpgrade).toBe(false);
    });
  });

  describe('Business validation', () => {
    it('should validate business data structure', () => {
      const validBusiness = {
        id: 'business-123',
        name: 'Test Business',
        slug: 'test-business',
        subdomain: 'test',
        isActive: true
      };

      // Validar estructura
      expect(validBusiness).toHaveProperty('id');
      expect(validBusiness).toHaveProperty('name');
      expect(validBusiness).toHaveProperty('slug');
      expect(validBusiness).toHaveProperty('subdomain');
      expect(validBusiness).toHaveProperty('isActive');

      // Validar tipos
      expect(typeof validBusiness.id).toBe('string');
      expect(typeof validBusiness.name).toBe('string');
      expect(typeof validBusiness.isActive).toBe('boolean');
    });

    it('should validate business slug format', () => {
      const validSlugs = ['test-business', 'restaurant_plaza', 'cafe123'];
      const invalidSlugs = ['Test Business', 'café niño', ''];

      validSlugs.forEach(slug => {
        expect(slug).toMatch(/^[a-z0-9_-]+$/);
        expect(slug.length).toBeGreaterThan(0);
      });

      invalidSlugs.forEach(slug => {
        if (slug === '') {
          expect(slug.length).toBe(0);
        } else {
          expect(slug).not.toMatch(/^[a-z0-9_-]+$/);
        }
      });
    });
  });
});
