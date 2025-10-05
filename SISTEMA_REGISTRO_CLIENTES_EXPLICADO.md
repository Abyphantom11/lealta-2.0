# 🎯 Sistema de Registro de Clientes en Reservas

## ✅ **RESPUESTA: Sí, los clientes SÍ se registran automáticamente**

Cuando creas una reserva, el sistema **automáticamente** registra o actualiza al cliente en la tabla `Cliente` de la base de datos.

---

## 🔄 **Flujo Completo del Sistema**

### **Paso 1: Usuario llena formulario de reserva**
```
┌─────────────────────────────────────────┐
│  📝 Formulario de Nueva Reserva         │
├─────────────────────────────────────────┤
│  Nombre: Juan Pérez                     │
│  Cédula: 8-123-4567                     │
│  Email: juan@example.com (opcional)     │
│  Teléfono: +507 6000-0000              │
│  Personas: 4                             │
│  Fecha: 05/10/2025                      │
│  Hora: 19:00                            │
│  Promotor: WhatsApp                     │
└─────────────────────────────────────────┘
```

### **Paso 2: Sistema busca cliente existente**

El API busca en este orden de prioridad:

**1️⃣ Por Email** (más confiable)
```typescript
cliente = await prisma.cliente.findFirst({
  where: {
    businessId: "business-123",
    correo: "juan@example.com"
  }
});
```

**2️⃣ Por Cédula** (si no hay email o no encontró)
```typescript
cliente = await prisma.cliente.findFirst({
  where: {
    businessId: "business-123",
    cedula: "8-123-4567"
  }
});
```

**3️⃣ Por Teléfono** (última opción)
```typescript
cliente = await prisma.cliente.findFirst({
  where: {
    businessId: "business-123",
    telefono: "+507 6000-0000"
  }
});
```

### **Paso 3A: Cliente NO existe → Crear nuevo**

```typescript
cliente = await prisma.cliente.create({
  data: {
    businessId: "business-123",
    cedula: "8-123-4567",        // ✅ Cédula real
    nombre: "Juan Pérez",
    correo: "juan@example.com",
    telefono: "+507 6000-0000",
    puntos: 0,                    // Inicia con 0 puntos
    totalVisitas: 0,
    totalGastado: 0.00,
    registeredAt: new Date()
  }
});
```

**Resultado:**
```
✅ Cliente nuevo creado
ID: clxxx123
Cédula: 8-123-4567
Nombre: Juan Pérez
```

### **Paso 3B: Cliente SÍ existe → Actualizar datos**

```typescript
cliente = await prisma.cliente.update({
  where: { id: "clxxx123" },
  data: {
    nombre: "Juan Pérez",           // Actualizar si cambió
    telefono: "+507 6000-0000",     // Actualizar si cambió
    correo: "juan@example.com",     // Actualizar si cambió
    // Si tenía cédula temporal, actualizar a real
    cedula: "8-123-4567"
  }
});
```

**Resultado:**
```
✅ Cliente existente actualizado
ID: clxxx123 (mismo)
Datos actualizados con info más reciente
```

### **Paso 4: Crear reserva vinculada al cliente**

```typescript
const reservation = await prisma.reservation.create({
  data: {
    businessId: "business-123",
    clienteId: "clxxx123",      // ← Vinculado al cliente
    customerName: "Juan Pérez",
    customerEmail: "juan@example.com",
    customerPhone: "+507 6000-0000",
    guestCount: 4,
    promotorId: "promotor-whatsapp",
    // ... resto de campos
  }
});
```

---

## 📊 **Modelo de Datos**

### **Tablas Relacionadas:**

```
┌──────────────────────────────────────────────────────┐
│ Business                                              │
│ - id: business-123                                    │
│ - name: "Mi Restaurante"                             │
└──────────────────────────────────────────────────────┘
           │
           ├────────────────────────────────────────┐
           │                                         │
           ▼                                         ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│ Cliente                  │       │ Reservation              │
├──────────────────────────┤       ├──────────────────────────┤
│ id: clxxx123             │◄──────│ clienteId: clxxx123      │
│ businessId: business-123 │       │ businessId: business-123 │
│ cedula: 8-123-4567       │       │ customerName: Juan Pérez │
│ nombre: Juan Pérez       │       │ guestCount: 4            │
│ correo: juan@example.com │       │ status: CONFIRMED        │
│ telefono: +507 6000-0000 │       │ reservedAt: 2025-10-05   │
│ puntos: 0                │       │ promotorId: xxx          │
│ totalVisitas: 0          │       └──────────────────────────┘
│ totalGastado: 0.00       │
│ registeredAt: 2025-10-03 │
└──────────────────────────┘
```

