# 🐛 Debugging: Tema no se Refleja en Cliente

## ✅ Estado Actual

- **Tema guardado en BD:** ✅ "elegante"
- **Business ID:** `cmgewmtue0000eygwq8taawak` (momo)
- **Logs agregados:** ✅ ThemeProvider y BalanceCard

---

## 🔍 Checklist de Debugging

### 1. ¿Está el servidor corriendo?

```bash
# Debería estar corriendo en: http://localhost:3000
npm run dev
```

**Verificar:**
- Terminal debe mostrar "Ready" o "Compiled successfully"
- NO debe haber errores de compilación

---

### 2. Abrir Cliente y Ver Logs

1. **Ir a:** `http://localhost:3000/cliente`
2. **Abrir consola:** Presiona `F12` → pestaña "Console"
3. **Buscar logs:**

#### ✅ Logs Esperados (CORRECTO):

```javascript
🎨 ThemeProvider: Cargando tema para businessId: cmgewmtue0000eygwq8taawak
🎨 ThemeProvider: Response status: 200
🎨 ThemeProvider: Tema recibido: elegante
🎨 ThemeProvider: Renderizando con tema: elegante isLoading: false
💳 BalanceCard: Renderizando con tema: elegante isLoading: false
```

#### ❌ Logs de Error (PROBLEMA):

**Error 404:**
```javascript
🎨 ThemeProvider: Response status: 404
🎨 ThemeProvider: Error response: {"error":"Negocio no encontrado"}
```
→ **Solución:** El businessId es incorrecto

**Error de Red:**
```javascript
🎨 ThemeProvider: Error loading theme: Failed to fetch
```
→ **Solución:** El servidor no está corriendo

**Tema incorrecto:**
```javascript
🎨 ThemeProvider: Tema recibido: moderno
💳 BalanceCard: Renderizando con tema: moderno
```
→ **Solución:** El tema no se guardó en BD

---

### 3. Verificar Apariencia Visual

#### Tema "Elegante" debe verse así:

```
┌──────────────────────────────────────┐
│ ⭐                                    │
│ [FONDO NEGRO #0a0a0a]                │
│ [BORDE DORADO - 2px yellow-400]      │
│                                       │
│ Balance de Puntos [texto gris]       │
│ 150 [texto AMARILLO grande]          │
│ Tarjeta ****1234 [texto gris]        │
│                                       │
│                          [👁️ dorado]  │
└──────────────────────────────────────┘
```

**Características visuales:**
- ✅ Fondo completamente NEGRO
- ✅ Borde dorado de 2px
- ✅ Números en amarillo brillante
- ✅ Estrella decorativa en esquina superior derecha
- ✅ Botón de ojo con fondo dorado/10

#### Si ves esto (INCORRECTO - tema moderno):

```
┌──────────────────────────────────────┐
│ ☕                                    │
│ [GRADIENTE COLORIDO]                 │
│ [indigo → purple → pink]             │
│                                       │
│ Balance de Puntos [texto blanco]     │
│ 150 [texto BLANCO grande]            │
│ Tarjeta ****1234 [texto blanco]      │
│                                       │
│                          [👁️ blanco]  │
└──────────────────────────────────────┘
```

→ **El tema NO se está cargando correctamente**

---

## 🔧 Soluciones Comunes

### Problema 1: Servidor no está corriendo
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Esperar a ver: "Ready in X ms"
```

### Problema 2: Cache del navegador
```bash
# En el navegador:
1. Ctrl + Shift + R (recarga dura)
2. O: F12 → Network → Disable cache ✅
3. Recargar página
```

### Problema 3: businessId incorrecto en el código

**Verificar en `src/app/cliente/page.tsx`:**
```typescript
const businessId = "cmgewmtue0000eygwq8taawak"; // ✅ Debe ser este
```

### Problema 4: Tema no se guardó en BD

**Verificar:**
```bash
node test-theme-change.js
```

**Debe mostrar:**
```
✅ Tema actualizado en BD
📊 Estado DESPUÉS:
   Tema actual: elegante
```

### Problema 5: ThemeProvider no se está usando

**Verificar en `src/app/cliente/page.tsx`:**
```typescript
export default function ClienteV2Page() {
  const businessId = "cmgewmtue0000eygwq8taawak";
  
  return (
    <BrandingProvider businessId={businessId}>
      <ThemeProvider businessId={businessId}> {/* ✅ Debe estar aquí */}
        <AuthHandler />
      </ThemeProvider>
    </BrandingProvider>
  );
}
```

---

## 🧪 Test Manual Paso a Paso

### Paso 1: Verificar BD
```bash
node test-theme-change.js
```
**Resultado esperado:** Tema actual: elegante ✅

### Paso 2: Iniciar servidor
```bash
npm run dev
```
**Resultado esperado:** Ready in X ms ✅

### Paso 3: Test API directamente
```bash
# En PowerShell o CMD (mientras servidor corre):
curl http://localhost:3000/api/business/cmgewmtue0000eygwq8taawak/client-theme
```
**Resultado esperado:**
```json
{"success":true,"theme":"elegante"}
```

### Paso 4: Abrir cliente
1. Ir a: `http://localhost:3000/cliente`
2. Abrir consola (F12)
3. Buscar logs de "🎨 ThemeProvider"

### Paso 5: Verificar visual
- Tarjeta debe ser NEGRA con borde DORADO
- NO debe ser gradiente colorido

---

## 📸 Capturas de Referencia

### ✅ CORRECTO (Tema Elegante):
- Fondo: Negro #0a0a0a
- Borde: Amarillo 2px
- Texto números: Amarillo brillante
- Decoración: Estrella dorada

### ❌ INCORRECTO (Tema Moderno - default):
- Fondo: Gradiente indigo/purple/pink
- Sin borde
- Texto: Blanco
- Decoración: Taza de café

---

## 🚨 Si Aún No Funciona

### Opción A: Forzar tema en código (temporal)

**En `src/contexts/ThemeContext.tsx`:**
```typescript
const [theme, setThemeState] = useState<ThemeStyle>('elegante'); // 🔥 Forzar elegante
```

**Resultado esperado:** Tarjeta SIEMPRE será elegante, sin importar BD

### Opción B: Bypass del ThemeProvider (temporal)

**En `src/app/cliente/components/dashboard/BalanceCard.tsx`:**
```typescript
// const { theme, isLoading } = useTheme();
const theme = 'elegante'; // 🔥 Hardcodear temporalmente
const isLoading = false;
```

**Resultado esperado:** Tarjeta SIEMPRE será elegante

---

## 📋 Información para Compartir

Si sigues teniendo problemas, comparte:

1. **Output de la consola del navegador** (todos los logs)
2. **Screenshot de la tarjeta** como se ve actualmente
3. **Output de:** `node test-theme-change.js`
4. **¿El servidor está corriendo?** Sí/No
5. **URL que estás usando:** (ej: localhost:3000/cliente)

---

**Fecha:** 6 de Octubre, 2025
**Estado:** Debugging en progreso
**Tema en BD:** ✅ elegante
**Logs agregados:** ✅ ThemeProvider y BalanceCard
