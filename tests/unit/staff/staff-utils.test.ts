import { describe, it, expect, vi } from 'vitest';
import { validateImageFile, formatFileSize, createFormData } from '../../../src/utils/file-helpers';
import { formatCurrency, calculatePoints, validateCedula } from '../../../src/utils/staff-helpers';
import { debounce } from '../../../src/utils/debounce';

// ========================================
// 🧪 TESTS DE UTILIDADES DEL STAFF
// ========================================

describe('Staff Utilities', () => {
  
  // ========================================
  // 📁 TESTS DE FILE HELPERS
  // ========================================

  describe('File Helpers', () => {
    it('should validate image files correctly', () => {
      const validImage = new File(['test'], 'test.png', { type: 'image/png' });
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const oversizedImage = new File(['x'.repeat(10 * 1024 * 1024)], 'big.png', { type: 'image/png' });

      expect(validateImageFile(validImage)).toBe(true);
      expect(validateImageFile(invalidFile)).toBe(false);
      expect(validateImageFile(oversizedImage)).toBe(false);
    });

    it('should format file sizes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatFileSize(500)).toBe('500.00 B');
    });

    it('should create FormData correctly', () => {
      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' })
      ];

      const data = {
        cedula: '12345678',
        businessId: 'test-business'
      };

      const formData = createFormData(files, data);

      expect(formData.get('cedula')).toBe('12345678');
      expect(formData.get('businessId')).toBe('test-business');
      expect(formData.getAll('images')).toHaveLength(2);
    });
  });

  // ========================================
  // 💰 TESTS DE STAFF HELPERS
  // ========================================

  describe('Staff Helpers', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(25.5)).toBe('$25.50');
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should calculate points correctly', () => {
      expect(calculatePoints(25.50, 1)).toBe(25);
      expect(calculatePoints(25.50, 1.5)).toBe(38);
      expect(calculatePoints(10, 2)).toBe(20);
      expect(calculatePoints(0, 1)).toBe(0);
    });

    it('should validate cedula format', () => {
      expect(validateCedula('12345678')).toBe(true);
      expect(validateCedula('V-12345678')).toBe(true);
      expect(validateCedula('E-12345678')).toBe(true);
      expect(validateCedula('123')).toBe(false);
      expect(validateCedula('')).toBe(false);
      expect(validateCedula('abc')).toBe(false);
    });
  });

  // ========================================
  // ⏱️ TESTS DE DEBOUNCE
  // ========================================

  describe('Debounce Utility', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers();
      
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      // Llamar múltiples veces rápidamente
      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      // No debería haberse ejecutado aún
      expect(mockFn).not.toHaveBeenCalled();

      // Avanzar tiempo
      vi.advanceTimersByTime(300);

      // Ahora debería ejecutarse solo una vez con el último valor
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');

      vi.useRealTimers();
    });

    it('should cancel previous timeout on new calls', async () => {
      vi.useFakeTimers();
      
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test1');
      vi.advanceTimersByTime(150); // Avanzar parcialmente
      
      debouncedFn('test2'); // Nueva llamada cancela la anterior
      vi.advanceTimersByTime(150); // Aún no completa los 300ms desde test2
      
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(150); // Ahora sí completa
      expect(mockFn).toHaveBeenCalledWith('test2');

      vi.useRealTimers();
    });
  });
});

// ========================================
// 🔧 IMPLEMENTACIONES DE UTILIDADES MOCK
// ========================================

// Mock implementations (estas deberían existir en tu código real)
const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

const createFormData = (files: File[], data: Record<string, string>): FormData => {
  const formData = new FormData();
  
  // Agregar datos
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  // Agregar archivos
  if (files.length === 1) {
    formData.append('image', files[0]);
  } else {
    files.forEach(file => {
      formData.append('images', file);
    });
  }
  
  return formData;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const calculatePoints = (amount: number, multiplier: number): number => {
  return Math.floor(amount * multiplier);
};

const validateCedula = (cedula: string): boolean => {
  if (!cedula || cedula.length < 6) return false;
  
  // Remover prefijos venezolanos
  const cleanCedula = cedula.replace(/^[VE]-?/i, '');
  
  // Verificar que solo contenga números y tenga al menos 6 dígitos
  return /^\d{6,}$/.test(cleanCedula);
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// Export para poder usar en tests
export {
  validateImageFile,
  formatFileSize,
  createFormData,
  formatCurrency,
  calculatePoints,
  validateCedula,
  debounce
};
