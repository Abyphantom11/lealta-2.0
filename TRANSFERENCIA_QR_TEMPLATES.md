# Transferencia de Templates de QR al Módulo de Reservas

## Resumen
Se identificó que los templates de QR (Halloween, Navidad, Año Nuevo, etc.) están en `ConfiguracionContent.tsx` del admin-v2, pero necesitan estar disponibles directamente en el módulo de reservas para facilitar el acceso.

## Templates Existentes

### Ubicación Actual
- **Archivo**: `src/components/admin-v2/configuracion/ConfiguracionContent.tsx`
- **Constante**: `CARD_TEMPLATES`

### Templates Disponibles:
1. **Elegante** - Black Card Premium (gradiente negro)
2. **Moderno** - Gradiente vibrante (púrpura)
3. **Minimalista** - Simple y limpio (blanco/negro)
4. **🎃 Halloween** - Tema naranja con decoraciones de calabazas
5. **🎄 Navidad** - Tema rojo/verde con árboles navideños
6. **🎆 Fin de Año 2025** - Tema dorado/azul para celebraciones

## Diferencia entre 2 Sistemas de QR

### 1. **QR Branding** (qr-personalizado)
- **Ubicación**: `src/app/[businessId]/admin/configuracion/qr-personalizado/page.tsx`
- **Propósito**: Personalizar el CONTENIDO del QR
- **Configuraciones**:
  - Mensaje de bienvenida
  - Marco con gradiente
  - Colores (primario/secundario)
  - Campos visibles (nombre, fecha, hora, etc.)
  - Información de contacto (teléfono, email, dirección)
- **Componente**: Usa `BrandedQRGenerator`
- **Hook**: `useQRBranding`

### 2. **Card Templates** (ConfiguracionContent)
- **Ubicación**: `src/components/admin-v2/configuracion/ConfiguracionContent.tsx`
- **Propósito**: Personalizar el DISEÑO DE LA TARJETA que rodea el QR
- **Configuraciones**:
  - Background color/gradiente
  - Border color y width
  - Border radius
  - Padding
  - Shadow
  - Header y text colors
  - Templates temáticos (Halloween, Navidad, etc.)
- **Componente**: Usa `QRCard`
- **API**: `/api/business/${businessId}/qr-branding`

## Solución

### Opción 1: Modal Combinado (RECOMENDADO)
Crear un modal en reservas con tabs:
- **Tab 1**: Personalización de Contenido (del qr-personalizado actual)
- **Tab 2**: Templates de Diseño (de ConfiguracionContent)

### Opción 2: Dos Botones Separados
- **Botón 1**: ⚙️ Configurar QR (contenido)
- **Botón 2**: 🎨 Estilos de QR (templates)

## Archivos a Modificar

1. **Crear**: `src/app/reservas/components/QRTemplatesModal.tsx`
   - Importar CARD_TEMPLATES
   - Vista previa con QRCard
   - Guardar selección en API

2. **Modificar**: `src/app/reservas/components/Header.tsx`
   - Agregar botón de "Estilos de QR" junto al botón de configuración existente

3. **Actualizar**: `src/app/reservas/components/QRConfigModal.tsx`
   - Renombrar a "Personalización de Contenido"
   - Clarificar que configura el contenido del QR

## API Endpoints

### Actual
- `GET/PATCH /api/qr-branding/${businessId}` - Configuración de contenido
- `GET/PATCH /api/business/${businessId}/qr-branding` - Templates de diseño

### Consolidar (FUTURO)
Unificar en un solo endpoint con dos secciones:
```json
{
  "contentConfig": { /* config actual de qr-branding */ },
  "designTemplate": "halloween",
  "cardDesign": { /* estilo de la tarjeta */ }
}
```

## Estado Actual

✅ QRConfigModal creado (personalización de contenido)
✅ Integrado en Header con botón Settings
✅ Usa componentes de shadcn/ui
❌ Falta integrar templates de diseño (Halloween, Navidad, etc.)

## Próximos Pasos

1. Crear QRTemplatesModal con CARD_TEMPLATES
2. Agregar segundo botón en Header (🎨 Estilos)
3. Implementar vista previa con QRCard
4. Conectar con API de business/qr-branding
5. Documentar diferencia entre ambos sistemas para el usuario

## Notas Técnicas

- **QRCard** tiene detección automática de temas (isHalloween, isChristmas)
- Los templates incluyen decoraciones SVG especiales (calabazas, árboles)
- El componente QRCard ya soporta overflow-visible para decoraciones
- MOCK_RESERVA debe usar `new Date()` para evitar errores de formato
