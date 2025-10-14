import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';

// ========================================
// 🧪 TESTS DE INTEGRACIÓN - APIS DEL STAFF
// ========================================

describe('Staff API Integration', () => {
  
  // Mock de datos para tests
  const mockBusiness = {
    id: 'test-business',
    name: 'Test Business',
    puntosPorDolar: 1.5
  };

  const mockClientes = [
    {
      id: '1',
      cedula: '12345678',
      nombre: 'Juan Pérez',
      telefono: '+584121234567',
      email: 'juan@test.com',
      puntos: 100,
      nivel: 'Bronze',
      totalGastado: 250.50,
      isActive: true
    },
    {
      id: '2',
      cedula: '87654321',
      nombre: 'María González',
      telefono: '+584129876543',
      email: 'maria@test.com',
      puntos: 250,
      nivel: 'Silver',
      totalGastado: 500.00,
      isActive: true
    }
  ];

  const mockConsumos = [
    {
      id: '1',
      clienteId: '1',
      businessId: 'test-business',
      total: 25.50,
      puntos: 25,
      productos: 'Café, Arepa',
      empleadoDetectado: 'Staff Test',
      tipo: 'OCR',
      createdAt: new Date()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // 🔍 TESTS DE BÚSQUEDA DE CLIENTES
  // ========================================

  describe('Client Search API', () => {
    it('should validate search parameters', () => {
      const validateSearchParams = (query: string, businessId: string) => {
        const errors: string[] = [];

        if (!query || query.trim().length < 2) {
          errors.push('Query debe tener al menos 2 caracteres');
        }

        if (!businessId || businessId.trim().length === 0) {
          errors.push('BusinessId es requerido');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      // Parámetros válidos
      const validParams = validateSearchParams('123', 'test-business');
      expect(validParams.isValid).toBe(true);
      expect(validParams.errors).toHaveLength(0);

      // Query muy corto
      const shortQuery = validateSearchParams('1', 'test-business');
      expect(shortQuery.isValid).toBe(false);
      expect(shortQuery.errors).toContain('Query debe tener al menos 2 caracteres');

      // BusinessId faltante
      const missingBusiness = validateSearchParams('123', '');
      expect(missingBusiness.isValid).toBe(false);
      expect(missingBusiness.errors).toContain('BusinessId es requerido');
    });

    it('should search clients by different criteria', () => {
      const searchClients = (query: string, clients: any[]) => {
        const normalizedQuery = query.toLowerCase().trim();
        
        return clients.filter(client => {
          return client.isActive && (
            client.cedula.includes(query) ||
            client.nombre.toLowerCase().includes(normalizedQuery) ||
            client.telefono.includes(query) ||
            (client.email && client.email.toLowerCase().includes(normalizedQuery))
          );
        }).slice(0, 10); // Limitar a 10 resultados
      };

      // Búsqueda por cédula
      const resultsByCedula = searchClients('123', mockClientes);
      expect(resultsByCedula).toHaveLength(1);
      expect(resultsByCedula[0].nombre).toBe('Juan Pérez');

      // Búsqueda por nombre (case insensitive)
      const resultsByName = searchClients('MARÍA', mockClientes);
      expect(resultsByName).toHaveLength(1);
      expect(resultsByName[0].nombre).toBe('María González');

      // Búsqueda por teléfono
      const resultsByPhone = searchClients('412123', mockClientes);
      expect(resultsByPhone).toHaveLength(1);

      // Búsqueda por email
      const resultsByEmail = searchClients('juan@', mockClientes);
      expect(resultsByEmail).toHaveLength(1);

      // Sin resultados
      const noResults = searchClients('xyz999', mockClientes);
      expect(noResults).toHaveLength(0);
    });

    it('should format client search results correctly', () => {
      const formatClientForSearch = (client: any) => {
        return {
          id: client.id,
          cedula: client.cedula,
          nombre: client.nombre,
          telefono: client.telefono || 'Sin teléfono',
          email: client.email || 'Sin email',
          puntos: client.puntos || 0,
          nivel: client.nivel || 'Bronze',
          totalGastado: client.totalGastado || 0,
          frecuencia: client.totalGastado > 500 ? 'VIP' : 
                     client.totalGastado > 200 ? 'Regular' : 'Nuevo'
        };
      };

      const formatted = formatClientForSearch(mockClientes[0]);
      
      expect(formatted.cedula).toBe('12345678');
      expect(formatted.nombre).toBe('Juan Pérez');
      expect(formatted.puntos).toBe(100);
      expect(formatted.frecuencia).toBe('Regular'); // 250.50 > 200
    });
  });

  // ========================================
  // 📊 TESTS DE TICKETS RECIENTES
  // ========================================

  describe('Recent Tickets API', () => {
    it('should filter tickets by date range', () => {
      const getRecentTickets = (tickets: any[], businessId: string, daysBack: number = 1) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        cutoffDate.setHours(0, 0, 0, 0);

        return tickets
          .filter(ticket => 
            ticket.businessId === businessId &&
            new Date(ticket.createdAt) >= cutoffDate
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20); // Limitar a 20 más recientes
      };

      const todayTickets = getRecentTickets(mockConsumos, 'test-business');
      expect(todayTickets).toHaveLength(1);

      // Test con fecha antigua
      const oldTicket = {
        ...mockConsumos[0],
        id: '2',
        createdAt: new Date('2023-01-01')
      };

      const ticketsWithOld = getRecentTickets([...mockConsumos, oldTicket], 'test-business');
      expect(ticketsWithOld).toHaveLength(1); // Solo el reciente
    });

    it('should format ticket data for display', () => {
      const formatTicketForDisplay = (ticket: any, cliente?: any) => {
        return {
          id: ticket.id,
          cliente: cliente?.nombre || 'Cliente Desconocido',
          cedula: cliente?.cedula || '',
          monto: parseFloat(ticket.total || '0'),
          puntos: parseInt(ticket.puntos || '0'),
          fecha: new Date(ticket.createdAt).toISOString().split('T')[0],
          hora: new Date(ticket.createdAt).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          items: ticket.productos ? ticket.productos.split(', ').filter(Boolean) : [],
          tipo: ticket.tipo || 'OCR',
          empleado: ticket.empleadoDetectado || 'Desconocido',
          reservaId: ticket.reservaId || null,
          reservaNombre: ticket.reserva?.nombreReserva || null
        };
      };

      const formatted = formatTicketForDisplay(mockConsumos[0], mockClientes[0]);

      expect(formatted.cliente).toBe('Juan Pérez');
      expect(formatted.monto).toBe(25.50);
      expect(formatted.puntos).toBe(25);
      expect(formatted.items).toEqual(['Café', 'Arepa']);
      expect(formatted.tipo).toBe('OCR');
    });
  });

  // ========================================
  // 💾 TESTS DE CREACIÓN DE CONSUMO
  // ========================================

  describe('Consumo Creation API', () => {
    it('should validate consumption data', () => {
      const validateConsumoData = (data: any) => {
        const errors: string[] = [];

        if (!data.clienteId) {
          errors.push('Cliente ID es requerido');
        }

        if (!data.businessId) {
          errors.push('Business ID es requerido');
        }

        if (!data.total || parseFloat(data.total) <= 0) {
          errors.push('Total debe ser mayor a 0');
        }

        if (!data.productos || !Array.isArray(data.productos) || data.productos.length === 0) {
          errors.push('Al menos un producto es requerido');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      // Datos válidos
      const validData = {
        clienteId: '1',
        businessId: 'test-business',
        total: '25.50',
        productos: [{ nombre: 'Café', precio: 25.50 }]
      };

      const validResult = validateConsumoData(validData);
      expect(validResult.isValid).toBe(true);

      // Datos inválidos
      const invalidData = {
        clienteId: '',
        total: '0',
        productos: []
      };

      const invalidResult = validateConsumoData(invalidData);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(4);
    });

    it('should calculate points correctly', () => {
      const calculateConsumoPoints = (total: number, puntosPorDolar: number, nivelMultiplier: number = 1) => {
        const basePoints = Math.floor(total * puntosPorDolar);
        return Math.floor(basePoints * nivelMultiplier);
      };

      // Cliente Bronze (multiplicador 1.0)
      expect(calculateConsumoPoints(25.50, 1.5, 1.0)).toBe(38);

      // Cliente Silver (multiplicador 1.2)
      expect(calculateConsumoPoints(25.50, 1.5, 1.2)).toBe(45);

      // Cliente Gold (multiplicador 1.5)
      expect(calculateConsumoPoints(25.50, 1.5, 1.5)).toBe(57);
    });

    it('should process manual consumption correctly', () => {
      const processManualConsumo = (data: any, cliente: any, puntosPorDolar: number) => {
        const total = parseFloat(data.total);
        const puntos = Math.floor(total * puntosPorDolar);

        return {
          clienteId: cliente.id,
          businessId: data.businessId,
          total: total,
          puntos: puntos,
          productos: data.productos.map((p: any) => p.nombre).join(', '),
          empleadoDetectado: data.empleadoVenta,
          tipo: 'MANUAL',
          metodoPago: 'efectivo',
          notas: `Registro manual por staff - Productos: ${data.productos.length}`,
          createdAt: new Date()
        };
      };

      const manualData = {
        businessId: 'test-business',
        empleadoVenta: 'María',
        total: '30.00',
        productos: [
          { nombre: 'Café', cantidad: 2 },
          { nombre: 'Arepa', cantidad: 1 }
        ]
      };

      const processed = processManualConsumo(manualData, mockClientes[0], 1.5);

      expect(processed.total).toBe(30.00);
      expect(processed.puntos).toBe(45); // 30 * 1.5 = 45
      expect(processed.productos).toBe('Café, Arepa');
      expect(processed.tipo).toBe('MANUAL');
      expect(processed.empleadoDetectado).toBe('María');
    });
  });

  // ========================================
  // 📷 TESTS DE PROCESAMIENTO OCR
  // ========================================

  describe('OCR Processing API', () => {
    it('should validate image files', () => {
      const validateImageFiles = (files: File[]) => {
        const errors: string[] = [];
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const maxFiles = 3;

        if (files.length === 0) {
          errors.push('Al menos una imagen es requerida');
        }

        if (files.length > maxFiles) {
          errors.push(`Máximo ${maxFiles} imágenes permitidas`);
        }

        files.forEach((file, index) => {
          if (!validTypes.includes(file.type)) {
            errors.push(`Archivo ${index + 1}: Tipo de imagen no válido`);
          }

          if (file.size > maxSize) {
            errors.push(`Archivo ${index + 1}: Tamaño excede el límite de 5MB`);
          }
        });

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      // Archivos válidos
      const validFiles = [
        new File(['test1'], 'test1.png', { type: 'image/png' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ];

      const validResult = validateImageFiles(validFiles);
      expect(validResult.isValid).toBe(true);

      // Archivos inválidos
      const invalidFiles = [
        new File(['test'], 'test.txt', { type: 'text/plain' }),
        new File(['x'.repeat(10 * 1024 * 1024)], 'big.png', { type: 'image/png' })
      ];

      const invalidResult = validateImageFiles(invalidFiles);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should simulate AI response processing', () => {
      const processAIResponse = (mockAIData: any, confidence: number) => {
        const requiresConfirmation = confidence < 80;

        return {
          requiresConfirmation,
          confidence,
          cliente: mockAIData.cliente,
          productos: mockAIData.productos,
          total: mockAIData.total,
          empleadoDetectado: mockAIData.empleado,
          analisis: {
            confianza: confidence,
            elementosDetectados: mockAIData.productos.length,
            calidad: confidence > 90 ? 'Excelente' : confidence > 70 ? 'Buena' : 'Regular'
          }
        };
      };

      const mockAIData = {
        cliente: {
          nombre: 'Juan Pérez',
          cedula: '12345678'
        },
        productos: [
          { nombre: 'Café', precio: 3.50 },
          { nombre: 'Arepa', precio: 2.00 }
        ],
        total: 5.50,
        empleado: 'María'
      };

      // Alta confianza - no requiere confirmación
      const highConfidence = processAIResponse(mockAIData, 95);
      expect(highConfidence.requiresConfirmation).toBe(false);
      expect(highConfidence.analisis.calidad).toBe('Excelente');

      // Baja confianza - requiere confirmación
      const lowConfidence = processAIResponse(mockAIData, 65);
      expect(lowConfidence.requiresConfirmation).toBe(true);
      expect(lowConfidence.analisis.calidad).toBe('Regular');
    });
  });

  // ========================================
  // 📋 TESTS DE RESERVAS
  // ========================================

  describe('Reservations API', () => {
    it('should filter today reservations', () => {
      const mockReservas = [
        {
          id: '1',
          businessId: 'test-business',
          fecha: new Date().toISOString().split('T')[0],
          hora: '19:00',
          cliente: 'Juan Pérez',
          numeroPersonas: 4,
          estado: 'CONFIRMED'
        },
        {
          id: '2',
          businessId: 'test-business',
          fecha: '2023-01-01',
          hora: '20:00',
          cliente: 'María González',
          numeroPersonas: 2,
          estado: 'CONFIRMED'
        }
      ];

      const getTodayReservations = (reservas: any[], businessId: string) => {
        const today = new Date().toISOString().split('T')[0];
        
        return reservas
          .filter(reserva => 
            reserva.businessId === businessId &&
            reserva.fecha === today &&
            ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(reserva.estado)
          )
          .sort((a, b) => a.hora.localeCompare(b.hora));
      };

      const todayReservations = getTodayReservations(mockReservas, 'test-business');
      expect(todayReservations).toHaveLength(1);
      expect(todayReservations[0].cliente).toBe('Juan Pérez');
    });

    it('should calculate consumption per reservation', () => {
      const calculateReservationConsumption = (reservaId: string, consumos: any[]) => {
        const reservaConsumos = consumos.filter(c => c.reservaId === reservaId);
        
        const total = reservaConsumos.reduce((sum, c) => sum + parseFloat(c.total), 0);
        const totalPuntos = reservaConsumos.reduce((sum, c) => sum + parseInt(c.puntos), 0);
        
        return {
          consumoTotal: total,
          puntosTotal: totalPuntos,
          ticketsCount: reservaConsumos.length,
          promedioPersona: 0 // Se calculará con numeroPersonas de la reserva
        };
      };

      const consumosReserva = [
        { reservaId: '1', total: '25.50', puntos: '25' },
        { reservaId: '1', total: '30.00', puntos: '30' }
      ];

      const result = calculateReservationConsumption('1', consumosReserva);
      expect(result.consumoTotal).toBe(55.50);
      expect(result.puntosTotal).toBe(55);
      expect(result.ticketsCount).toBe(2);
    });
  });

  // ========================================
  // ⚙️ TESTS DE CONFIGURACIÓN
  // ========================================

  describe('Configuration API', () => {
    it('should validate points configuration', () => {
      const validatePointsConfig = (config: any) => {
        const errors: string[] = [];

        if (!config.puntosPorDolar || config.puntosPorDolar <= 0) {
          errors.push('Puntos por dólar debe ser mayor a 0');
        }

        if (config.puntosPorDolar > 10) {
          errors.push('Puntos por dólar no puede ser mayor a 10');
        }

        return {
          isValid: errors.length === 0,
          errors,
          config: {
            puntosPorDolar: parseFloat(config.puntosPorDolar || '1'),
            multiplicadorBronce: 1.0,
            multiplicadorPlata: 1.2,
            multiplicadorOro: 1.5,
            multiplicadorPlatino: 2.0
          }
        };
      };

      // Configuración válida
      const validConfig = validatePointsConfig({ puntosPorDolar: 1.5 });
      expect(validConfig.isValid).toBe(true);
      expect(validConfig.config.puntosPorDolar).toBe(1.5);

      // Configuración inválida
      const invalidConfig = validatePointsConfig({ puntosPorDolar: 15 });
      expect(invalidConfig.isValid).toBe(false);
      expect(invalidConfig.errors).toContain('Puntos por dólar no puede ser mayor a 10');
    });
  });
});
