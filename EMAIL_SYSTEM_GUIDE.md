# 📧 CONFIGURACIÓN COMPLETA DEL SISTEMA DE EMAILS - LEALTA

## ✅ IMPLEMENTADO

- ✅ Servicio de emails con Resend
- ✅ Sistema de verificación de códigos 
- ✅ Templates HTML premium para todos los tipos de email
- ✅ API completa de gestión de emails
- ✅ Modal de verificación de email en signup
- ✅ Base de datos para logs y verificaciones
- ✅ Página de administración de emails
- ✅ API de testing de emails

## 🔧 CONFIGURACIÓN PASO A PASO

### 1. Configurar Resend (OBLIGATORIO)

#### a) Crear cuenta en Resend:
```bash
1. Ve a https://resend.com/
2. Crea cuenta con hello@lealta.app
3. Verifica tu email
```

#### b) Configurar dominio:
```bash
1. En Resend Dashboard → Domains
2. Agrega el dominio: lealta.app
3. Copia los registros DNS
4. Ve a Namecheap DNS para lealta.app
5. Agrega estos registros TXT:
   - Name: @
   - Value: [el valor que te dé Resend]
```

#### c) Generar API Key:
```bash
1. En Resend Dashboard → API Keys
2. Click "Create API Key"
3. Nombre: "Lealta Production"
4. Permissions: "Full Access"
5. Copia la clave (empieza con "re_")
```

#### d) Configurar .env:
```env
RESEND_API_KEY="re_tu_clave_aqui"
RESEND_FROM_EMAIL="hello@lealta.app"
RESEND_NO_REPLY_EMAIL="no-reply@lealta.app"
RESEND_TRIALS_EMAIL="trials@lealta.app"
```

### 2. Verificar Configuración

#### Probar API de emails:
```bash
# Ejecutar en el proyecto:
curl -X POST http://localhost:3001/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "tu-email@ejemplo.com",
    "type": "welcome"
  }'
```

#### Probar desde el dashboard:
```bash
1. Ve a http://localhost:3001/admin/email-management
2. Ingresa tu email en "Email de prueba"
3. Haz click en "Probar" en cualquier template
4. Revisa tu bandeja de entrada
```

## 📧 TIPOS DE EMAIL DISPONIBLES

### 🔐 Sistema
- **email-verification**: Código de 6 dígitos para verificar email
- **password-reset**: Link para restablecer contraseña

### 🏢 Empresa
- **welcome**: Bienvenida al registrar nueva empresa
- **trial-welcome**: Confirmación de inicio de prueba de 14 días
- **trial-reminder**: Aviso cuando quedan pocos días de prueba
- **trial-expired**: Notificación de que la prueba ha expirado
- **staff-invitation**: Invitación para unirse al equipo
- **business-registered**: Confirmación de empresa registrada

### 👥 Cliente
- **loyalty-level-up**: Cliente ha subido de nivel en tarjeta
- **promotional**: Ofertas y promociones especiales

## 🎨 DISEÑO DE EMAILS

### Características:
- **Dark theme** acorde a la marca Lealta
- **Gradientes premium** azul/púrpura
- **Responsive** para móvil y desktop
- **Íconos** de Lucide integrados
- **Typography** moderna con Inter/system fonts

### Estructura:
```
┌─────────────────┐
│ Header (gradient)│
├─────────────────┤
│ Contenido       │
│ • Saludo        │
│ • Mensaje       │
│ • CTA Button    │
│ • Info adicional│
├─────────────────┤
│ Footer          │
│ • Copyright     │
│ • Links         │
└─────────────────┘
```

## 🔧 APIs DISPONIBLES

### 1. Verificación de Email
```
POST /api/auth/email-verification
```

**Enviar código:**
```json
{
  "action": "send",
  "email": "usuario@empresa.com",
  "businessName": "Mi Empresa",
  "type": "email-verification"
}
```

**Verificar código:**
```json
{
  "action": "verify",
  "email": "usuario@empresa.com", 
  "code": "ABC123",
  "type": "email-verification"
}
```

### 2. Testing de Emails
```
POST /api/emails/test
```

```json
{
  "to": "test@ejemplo.com",
  "type": "welcome",
  "data": {
    "businessName": "Empresa Demo",
    "adminName": "Juan Pérez"
  }
}
```

## 🚀 INTEGRACIÓN EN SIGNUP

El formulario de signup ahora incluye:

1. **Verificación opcional**: Controlada por `requireVerification`
2. **Modal automático**: Se abre al detectar email no verificado
3. **Reenvío inteligente**: Permite reenvío si quedan <2 min
4. **Auto-submit**: Continúa registro tras verificación
5. **Estados visuales**: Indicadores de verificación

## 📊 LOGGING Y MONITOREO

### Tablas de BD:
- **EmailVerification**: Códigos y estados de verificación
- **EmailLog**: Registro de todos los emails enviados

### Datos rastreados:
- ✅ ID de Resend para tracking
- ✅ Estado de entrega (pending/sent/delivered/failed)
- ✅ Metadatos (IP, User-Agent)
- ✅ Intentos de verificación
- ✅ Timestamps completos

## 🔒 SEGURIDAD

### Medidas implementadas:
- **Expiración**: Códigos expiran en 10 minutos
- **Límite de intentos**: Máximo 3 intentos por código
- **Rate limiting**: Previene spam de códigos
- **Validación**: Esquemas Zod en todas las APIs
- **Sanitización**: Email validation estricta

## 🎯 SIGUIENTES PASOS

### Para Producción:
1. **Configurar Resend con dominio verificado**
2. **Agregar templates faltantes** (password-reset, etc.)
3. **Configurar webhooks** de Resend para estado de entrega
4. **Implementar analytics** de apertura y clicks
5. **A/B testing** de templates
6. **Segmentación** de audiencias

### Mejoras Futuras:
- 📱 **Push notifications** (OneSignal/Firebase)
- 🎨 **Editor visual** de templates
- 📈 **Dashboard analytics** de emails
- 🤖 **Emails automáticos** por eventos
- 🎯 **Personalización IA** de contenido

## 💡 EJEMPLOS DE USO

### Registro de empresa:
```typescript
await sendEmail({
  to: adminEmail,
  type: 'welcome',
  data: {
    businessName: 'Café Central',
    adminName: 'María García',
    loginUrl: 'https://lealta.app/login'
  }
});
```

### Cliente sube de nivel:
```typescript
await sendEmail({
  to: clientEmail,
  type: 'loyalty-level-up',
  data: {
    clientName: 'Juan Pérez',
    oldLevel: 'Plata',
    newLevel: 'Oro',
    newBenefits: ['10% descuento', 'Acceso VIP']
  }
});
```

## 🆘 TROUBLESHOOTING

### Email no llega:
1. Verificar RESEND_API_KEY en .env
2. Confirmar dominio verificado en Resend
3. Revisar logs en `/api/emails/test`
4. Verificar spam folder

### Error "Domain not verified":
1. Ve a Resend Dashboard → Domains
2. Verifica que lealta.app esté "Verified"
3. Si no, agrega los registros DNS correctos

### Códigos de verificación no funcionan:
1. Verificar que la tabla EmailVerification existe
2. Confirmar que Prisma está actualizado
3. Revisar logs de la API

---

¡Con esto tienes un **sistema de emails empresarial completo**! 🚀📧
