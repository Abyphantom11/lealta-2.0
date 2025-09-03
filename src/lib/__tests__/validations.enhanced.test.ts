import { 
  BusinessSchema, 
  ClienteSchema, 
  ConsumoSchema, 
  MenuCategorySchema, 
  MenuItemSchema,
  UserSchema 
} from '../validations';

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

    it('should reject empty name', () => {
      const invalidBusiness = {
        name: '', 
        slug: 'mi-restaurante',
        subdomain: 'mi-rest',
        subscriptionPlan: 'BASIC' as const,
        isActive: true,
      };

      const result = BusinessSchema.safeParse(invalidBusiness);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('name') && issue.message.includes('Nombre requerido')
        )).toBe(true);
      }
    });

    it('should reject invalid subscription plan', () => {
      const invalidBusiness = {
        name: 'Mi Restaurante',
        slug: 'mi-restaurante',
        subdomain: 'mi-rest',
        subscriptionPlan: 'INVALID' as any,
        isActive: true,
      };

      const result = BusinessSchema.safeParse(invalidBusiness);
      expect(result.success).toBe(false);
    });

    it('should accept valid custom domain', () => {
      const validBusiness = {
        name: 'Mi Restaurante',
        slug: 'mi-restaurante',
        subdomain: 'mi-rest',
        customDomain: 'https://mi-restaurante.com',
        subscriptionPlan: 'PRO' as const,
        isActive: true,
      };

      const result = BusinessSchema.safeParse(validBusiness);
      expect(result.success).toBe(true);
    });

    it('should reject invalid custom domain', () => {
      const invalidBusiness = {
        name: 'Mi Restaurante',
        slug: 'mi-restaurante',
        subdomain: 'mi-rest',
        customDomain: 'invalid-url',
        subscriptionPlan: 'PRO' as const,
        isActive: true,
      };

      const result = BusinessSchema.safeParse(invalidBusiness);
      expect(result.success).toBe(false);
    });
  });

  describe('UserSchema', () => {
    it('should validate a correct user object', () => {
      const validUser = {
        email: 'usuario@example.com',
        name: 'Juan Pérez',
        role: 'ADMIN' as const,
        isActive: true,
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        name: 'Juan Pérez',
        role: 'ADMIN' as const,
        isActive: true,
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('email')
        )).toBe(true);
      }
    });

    it('should reject invalid role', () => {
      const invalidUser = {
        email: 'usuario@example.com',
        name: 'Juan Pérez',
        role: 'INVALID_ROLE' as any,
        isActive: true,
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should default isActive to true', () => {
      const userWithoutActive = {
        email: 'usuario@example.com',
        name: 'Juan Pérez',
        role: 'STAFF' as const,
      };

      const result = UserSchema.safeParse(userWithoutActive);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
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
        correo: 'invalid-email',
        telefono: '12345678',
      };

      const result = ClienteSchema.safeParse(invalidCliente);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('correo')
        )).toBe(true);
      }
    });

    it('should reject short cedula', () => {
      const invalidCliente = {
        cedula: '123',
        nombre: 'Juan Pérez',
        correo: 'juan@example.com',
        telefono: '12345678',
      };

      const result = ClienteSchema.safeParse(invalidCliente);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('cedula')
        )).toBe(true);
      }
    });

    it('should reject short telefono', () => {
      const invalidCliente = {
        cedula: '12345678',
        nombre: 'Juan Pérez',
        correo: 'juan@example.com',
        telefono: '123',
      };

      const result = ClienteSchema.safeParse(invalidCliente);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('telefono')
        )).toBe(true);
      }
    });
  });

  describe('ConsumoSchema', () => {
    it('should validate a correct consumo object', () => {
      const validConsumo = {
        clienteId: 'cliente_123',
        monto: 25.50,
        descripcion: 'Compra de productos',
      };

      const result = ConsumoSchema.safeParse(validConsumo);
      expect(result.success).toBe(true);
    });

    it('should allow consumo without descripcion', () => {
      const validConsumo = {
        clienteId: 'cliente_123',
        monto: 25.50,
      };

      const result = ConsumoSchema.safeParse(validConsumo);
      expect(result.success).toBe(true);
    });

    it('should reject negative monto', () => {
      const invalidConsumo = {
        clienteId: 'cliente_123',
        monto: -10,
        descripcion: 'Compra de productos',
      };

      const result = ConsumoSchema.safeParse(invalidConsumo);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('monto')
        )).toBe(true);
      }
    });

    it('should reject empty clienteId', () => {
      const invalidConsumo = {
        clienteId: '',
        monto: 25.50,
      };

      const result = ConsumoSchema.safeParse(invalidConsumo);
      expect(result.success).toBe(false);
    });
  });

  describe('MenuCategorySchema', () => {
    it('should validate a correct category object', () => {
      const validCategory = {
        nombre: 'Bebidas',
        descripcion: 'Categoría de bebidas',
        activo: true,
        orden: 1,
      };

      const result = MenuCategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it('should default activo to true', () => {
      const categoryWithoutActivo = {
        nombre: 'Bebidas',
        orden: 1,
      };

      const result = MenuCategorySchema.safeParse(categoryWithoutActivo);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activo).toBe(true);
      }
    });

    it('should accept parentId', () => {
      const categoryWithParent = {
        nombre: 'Subcategoría',
        orden: 1,
        parentId: 'parent_123',
      };

      const result = MenuCategorySchema.safeParse(categoryWithParent);
      expect(result.success).toBe(true);
    });

    it('should reject negative orden', () => {
      const invalidCategory = {
        nombre: 'Bebidas',
        orden: -1,
      };

      const result = MenuCategorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });
  });

  describe('MenuItemSchema', () => {
    it('should validate a correct menu item', () => {
      const validItem = {
        nombre: 'Café Americano',
        descripcion: 'Café negro tradicional',
        precio: 5.50,
        tipoProducto: 'simple' as const,
        disponible: true,
        destacado: false,
        orden: 1,
      };

      const result = MenuItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should validate bebida type with prices', () => {
      const validBebida = {
        nombre: 'Cerveza',
        descripcion: 'Cerveza nacional',
        precioVaso: 3.50,
        precioBotella: 8.00,
        tipoProducto: 'bebida' as const,
      };

      const result = MenuItemSchema.safeParse(validBebida);
      expect(result.success).toBe(true);
    });

    it('should default values correctly', () => {
      const minimalItem = {
        nombre: 'Producto Simple',
      };

      const result = MenuItemSchema.safeParse(minimalItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tipoProducto).toBe('simple');
        expect(result.data.disponible).toBe(true);
        expect(result.data.destacado).toBe(false);
        expect(result.data.orden).toBe(0);
      }
    });

    it('should reject invalid tipoProducto', () => {
      const invalidItem = {
        nombre: 'Producto',
        tipoProducto: 'invalid' as any,
      };

      const result = MenuItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject negative prices', () => {
      const invalidItem = {
        nombre: 'Producto',
        precio: -5,
      };

      const result = MenuItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('precio')
        )).toBe(true);
      }
    });
  });
});
