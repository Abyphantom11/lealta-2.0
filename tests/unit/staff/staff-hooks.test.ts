import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCustomerSearch } from '../../../src/hooks/useCustomerSearch';
import { useImageCapture } from '../../../src/hooks/useImageCapture';
import { useNotifications } from '../../../src/hooks/useNotifications';

// ========================================
// 🔧 MOCKS GLOBALES
// ========================================

// Mock de fetch
global.fetch = vi.fn();

// Mock del Clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    read: vi.fn(),
    readText: vi.fn(),
    write: vi.fn(),
    writeText: vi.fn()
  }
});

// Mock de FileReader
global.FileReader = class {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  readAsDataURL = vi.fn().mockImplementation(function(this: FileReader) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({
          target: { result: 'data:image/png;base64,test' }
        } as ProgressEvent<FileReader>);
      }
    }, 0);
  });
} as any;

// ========================================
// 🧪 TESTS DE HOOKS DEL STAFF
// ========================================

describe('Staff Hooks', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  // ========================================
  // 🔍 TESTS DE useCustomerSearch
  // ========================================

  describe('useCustomerSearch', () => {
    const mockCustomers = [
      {
        id: '1',
        cedula: '12345678',
        nombre: 'Juan Pérez',
        telefono: '+584121234567',
        puntos: 100,
        nivel: 'Bronze'
      },
      {
        id: '2',
        cedula: '87654321',
        nombre: 'María González',
        telefono: '+584129876543',
        puntos: 250,
        nivel: 'Silver'
      }
    ];

    beforeEach(() => {
      (global.fetch as any).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCustomers)
        })
      );
    });

    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useCustomerSearch('test-business'));

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.showResults).toBe(false);
      expect(result.current.selectedCustomer).toBeNull();
    });

    it('should search customers with valid query', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useCustomerSearch('test-business'));

      act(() => {
        result.current.searchCustomers('12345');
      });

      // Verificar estado de carga
      expect(result.current.isSearching).toBe(true);

      // Avanzar timers para completar debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.isSearching).toBe(false);
        expect(result.current.searchResults).toEqual(mockCustomers);
        expect(result.current.showResults).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/clientes/search?q=12345&businessId=test-business',
        expect.objectContaining({ method: 'GET' })
      );

      vi.useRealTimers();
    });

    it('should not search with query less than 2 characters', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useCustomerSearch('test-business'));

      act(() => {
        result.current.searchCustomers('1');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(fetch).not.toHaveBeenCalled();
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.showResults).toBe(false);

      vi.useRealTimers();
    });

    it('should select customer from results', () => {
      const { result } = renderHook(() => useCustomerSearch('test-business'));

      act(() => {
        result.current.selectCustomer(mockCustomers[0]);
      });

      expect(result.current.selectedCustomer).toEqual(mockCustomers[0]);
      expect(result.current.showResults).toBe(false);
    });

    it('should clear search results', () => {
      const { result } = renderHook(() => useCustomerSearch('test-business'));

      // Primero establecer algunos resultados
      act(() => {
        result.current.searchCustomers('test');
      });

      // Luego limpiar
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.showResults).toBe(false);
      expect(result.current.selectedCustomer).toBeNull();
    });

    it('should handle search errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useCustomerSearch('test-business'));

      await act(async () => {
        result.current.searchCustomers('12345');
      });

      await waitFor(() => {
        expect(result.current.isSearching).toBe(false);
        expect(result.current.searchResults).toEqual([]);
      });
    });
  });

  // ========================================
  // 📸 TESTS DE useImageCapture
  // ========================================

  describe('useImageCapture', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useImageCapture());

      expect(result.current.selectedFiles).toEqual([]);
      expect(result.current.previews).toEqual([]);
      expect(result.current.isCapturing).toBe(false);
      expect(result.current.captureStartTime).toBe(0);
    });

    it('should add files correctly', async () => {
      const { result } = renderHook(() => useImageCapture());

      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' })
      ];

      await act(async () => {
        result.current.addFiles(files);
      });

      expect(result.current.selectedFiles).toHaveLength(2);
      await waitFor(() => {
        expect(result.current.previews).toHaveLength(2);
      });
    });

    it('should limit files to maximum of 3', async () => {
      const { result } = renderHook(() => useImageCapture());

      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
        new File(['test3'], 'test3.png', { type: 'image/png' }),
        new File(['test4'], 'test4.png', { type: 'image/png' })
      ];

      await act(async () => {
        result.current.addFiles(files);
      });

      expect(result.current.selectedFiles).toHaveLength(3);
    });

    it('should remove file by index', async () => {
      const { result } = renderHook(() => useImageCapture());

      const files = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.png', { type: 'image/png' })
      ];

      await act(async () => {
        result.current.addFiles(files);
      });

      act(() => {
        result.current.removeFile(0);
      });

      expect(result.current.selectedFiles).toHaveLength(1);
      expect(result.current.selectedFiles[0].name).toBe('test2.png');
    });

    it('should start automatic capture', () => {
      const { result } = renderHook(() => useImageCapture());

      act(() => {
        result.current.startAutomaticCapture();
      });

      expect(result.current.isCapturing).toBe(true);
      expect(result.current.captureStartTime).toBeGreaterThan(0);
    });

    it('should detect clipboard image during capture', async () => {
      const mockBlob = new Blob(['test image'], { type: 'image/png' });
      (navigator.clipboard.read as any).mockResolvedValue([
        {
          types: ['image/png'],
          getType: () => Promise.resolve(mockBlob)
        }
      ]);

      const { result } = renderHook(() => useImageCapture());

      // Iniciar captura automática
      act(() => {
        result.current.startAutomaticCapture();
      });

      // Simular detección de clipboard
      await act(async () => {
        await result.current.checkClipboard();
      });

      await waitFor(() => {
        expect(result.current.selectedFiles).toHaveLength(1);
        expect(result.current.isCapturing).toBe(false);
      });
    });

    it('should clear all files', async () => {
      const { result } = renderHook(() => useImageCapture());

      const files = [new File(['test'], 'test.png', { type: 'image/png' })];

      await act(async () => {
        result.current.addFiles(files);
      });

      act(() => {
        result.current.clearFiles();
      });

      expect(result.current.selectedFiles).toEqual([]);
      expect(result.current.previews).toEqual([]);
    });
  });

  // ========================================
  // 🔔 TESTS DE useNotifications
  // ========================================

  describe('useNotifications', () => {
    it('should initialize with no notification', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.notification).toBeNull();
    });

    it('should show notification', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification('success', 'Test message');
      });

      expect(result.current.notification).toEqual({
        type: 'success',
        message: 'Test message'
      });
    });

    it('should auto-hide notification after timeout', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useNotifications(2000)); // 2 segundos

      act(() => {
        result.current.showNotification('info', 'Test message');
      });

      expect(result.current.notification).not.toBeNull();

      // Avanzar tiempo
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.notification).toBeNull();
      });

      vi.useRealTimers();
    });

    it('should hide notification manually', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification('error', 'Test error');
      });

      expect(result.current.notification).not.toBeNull();

      act(() => {
        result.current.hideNotification();
      });

      expect(result.current.notification).toBeNull();
    });

    it('should replace existing notification', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification('info', 'First message');
      });

      act(() => {
        result.current.showNotification('success', 'Second message');
      });

      expect(result.current.notification).toEqual({
        type: 'success',
        message: 'Second message'
      });
    });
  });
});

