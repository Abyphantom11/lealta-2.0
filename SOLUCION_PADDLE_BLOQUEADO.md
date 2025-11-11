# 🚨 Solución: Error "ERR_BLOCKED_BY_CLIENT" con Paddle

## 🔴 El Problema

Cuando intentas abrir el checkout de Paddle, ves este error en la consola:
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
sandbox-checkout-service.paddle.com/transaction-checkout:1 Failed to load resource
```

## ✅ Causa

**Tu bloqueador de anuncios está bloqueando Paddle.**

Los bloqueadores de anuncios como uBlock Origin, AdBlock, Privacy Badger, o Brave Shield detectan los scripts de Paddle como "rastreadores" y los bloquean automáticamente.

## 🛠️ Soluciones (elige una)

### Solución 1: Desactivar el bloqueador para localhost (Recomendado)

#### uBlock Origin
1. Haz clic en el icono de uBlock Origin
2. Haz clic en el **botón de encendido grande** (quedará en gris)
3. Recarga la página

#### AdBlock / AdBlock Plus
1. Haz clic en el icono de AdBlock
2. Selecciona "Pausar en este sitio"
3. Recarga la página

#### Brave Browser
1. Haz clic en el icono del **león (Brave Shield)** en la barra de direcciones
2. Cambia "Shields" a **OFF** para este sitio
3. Recarga la página

### Solución 2: Agregar excepciones para dominios de Paddle

En lugar de desactivar todo el bloqueador, puedes permitir solo los dominios de Paddle:

#### Dominios a permitir:
```
*.paddle.com
cdn.paddle.com
sandbox-checkout-service.paddle.com
sandbox-vendors.paddle.com
buy.paddle.com
```

#### En uBlock Origin:
1. Clic en el icono → "Abrir el panel de control"
2. Ve a "Listas de filtros" → "Mis filtros"
3. Agrega estas líneas:
   ```
   @@||paddle.com^$domain=localhost
   @@||cdn.paddle.com^$domain=localhost
   @@||sandbox-checkout-service.paddle.com^$domain=localhost
   ```
4. "Aplicar cambios"

### Solución 3: Usar otro navegador para pruebas

Si no quieres modificar tu navegador principal:

1. **Descarga Chrome** (sin extensiones)
2. O usa **modo incógnito** (las extensiones suelen estar desactivadas)
3. Abre: `http://localhost:3001/pricing`

## 🧪 Verificar que funciona

### Método 1: Página de diagnóstico
```
http://localhost:3001/test-paddle.html
```

Esta página te dirá exactamente qué está bloqueado.

### Método 2: Consola del navegador
1. Abre las herramientas de desarrollo (F12)
2. Ve a la pestaña "Console"
3. Busca el mensaje: `✅ Paddle inicializado correctamente`

Si ves `❌ Error inicializando Paddle` → aún está bloqueado

## 🔍 Otros errores comunes

### Error 400 en transaction-checkout
**Causa:** Paddle está cargado pero hay un problema con los datos enviados.

**Solución:**
- Verifica que tu Price ID sea correcto: `pri_01k9rf1r9jv9aa3fsjnzf34zkp`
- Ejecuta: `node test-paddle-connection.js`

### Error con Sentry (ERR_BLOCKED_BY_CLIENT)
**No es crítico.** Sentry también puede estar bloqueado, pero eso no afecta a Paddle.

## 📝 Notas para Producción

Cuando subas a producción:

1. **Los usuarios también tendrán este problema** si usan bloqueadores
2. **Considera mostrar un aviso** si Paddle no se carga:
   ```tsx
   {paddleError?.includes('BLOQUEADO') && (
     <div className="alert">
       ⚠️ Parece que tu bloqueador de anuncios está activo.
       Por favor desactívalo para completar la compra.
     </div>
   )}
   ```

3. **Alternativa:** Usa Payment Links en lugar de Paddle Overlay:
   - Los Payment Links redirigen al usuario a paddle.com
   - Son más difíciles de bloquear
   - Ver: `createCheckoutWithLink()` en `usePaddle.ts`

## ✅ Checklist

- [ ] Bloqueador de anuncios desactivado para localhost
- [ ] Página recargada después de desactivar
- [ ] Consola del navegador muestra: "✅ Paddle inicializado"
- [ ] `/test-paddle.html` muestra todo en verde
- [ ] El botón "Empezar" abre el checkout correctamente

---

**¿Sigue sin funcionar?** 
- Ejecuta: `node test-paddle-connection.js` para verificar las credenciales
- Revisa la consola del navegador (F12) para ver errores específicos
- Prueba en modo incógnito sin extensiones