### **Relación 1:N**
Un cliente puede tener **múltiples reservas**:

```typescript
const cliente = await prisma.cliente.findUnique({
  where: { id: "clxxx123" },
  include: {
    reservations: true  // Todas las reservas del cliente
  }
});

console.log(cliente.reservations.length); // Ej: 5 reservas
```

---

## 🎯 **Beneficios del Sistema**

### **1. Prevención de Duplicados**
- ✅ Busca por 3 métodos (email, cédula, teléfono)
- ✅ No crea clientes duplicados si ya existe
- ✅ Actualiza datos si el cliente proporciona info nueva

### **2. Historial Completo**
```sql
SELECT * FROM Reservation 
WHERE clienteId = 'clxxx123'
ORDER BY reservedAt DESC;
```

**Resultado:**
```
Juan Pérez ha hecho 5 reservas:
1. 05/10/2025 - 4 personas - CONFIRMED
2. 20/09/2025 - 2 personas - COMPLETED
3. 10/09/2025 - 6 personas - COMPLETED
4. 25/08/2025 - 4 personas - NO_SHOW
5. 15/08/2025 - 3 personas - COMPLETED
```

### **3. Sistema de Puntos/Fidelidad**
```typescript
// Incrementar puntos después de cada visita
await prisma.cliente.update({
  where: { id: "clxxx123" },
  data: {
    puntos: { increment: 10 },
    totalVisitas: { increment: 1 },
    totalGastado: { increment: 45.50 }
  }
});
```

### **4. Reportes y Análisis**
```typescript
// Top 10 clientes frecuentes
const topClientes = await prisma.cliente.findMany({
  where: { businessId: "business-123" },
  orderBy: { totalVisitas: 'desc' },
  take: 10,
  include: {
    _count: {
      select: { reservations: true }
    }
  }
});
```

### **5. Marketing Directo**
```typescript
// Obtener todos los emails para newsletter
const clientesConEmail = await prisma.cliente.findMany({
  where: {
    businessId: "business-123",
    correo: { not: { startsWith: 'temp-' } }
  },
  select: {
    nombre: true,
    correo: true
  }
});

// Enviar promoción por email o WhatsApp
for (const cliente of clientesConEmail) {
  await enviarPromocion(cliente.correo, 'Descuento 20%');
}
```

---

## ⚠️ **Casos Especiales**

### **Caso 1: Cliente sin Email**
```typescript
// Formulario:
Nombre: María García
Cédula: 8-999-8888
Email: (vacío)
Teléfono: +507 6111-1111

// Sistema busca por:
1. Email: ❌ No hay
2. Cédula: ✅ Busca por "8-999-8888"
3. Teléfono: ✅ Si no encontró, busca por "+507 6111-1111"

// Si no existe, crea con email temporal:
correo: "temp-1696334400000@temp.com"
```

### **Caso 2: Cliente cambia de número**
```typescript
// Primera reserva:
Juan Pérez - 8-123-4567 - +507 6000-0000 - juan@example.com
Cliente creado: ID clxxx123

// Segunda reserva (cambia número):
Juan Pérez - 8-123-4567 - +507 6111-1111 - juan@example.com
                                    ↑ nuevo número

// Sistema:
1. Busca por email "juan@example.com" ✅ ENCONTRADO (clxxx123)
2. Actualiza teléfono: +507 6111-1111
3. Usa mismo cliente (NO crea duplicado)
```

### **Caso 3: Cliente sin cédula en formulario**
```typescript
// Si el campo cédula está vacío o es inválido:
cedula: `temp-${Date.now()}`  // Temporal

// ⚠️ LIMITACIÓN: Puede crear duplicados
// SOLUCIÓN: Hacer campo cédula obligatorio en formulario
```

---

## 🔧 **Mejoras Implementadas (3 Oct 2025)**

### **✅ Antes (Problemas):**
```typescript
// ❌ Siempre generaba cédula temporal
cedula: `temp-${Date.now()}`

// ❌ Solo buscaba por email
if (data.cliente.email) {
  cliente = await prisma.cliente.findFirst({ ... });
}

// ❌ No actualizaba correo si existía
data: {
  nombre: data.cliente.nombre,
  telefono: data.cliente.telefono || ''
  // correo NO se actualizaba
}
```

