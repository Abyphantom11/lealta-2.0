# 🎨 UBICACIÓN UI: CONFIGURACIÓN DE QR PERSONALIZADO

## 🎯 ANÁLISIS DE OPCIONES DE UBICACIÓN

### **OPCIÓN 1: Tab en Navbar Principal (NO RECOMENDADO)**

```
┌─────────────────────────────────────────────────┐
│  Dashboard | Scanner QR | Reportes | QR Config │ ❌
└─────────────────────────────────────────────────┘
```

**Problemas:**
- ❌ Sobrecarga visual en navbar
- ❌ No es una función de "uso diario"
- ❌ Confunde la jerarquía de información
- ❌ En móvil no hay espacio

---

### **OPCIÓN 2: Dentro de Gestión de Promotores (NO RECOMENDADO)**

```
Gestión de Promotores
├── Lista de Promotores
└── Config QR ❌
```

**Problemas:**
- ❌ No tiene relación lógica
- ❌ Los promotores no configuran QRs
- ❌ Difícil de encontrar

---

### **OPCIÓN 3: Modal desde Header (BUENA)**

```
┌─────────────────────────────────────────────────┐
│  Reservas Dashboard    [⚙️ Config QR] [+ Nueva] │ ✅
└─────────────────────────────────────────────────┘
```

**Ventajas:**
- ✅ Accesible desde cualquier vista
- ✅ Icono claro (engranaje)
- ✅ No ocupa espacio fijo
- ✅ Funciona en móvil

**Problemas:**
- ⚠️ Puede pasar desapercibido
- ⚠️ No está relacionado con "crear reserva"

---

### **OPCIÓN 4: Configuración Global del Business (MEJOR) ⭐**

```
/{businessId}/admin
├── Dashboard
├── Clientes
├── Menú
├── Portal Cliente
└── Configuración ← AQUÍ
    ├── General
    ├── Branding
    ├── QR Personalizado ⭐
    └── Notificaciones
```

**Ventajas:**
- ✅ Lógica clara: "Configuración" → "QR"
- ✅ Se configura una vez, se usa siempre
- ✅ Agrupado con otras configs del negocio
- ✅ Admin tiene control total
- ✅ No interfiere con flujo de reservas

**Implementación:**
1. Nueva sección en Admin: "Configuración"
2. Subsección: "QR Personalizado"
3. Preview en tiempo real
4. Guardar para todo el negocio

---

### **OPCIÓN 5: Híbrida - Config en Admin + Preview en Reservas (RECOMENDACIÓN FINAL) 🏆**

```
ADMIN (/admin/configuracion/qr)
├── Configuración completa del QR
├── Todos los controles (colores, mensaje, logo, etc.)
├── Templates prediseñados
└── Guardar configuración global

RESERVAS (/reservas)
├── Al confirmar reserva → Muestra QR con config aplicada
├── Botón "Ver ejemplo QR" en header (opcional)
└── Link sutil "Personalizar QR" → Redirige a Admin
```

---

## 🎨 PROPUESTA FINAL DE UI

### **1. Admin - Sección de Configuración**

```typescript
// Nueva estructura en Admin
/{businessId}/admin
├── dashboard
├── clientes
├── menu
├── portal
└── configuracion  ← NUEVO
    ├── general
    ├── branding
    ├── qr-personalizado  ← AQUÍ VA LA CONFIG
    ├── notificaciones
    └── integraciones
```

**Navegación en Admin:**
```tsx
<Sidebar>
  <NavItem icon={Home}>Dashboard</NavItem>
  <NavItem icon={Users}>Clientes</NavItem>
  <NavItem icon={Menu}>Menú</NavItem>
  <NavItem icon={Globe}>Portal Cliente</NavItem>
  <NavItem icon={Settings}>Configuración</NavItem>  ← AQUÍ
</Sidebar>

// Al hacer click en Configuración:
<ConfigSubMenu>
  <SubItem>General</SubItem>
  <SubItem>Branding</SubItem>
  <SubItem>QR Personalizado</SubItem>  ← AQUÍ
  <SubItem>Notificaciones</SubItem>
</ConfigSubMenu>
```

### **2. Reservas - Uso Automático**

