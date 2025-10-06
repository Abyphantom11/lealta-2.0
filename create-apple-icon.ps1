# Script para crear apple-touch-icon desde iconos existentes
# El apple-touch-icon debe ser 180x180px con fondo opaco (iOS no soporta transparencia)

# Opción 1: Si tienes ImageMagick instalado
# convert public/icons/icon-192.png -resize 180x180 -background "#1a1a1a" -flatten public/icons/apple-touch-icon.png

# Opción 2: Si tienes Sharp (Node.js)
# npm install --save-dev sharp
# node -e "const sharp = require('sharp'); sharp('public/icons/icon-192.png').resize(180, 180).flatten({background: {r: 26, g: 26, b: 26}}).toFile('public/icons/apple-touch-icon.png')"

# Opción 3: Manual
# 1. Abre icon-192.png en cualquier editor de imágenes
# 2. Redimensiona a 180x180px
# 3. Si tiene transparencia, agrega fondo #1a1a1a (gris oscuro)
# 4. Guarda como apple-touch-icon.png

# Por ahora, vamos a copiar el icon-192.png como temporal
# (funciona, pero iOS prefiere 180x180 específicamente)

Write-Host "🍎 Creando apple-touch-icon..."

# Copiar icon-192.png como apple-touch-icon.png temporalmente
Copy-Item "public\icons\icon-192.png" "public\icons\apple-touch-icon.png"

Write-Host "✅ apple-touch-icon.png creado (usando icon-192.png)"
Write-Host "📝 NOTA: Para mejor resultado, redimensiona manualmente a 180x180px"
Write-Host "📝 iOS requiere fondo opaco (sin transparencia)"
