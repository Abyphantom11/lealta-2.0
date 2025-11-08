/**
 * 🎭 SEED DEMO DATA - LEALTA 2.0
 * 
 * Script para crear datos de demostración realistas
 * Business: "Demo Lealta"
 * 
 * Incluye:
 * - SuperAdmin user
 * - Business completo configurado
 * - Admin user
 * - Staff users
 * - 50 clientes con consumos, visitas y puntos variados
 * - Tarjetas de lealtad según nivel
 * - Reservas con check-ins
 * - Promotores
 * - Configuraciones de branding
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ====================================
// DATOS DE CONFIGURACIÓN
// ====================================

const DEMO_CONFIG = {
  business: {
    name: 'Demo Lealta',
    slug: 'demo-lealta',
    subdomain: 'demo-lealta',
    customDomain: null,
    subscriptionPlan: 'ENTERPRISE',
    isActive: true,
  },
  
  superadmin: {
    name: 'Super Admin Demo',
    email: 'superadmin@demo.lealta.com',
    password: 'demo123',
    role: 'SUPERADMIN',
  },
  
  admin: {
    name: 'Admin Demo',
    email: 'admin@demo.lealta.com',
    password: 'demo123',
    role: 'ADMIN',
  },
  
  staff: [
    { name: 'Carlos Staff', email: 'carlos@demo.lealta.com', password: 'demo123' },
    { name: 'María Staff', email: 'maria@demo.lealta.com', password: 'demo123' },
    { name: 'Juan Staff', email: 'juan@demo.lealta.com', password: 'demo123' },
  ],
};

// Nombres realistas para clientes
const NOMBRES = [
  'Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana Martínez', 'Luis García',
  'Carmen López', 'José Hernández', 'Isabel Díaz', 'Francisco Ruiz', 'Laura Sánchez',
  'Miguel Torres', 'Patricia Ramírez', 'Roberto Flores', 'Elena Morales', 'Diego Castro',
  'Sofía Jiménez', 'Andrés Ortiz', 'Valentina Silva', 'Gabriel Rojas', 'Camila Mendoza',
  'Daniel Vargas', 'Victoria Guzmán', 'Sebastián Ríos', 'Gabriela Medina', 'Mateo Navarro',
  'Lucía Romero', 'Santiago Guerrero', 'Natalia Cortés', 'Alejandro Peña', 'Paula Delgado',
  'Nicolás Vega', 'Daniela Cruz', 'Javier Campos', 'Carolina Herrera', 'Emilio Soto',
  'Adriana Molina', 'Ricardo Vera', 'Fernanda Luna', 'Tomás Ibarra', 'Mariana Parra',
  'Fernando Aguilar', 'Juliana Suárez', 'Pablo Arias', 'Andrea Moreno', 'Martín Núñez',
  'Valeria Salazar', 'Rodrigo Domínguez', 'Claudia Estrada', 'Hernán Figueroa', 'Beatriz Santos',
];

// Correos únicos
function generarCorreo(nombre) {
  return nombre.toLowerCase()
    .replace(/\s+/g, '.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    + '@cliente.demo';
}

// Generar cédula única
function generarCedula(index) {
  return `17${String(index).padStart(8, '0')}`;
}

// Generar teléfono
function generarTelefono() {
  return `099${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
}

// ====================================
// FUNCIONES DE SEEDING
// ====================================

async function cleanDatabase() {
  console.log('🧹 Limpiando base de datos...');
  
  // Orden correcto para evitar errores de FK
  await prisma.guestConsumo.deleteMany({});
  await prisma.hostTracking.deleteMany({});
  await prisma.consumo.deleteMany({});
  await prisma.historialCanje.deleteMany({});
  await prisma.tarjetaLealtad.deleteMany({});
  await prisma.visitLog.deleteMany({});
  await prisma.visita.deleteMany({});
  await prisma.reservationQRCode.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.promotor.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.menuProduct.deleteMany({});
  await prisma.menuCategory.deleteMany({});
  await prisma.portalBanner.deleteMany({});
  await prisma.portalFavoritoDelDia.deleteMany({});
  await prisma.portalPromocion.deleteMany({});
  await prisma.portalRecompensa.deleteMany({});
  await prisma.portalTarjetasConfig.deleteMany({});
  await prisma.puntosConfig.deleteMany({});
  await prisma.brandingConfig.deleteMany({});
  await prisma.businessGoals.deleteMany({});
  await prisma.paymentHistory.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@demo.lealta.com'
      }
    }
  });
  await prisma.business.deleteMany({
    where: {
      slug: 'demo-lealta'
    }
  });
  
  console.log('✅ Base de datos limpia');
}

async function createBusiness() {
  console.log('🏢 Creando business "Demo Lealta"...');
  
  const business = await prisma.business.create({
    data: {
      name: DEMO_CONFIG.business.name,
      slug: DEMO_CONFIG.business.slug,
      subdomain: DEMO_CONFIG.business.subdomain,
      customDomain: DEMO_CONFIG.business.customDomain,
      subscriptionPlan: DEMO_CONFIG.business.subscriptionPlan,
      isActive: DEMO_CONFIG.business.isActive,
      subscriptionId: 'sub_demo_' + Date.now(),
      subscriptionStatus: 'active',
      planId: 'pri_enterprise_demo',
      customerId: 'ctm_demo_' + Date.now(),
      subscriptionStartDate: new Date(),
      trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      clientTheme: 'futurista',
      qrMostrarLogo: true,
      qrMensajeBienvenida: '¡Bienvenido a Demo Lealta! Escanea para registrar tu llegada.',
    },
  });
  
  console.log(`✅ Business creado: ${business.id}`);
  return business;
}

async function createUsers(businessId) {
  console.log('👥 Creando usuarios...');
  
  const hashedPassword = await bcrypt.hash(DEMO_CONFIG.superadmin.password, 10);
  
  // SuperAdmin
  const superadmin = await prisma.user.create({
    data: {
      name: DEMO_CONFIG.superadmin.name,
      email: DEMO_CONFIG.superadmin.email,
      password: hashedPassword,
      role: DEMO_CONFIG.superadmin.role,
      businessId: businessId,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ SuperAdmin: ${superadmin.email}`);
  
  // Admin
  const admin = await prisma.user.create({
    data: {
      name: DEMO_CONFIG.admin.name,
      email: DEMO_CONFIG.admin.email,
      password: hashedPassword,
      role: DEMO_CONFIG.admin.role,
      businessId: businessId,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email}`);
  
  // Staff
  const staffUsers = [];
  for (const staffData of DEMO_CONFIG.staff) {
    const staff = await prisma.user.create({
      data: {
        name: staffData.name,
        email: staffData.email,
        password: hashedPassword,
        role: 'STAFF',
        businessId: businessId,
        emailVerified: new Date(),
      },
    });
    staffUsers.push(staff);
    console.log(`✅ Staff: ${staff.email}`);
  }
  
  return { superadmin, admin, staffUsers };
}

async function createLocation(businessId) {
  console.log('📍 Creando ubicación...');
  
  const location = await prisma.location.create({
    data: {
      businessId: businessId,
      name: 'Sede Principal',
    },
  });
  
  console.log(`✅ Ubicación: ${location.name}`);
  return location;
}

async function createBrandingConfig(businessId) {
  console.log('🎨 Configurando branding...');
  
  await prisma.brandingConfig.create({
    data: {
      businessId: businessId,
      businessName: 'Demo Lealta',
      primaryColor: '#FF6B6B',
      secondaryColor: '#4ECDC4',
      accentColor: '#FFE66D',
      logoUrl: 'https://via.placeholder.com/200x200?text=Demo+Lealta',
      carouselImages: [
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
        'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=1200',
      ],
    },
  });
  
  console.log('✅ Branding configurado');
}

async function createPuntosConfig(businessId) {
  console.log('⭐ Configurando sistema de puntos...');
  
  await prisma.puntosConfig.create({
    data: {
      businessId: businessId,
      puntosPorDolar: 10,
      multiplicadores: {
        BRONCE: 1,
        PLATA: 1.5,
        ORO: 2,
        PLATINO: 2.5,
        DIAMANTE: 3,
      },
    },
  });
  
  console.log('✅ Sistema de puntos configurado');
}

async function createTarjetasConfig(businessId) {
  console.log('💳 Configurando tarjetas de lealtad...');
  
  const configs = [
    {
      nivel: 'BRONCE',
      nombrePersonalizado: 'Cliente Nuevo',
      textoCalidad: 'Bienvenido',
      puntosMinimos: 0,
      gastosMinimos: 0,
      visitasMinimas: 0,
      beneficio: '10 puntos por cada $1',
      colores: { primary: '#CD7F32', secondary: '#8B5A00', gradient: 'from-amber-700 to-amber-900' },
    },
    {
      nivel: 'PLATA',
      nombrePersonalizado: 'Cliente Frecuente',
      textoCalidad: 'Excelente',
      puntosMinimos: 500,
      gastosMinimos: 50,
      visitasMinimas: 5,
      beneficio: '15 puntos por cada $1 + 10% descuento',
      colores: { primary: '#C0C0C0', secondary: '#808080', gradient: 'from-gray-300 to-gray-500' },
    },
    {
      nivel: 'ORO',
      nombrePersonalizado: 'Cliente Premium',
      textoCalidad: 'Sobresaliente',
      puntosMinimos: 1500,
      gastosMinimos: 150,
      visitasMinimas: 15,
      beneficio: '20 puntos por cada $1 + 15% descuento + acceso prioritario',
      colores: { primary: '#FFD700', secondary: '#FFA500', gradient: 'from-yellow-400 to-yellow-600' },
    },
    {
      nivel: 'PLATINO',
      nombrePersonalizado: 'Cliente VIP',
      textoCalidad: 'Elite',
      puntosMinimos: 3500,
      gastosMinimos: 350,
      visitasMinimas: 35,
      beneficio: '25 puntos por cada $1 + 20% descuento + eventos exclusivos',
      colores: { primary: '#E5E4E2', secondary: '#BCC6CC', gradient: 'from-slate-200 to-slate-400' },
    },
    {
      nivel: 'DIAMANTE',
      nombrePersonalizado: 'Cliente Diamante',
      textoCalidad: 'Legendario',
      puntosMinimos: 7500,
      gastosMinimos: 750,
      visitasMinimas: 75,
      beneficio: '30 puntos por cada $1 + 25% descuento + concierge personal',
      colores: { primary: '#B9F2FF', secondary: '#4A90E2', gradient: 'from-cyan-200 to-blue-500' },
    },
  ];
  
  for (const config of configs) {
    await prisma.configuracionTarjeta.create({
      data: {
        businessId: businessId,
        ...config,
      },
    });
  }
  
  console.log('✅ Tarjetas de lealtad configuradas');
}

async function createPromotores(businessId) {
  console.log('💼 Creando promotores...');
  
  const promotores = [
    { nombre: 'Promotor VIP', codigo: 'PROMO-VIP' },
    { nombre: 'Promotor Premium', codigo: 'PROMO-PREMIUM' },
    { nombre: 'Promotor Regular', codigo: 'PROMO-REG' },
  ];
  
  const created = [];
  for (const p of promotores) {
    const promotor = await prisma.promotor.create({
      data: {
        businessId: businessId,
        nombre: p.nombre,
        codigo: p.codigo,
        activo: true,
      },
    });
    created.push(promotor);
  }
  
  console.log(`✅ ${created.length} promotores creados`);
  return created;
}

async function createClientes(businessId, staffUsers, locationId) {
  console.log('👤 Creando 50 clientes con datos realistas...');
  
  const clientes = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const nombre = NOMBRES[i];
    const correo = generarCorreo(nombre);
    const cedula = generarCedula(i + 1);
    const telefono = generarTelefono();
    
    // Distribución de niveles (más broncos, pocos diamantes)
    let nivel, puntos, totalGastado, totalVisitas;
    
    if (i < 20) {
      // 40% BRONCE
      nivel = 'BRONCE';
      puntos = Math.floor(Math.random() * 400) + 50;
      totalGastado = Math.floor(Math.random() * 40) + 10;
      totalVisitas = Math.floor(Math.random() * 4) + 1;
    } else if (i < 35) {
      // 30% PLATA
      nivel = 'PLATA';
      puntos = Math.floor(Math.random() * 800) + 500;
      totalGastado = Math.floor(Math.random() * 80) + 50;
      totalVisitas = Math.floor(Math.random() * 8) + 5;
    } else if (i < 45) {
      // 20% ORO
      nivel = 'ORO';
      puntos = Math.floor(Math.random() * 1500) + 1500;
      totalGastado = Math.floor(Math.random() * 150) + 150;
      totalVisitas = Math.floor(Math.random() * 15) + 15;
    } else if (i < 49) {
      // 8% PLATINO
      nivel = 'PLATINO';
      puntos = Math.floor(Math.random() * 3000) + 3500;
      totalGastado = Math.floor(Math.random() * 300) + 350;
      totalVisitas = Math.floor(Math.random() * 30) + 35;
    } else {
      // 2% DIAMANTE
      nivel = 'DIAMANTE';
      puntos = Math.floor(Math.random() * 5000) + 7500;
      totalGastado = Math.floor(Math.random() * 500) + 750;
      totalVisitas = Math.floor(Math.random() * 50) + 75;
    }
    
    const puntosAcumulados = puntos + Math.floor(Math.random() * 1000);
    
    // Crear cliente
    const cliente = await prisma.cliente.create({
      data: {
        businessId: businessId,
        cedula: cedula,
        nombre: nombre,
        correo: correo,
        telefono: telefono,
        puntos: puntos,
        puntosAcumulados: puntosAcumulados,
        totalVisitas: totalVisitas,
        totalGastado: totalGastado,
        registeredAt: new Date(now - Math.random() * 90 * 24 * 60 * 60 * 1000), // Últimos 90 días
        lastLogin: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000), // Última semana
        portalViews: Math.floor(Math.random() * 50) + totalVisitas,
      },
    });
    
    // Crear tarjeta de lealtad
    await prisma.tarjetaLealtad.create({
      data: {
        clienteId: cliente.id,
        nivel: nivel,
        fechaEmision: new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
    
    // Crear consumos (1-3 consumos por cliente)
    const numConsumos = Math.min(totalVisitas, Math.floor(Math.random() * 3) + 1);
    for (let c = 0; c < numConsumos; c++) {
      const montoConsumo = Math.floor(Math.random() * 80) + 20;
      const puntosConsumo = Math.floor(montoConsumo * 10);
      
      await prisma.consumo.create({
        data: {
          businessId: businessId,
          clienteId: cliente.id,
          locationId: locationId,
          empleadoId: staffUsers[Math.floor(Math.random() * staffUsers.length)].id,
          total: montoConsumo,
          puntos: puntosConsumo,
          productos: {
            items: [
              { nombre: 'Bebida Premium', cantidad: 2, precio: montoConsumo * 0.6 },
              { nombre: 'Entrada', cantidad: 1, precio: montoConsumo * 0.4 },
            ]
          },
          pagado: true,
          metodoPago: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'][Math.floor(Math.random() * 3)],
          registeredAt: new Date(now - Math.random() * 60 * 24 * 60 * 60 * 1000),
          paidAt: new Date(now - Math.random() * 60 * 24 * 60 * 60 * 1000),
        },
      });
    }
    
    // Crear visitas
    for (let v = 0; v < Math.min(totalVisitas, 5); v++) {
      await prisma.visita.create({
        data: {
          businessId: businessId,
          clienteId: cliente.id,
          fecha: new Date(now - Math.random() * 60 * 24 * 60 * 60 * 1000),
          duracion: Math.floor(Math.random() * 180) + 30, // 30-210 minutos
        },
      });
    }
    
    clientes.push({ cliente, nivel });
    
    if ((i + 1) % 10 === 0) {
      console.log(`✅ ${i + 1}/50 clientes creados`);
    }
  }
  
  // Resumen por nivel
  const resumen = {
    BRONCE: clientes.filter(c => c.nivel === 'BRONCE').length,
    PLATA: clientes.filter(c => c.nivel === 'PLATA').length,
    ORO: clientes.filter(c => c.nivel === 'ORO').length,
    PLATINO: clientes.filter(c => c.nivel === 'PLATINO').length,
    DIAMANTE: clientes.filter(c => c.nivel === 'DIAMANTE').length,
  };
  
  console.log('\n📊 Distribución de clientes por nivel:');
  console.log(`   🥉 BRONCE: ${resumen.BRONCE} (${(resumen.BRONCE/50*100).toFixed(1)}%)`);
  console.log(`   🥈 PLATA: ${resumen.PLATA} (${(resumen.PLATA/50*100).toFixed(1)}%)`);
  console.log(`   🥇 ORO: ${resumen.ORO} (${(resumen.ORO/50*100).toFixed(1)}%)`);
  console.log(`   💎 PLATINO: ${resumen.PLATINO} (${(resumen.PLATINO/50*100).toFixed(1)}%)`);
  console.log(`   💠 DIAMANTE: ${resumen.DIAMANTE} (${(resumen.DIAMANTE/50*100).toFixed(1)}%)`);
  
  return clientes;
}

async function createReservations(businessId, clientes, promotores) {
  console.log('📅 Creando reservas...');
  
  const now = new Date();
  const reservaciones = [];
  
  // Crear 20 reservas (mix de pasadas, hoy y futuras)
  for (let i = 0; i < 20; i++) {
    const clienteData = clientes[Math.floor(Math.random() * clientes.length)];
    const promotor = promotores[Math.floor(Math.random() * promotores.length)];
    
    let fechaReserva, estado;
    
    if (i < 8) {
      // 40% pasadas con check-in
      fechaReserva = new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000);
      estado = 'CHECKED_IN';
    } else if (i < 12) {
      // 20% de hoy
      fechaReserva = new Date();
      estado = Math.random() > 0.5 ? 'CHECKED_IN' : 'CONFIRMED';
    } else if (i < 16) {
      // 20% confirmadas futuras
      fechaReserva = new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      estado = 'CONFIRMED';
    } else {
      // 20% pendientes
      fechaReserva = new Date(now.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
      estado = 'PENDING';
    }
    
    // Ajustar hora a horario nocturno (8 PM - 2 AM)
    const hora = Math.floor(Math.random() * 6) + 20; // 20-25 (8PM-1AM)
    fechaReserva.setHours(hora > 23 ? hora - 24 : hora, Math.floor(Math.random() * 4) * 15, 0, 0);
    
    const numeroPersonas = Math.floor(Math.random() * 8) + 2; // 2-10 personas
    
    const reserva = await prisma.reservation.create({
      data: {
        businessId: businessId,
        clienteId: clienteData.cliente.id,
        customerName: clienteData.cliente.nombre,
        customerPhone: clienteData.cliente.telefono,
        customerEmail: clienteData.cliente.correo,
        numeroPersonas: numeroPersonas,
        reservedAt: fechaReserva,
        status: estado,
        promotorId: promotor.id,
        notes: `Reserva para ${numeroPersonas} personas`,
      },
    });
    
    // Crear QR codes
    for (let q = 0; q < Math.min(numeroPersonas, 3); q++) {
      await prisma.reservationQRCode.create({
        data: {
          reservationId: reserva.id,
          qrCode: `QR-${reserva.id}-${q + 1}`,
          isActive: true,
          scanCount: estado === 'CHECKED_IN' ? Math.floor(Math.random() * numeroPersonas) + 1 : 0,
        },
      });
    }
    
    // Si está checked-in, crear HostTracking
    if (estado === 'CHECKED_IN') {
      await prisma.hostTracking.create({
        data: {
          businessId: businessId,
          reservationId: reserva.id,
          clienteId: clienteData.cliente.id,
          reservationName: clienteData.cliente.nombre,
          reservationDate: fechaReserva,
          guestCount: Math.floor(Math.random() * numeroPersonas) + 1,
          isActive: false, // Ya pasó
        },
      });
    }
    
    reservaciones.push(reserva);
  }
  
  console.log(`✅ ${reservaciones.length} reservas creadas`);
  return reservaciones;
}

async function createBusinessGoals(businessId) {
  console.log('🎯 Configurando metas del negocio...');
  
  await prisma.businessGoals.create({
    data: {
      businessId: businessId,
      dailyRevenue: 500,
      weeklyRevenue: 3500,
      monthlyRevenue: 15000,
      dailyClients: 15,
      weeklyClients: 100,
      monthlyClients: 400,
      dailyTransactions: 25,
      weeklyTransactions: 175,
      monthlyTransactions: 700,
      targetTicketAverage: 35,
      targetRetentionRate: 75,
      targetConversionRate: 85,
      targetTopClient: 500,
      targetActiveClients: 150,
    },
  });
  
  console.log('✅ Metas configuradas');
}

async function createPortalContent(businessId) {
  console.log('🎨 Creando contenido del portal...');
  
  // Banners
  await prisma.portalBanner.create({
    data: {
      businessId: businessId,
      title: 'Noche de DJ en Vivo',
      description: 'Este viernes disfruta de los mejores beats',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
      linkUrl: '/eventos/dj-vivo',
      active: true,
      orden: 1,
    },
  });
  
  // Promociones
  await prisma.portalPromocion.create({
    data: {
      businessId: businessId,
      title: 'Happy Hour',
      description: '2x1 en bebidas seleccionadas de 6 a 8 PM',
      imageUrl: 'https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?w=800',
      tipoDescuento: 'PORCENTAJE',
      valorDescuento: 50,
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
      orden: 1,
    },
  });
  
  // Recompensas
  const recompensas = [
    { nombre: 'Bebida Gratis', puntos: 150, icono: '🍹' },
    { nombre: 'Entrada VIP', puntos: 300, icono: '🎫' },
    { nombre: 'Descuento 20%', puntos: 200, icono: '💰' },
    { nombre: 'Mesa Reservada', puntos: 500, icono: '🪑' },
    { nombre: 'Botella Premium', puntos: 1000, icono: '🍾' },
  ];
  
  for (const r of recompensas) {
    await prisma.portalRecompensa.create({
      data: {
        businessId: businessId,
        nombre: r.nombre,
        puntosRequeridos: r.puntos,
        stock: 50,
        descripcion: `Canjea ${r.puntos} puntos por ${r.nombre.toLowerCase()}`,
        icono: r.icono,
        active: true,
      },
    });
  }
  
  // Favorito del día
  await prisma.portalFavoritoDelDia.create({
    data: {
      businessId: businessId,
      productName: 'Mojito Especial',
      description: 'Mojito con menta fresca y ron premium',
      imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800',
      originalPrice: '$12',
      specialPrice: '$8',
      specialOffer: '¡33% OFF solo hoy!',
      active: true,
      date: new Date(),
    },
  });
  
  console.log('✅ Contenido del portal creado');
}

async function createPaymentHistory(businessId) {
  console.log('💳 Creando historial de pagos...');
  
  const now = new Date();
  
  // Últimos 6 meses de pagos
  for (let i = 0; i < 6; i++) {
    await prisma.paymentHistory.create({
      data: {
        businessId: businessId,
        transactionId: `txn_demo_${Date.now()}_${i}`,
        subscriptionId: 'sub_demo_' + Date.now(),
        amount: 250.00,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'card',
        customerId: 'ctm_demo_' + Date.now(),
        paddleData: {
          invoice_number: `INV-DEMO-${String(i + 1).padStart(4, '0')}`,
          receipt_url: 'https://paddle.com/receipt/demo',
        },
        createdAt: new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  
  console.log('✅ Historial de pagos creado');
}

// ====================================
// FUNCIÓN PRINCIPAL
// ====================================

async function main() {
  console.log('\n🎭 ========================================');
  console.log('   SEED DEMO DATA - LEALTA 2.0');
  console.log('   Business: Demo Lealta');
  console.log('========================================\n');
  
  try {
    // 1. Limpiar datos existentes
    await cleanDatabase();
    
    // 2. Crear business
    const business = await createBusiness();
    
    // 3. Crear usuarios
    const { superadmin, admin, staffUsers } = await createUsers(business.id);
    
    // 4. Crear ubicación
    const location = await createLocation(business.id);
    
    // 5. Configuraciones
    await createBrandingConfig(business.id);
    await createPuntosConfig(business.id);
    await createTarjetasConfig(business.id);
    await createBusinessGoals(business.id);
    
    // 6. Crear promotores
    const promotores = await createPromotores(business.id);
    
    // 7. Crear clientes con datos realistas
    const clientes = await createClientes(business.id, staffUsers, location.id);
    
    // 8. Crear reservas
    await createReservations(business.id, clientes, promotores);
    
    // 9. Crear contenido del portal
    await createPortalContent(business.id);
    
    // 10. Crear historial de pagos
    await createPaymentHistory(business.id);
    
    console.log('\n✅ ========================================');
    console.log('   SEED COMPLETADO EXITOSAMENTE');
    console.log('========================================\n');
    
    console.log('📋 CREDENCIALES DE ACCESO:\n');
    console.log('👑 SUPERADMIN:');
    console.log(`   Email: ${DEMO_CONFIG.superadmin.email}`);
    console.log(`   Password: ${DEMO_CONFIG.superadmin.password}`);
    console.log(`   URL: http://localhost:3001/${business.slug}/superadmin\n`);
    
    console.log('👨‍💼 ADMIN:');
    console.log(`   Email: ${DEMO_CONFIG.admin.email}`);
    console.log(`   Password: ${DEMO_CONFIG.admin.password}`);
    console.log(`   URL: http://localhost:3001/${business.slug}/admin\n`);
    
    console.log('📱 STAFF:');
    DEMO_CONFIG.staff.forEach(s => {
      console.log(`   Email: ${s.email}`);
      console.log(`   Password: ${s.password}`);
    });
    console.log(`   URL: http://localhost:3001/${business.slug}/staff\n`);
    
    console.log('👤 PORTAL CLIENTE:');
    console.log(`   URL: http://localhost:3001/${business.slug}/cliente`);
    console.log('   (Los clientes pueden iniciar sesión con su cédula)\n');
    
    console.log('📊 ESTADÍSTICAS GENERADAS:');
    console.log(`   • 50 clientes con diferentes niveles de lealtad`);
    console.log(`   • 80+ consumos registrados`);
    console.log(`   • 20 reservas (pasadas, presentes y futuras)`);
    console.log(`   • 3 promotores activos`);
    console.log(`   • 5 recompensas canjeables`);
    console.log(`   • 6 meses de historial de pagos\n`);
    
  } catch (error) {
    console.error('\n❌ ERROR durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