```tsx
// En ReservationConfirmation.tsx
<BrandedQRGenerator
  reserva={reserva}
  businessId={businessId}
  // Config se carga automáticamente desde DB
/>

// Link sutil para editar
<div className="text-xs text-gray-500 text-center mt-4">
  <a href={`/${businessId}/admin/configuracion/qr-personalizado`}>
    ⚙️ Personalizar diseño del QR
  </a>
</div>
```

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### **FASE 1: Estructura de Rutas**

```bash
# Crear nueva sección en Admin
src/app/[businessId]/admin/
├── page.tsx
├── clientes/
├── menu/
├── portal/
└── configuracion/  ← NUEVO
    ├── page.tsx (Layout de configuración)
    ├── general/page.tsx
    ├── branding/page.tsx
    └── qr-personalizado/page.tsx  ← CONFIG QR
```

### **FASE 2: Sidebar Navigation**

```typescript
// src/app/[businessId]/admin/components/AdminSidebar.tsx

const navigationItems = [
  { label: 'Dashboard', icon: Home, href: '/admin' },
  { label: 'Clientes', icon: Users, href: '/admin/clientes' },
  { label: 'Menú', icon: UtensilsCrossed, href: '/admin/menu' },
  { label: 'Portal Cliente', icon: Globe, href: '/admin/portal' },
  { 
    label: 'Configuración', 
    icon: Settings, 
    href: '/admin/configuracion',
    subItems: [  // ← SUBMENU
      { label: 'General', href: '/admin/configuracion/general' },
      { label: 'Branding', href: '/admin/configuracion/branding' },
      { label: 'QR Personalizado', href: '/admin/configuracion/qr-personalizado' },
      { label: 'Notificaciones', href: '/admin/configuracion/notificaciones' },
    ]
  },
];
```

### **FASE 3: Página de Configuración QR**

```typescript
// src/app/[businessId]/admin/configuracion/qr-personalizado/page.tsx

export default function QRConfigPage({ params }: { params: { businessId: string } }) {
  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-6">
        <a href={`/${params.businessId}/admin`}>Admin</a> 
        <span className="mx-2">/</span>
        <a href={`/${params.businessId}/admin/configuracion`}>Configuración</a>
        <span className="mx-2">/</span>
        <span className="text-gray-900">QR Personalizado</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">QR Personalizado</h1>
          <p className="text-gray-600 mt-2">
            Configura cómo se verán los códigos QR de las reservas
          </p>
        </div>
        
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      {/* Grid: Formulario + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Formulario de configuración */}
        <div className="space-y-6">
          <Tabs>
            <TabsList>
              <TabsTrigger>Mensaje</TabsTrigger>
              <TabsTrigger>Colores</TabsTrigger>
              <TabsTrigger>Contacto</TabsTrigger>
              <TabsTrigger>Avanzado</TabsTrigger>
            </TabsList>
            
            <TabsContent>
              {/* Todos los controles aquí */}
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: Preview en tiempo real */}
        <div className="sticky top-8">
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Vista Previa</h3>
            <BrandedQRGenerator
              reserva={MOCK_RESERVA}  // Reserva de ejemplo
              businessId={params.businessId}
              brandingConfig={config}  // Config actual
              preview={true}  // Modo preview
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 CAMPOS CONDICIONALES (Tu Pregunta sobre Mesa)

### **Solución para Campos Opcionales:**

```typescript
// src/types/branding.ts

export interface QRBrandingConfig {
  // ... otros campos ...
  
  // 📋 Configuración de campos mostrados
  camposMostrados: {
    nombreCliente: boolean;      // default: true
    fecha: boolean;              // default: true
    hora: boolean;               // default: true
    numeroPersonas: boolean;     // default: true
    mesa: boolean;               // default: false ⭐ (opcional)
    promotor: boolean;           // default: false
    observaciones: boolean;      // default: false
    codigoReserva: boolean;      // default: true
  };
  
  // 💬 Etiquetas personalizadas
  etiquetas: {
    nombreCliente: string;       // default: "Cliente"
    fecha: string;               // default: "Fecha"
    hora: string;                // default: "Hora"
    numeroPersonas: string;      // default: "Personas"
    mesa: string;                // default: "Mesa"
    promotor: string;            // default: "Promotor"
    observaciones: string;       // default: "Observaciones"
  };
}
```

### **Implementación en BrandedQRGenerator:**

```typescript
// src/app/reservas/components/BrandedQRGenerator.tsx

