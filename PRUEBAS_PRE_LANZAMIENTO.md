# 🧪 LISTA DE PRUEBAS PRE-LANZAMIENTO

## ⏱️ TIEMPO ESTIMADO: 30 MINUTOS

### 1. **Prueba de Registro y Login** (5 min)
```
✅ Ir a /signup
✅ Crear negocio: "Demo Restaurante"
✅ Email: demo@restaurant.com / Password: 123456
✅ Verificar que entra directo (sin verificación email)
✅ Logout y volver a hacer login
```

### 2. **Prueba de Tarjetas de Fidelización** (10 min)
```
✅ Ir a Admin → Portal → Gestión de Tarjetas
✅ Crear tarjeta: "Café Gratis" - 10 puntos
✅ Activar la tarjeta
✅ Verificar que aparece en la lista
✅ Ir al Portal Cliente (botón "Ver Portal")
✅ Verificar que se ve bien en móvil
```

### 3. **Prueba de Clientes y Puntos** (10 min)
```
✅ Ir a Admin → Clientes
✅ Agregar cliente: "Juan Pérez" - 555-1234
✅ Ir a "Gestionar" del cliente
✅ Asignar 5 puntos manualmente
✅ Verificar que aparece en historial
✅ Asignar 5 puntos más (total 10)
✅ Verificar que puede canjear "Café Gratis"
```

### 4. **Prueba de Portal Cliente** (5 min)
```
✅ Ir al Portal Cliente
✅ Buscar cliente por teléfono: 555-1234
✅ Verificar que muestra puntos correctos
✅ Verificar que muestra tarjetas disponibles
✅ Probar en móvil (F12 → Device Mode)
```

---

## 🎯 DATOS DE DEMO LISTOS

### **Negocio Demo:**
- Nombre: "Café Central Demo"
- Email: demo@cafecentral.com
- Teléfono: 555-0123

### **Tarjetas Sugeridas:**
1. **Café Gratis** - 10 puntos
2. **Descuento 20%** - 15 puntos  
3. **Postre Gratis** - 8 puntos

### **Clientes Demo:**
1. **María González** - 555-1111 (15 puntos)
2. **Carlos López** - 555-2222 (8 puntos)
3. **Ana Martín** - 555-3333 (22 puntos)

---

## 🚨 SI ALGO NO FUNCIONA

### **Reiniciar Aplicación:**
```bash
npm run build
npm start
```

### **Resetear Base de Datos:**
```bash
# Solo si es necesario
npx prisma migrate reset --force
npx prisma db seed
```

### **Ver Logs de Error:**
- Abrir DevTools (F12)
- Ver errores en Console
- Tomar screenshot para debug posterior

---

## 📱 CHECKLIST FINAL PRE-DEMO

- [ ] Aplicación funcionando en `http://localhost:3000`
- [ ] Datos demo cargados y funcionando
- [ ] Portal cliente responsive en móvil
- [ ] Screenshots tomados como backup
- [ ] Historia preparada para contar

**¡LISTO PARA EL LANZAMIENTO! 🚀**
