# 🔧 CREAR NUEVO CLIENT TOKEN CON PERMISOS

Tu cuenta está **verificada** ✅, pero el Client Token puede no tener los permisos correctos.

---

## 📝 PASOS PARA CREAR NUEVO CLIENT TOKEN:

### 1. Ve a la sección de Authentication:
```
https://vendors.paddle.com/authentication
```

O desde el menú:
- **Settings** (icono de engranaje)
- **Developer Tools**
- **Authentication**

---

### 2. Busca la sección **"Client-side tokens"**

(NO "API Keys", sino "Client-side tokens")

---

### 3. Click en **"Generate token"** o **"Create new token"**

---

### 4. Configura el token:

**Name:** `Lealta Frontend Token`

**Permissions (Scopes):** Selecciona:
- ✅ `read:products`
- ✅ `read:prices`
- ✅ `write:checkouts` (Muy importante)
- ✅ `read:customers`
- ✅ `write:transactions`

O mejor aún: **Selecciona todos los scopes disponibles** para asegurarte

---

### 5. Click **"Generate"** o **"Create"**

---

### 6. **COPIA EL TOKEN INMEDIATAMENTE**

Se mostrará algo como:
```
live_abc123def456ghi789...
```

⚠️ **IMPORTANTE:** Solo se muestra UNA VEZ. Guárdalo.

---

### 7. Pega el token aquí en el chat

Formato:
```
live_xxxxxxxxxxxxxxxxxxxxx
```

Y yo lo configuraré en tu `.env` automáticamente.

---

## 🔍 Ubicación exacta en Paddle:

```
Paddle Dashboard
└── Settings (menú inferior izquierdo, icono engranaje)
    └── Developer tools
        └── Authentication
            └── Client-side tokens ← Aquí
```

---

## ❓ Si no ves "Client-side tokens":

Puede estar en:
- **Authentication** > **Tokens**
- **Developer** > **API Authentication**
- **Settings** > **Authentication**

Busca la sección que diga "for use in the browser" o "public tokens"

---

Una vez que tengas el nuevo token, pégalo aquí y continuamos 🚀
