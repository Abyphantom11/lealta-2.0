# Script simplificado para corregir caracteres UTF-8 malformados
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
$content = $content -replace "segÃºn", "según"
$content = $content -replace "imÃ¡genes", "imágenes"
$content = $content -replace "despuÃ©s", "después"
$content = $content -replace "configuraciÃ³n", "configuración"
$content = $content -replace "versiÃ³n", "versión"
$content = $content -replace "actualizaciÃ³n", "actualización"
$content = $content -replace "rotaciÃ³n", "rotación"
$content = $content -replace "automÃ¡tica", "automática"
$content = $content -replace "sincronizaciÃ³n", "sincronización"
$content = $content -replace "rÃ¡pido", "rápido"
$content = $content -replace "mÃ¡ximo", "máximo"
$content = $content -replace "tambiÃ©n", "también"

# Guardar el archivo corregido
Set-Content -Path $filePath -Value $content -Encoding UTF8

Write-Host "Corrección de caracteres UTF-8 completada en: $filePath"
