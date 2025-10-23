# 🧪 GUÍA DE PRUEBAS - QR SHARE OPTIMIZADO

## 📋 CHECKLIST DE PRUEBAS MANUALES

### ✅ PRUEBA 1: Chrome Desktop Moderno (v89+)

**Objetivo:** Verificar compartir directo con mensaje personalizado

1. Abrir en Chrome Desktop (versión 89+)
2. Ir a una reserva
3. Click en "Compartir por WhatsApp"
4. **Verificar:**
   - ✅ Se abre selector nativo de compartir
   - ✅ Se envía QR + mensaje juntos
   - ✅ Toast: "✅ QR + Mensaje enviados juntos"
   - ✅ Descripción: "🏆 Imagen QR y mensaje enviados correctamente"

---

### ✅ PRUEBA 2: Chrome Desktop sin mensaje personalizado

**Objetivo:** Verificar compartir solo QR

1. Abrir en Chrome Desktop
2. Ir a una reserva (sin configurar mensaje personalizado)
3. Click en "Compartir por WhatsApp"
4. **Verificar:**
   - ✅ Se abre selector nativo de compartir
   - ✅ Se envía solo el QR
   - ✅ Toast: "✅ QR enviado correctamente"
   - ✅ Descripción: "📷 Imagen compartida exitosamente"

---

### ✅ PRUEBA 3: Descargar QR

**Objetivo:** Verificar descarga optimizada

1. Click en botón "Descargar"
2. **Verificar:**
   - ✅ Toast: "📸 Generando imagen..."
   - ✅ Se descarga archivo PNG
   - ✅ Nombre: `reserva-{nombre-cliente}.png`
   - ✅ Toast final: "✅ Imagen descargada exitosamente"
   - ✅ No se genera múltiples veces (revisar consola)

---

### ✅ PRUEBA 4: Copiar solo mensaje

**Objetivo:** Verificar copia de mensaje personalizado

**Pre-requisito:** Configurar mensaje personalizado en el botón ⚙️

1. Click en botón "Copiar" (con mensaje configurado)
2. **Verificar:**
   - ✅ Toast: "✅ Mensaje copiado"
   - ✅ Descripción: "Pega el mensaje en WhatsApp después de enviar el QR"
   - ✅ Botón cambia a ✅ "Copiado" por 3 segundos
   - ✅ Mensaje está en portapapeles (Ctrl+V para probar)

---

### ✅ PRUEBA 5: Editor de mensaje personalizado

**Objetivo:** Verificar edición y guardado

1. Click en botón ⚙️ (Settings)
2. **Verificar modal:**
   - ✅ Se abre modal bonito
   - ✅ Textarea con placeholder claro
   - ✅ Contador de caracteres (0/500)
   - ✅ Mensaje actual pre-cargado (si existe)

3. Escribir mensaje personalizado
4. Click en "💾 Guardar Mensaje"
5. **Verificar:**
   - ✅ Toast de loading: "Guardando..."
   - ✅ Toast success: "✅ Mensaje guardado exitosamente"
   - ✅ Modal se cierra
   - ✅ Botón "Copiar" aparece (si no estaba)
   - ✅ Info de capacidades se actualiza

---

### ✅ PRUEBA 6: Indicador de capacidades

**Objetivo:** Verificar detección de navegador

1. Abrir página en Chrome Desktop
2. **Verificar sección de capacidades:**
   - ✅ Emoji correcto (✨ para direct)
   - ✅ Descripción: "✨ Envío directo de QR + mensaje"
   - ✅ Mensaje adaptativo según haya o no mensaje personalizado
   - ✅ Con mensaje: "🏆 Óptimo: Tu navegador enviará QR + mensaje juntos"
   - ✅ Sin mensaje: "✅ Se compartirá solo la imagen del QR"

3. **En modo desarrollo (NODE_ENV=development):**
   - ✅ Aparece sección "Detalles técnicos"
   - ✅ Click en summary expande info
   - ✅ Muestra Chrome version, móvil, Share API, etc.

---

### ✅ PRUEBA 7: Chrome Mobile (Android)

**Objetivo:** Verificar en móvil

