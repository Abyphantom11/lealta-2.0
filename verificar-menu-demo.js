const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarMenu() {
  try {
    console.log('🔍 Verificando menú de Demo Lealta...\n');

    // Buscar el negocio
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Lealta', mode: 'insensitive' } },
          { subdomain: 'demo-lealta' }
        ]
      }
    });

    if (!business) {
      console.log('❌ No se encontró el negocio Demo Lealta');
      return;
    }

    console.log(`✅ Negocio encontrado: ${business.name}`);
    console.log(`   ID: ${business.id}\n`);

    // Contar productos (usar modelo correcto: MenuProduct)
    const totalProductos = await prisma.menuProduct.count({
      where: {
        MenuCategory: {
          businessId: business.id
        }
      }
    });

    console.log(`📊 Total de productos: ${totalProductos}\n`);

    // Contar categorías (usar modelo correcto: MenuCategory)
    const totalCategorias = await prisma.menuCategory.count({
      where: { businessId: business.id }
    });

    console.log(`📂 Total de categorías: ${totalCategorias}\n`);

    // Listar categorías con conteo de productos
    const categorias = await prisma.menuCategory.findMany({
      where: { businessId: business.id },
      include: {
        _count: {
          select: { MenuProduct: true }
        }
      },
      orderBy: { orden: 'asc' }
    });

    console.log('📋 Categorías y productos:\n');
    for (const cat of categorias) {
      console.log(`   ${cat.nombre}: ${cat._count.MenuProduct} productos`);
    }

    // Verificar algunos productos de ejemplo
    console.log('\n🔍 Primeros 5 productos:\n');
    const productos = await prisma.menuProduct.findMany({
      where: {
        MenuCategory: {
          businessId: business.id
        }
      },
      include: { MenuCategory: true },
      take: 5,
      orderBy: { nombre: 'asc' }
    });

    for (const prod of productos) {
      console.log(`   • ${prod.nombre} - $${prod.precio || prod.precioVaso || '0.00'}`);
      console.log(`     Categoría: ${prod.MenuCategory?.nombre || 'Sin categoría'}`);
      console.log(`     Disponible: ${prod.disponible ? 'Sí' : 'No'}`);
      console.log(`     Tipo: ${prod.tipoProducto}`);
      console.log(`     Imagen: ${prod.imagenUrl ? 'Sí' : 'No'}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarMenu();
