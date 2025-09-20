const { Client } = require('pg');

async function testAdminDataLoad() {
  const client = new Client({
    connectionString: 'postgresql://postgres:admin123@localhost:5432/lealta_db'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // 1. Probar el businessId correcto que ahora usa el admin
    const correctBusinessId = 'cmfr2y0ia0000eyvw7ef3k20u';
    console.log(`\n🔍 Probando datos para businessId: ${correctBusinessId}`);
    
    // 2. Query para BrandingConfig (lo que usa /api/branding)
    const brandingQuery = `
      SELECT * FROM "BrandingConfig" 
      WHERE "businessId" = $1
    `;
    const brandingResult = await client.query(brandingQuery, [correctBusinessId]);
    console.log('\n🎨 BRANDING CONFIG ENCONTRADO:');
    if (brandingResult.rows.length > 0) {
      const branding = brandingResult.rows[0];
      console.log(`  ✅ businessName: ${branding.businessName}`);
      console.log(`  ✅ primaryColor: ${branding.primaryColor}`);
      console.log(`  ✅ carouselImages: ${branding.carouselImages ? branding.carouselImages.length : 0} imágenes`);
    } else {
      console.log('  ❌ No se encontró BrandingConfig');
    }

    // 3. Query para PortalBanner (lo que usa /api/admin/portal-config)
    const bannerQuery = `
      SELECT * FROM "PortalBanner" 
      WHERE "businessId" = $1
    `;
    const bannerResult = await client.query(bannerQuery, [correctBusinessId]);
    console.log('\n🏷️ PORTAL BANNER:');
    if (bannerResult.rows.length > 0) {
      console.log(`  ✅ Encontrados ${bannerResult.rows.length} banners`);
      bannerResult.rows.forEach((banner, i) => {
        console.log(`    Banner ${i+1}: ${banner.titulo} (activo: ${banner.activo})`);
      });
    } else {
      console.log('  ❌ No se encontraron banners');
    }

    // 4. Query para PortalPromocion
    const promoQuery = `
      SELECT * FROM "PortalPromocion" 
      WHERE "businessId" = $1
    `;
    const promoResult = await client.query(promoQuery, [correctBusinessId]);
    console.log('\n🎁 PORTAL PROMOCIONES:');
    if (promoResult.rows.length > 0) {
      console.log(`  ✅ Encontradas ${promoResult.rows.length} promociones`);
      promoResult.rows.forEach((promo, i) => {
        console.log(`    Promo ${i+1}: ${promo.titulo} (activa: ${promo.activa})`);
      });
    } else {
      console.log('  ❌ No se encontraron promociones');
    }

  } catch (error) {
    console.error('❌ Error en test:', error.message);
  } finally {
    await client.end();
  }
}

testAdminDataLoad();
