# Configuración de Túnel Cloudflare para Desarrollo

## 🚇 Problema Actual
Al usar `cloudflared tunnel` para exponer tu servidor local, NextAuth genera errores 401/500 porque no reconoce el dominio del túnel como válido.

## ✅ Solución

### 1. Instalar Cloudflare Tunnel (si no lo tienes)
```bash
# Windows (PowerShell como administrador)
winget install --id Cloudflare.cloudflared

# O descarga desde: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### 2. Iniciar el túnel con puerto personalizado
```bash
# Desde la raíz del proyecto
cloudflared tunnel --url http://localhost:3001
```

Esto te dará una URL como: `https://abc-123-def.trycloudflare.com`

### 3. Actualizar variables de entorno temporalmente

Crea un archivo `.env.tunnel` con:
```bash
# URL del túnel de Cloudflare
NEXTAUTH_URL="https://abc-123-def.trycloudflare.com"
AUTH_TRUST_HOST="true"

# Copiar el resto de .env.local
DATABASE_URL="tu-database-url"
DIRECT_URL="tu-direct-url"
NEXTAUTH_SECRET="your-secret-key"
AUTH_SECRET="your-auth-secret"
```

### 4. Iniciar el servidor con las nuevas variables
```bash
# Opción 1: Usar archivo .env.tunnel
cp .env.tunnel .env.local
npm run dev

# Opción 2: Pasar variables directamente (PowerShell)
$env:NEXTAUTH_URL="https://abc-123-def.trycloudflare.com"; $env:AUTH_TRUST_HOST="true"; npm run dev
```

### 5. Acceder desde cualquier dispositivo
Ahora puedes abrir `https://abc-123-def.trycloudflare.com` desde cualquier dispositivo con internet:
- Tu teléfono móvil
- Tablet
- Otra computadora
- Compartir con clientes para pruebas

## 🔧 Solución Alternativa: Usar ngrok

Si prefieres ngrok en lugar de Cloudflare:

```bash
# Instalar ngrok
choco install ngrok  # Windows con Chocolatey

# Iniciar túnel
ngrok http 3001

# Actualizar NEXTAUTH_URL con la URL de ngrok
NEXTAUTH_URL="https://xyz123.ngrok.io"
```

## ⚠️ Importante

### Después de las pruebas
Recuerda restaurar tu `.env.local` original:
```bash
NEXTAUTH_URL="http://localhost:3001"
NODE_ENV="development"
```

### Para Producción
En producción (Vercel), asegúrate de configurar:
```bash
NEXTAUTH_URL="https://lealta.app"
AUTH_TRUST_HOST="true"
NODE_ENV="production"
```

## 🎯 Uso Común

### Probar QR Codes en tu teléfono
1. Inicia cloudflared tunnel
2. Copia la URL generada
3. Actualiza NEXTAUTH_URL
4. Reinicia el servidor
5. Escanea el QR desde tu teléfono
6. Prueba la funcionalidad de compartir por WhatsApp

### Demostración a clientes
1. Inicia el túnel antes de la reunión
2. Comparte la URL de Cloudflare
3. El cliente puede ver tu app en tiempo real
4. Los cambios se reflejan inmediatamente

## 📝 Notas

- Los túneles de Cloudflare gratis expiran después de unas horas
- La URL cambia cada vez que reinicias el túnel
- Para URLs permanentes, considera Cloudflare Tunnel con dominio propio
- ngrok ofrece URLs persistentes con plan de pago

## 🐛 Troubleshooting

### Error 401 en /api/auth/me
- Verifica que NEXTAUTH_URL coincida con la URL del túnel
- Asegúrate de haber reiniciado el servidor después de cambiar variables

### Error 500 en /api/auth/signin
- Revisa que AUTH_TRUST_HOST="true" esté configurado
- Verifica la conexión a la base de datos
- Revisa los logs del servidor

### No puedo iniciar sesión
- Limpia cookies del navegador
- Prueba en modo incógnito
- Verifica que las credenciales sean correctas