const generateBrandedQR = async () => {
  // ... setup canvas ...

  // INFORMACIÓN DE LA RESERVA (solo campos habilitados)
  const campos = [
    { 
      mostrar: brandingConfig.camposMostrados.nombreCliente,
      emoji: '👤',
      label: brandingConfig.etiquetas.nombreCliente,
      valor: reserva.cliente.nombre
    },
    { 
      mostrar: brandingConfig.camposMostrados.fecha,
      emoji: '📅',
      label: brandingConfig.etiquetas.fecha,
      valor: reserva.fecha
    },
    { 
      mostrar: brandingConfig.camposMostrados.hora,
      emoji: '🕐',
      label: brandingConfig.etiquetas.hora,
      valor: reserva.hora
    },
    { 
      mostrar: brandingConfig.camposMostrados.numeroPersonas,
      emoji: '👥',
      label: brandingConfig.etiquetas.numeroPersonas,
      valor: `${reserva.numeroPersonas} personas`
    },
    { 
      mostrar: brandingConfig.camposMostrados.mesa && reserva.mesa,  // ⭐ Solo si está habilitado Y existe
      emoji: '📍',
      label: brandingConfig.etiquetas.mesa,
      valor: `Mesa ${reserva.mesa}`
    },
    { 
      mostrar: brandingConfig.camposMostrados.promotor && reserva.promotor,
      emoji: '🎯',
      label: brandingConfig.etiquetas.promotor,
      valor: reserva.promotor.nombre
    },
  ];

  // Renderizar solo campos habilitados
  campos.forEach((campo) => {
    if (campo.mostrar && campo.valor) {  // ⭐ Doble validación
      ctx.fillText(
        `${campo.emoji} ${campo.label}: ${campo.valor}`,
        width / 2,
        currentY
      );
      currentY += 35;
    }
  });
};
```

### **UI de Configuración:**

```tsx
// En el panel de configuración

<div className="space-y-4">
  <h3 className="font-semibold">Información en el QR</h3>
  <p className="text-sm text-gray-600">
    Selecciona qué información quieres mostrar en el QR
  </p>

  {/* Switches para cada campo */}
  <div className="space-y-3">
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">👤</span>
        <div>
          <p className="font-medium">Nombre del Cliente</p>
          <p className="text-xs text-gray-500">Siempre recomendado</p>
        </div>
      </div>
      <Switch
        checked={config.camposMostrados.nombreCliente}
        disabled  // Siempre activo
      />
    </div>

    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📅</span>
        <div>
          <p className="font-medium">Fecha</p>
          <p className="text-xs text-gray-500">Fecha de la reserva</p>
        </div>
      </div>
      <Switch
        checked={config.camposMostrados.fecha}
        onCheckedChange={(checked) => updateCampo('fecha', checked)}
      />
    </div>

    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🕐</span>
        <div>
          <p className="font-medium">Hora</p>
          <p className="text-xs text-gray-500">Hora de la reserva</p>
        </div>
      </div>
      <Switch
        checked={config.camposMostrados.hora}
        onCheckedChange={(checked) => updateCampo('hora', checked)}
      />
    </div>

    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">👥</span>
        <div>
          <p className="font-medium">Número de Personas</p>
          <p className="text-xs text-gray-500">Cantidad de comensales</p>
        </div>
      </div>
      <Switch
        checked={config.camposMostrados.numeroPersonas}
        onCheckedChange={(checked) => updateCampo('numeroPersonas', checked)}
      />
    </div>

    {/* ⭐ MESA - OPCIONAL */}
    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📍</span>
        <div>
          <p className="font-medium">Mesa</p>
          <p className="text-xs text-gray-500">
            Solo se muestra si la reserva tiene mesa asignada
          </p>
        </div>
      </div>
      <Switch
        checked={config.camposMostrados.mesa}
        onCheckedChange={(checked) => updateCampo('mesa', checked)}
      />
    </div>

    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎯</span>
        <div>
          <p className="font-medium">Promotor</p>
          <p className="text-xs text-gray-500">Quien generó la reserva</p>
        </div>
      </div>
      <Switch
        checked={config.camposMostrados.promotor}
        onCheckedChange={(checked) => updateCampo('promotor', checked)}
      />
    </div>

    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📝</span>
        <div>
          <p className="font-medium">Observaciones</p>
          <p className="text-xs text-gray-500">Notas adicionales</p>
        </div>
      </div>
      <Switch
        checked={config.camposMostrados.observaciones}
        onCheckedChange={(checked) => updateCampo('observaciones', checked)}
      />
    </div>
  </div>

  {/* Personalización de etiquetas */}
  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <h4 className="font-semibold text-blue-900 mb-3">
      💡 Tip: Personaliza las etiquetas
    </h4>
    <p className="text-sm text-blue-800 mb-3">
      Puedes cambiar cómo se llaman los campos en tu idioma o jerga
    </p>
    
    <div className="space-y-2">
      <div>
        <Label className="text-xs">Etiqueta para "Mesa"</Label>
        <Input
          value={config.etiquetas.mesa}
          onChange={(e) => updateEtiqueta('mesa', e.target.value)}
          placeholder="Mesa"
          className="text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ejemplo: "Table", "Tavolo", "Zona", etc.
        </p>
      </div>
    </div>
  </div>
