# 📚 Lealta 2.0 - Documentación de APIs

## 🏗️ Arquitectura General

- **Framework**: Next.js 14.2.5 App Router
- **Base de Datos**: SQLite con Prisma ORM 6.15.0
- **Autenticación**: NextAuth con proveedores personalizados
- **Validación**: Zod schemas
- **Rate Limiting**: Middleware personalizado

---

## 🔐 Autenticación (`/api/auth/`)

### `POST /api/auth/signin`
**Descripción**: Autenticar usuario con credenciales  
**Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Respuesta**: JWT token y datos del usuario

### `POST /api/auth/signup`
**Descripción**: Registrar nuevo usuario  
**Body**:
```json
{
  "email": "string",
  "password": "string",
  "nombre": "string",
  "role": "ADMIN | STAFF | CLIENTE"
}
```

### `POST /api/auth/signout`
**Descripción**: Cerrar sesión del usuario

---

## 👥 Gestión de Usuarios (`/api/users/`)

### `GET /api/users`
**Descripción**: Listar todos los usuarios  
**Headers**: `Authorization: Bearer {token}`  
**Query Params**:
- `page?: number` (default: 1)
- `limit?: number` (default: 10)
- `role?: string`

### `POST /api/users`
**Descripción**: Crear nuevo usuario  
**Body**:
```json
{
  "email": "string",
  "nombre": "string",
  "role": "ADMIN | STAFF | CLIENTE",
  "telefono?: string"
}
```

---

## 🏢 Administración (`/api/admin/`)

### `GET /api/admin/dashboard`
**Descripción**: Obtener métricas del dashboard administrativo  
**Respuesta**:
```json
{
  "totalClientes": "number",
  "totalTarjetas": "number",
  "puntosCanjeados": "number",
  "ventasHoy": "number"
}
```

---

## 👤 Clientes (`/api/cliente/` y `/api/clientes/`)

### `POST /api/cliente/registro`
**Descripción**: Registrar nuevo cliente  
**Body**:
```json
{
  "nombre": "string",
  "email": "string",
  "telefono": "string",
  "fechaNacimiento?: string"
}
```

### `GET /api/cliente/verificar`
**Descripción**: Verificar existencia de cliente  
**Query**: `?email=string` o `?telefono=string`

### `GET /api/clientes/search`
**Descripción**: Buscar clientes  
**Query**: `?q=string&limit=number`

### `GET /api/cliente/lista`
**Descripción**: Obtener lista paginada de clientes

### `GET /api/cliente/favorito-del-dia`
**Descripción**: Obtener cliente destacado del día

---

## 🎫 Tarjetas de Lealtad (`/api/tarjetas/`)

### `POST /api/tarjetas/asignar`
**Descripción**: Asignar tarjeta a cliente  
**Body**:
```json
{
  "clienteId": "string",
  "tipoTarjeta": "BASICA | PREMIUM | VIP"
}
```

---

## 👨‍💼 Staff (`/api/staff/`)

### `POST /api/staff/consumo`
**Descripción**: Registrar consumo de puntos  
**Body**:
```json
{
  "clienteId": "string",
  "puntos": "number",
  "descripcion": "string"
}
```

### `POST /api/staff/consumo/manual`
**Descripción**: Registro manual de consumo con validaciones avanzadas  
**Body**:
```json
{
  "clienteId": "string",
  "puntos": "number",
  "descripcion": "string",
  "fechaConsumo": "string"
}
```

---

## 🔔 Notificaciones (`/api/notificaciones/`)

### `GET /api/notificaciones`
**Descripción**: Obtener notificaciones del usuario  
**Headers**: `Authorization: Bearer {token}`

### `POST /api/notificaciones`
**Descripción**: Crear nueva notificación  
**Body**:
```json
{
  "titulo": "string",
  "mensaje": "string",
  "tipo": "INFO | WARNING | ERROR",
  "destinatarioId": "string"
}
```

---

## 📊 Analytics (`/api/analytics/`)

### `GET /api/analytics/dashboard`
**Descripción**: Métricas del dashboard de analytics

### `GET /api/analytics/clientes`
**Descripción**: Estadísticas de clientes

### `GET /api/analytics/ventas`
**Descripción**: Reportes de ventas y consumos

---

## 🎨 Branding (`/api/branding/`)

### `GET /api/branding/config`
**Descripción**: Obtener configuración de branding

### `PUT /api/branding/config`
**Descripción**: Actualizar configuración de branding  
**Body**:
```json
{
  "colorPrimario": "string",
  "colorSecundario": "string",
  "logo": "string",
  "nombreEmpresa": "string"
}
```

---

## 🔒 Seguridad y Middleware

### Rate Limiting
- **Límite**: 100 requests por minuto por IP
- **Headers de respuesta**: `X-RateLimit-*`

### Autenticación
- **Tipo**: JWT via NextAuth
- **Header**: `Authorization: Bearer {token}`
- **Expiración**: 24 horas

### Validación
- **Schema**: Zod para validación de entrada
- **Sanitización**: Automática en todos los endpoints

---

## 📈 Códigos de Estado HTTP

- **200**: Éxito
- **201**: Creado
- **400**: Bad Request (validación fallida)
- **401**: No autorizado
- **403**: Prohibido
- **404**: No encontrado
- **429**: Rate limit excedido
- **500**: Error interno del servidor

---

## 🔧 Configuración Local

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npx prisma db push

# Ejecutar en desarrollo
npm run dev

# Health check
npm run health-check
```

---

## 📝 Notas de Implementación

1. **Consistencia**: Todos los endpoints siguen el patrón REST estándar
2. **Error Handling**: Respuestas de error estandarizadas
3. **Logging**: Sistema de logs para debugging
4. **Testing**: Cobertura de pruebas en endpoints críticos
5. **Documentation**: Este documento se actualiza con cada cambio

---

## 🚀 Próximos Pasos

1. [ ] Implementar OpenAPI/Swagger
2. [ ] Agregar más tests de integración
3. [ ] Optimizar queries de Prisma
4. [ ] Implementar caché Redis
5. [ ] Agregar webhooks para eventos