### **✅ Después (Solucionado):**
```typescript
// ✅ Usa cédula real del formulario
cedula: formData.clienteCedula  // Ej: "8-123-4567"

// ✅ Busca por 3 métodos (prioridad)
1. Email
2. Cédula
3. Teléfono

// ✅ Actualiza TODOS los datos
data: {
  nombre: data.cliente.nombre,
  telefono: data.cliente.telefono || cliente.telefono,
  correo: data.cliente.email || cliente.correo,
  cedula: // actualiza si era temporal y ahora hay real
}
```

---

## 📈 **Queries Útiles**

### **1. Ver todos los clientes registrados:**
```typescript
const clientes = await prisma.cliente.findMany({
  where: { businessId: "business-123" },
  include: {
    _count: {
      select: { reservations: true }
    }
  },
  orderBy: { registeredAt: 'desc' }
});

console.log(`Total clientes: ${clientes.length}`);
clientes.forEach(c => {
  console.log(`${c.nombre} - ${c._count.reservations} reservas`);
});
```

### **2. Encontrar cliente por cédula:**
```typescript
const cliente = await prisma.cliente.findFirst({
  where: {
    businessId: "business-123",
    cedula: "8-123-4567"
  },
  include: {
    reservations: {
      orderBy: { reservedAt: 'desc' },
      take: 5  // Últimas 5 reservas
    }
  }
});
```

### **3. Clientes nuevos este mes:**
```typescript
const inicioMes = new Date(2025, 9, 1);  // Oct 1
const finMes = new Date(2025, 9, 31, 23, 59, 59);

const clientesNuevos = await prisma.cliente.count({
  where: {
    businessId: "business-123",
    registeredAt: {
      gte: inicioMes,
      lte: finMes
    }
  }
});

console.log(`Clientes nuevos en octubre: ${clientesNuevos}`);
```

### **4. Clientes sin email real:**
```typescript
const clientesTemporales = await prisma.cliente.findMany({
  where: {
    businessId: "business-123",
    correo: { startsWith: 'temp-' }
  },
  select: {
    nombre: true,
    cedula: true,
    telefono: true
  }
});

console.log(`Clientes sin email: ${clientesTemporales.length}`);
```

---

## 🎨 **Diagrama de Flujo Completo**

```
┌─────────────────────┐
│ Usuario llena form  │
│ de nueva reserva    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ¿Tiene email?       │
└──────┬──────────┬───┘
       │ Sí       │ No
       ▼          ▼
┌──────────┐  ┌──────────┐
│ Buscar   │  │ ¿Tiene   │
│ por      │  │ cédula?  │
│ email    │  └────┬─────┘
└────┬─────┘       │
     │             ▼
     │      ┌──────────┐
     │      │ Buscar   │
     │      │ por      │
     │      │ cédula   │
     │      └────┬─────┘
     │           │
     ▼           ▼
┌─────────────────────┐
│ ¿Cliente existe?    │
└──────┬──────────┬───┘
       │ Sí       │ No
       ▼          ▼
┌──────────┐  ┌──────────┐
│ Actualizar│  │ Crear    │
│ datos     │  │ nuevo    │
│ existente │  │ cliente  │
└────┬──────┘  └────┬─────┘
     │              │
     └──────┬───────┘
            ▼
   ┌─────────────────┐
   │ Crear Reserva   │
   │ vinculada al    │
   │ cliente         │
   └─────────────────┘
```

---

## ✅ **Resumen Final**

**Pregunta:** ¿Al registrar un cliente para la reserva se registra en la base de datos de clientes también?

**Respuesta:** **SÍ**, absolutamente. El sistema:

1. ✅ **Busca** si el cliente ya existe (por email, cédula o teléfono)
2. ✅ **Actualiza** sus datos si ya existe
3. ✅ **Crea** un nuevo registro si no existe
4. ✅ **Vincula** la reserva al cliente mediante `clienteId`
5. ✅ **Mantiene historial** de todas las reservas del cliente
6. ✅ **Permite análisis** de clientes frecuentes, puntos, etc.

**Beneficios:**
- No hay duplicados (si el cliente proporciona email o cédula)
- Historial completo de reservas por cliente
- Base de datos para marketing y fidelización
- Reportes de clientes frecuentes
- Sistema de puntos acumulables

---

**Fecha de actualización:** 3 de Octubre, 2025  
**Versión:** 2.0 (Mejorada con búsqueda por cédula)  
**Archivos modificados:**
- `src/app/api/reservas/route.ts` (lógica de búsqueda mejorada)
- `src/app/reservas/components/ReservationForm.tsx` (envío de cédula real)
