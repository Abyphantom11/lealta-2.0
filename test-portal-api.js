// Script de prueba para la API del portal
const testData = {
  banners: [
    {
      id: "banner-test",
      title: "Banner de Prueba",
      description: "Este es un banner actualizado desde la API",
      imageUrl: "/test-banner.jpg",
      linkUrl: "/test",
      isActive: true,
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

console.log('Datos de prueba:', JSON.stringify(testData, null, 2));
