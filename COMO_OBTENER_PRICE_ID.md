# 🔍 CÓMO OBTENER EL PRICE ID CORRECTO

## ✅ Ya tienes el Product ID:
```
pro_01k9d940v6ppjbh0cknn5xz4t3
```

Pero necesitas el **PRICE ID** (no el Product ID).

---

## 📝 PASOS PARA OBTENER EL PRICE ID:

### 1. Ve a tu Dashboard de Paddle:
```
https://vendors.paddle.com/catalog/products
```

### 2. Busca tu producto:
- Nombre: "Lealta Enterprise" (o como lo hayas llamado)
- ID: `pro_01k9d940v6ppjbh0cknn5xz4t3` ✅

### 3. Click en el producto

### 4. Ve a la sección **"Prices"**

### 5. Busca el precio de $250/mes

Deberías ver algo como:

```
💵 $250.00 USD / month
   ID: pri_01xxxxxxxxxxxxxxxxxxxxx
   Status: Active
   Billing: Recurring (monthly)
```

### 6. **Copia ese ID** que empieza con `pri_`

---

## 🖼️ Referencia Visual:

```
┌─────────────────────────────────────────┐
│ Lealta Enterprise                       │
│ pro_01k9d940v6ppjbh0cknn5xz4t3         │
├─────────────────────────────────────────┤
│ Prices:                                 │
│                                         │
│ 💵 $250.00 USD / month                 │
│    pri_01xxxxxxxxxxxxxxxxxxxxx  ⬅️ COPIA ESTE
│    Status: Active ✅                    │
│    Billing: Recurring                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚀 Una vez que tengas el Price ID:

Pégalo aquí en el chat en este formato:

```
pri_01xxxxxxxxxxxxxxxxxxxxx
```

Y yo actualizaré el archivo `.env` por ti.

---

## ❓ Si NO ves ningún precio:

Significa que necesitas crear uno:

### Click en "Add Price"

**Configura:**
```
Amount: $250.00
Currency: USD
Billing: Recurring ✅
Interval: Monthly ✅
```

**Click "Save"**

Luego copia el **Price ID** que se genera.

---

## 🧪 Alternativa: ¿Prefieres usar Sandbox?

Si tu cuenta de producción no está lista, podemos probar en Sandbox:

1. Ve a: https://sandbox-vendors.paddle.com/
2. Crea un producto de prueba
3. Agrega un precio de prueba ($250)
4. Usa el Price ID de sandbox (con ambiente "sandbox")

**Ventajas de Sandbox:**
- ✅ No procesas pagos reales
- ✅ Puedes probar todo el flujo
- ✅ Tarjeta de prueba: 4242 4242 4242 4242
- ✅ No necesitas cuenta aprobada

---

**¿Qué prefieres?**
1. 🔍 Buscar el Price ID en production
2. 🧪 Configurar Sandbox para pruebas
