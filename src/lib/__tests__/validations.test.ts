import { BusinessSchema, ClienteSchema } from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('BusinessSchema', () => {
    it('should validate a correct business object', () => {
      const validBusiness = {
        name: 'Mi Restaurante',
        slug: 'mi-restaurante',
        subdomain: 'mi-rest',
        subscriptionPlan: 'BASIC' as const,
        isActive: true,
      };

      const result = BusinessSchema.safeParse(validBusiness);
      expect(result.success).toBe(true);
    });

    it('should reject invalid business object', () => {
      const invalidBusiness = {
        name: '', // Empty name should fail
        slug: 'mi-restaurante',
        subdomain: 'mi-rest',
        subscriptionPlan: 'INVALID' as any,
        isActive: true,
      };

      const result = BusinessSchema.safeParse(invalidBusiness);
      expect(result.success).toBe(false);
    });
  });

  describe('ClienteSchema', () => {
    it('should validate a correct cliente object', () => {
      const validCliente = {
        cedula: '12345678',
        nombre: 'Juan Pérez',
        correo: 'juan@example.com',
        telefono: '12345678',
      };

      const result = ClienteSchema.safeParse(validCliente);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidCliente = {
        cedula: '12345678',
        nombre: 'Juan Pérez',
        correo: 'invalid-email', // Invalid email
        telefono: '12345678',
      };

      const result = ClienteSchema.safeParse(invalidCliente);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('correo'))).toBe(true);
      }
    });
  });
});