// ========================================
// 🔧 IMPLEMENTACIONES MOCK DE HOOKS
// ========================================

// useCustomerSearch Hook
const useCustomerSearch = (businessId: string) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const searchCustomers = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/clientes/search?q=${query}&businessId=${businessId}`);
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [businessId]
  );

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchResults([]);
    setShowResults(false);
    setSelectedCustomer(null);
  };

  return {
    searchResults,
    isSearching,
    showResults,
    selectedCustomer,
    searchCustomers,
    selectCustomer,
    clearSearch
  };
};

// useImageCapture Hook
const useImageCapture = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStartTime, setCaptureStartTime] = useState(0);

  const addFiles = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    const newFiles = [...selectedFiles, ...validFiles].slice(0, 3);
    
    setSelectedFiles(newFiles);
    
    // Generar previews
    newFiles.forEach((file, index) => {
      if (index >= previews.length) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const startAutomaticCapture = () => {
    setIsCapturing(true);
    setCaptureStartTime(Date.now());
  };

  const checkClipboard = async () => {
    if (!isCapturing) return;

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType('image/png');
          const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
          addFiles([file]);
          setIsCapturing(false);
          setCaptureStartTime(0);
          break;
        }
      }
    } catch (error) {
      console.error('Error checking clipboard:', error);
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setPreviews([]);
  };

  return {
    selectedFiles,
    previews,
    isCapturing,
    captureStartTime,
    addFiles,
    removeFile,
    startAutomaticCapture,
    checkClipboard,
    clearFiles
  };
};

// useNotifications Hook
const useNotifications = (autoHideDelay: number = 3000) => {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    
    setTimeout(() => {
      setNotification(null);
    }, autoHideDelay);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    hideNotification
  };
};

// Utility functions
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

const { useState, useCallback } = React;
import React from 'react';

export { useCustomerSearch, useImageCapture, useNotifications };