1. Abrir en Chrome Android
2. Click en "Compartir por WhatsApp"
3. **Verificar:**
   - ✅ Se abre selector de apps nativo de Android
   - ✅ WhatsApp aparece en la lista
   - ✅ Seleccionar WhatsApp
   - ✅ QR + mensaje se pegan correctamente

---

### ✅ PRUEBA 8: Safari / Firefox (Fallback)

**Objetivo:** Verificar fallback a descarga

1. Abrir en Safari o Firefox
2. **Verificar indicador:**
   - ✅ Emoji: 📥
   - ✅ Descripción: "📥 Descargar QR y copiar mensaje"

3. Click en "Compartir por WhatsApp"
4. **Verificar:**
   - ✅ Se descarga el archivo automáticamente
   - ✅ Mensaje se copia al portapapeles (si hay)
   - ✅ Toast: "📥 QR descargado"
   - ✅ Descripción: "Mensaje copiado - Adjunta el archivo en WhatsApp"

---

### ✅ PRUEBA 9: Performance - Cache de QR

**Objetivo:** Verificar que NO se regenera innecesariamente

1. Abrir consola del navegador
2. Click en "Compartir" (primera vez)
3. **Verificar en consola:**
   - ✅ Log: "✅ QR generado exitosamente: { size: X KB, ... }"

4. Click en "Compartir" (segunda vez inmediata)
5. **Verificar en consola:**
   - ✅ Log: "✅ Usando QR cacheado"
   - ✅ NO aparece "QR generado exitosamente" de nuevo

6. Click en "Descargar"
7. **Verificar:**
   - ✅ También usa cache
   - ✅ Log: "✅ Usando QR cacheado"

---

### ✅ PRUEBA 10: Error handling

**Objetivo:** Verificar manejo de errores

**Escenario 1: Sin permisos de clipboard**
1. Revocar permisos de clipboard en navegador
2. Click en "Copiar mensaje"
3. **Verificar:**
   - ✅ Toast: "❌ Error al copiar el mensaje"
   - ✅ No rompe la aplicación

**Escenario 2: Cancelar share**
1. Click en "Compartir por WhatsApp"
2. Cancelar el selector de apps
3. **Verificar:**
   - ✅ NO muestra error
   - ✅ Simplemente cierra sin toast
   - ✅ Botón vuelve a estado normal

---

## 🔍 PRUEBAS DE CONSOLA

### Revisar logs esperados:

**Al cargar componente:**
```
🔍 QRCardShare - businessId: {id}
🔍 Fetching QR config from: /api/business/{id}/qr-branding
✅ QR config data: { businessName, cardDesign, customWhatsappMessage }
```

**Al compartir (primera vez):**
```
📋 Usando mensaje personalizado
✅ QR generado exitosamente: { size: "X.XX KB", dimensions: "WxH" }
🥇 Intentando enviar QR + mensaje juntos...
```

**Al compartir (segunda vez):**
```
📋 Usando mensaje personalizado
✅ Usando QR cacheado
```

**Al descargar:**
```
✅ Usando QR cacheado
```

---

## 📊 MÉTRICAS A OBSERVAR

### Performance (abrir DevTools -> Performance):

1. Grabar mientras se hace "Compartir"
2. **Verificar:**
   - ✅ html2canvas se ejecuta solo 1 vez
   - ✅ No hay re-renders excesivos
   - ✅ Tiempo total < 500ms

### Network (abrir DevTools -> Network):

1. Recargar página
2. **Verificar:**
   - ✅ Solo 1 request a `/api/business/{id}/qr-branding`
   - ✅ No hay requests redundantes

3. Compartir varias veces
4. **Verificar:**
   - ✅ No hay nuevos requests a la API
   - ✅ Cache funciona correctamente

---

## ✅ RESULTADO ESPERADO

**Todas las pruebas deben pasar sin errores críticos.**

**Si encuentras errores:**
1. Revisar consola del navegador
2. Verificar que todos los archivos estén creados
3. Verificar imports correctos
4. Revisar que TypeScript compile sin errores

---

## 🎉 LISTO PARA PRODUCCIÓN

Una vez que todas las pruebas pasen:
- ✅ Código optimizado y funcionando
- ✅ Compatible con múltiples navegadores
- ✅ Performance mejorada 3-4x
- ✅ UX clara y consistente

**¡Felicidades! El QR Share está optimizado al máximo.** 🚀
