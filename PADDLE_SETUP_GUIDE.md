# 💳 Guía de Implementación de Paddle en Lealta 2.0

## ✅ ¡Instalación Completada!

La integración de Paddle ha sido configurada exitosamente en tu proyecto. Aquí está todo lo que se ha implementado:

## 🎯 Componentes Implementados

### 1. **Configuración Base**
- ✅ Paddle SDK instalado (`@paddle/paddle-js`, `@paddle/paddle-node-sdk`)
- ✅ Configuración centralizada en `/src/lib/paddle.ts`
- ✅ Variables de entorno agregadas
- ✅ Esquema de base de datos actualizado

### 2. **API Routes**
- ✅ `/api/billing/checkout` - Crear sesiones de pago
- ✅ `/api/billing/subscriptions` - Gestionar suscripciones
- ✅ `/api/webhooks/paddle` - Webhooks de Paddle

### 3. **Frontend Components**
- ✅ Hook `usePaddle` para manejar pagos
- ✅ Hook `usePaddleSubscriptions` para suscripciones
- ✅ Componente `PricingTable` con integración completa
- ✅ Páginas de éxito y cancelación

### 4. **Base de Datos**
- ✅ Campos de billing agregados al modelo `Business`
- ✅ Modelo `PaymentHistory` para auditoría
- ✅ Índices optimizados para consultas

## 🚀 Próximos Pasos para Activar Paddle

### Paso 1: Crear Cuenta en Paddle
1. Ve a [Paddle.com](https://paddle.com) y crea tu cuenta
2. Completa el proceso de verificación
3. Obtén tus credenciales de API

### Paso 2: Configurar Productos en Paddle
1. En tu dashboard de Paddle, crea los siguientes productos:

```
Plan Starter:
- Nombre: "Lealta Starter"
- Precio: $29/mes
- Descripción: "Para restaurantes pequeños"

Plan Professional:
- Nombre: "Lealta Professional" 
- Precio: $79/mes
- Descripción: "Para restaurantes en crecimiento"

Plan Enterprise:
- Nombre: "Lealta Enterprise"
- Precio: $199/mes
- Descripción: "Para cadenas de restaurantes"
```

### Paso 3: Configurar Variables de Entorno
Actualiza tu archivo `.env` con las credenciales reales de Paddle:

```env
# 💳 Paddle Configuration (reemplazar con valores reales)
PADDLE_VENDOR_ID="tu_vendor_id_real"
PADDLE_CLIENT_TOKEN="tu_client_token_real"
PADDLE_API_KEY="tu_api_key_real"
PADDLE_WEBHOOK_SECRET="tu_webhook_secret_real"
NEXT_PUBLIC_PADDLE_ENVIRONMENT="production" # cambiar en producción

# 📋 IDs de los planes creados en Paddle
PADDLE_PLAN_STARTER_ID="pri_01234567890abcdef"
PADDLE_PLAN_PROFESSIONAL_ID="pri_abcdef1234567890"
PADDLE_PLAN_ENTERPRISE_ID="pri_fedcba0987654321"
```

### Paso 4: Configurar Webhooks
En tu dashboard de Paddle, configura un webhook que apunte a:
```
URL: https://tu-dominio.com/api/webhooks/paddle
Eventos: subscription.created, subscription.updated, subscription.canceled, transaction.completed
```

### Paso 5: Aplicar Migración de Base de Datos
```bash
npx prisma db push
```

## 📝 Cómo Usar en tu Aplicación

### 1. Mostrar Planes de Precio
```tsx
import PricingTable from '@/components/billing/PricingTable';

export default function PricingPage() {
  return (
    <PricingTable
      businessId="business_123"
      customerEmail="cliente@ejemplo.com"
      customerName="Juan Pérez"
    />
  );
}
```

### 2. Verificar Estado de Suscripción
```tsx
import { usePaddleSubscriptions } from '@/hooks/usePaddle';

function BusinessDashboard({ businessId }) {
  const { subscriptions, isLoading } = usePaddleSubscriptions(businessId);
  
  const activeSubscription = subscriptions.find(sub => sub.status === 'active');
  
  return (
    <div>
      {activeSubscription ? (
        <p>Plan Activo: {activeSubscription.planId}</p>
      ) : (
        <p>No hay suscripción activa</p>
      )}
    </div>
  );
}
```

### 3. Crear Checkout Programáticamente
```tsx
import { usePaddle } from '@/hooks/usePaddle';

function UpgradeButton() {
  const { createCheckout } = usePaddle();
  
  const handleUpgrade = async () => {
    await createCheckout({
      priceId: 'pri_professional_plan_id',
      businessId: 'business_123',
      customerEmail: 'cliente@ejemplo.com',
    });
  };
  
  return <button onClick={handleUpgrade}>Actualizar Plan</button>;
}
```

## 🔐 Seguridad y Mejores Prácticas

### 1. Variables de Entorno
- ✅ Las API keys están en variables de entorno
- ✅ Webhook secret se verifica en cada llamada
- ✅ Tokens de cliente separados del servidor

### 2. Validación de Datos
- ✅ Schemas de Zod para validar requests
- ✅ Middleware de autenticación en APIs críticas
- ✅ Verificación de firma en webhooks

### 3. Manejo de Errores
- ✅ Logging detallado de transacciones
- ✅ Fallbacks para errores de red
- ✅ Interfaz de usuario para errores

## 🧪 Testing

### Modo Sandbox
Tu configuración actual está en modo sandbox. Para testing:

1. Usa tarjetas de prueba de Paddle
2. Los pagos no serán reales
3. Puedes simular diferentes escenarios

### Datos de Prueba
```
Tarjeta de Prueba Exitosa: 4000 0000 0000 0002
Tarjeta de Prueba Fallida: 4000 0000 0000 0069
CVV: cualquier 3 dígitos
```

## 📊 Monitoreo y Analytics

### 1. Dashboard de Paddle
- Ingresos en tiempo real
- Métricas de conversión
- Análisis de churn

### 2. En tu Aplicación
- Estado de suscripciones en dashboard de admin
- Historial de pagos en `PaymentHistory`
- Alertas por suscripciones canceladas

## 🛠️ Personalización Avanzada

### 1. Planes Personalizados
Puedes crear planes adicionales o modificar precios desde el dashboard de Paddle.

### 2. Descuentos y Promociones
Paddle soporta cupones y descuentos que puedes aplicar programáticamente.

### 3. Facturación Regional
Configura precios por región y manejo de impuestos automático.

## 📞 Soporte

Si tienes problemas con la implementación:

1. **Logs de Desarrollo**: Revisa la consola del navegador y logs del servidor
2. **Dashboard de Paddle**: Verifica el estado de webhooks y transacciones
3. **Documentación**: [Paddle Developer Docs](https://developer.paddle.com/)

## 🎉 ¡Listo para Facturar!

Tu implementación de Paddle está completa y lista para producción. Solo necesitas:

1. ✅ Obtener credenciales reales de Paddle
2. ✅ Crear productos en tu dashboard
3. ✅ Configurar webhook en producción
4. ✅ Cambiar a modo production

¡Felicitaciones por implementar un sistema de billing robusto! 🚀
