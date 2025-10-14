# 🏠 GUÍA COMPLETA: Flujo de Asociación de Consumos a Anfitriones

## 📋 Flujo Paso a Paso en Staff

### **PASO 1: Introducir Cliente/Invitado**
```
1. Ve a la página de Staff
2. En el campo "Buscar Cliente", introduce la cédula del INVITADO
   - Ejemplo: "12345678" (cédula del invitado, NO del anfitrión)
3. Espera a que aparezca la información del cliente
```

### **PASO 2: Activar Modo Anfitrión** 
```
4. Verás aparecer una sección morada que dice:
   "¿Es invitado de un anfitrión?"
5. Activa el toggle (cambia a color morado)
6. Aparecerá un botón "🔍 Buscar Anfitrión"
```

### **PASO 3: Buscar el Anfitrión**
```
7. Haz clic en "🔍 Buscar Anfitrión"
8. Se abre un modal con dos opciones de búsqueda:
   - Por Mesa: "5", "Mesa 5", etc.
   - Por Nombre: "Juan Pérez", "María García", etc.
9. Escribe el número de mesa o nombre del anfitrión
10. Selecciona el anfitrión correcto de los resultados
```

### **PASO 4: Confirmar Vinculación**
```
11. Verás un recuadro que muestra:
    - Mesa del anfitrión
    - Nombre del anfitrión  
    - Número de invitados
    - "✓ Este consumo se vinculará al anfitrión [Nombre]"
```

### **PASO 5: Procesar Consumo**
```
12. Sube la imagen del ticket (como siempre)
13. Procesa con IA
14. Confirma los datos
15. ¡LISTO! El consumo queda asociado al anfitrión automáticamente
```

## 🎯 Resultado Final

- El consumo aparece en el perfil del INVITADO (quien consumió)
- El consumo SE VINCULA al ANFITRIÓN (para fidelización)
- En SuperAdmin → Anfitrión, verás:
  - El anfitrión con sus invitados
  - Los consumos de cada invitado
  - El total gastado por mesa/anfitrión

## ⚠️ Puntos Importantes

1. **La cédula inicial es del INVITADO** (quien va a consumir)
2. **El anfitrión se busca después** (en el modal)
3. **Ambos deben existir** en el sistema
4. **Solo funciona con reservas activas** del día

## 🔧 Verificación de Funcionamiento

### Frontend (UI):
- ✅ GuestConsumoToggle aparece con cédula válida
- ✅ Modal de búsqueda se abre correctamente
- ✅ Búsqueda por mesa y nombre implementada

### Backend (APIs):
- ✅ `/api/staff/host-tracking/search` - Buscar anfitriones
- ✅ `/api/staff/guest-consumo` - Vincular consumo
- ✅ `/api/admin/host-tracking` - Ver datos en admin

## 🚀 Si No Funciona, Verificar:

1. **¿Existe una reserva activa hoy?**
   - El anfitrión debe tener reserva CONFIRMED o SEATED
   
2. **¿El invitado está registrado?**
   - Si no existe, regístralo primero
   
3. **¿La búsqueda encuentra al anfitrión?**
   - Prueba buscar por mesa "5" o nombre completo
   
4. **¿Los logs muestran errores?**
   - Revisa la consola del navegador
   - Revisa los logs del servidor

## 🎪 Ejemplo Práctico

```
ESCENARIO: Mesa 5 con Juan Pérez como anfitrión, María González como invitada

1. Staff introduce: "98765432" (cédula de María)
2. Activa toggle "¿Es invitado de un anfitrión?"
3. Busca por mesa: "5"
4. Selecciona: "Juan Pérez - Mesa 5"
5. Procesa ticket de María
6. ✅ Consumo de María queda vinculado a Juan como anfitrión
```