</div>
```

---

## 🎯 FLUJO COMPLETO DEL USUARIO

### **1. Configuración Inicial (Una vez)**

```
Admin entra a:
/{businessId}/admin/configuracion/qr-personalizado

1. Selecciona colores del negocio
2. Sube logo
3. Configura mensaje ("¡Te esperamos!")
4. Activa/desactiva campos (Mesa: OFF en tu caso)
5. Personaliza etiquetas si quiere
6. Ve preview en tiempo real
7. Guarda → Configuración aplicada a TODAS las reservas
```

### **2. Uso Diario (Automático)**

```
Staff/Admin crea reserva:
1. Llena formulario (sin mesa, en tu caso)
2. Confirma reserva
3. QR se genera automáticamente con config guardada
4. QR NO muestra campo "Mesa" (porque está desactivado)
5. Cliente recibe QR branded hermoso
```

### **3. Actualización (Cuando quiera)**

```
Si Admin quiere cambiar algo:
1. Va a /admin/configuracion/qr-personalizado
2. Cambia lo que necesite
3. Guarda
4. TODAS las reservas futuras usan nueva config
5. Reservas existentes mantienen su QR original
```

---

## 🎨 MOCKUP VISUAL DE LA UBICACIÓN

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN - SIDEBAR                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏠 Dashboard                                           │
│  👥 Clientes                                            │
│  🍽️  Menú                                               │
│  🌐 Portal Cliente                                      │
│  ⚙️  Configuración                    ◀───┐            │
│      ├─ General                           │            │
│      ├─ Branding                          │            │
│      ├─ 🎨 QR Personalizado   ◀───────────┘            │
│      └─ Notificaciones                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN > QR PERSONALIZADO                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Tabs: Mensaje | Colores | Campos | Contacto]         │
│                                                         │
│  FORMULARIO                      PREVIEW               │
│  ┌────────────────┐             ┌────────────────┐    │
│  │ Mensaje:       │             │  [LOGO] Negocio│    │
│  │ ¡Te esperamos! │             │                │    │
│  │                │             │  👤 Juan Pérez │    │
│  │ Campos:        │             │  📅 15 Oct     │    │
│  │ ☑ Nombre       │             │  🕐 20:00      │    │
│  │ ☑ Fecha        │             │  👥 4 personas │    │
│  │ ☑ Hora         │             │  [QR CODE]     │    │
│  │ ☑ Personas     │             │                │    │
│  │ ☐ Mesa    ◀────┼─────────────│  ¡Te esperamos!│    │
│  │                │             │  📞 6000-0000  │    │
│  └────────────────┘             └────────────────┘    │
│                                                         │
│  [Guardar Cambios]                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ RESUMEN DE LA RECOMENDACIÓN

### **Ubicación: Admin > Configuración > QR Personalizado**

**Por qué:**
1. ✅ Es configuración del negocio, no de cada reserva
2. ✅ Se configura una vez, se usa miles de veces
3. ✅ Admin tiene control centralizado
4. ✅ No interfiere con flujo de trabajo diario
5. ✅ Fácil de encontrar en sección de configuración
6. ✅ Permite preview antes de guardar

**Campos opcionales:**
1. ✅ Cada negocio elige qué mostrar
2. ✅ Mesa desactivada por defecto en tu caso
3. ✅ Si no hay dato, no se renderiza
4. ✅ Etiquetas personalizables

**Flujo:**
```
Config una vez → Se aplica siempre → QR automático con config
```

¿Te parece bien este approach? ¿Quieres que empiece implementando la estructura de Admin con la nueva sección de Configuración? 🎨
