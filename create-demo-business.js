/**
 * Script para crear un negocio de demostración completo
 * Con datos realistas para capturas y demos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuración del negocio demo
const DEMO_CONFIG = {
  businessName: "La Casa del Sabor",
  businessType: "Restaurante Gourmet",
  adminEmail: "demo@lacasadelsabor.com",
  adminPassword: "Demo2024!",
  numClients: 25,
  numConsumos: 80,
  numReservas: 15,
};

// Nombres y apellidos para generar clientes
const NOMBRES = [
  "Carlos", "María", "José", "Ana", "Luis", "Carmen", "Pedro", "Laura",
  "Miguel", "Isabel", "Francisco", "Rosa", "Antonio", "Patricia", "Juan",
  "Elena", "Manuel", "Sofía", "Rafael", "Lucía", "David", "Marta", "Javier",
  "Beatriz", "Alberto"
];

const APELLIDOS = [
  "García", "Rodríguez", "Martínez", "López", "González", "Pérez", "Sánchez",
  "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz", "Morales",
  "Reyes", "Jiménez", "Hernández", "Ruiz", "Mendoza"
];

// Productos del menú
const MENU_ITEMS = [
  { nombre: "Entrada Mediterránea", precio: 12.50 },
  { nombre: "Ensalada César", precio: 9.90 },
  { nombre: "Sopa del Día", precio: 7.50 },
  { nombre: "Filete de Salmón", precio: 24.90 },
  { nombre: "Lomo de Res Premium", precio: 28.50 },
  { nombre: "Pasta Carbonara", precio: 16.90 },
  { nombre: "Risotto de Hongos", precio: 18.50 },
  { nombre: "Pizza Margherita", precio: 14.90 },
  { nombre: "Tacos Gourmet (3)", precio: 13.50 },
  { nombre: "Hamburguesa Angus", precio: 15.90 },
  { nombre: "Postre del Chef", precio: 8.90 },
  { nombre: "Tiramisu", precio: 9.50 },
  { nombre: "Bebida Premium", precio: 5.90 },
  { nombre: "Vino de la Casa (Copa)", precio: 7.50 },
  { nombre: "Café Espresso", precio: 3.50 },
];

// Función helper para generar fecha aleatoria en los últimos N días
function randomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 4) + 18); // Entre 18:00 y 22:00
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

// Función helper para generar teléfono
function randomPhone() {
  return `+34 ${Math.floor(Math.random() * 900) + 600} ${Math.floor(Math.random() * 900000) + 100000}`;
}

// Función helper para generar email
function randomEmail(nombre, apellido) {
  const providers = ['gmail.com', 'hotmail.com', 'yahoo.es', 'outlook.com'];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  return `${nombre.toLowerCase()}.${apellido.toLowerCase()}@${provider}`;
}

async function main() {
  console.log('🚀 Iniciando creación de negocio demo...\n');

  try {
    // 1. CREAR NEGOCIO PRIMERO (porque User requiere businessId)
    console.log('🏢 Paso 1: Creando negocio...');
    
    // Crear business temporal sin owner
    const business = await prisma.business.create({
      data: {
        name: DEMO_CONFIG.businessName,
        slug: "la-casa-del-sabor",
        subdomain: "lacasadelsabor",
        subscriptionPlan: "PRO",
        isActive: true,
        settings: {
          email: DEMO_CONFIG.adminEmail,
          phone: "+34 911 234 567",
          address: "Calle Gran Vía, 28, Madrid",
          description: "Restaurante gourmet con cocina mediterránea y ambiente acogedor. Especialidad en carnes y pescados frescos.",
          category: "Restaurante",
          colors: {
            primary: "#D4AF37",
            secondary: "#2C3E50",
            accent: "#E74C3C"
          },
          currency: "EUR",
          timezone: "Europe/Madrid",
          language: "es"
        },
        clientTheme: "elegante",
        qrMostrarLogo: true,
        qrMensajeBienvenida: "¡Bienvenido a La Casa del Sabor!",
      }
    });
    console.log(`✅ Negocio creado: ${business.name}`);
    console.log(`   ID: ${business.id}\n`);

    // 2. CREAR ADMIN
    console.log('👤 Paso 2: Creando usuario administrador...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(DEMO_CONFIG.adminPassword, 10);
    
    const admin = await prisma.user.create({
      data: {
        businessId: business.id,
        email: DEMO_CONFIG.adminEmail,
        passwordHash: hashedPassword,
        name: "Admin Demo",
        role: "SUPERADMIN",
        isActive: true,
      }
    });
    console.log(`✅ Admin creado: ${admin.email}`);
    console.log(`   Password: ${DEMO_CONFIG.adminPassword}\n`);

    // 3. CREAR TARJETAS DE FIDELIDAD (Sistema jerárquico)
    console.log('🎴 Paso 3: Creando tarjetas de fidelidad...');
    
    const tarjetaBronce = await prisma.tarjetaFidelidad.create({
      data: {
        businessId: business.id,
        nombre: "Bronce",
        color: "#CD7F32",
        beneficios: ["5% descuento", "Puntos x1"],
        puntosRequeridos: 0,
        prioridad: 1,
        imagen: null,
        activa: true,
      }
    });

    const tarjetaPlata = await prisma.tarjetaFidelidad.create({
      data: {
        businessId: business.id,
        nombre: "Plata",
        color: "#C0C0C0",
        beneficios: ["10% descuento", "Puntos x1.5", "Reservas prioritarias"],
        puntosRequeridos: 5000,
        prioridad: 2,
        imagen: null,
        activa: true,
        parentId: tarjetaBronce.id,
      }
    });

    const tarjetaOro = await prisma.tarjetaFidelidad.create({
      data: {
        businessId: business.id,
        nombre: "Oro",
        color: "#FFD700",
        beneficios: ["15% descuento", "Puntos x2", "Eventos exclusivos", "Cumpleaños especial"],
        puntosRequeridos: 15000,
        prioridad: 3,
        imagen: null,
        activa: true,
        parentId: tarjetaPlata.id,
      }
    });

    const tarjetaPlatino = await prisma.tarjetaFidelidad.create({
      data: {
        businessId: business.id,
        nombre: "Platino",
        color: "#E5E4E2",
        beneficios: ["20% descuento", "Puntos x3", "Mesa VIP", "Chef privado disponible", "Valet parking"],
        puntosRequeridos: 30000,
        prioridad: 4,
        imagen: null,
        activa: true,
        parentId: tarjetaOro.id,
      }
    });

    console.log(`✅ 4 tarjetas creadas: Bronce → Plata → Oro → Platino\n`);

    // 4. CREAR CLIENTES
    console.log(`👥 Paso 4: Creando ${DEMO_CONFIG.numClients} clientes...`);
    const clientes = [];
    
    for (let i = 0; i < DEMO_CONFIG.numClients; i++) {
      const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
      const apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
      const email = randomEmail(nombre, apellido);
      
      // Distribuir tarjetas de forma realista
      let tarjetaId;
      const rand = Math.random();
      if (rand < 0.50) tarjetaId = tarjetaBronce.id; // 50% Bronce
      else if (rand < 0.75) tarjetaId = tarjetaPlata.id; // 25% Plata
      else if (rand < 0.90) tarjetaId = tarjetaOro.id; // 15% Oro
      else tarjetaId = tarjetaPlatino.id; // 10% Platino

      const puntosBase = tarjetaId === tarjetaBronce.id ? Math.floor(Math.random() * 3000) :
                        tarjetaId === tarjetaPlata.id ? Math.floor(Math.random() * 8000) + 5000 :
                        tarjetaId === tarjetaOro.id ? Math.floor(Math.random() * 12000) + 15000 :
                        Math.floor(Math.random() * 20000) + 30000;

      const cliente = await prisma.cliente.create({
        data: {
          nombre,
          apellido,
          email,
          telefono: randomPhone(),
          businessId: business.id,
          tarjetaId,
          puntos: puntosBase,
          totalGastado: puntosBase / puntosConfig.puntosPerEuro, // Aproximado
          visitasTotales: Math.floor(Math.random() * 30) + 1,
          fechaRegistro: randomDate(180),
        }
      });
      
      clientes.push(cliente);
    }
    
    console.log(`✅ ${clientes.length} clientes creados\n`);

    // 6. CREAR CONSUMOS
    console.log(`💰 Paso 6: Generando ${DEMO_CONFIG.numConsumos} consumos...`);
    
    for (let i = 0; i < DEMO_CONFIG.numConsumos; i++) {
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      
      // Generar 1-4 items por consumo
      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let total = 0;
      
      for (let j = 0; j < numItems; j++) {
        const item = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
        const cantidad = Math.floor(Math.random() * 2) + 1;
        items.push({
          nombre: item.nombre,
          precio: item.precio,
          cantidad
        });
        total += item.precio * cantidad;
      }
      
      const puntosGanados = Math.floor(total * puntosConfig.puntosPerEuro);
      
      await prisma.consumo.create({
        data: {
          clienteId: cliente.id,
          businessId: business.id,
          monto: total,
          items,
          puntosGanados,
          fecha: randomDate(90),
          metodoPago: ["efectivo", "tarjeta", "transferencia"][Math.floor(Math.random() * 3)],
        }
      });
    }
    
    console.log(`✅ ${DEMO_CONFIG.numConsumos} consumos generados\n`);

    // 7. CREAR RESERVAS
    console.log(`📅 Paso 7: Creando ${DEMO_CONFIG.numReservas} reservas...`);
    
    const estados = ["confirmada", "confirmada", "confirmada", "pendiente", "cancelada"];
    
    for (let i = 0; i < DEMO_CONFIG.numReservas; i++) {
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      const estado = estados[Math.floor(Math.random() * estados.length)];
      
      // Mezcla de reservas pasadas y futuras
      const esFutura = Math.random() > 0.4; // 60% futuras
      let fechaReserva;
      
      if (esFutura) {
        fechaReserva = new Date();
        fechaReserva.setDate(fechaReserva.getDate() + Math.floor(Math.random() * 30) + 1);
        fechaReserva.setHours(Math.floor(Math.random() * 4) + 19); // 19:00-23:00
      } else {
        fechaReserva = randomDate(30);
      }
      
      const numPersonas = Math.floor(Math.random() * 6) + 2; // 2-8 personas
      
      await prisma.reserva.create({
        data: {
          businessId: business.id,
          clienteId: cliente.id,
          fecha: fechaReserva,
          numeroPersonas: numPersonas,
          estado,
          mesa: `Mesa ${Math.floor(Math.random() * 20) + 1}`,
          notas: estado === "confirmada" ? "Confirmada por WhatsApp" : 
                 estado === "pendiente" ? "Esperando confirmación" : 
                 "Cliente canceló por cambio de planes",
          confirmadoPor: estado === "confirmada" ? admin.id : null,
        }
      });
    }
    
    console.log(`✅ ${DEMO_CONFIG.numReservas} reservas creadas\n`);

    // 8. CREAR PROMOCIONES
    console.log(`🎉 Paso 8: Creando promociones activas...`);
    
    const promocion1 = await prisma.promocion.create({
      data: {
        businessId: business.id,
        nombre: "Happy Hour - 2x1 en Bebidas",
        descripcion: "De lunes a viernes de 18:00 a 20:00. Segunda bebida gratis.",
        descuento: 50,
        tipo: "porcentaje",
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 días
        activa: true,
        condiciones: "Válido solo en barra. No acumulable con otras promociones.",
      }
    });

    const promocion2 = await prisma.promocion.create({
      data: {
        businessId: business.id,
        nombre: "Menú del Día Especial",
        descripcion: "Menú completo: Entrada + Principal + Postre + Bebida",
        descuento: 25,
        tipo: "monto_fijo",
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
        activa: true,
        condiciones: "De lunes a viernes. Solo al mediodía.",
      }
    });

    const promocion3 = await prisma.promocion.create({
      data: {
        businessId: business.id,
        nombre: "Cumpleaños Especial",
        descripcion: "Postre gratis en tu cumpleaños + 1000 puntos extra",
        descuento: 0,
        tipo: "regalo",
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 año
        activa: true,
        condiciones: "Presentar DNI. Válido el día de tu cumpleaños.",
      }
    });

    console.log(`✅ 3 promociones activas creadas\n`);

    // 9. CREAR STAFF ADICIONAL
    console.log(`👔 Paso 9: Creando personal del restaurante...`);
    
    const staff1 = await prisma.user.create({
      data: {
        businessId: business.id,
        email: "camarero@lacasadelsabor.com",
        passwordHash: hashedPassword,
        name: "Juan Camarero",
        role: "STAFF",
        isActive: true,
        createdBy: admin.id,
      }
    });

    console.log(`✅ Personal adicional creado (camarero@lacasadelsabor.com)\n`);

    // 10. RESUMEN FINAL
    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ ¡NEGOCIO DEMO CREADO EXITOSAMENTE! ✨');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📊 RESUMEN DE DATOS CREADOS:\n');
    console.log(`🏢 Negocio: ${business.name}`);
    console.log(`   └─ Subdomain: ${business.subdomain}`);
    console.log(`   └─ ID: ${business.id}\n`);
    
    console.log(`👤 Usuario Admin:`);
    console.log(`   └─ Email: ${DEMO_CONFIG.adminEmail}`);
    console.log(`   └─ Password: ${DEMO_CONFIG.adminPassword}\n`);
    
    console.log(`🎴 Tarjetas de Fidelidad: 4 niveles`);
    console.log(`   ├─ Bronce (${tarjetaBronce.id})`);
    console.log(`   ├─ Plata (${tarjetaPlata.id})`);
    console.log(`   ├─ Oro (${tarjetaOro.id})`);
    console.log(`   └─ Platino (${tarjetaPlatino.id})\n`);
    
    console.log(`👥 Clientes: ${clientes.length}`);
    console.log(`💰 Consumos: ${DEMO_CONFIG.numConsumos}`);
    console.log(`📅 Reservas: ${DEMO_CONFIG.numReservas}`);
    console.log(`🎉 Promociones: 3 activas\n`);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 URLs PARA ACCEDER:\n');
    console.log(`Admin Dashboard:`);
    console.log(`   http://localhost:3001/admin\n`);
    console.log(`Portal del Cliente:`);
    console.log(`   http://localhost:3001/${business.id}\n`);
    console.log(`Staff (Punto de Venta):`);
    console.log(`   http://localhost:3001/${business.id}/staff\n`);
    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error creando negocio demo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
