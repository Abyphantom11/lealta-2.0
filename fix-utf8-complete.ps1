# Script completo para corregir todos los caracteres UTF-8 malformados
$filePath = "c:\Users\abrah\lealta 2.0v\lealta-2.0\src\app\cliente\page.tsx"

# Leer el contenido del archivo
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# Correcciones comunes de UTF-8
$content = $content -replace "Ã¡", "á"
$content = $content -replace "Ã©", "é" 
$content = $content -replace "Ã­", "í"
$content = $content -replace "Ã³", "ó"
$content = $content -replace "Ãº", "ú"
$content = $content -replace "Ã±", "ñ"

# Correcciones específicas de palabras
$content = $content -replace "categorÃ­a", "categoría"
$content = $content -replace "BÃºsqueda", "Búsqueda"
$content = $content -replace "DÃ­a", "Día"
$content = $content -replace "dÃ­a", "día"
$content = $content -replace "especÃ­ficos", "específicos"
$content = $content -replace "SecciÃ³n", "Sección"
$content = $content -replace "vacÃ­o", "vacío"
$content = $content -replace "FunciÃ³n", "Función"

# Guardar el archivo corregido
Set-Content -Path $filePath -Value $content -Encoding UTF8

Write-Host "Corrección completa de caracteres UTF-8 completada en: $filePath"
