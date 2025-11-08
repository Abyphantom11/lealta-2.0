const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creando clientes demo...\n');
  
  const business = await prisma.business.findFirst({
    where: { name: { contains: 'Demo' } }
  });
  
  if (!business) {
    console.log('No se encontro negocio Demo');
    return;
  }
  
  console.log('Negocio:', business.name);
  
  const productos = await prisma.menuProduct.findMany({
    where: { MenuCategory: { businessId: business.id } },
    include: { MenuCategory: true }
  });
  
  console.log('Productos:', productos.length, '\n');
  
  const platos = productos.filter(p => p.MenuCategory.nombre.includes('Platos') || p.MenuCategory.nombre.includes('Entrada'));
  const postres = productos.filter(p => p.MenuCategory.nombre.includes('Postres'));
  const bebidas = productos.filter(p => p.MenuCategory.nombre.includes('Bebidas') || p.MenuCategory.nombre.includes('Cocteles') || p.MenuCategory.nombre.includes('Cervezas'));
  const botellas = productos.filter(p => p.MenuCategory.nombre.includes('Botellas') || p.MenuCategory.nombre.includes('Vinos'));
  
  const clientesData = [
    { nombre: 'Carlos Mendoza Silva', cedula: '0926384751', correo: 'carlos.mendoza@email.com', telefono: '0998765432', visitas: 20 },
    { nombre: 'Maria Torres Vargas', cedula: '0915273846', correo: 'maria.torres@email.com', telefono: '0987654321', visitas: 22 },
    { nombre: 'Roberto Guzman Lopez', cedula: '0934567891', correo: 'roberto.guzman@email.com', telefono: '0991234567', visitas: 14 },
    { nombre: 'Ana Flores Castro', cedula: '0923456789', correo: 'ana.flores@email.com', telefono: '0989876543', visitas: 12 },
    { nombre: 'Diego Ruiz Moreno', cedula: '0912345678', correo: 'diego.ruiz@email.com', telefono: '0995678901', visitas: 10 },
    { nombre: 'Laura Campos Rivera', cedula: '0934512890', correo: 'laura.campos@email.com', telefono: '0992345678', visitas: 9 },
    { nombre: 'Fernando Vega Santos', cedula: '0921234567', correo: 'fernando.vega@email.com', telefono: '0987123456', visitas: 7 },
    { nombre: 'Patricia Ortiz Pena', cedula: '0913456789', correo: 'patricia.ortiz@email.com', telefono: '0994567890', visitas: 6 },
    { nombre: 'Andres Sanchez Diaz', cedula: '0925678901', correo: 'andres.sanchez@email.com', telefono: '0996789012', visitas: 5 },
    { nombre: 'Gabriela Ramirez Luna', cedula: '0914567890', correo: 'gabriela.ramirez@email.com', telefono: '0983456789', visitas: 5 },
    { nombre: 'Miguel Herrera Cruz', cedula: '0936789012', correo: 'miguel.herrera@email.com', telefono: '0991234890', visitas: 4 },
    { nombre: 'Valeria Paredes Gil', cedula: '0922345678', correo: 'valeria.paredes@email.com', telefono: '0988765432', visitas: 4 },
    { nombre: 'Javier Molina Ramos', cedula: '0917890123', correo: 'javier.molina@email.com', telefono: '0993456789', visitas: 3 },
    { nombre: 'Daniela Nunez Vera', cedula: '0935678901', correo: 'daniela.nunez@email.com', telefono: '0986543210', visitas: 3 },
    { nombre: 'Sebastian Reyes Maldonado', cedula: '0919876543', correo: 'sebastian.reyes@email.com', telefono: '0997654321', visitas: 2 },
    { nombre: 'Camila Figueroa Soto', cedula: '0928765432', correo: 'camila.figueroa@email.com', telefono: '0984567890', visitas: 2 },
    { nombre: 'Cristian Navarro Pena', cedula: '0916543210', correo: 'cristian.navarro@email.com', telefono: '0992345876', visitas: 1 },
    { nombre: 'Nicole Aguirre Morales', cedula: '0937654321', correo: 'nicole.aguirre@email.com', telefono: '0989123456', visitas: 1 },
    { nombre: 'Mateo Salazar Bravo', cedula: '0924321098', correo: 'mateo.salazar@email.com', telefono: '0995432109', visitas: 1 },
    { nombre: 'Isabella Cordero Leon', cedula: '0911234567', correo: 'isabella.cordero@email.com', telefono: '0981234567', visitas: 1 },
  ];
  
  let totalConsumos = 0;
  
  for (const cd of clientesData) {
    console.log(cd.nombre + '...');
    
    const cliente = await prisma.cliente.create({
      data: {
        businessId: business.id,
        nombre: cd.nombre,
        cedula: cd.cedula,
        correo: cd.correo,
        telefono: cd.telefono,
        puntos: 0
      }
    });
    
    let puntosTotal = 0;
    let gastoTotal = 0;
    
    for (let i = 0; i < cd.visitas; i++) {
      const items = [];
      let total = 0;
      const tipo = Math.random();
      
      if (tipo < 0.3 && bebidas.length > 0) {
        const p = bebidas[Math.floor(Math.random() * bebidas.length)];
        items.push({ nombre: p.nombre, cantidad: 1, precio: p.precio || 5 });
        total += p.precio || 5;
      } else if (tipo < 0.7 && platos.length > 0) {
        const p = platos[Math.floor(Math.random() * platos.length)];
        items.push({ nombre: p.nombre, cantidad: 1, precio: p.precio || 15 });
        total += p.precio || 15;
        if (bebidas.length > 0) {
          const b = bebidas[Math.floor(Math.random() * bebidas.length)];
          items.push({ nombre: b.nombre, cantidad: 1, precio: b.precio || 5 });
          total += b.precio || 5;
        }
      } else {
        if (platos.length > 0) {
          const p = platos[Math.floor(Math.random() * platos.length)];
          items.push({ nombre: p.nombre, cantidad: 1, precio: p.precio || 15 });
          total += p.precio || 15;
        }
        if (postres.length > 0 && Math.random() < 0.5) {
          const p = postres[Math.floor(Math.random() * postres.length)];
          items.push({ nombre: p.nombre, cantidad: 1, precio: p.precio || 6 });
          total += p.precio || 6;
        }
        if (bebidas.length > 0) {
          const b = bebidas[Math.floor(Math.random() * bebidas.length)];
          items.push({ nombre: b.nombre, cantidad: 1, precio: b.precio || 5 });
          total += b.precio || 5;
        }
      }
      
      if (items.length === 0) continue;
      
      const puntos = Math.round(total);
      puntosTotal += puntos;
      gastoTotal += total;
      
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      await prisma.consumo.create({
        data: {
          businessId: business.id,
          clienteId: cliente.id,
          total: total,
          puntos: puntos,
          productos: items,
          fecha: fecha
        }
      });
      
      totalConsumos++;
    }
    
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        puntos: puntosTotal,
        puntosAcumulados: puntosTotal,
        totalVisitas: cd.visitas,
        totalGastado: gastoTotal
      }
    });
    
    console.log('  ' + puntosTotal + ' puntos');
  }
  
  console.log('\nCompletado: ' + clientesData.length + ' clientes, ' + totalConsumos + ' consumos');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e.message); prisma.$disconnect(); process.exit(1); });
