# Script para corregir caracteres UTF-8 malformados
$filePath = "c:\Users\abrah\lealta 2.0v\lealta-2.0\src\app\cliente\page.tsx"

# Leer el contenido del archivo
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# Mapeo de caracteres malformados a caracteres correctos
$replacements = @{
    "Ã¡" = "á"
    "Ã©" = "é" 
    "Ã­" = "í"
    "Ã³" = "ó"
    "Ãº" = "ú"
    "Ã±" = "ñ"
    "ÃÃ" = "Á"
    "ÃÃ" = "É"
    "ÃÃ" = "Í"
    "ÃÃ" = "Ó"
    "ÃÃ" = "Ú"
    "ÃÃ" = "Ñ"
    "CÃ©dula" = "Cédula"
    "cÃ©dula" = "cédula"
    "NÃºmero" = "Número"
    "nÃºmero" = "número"
    "dÃ­a" = "día"
    "DÃ­a" = "Día"
    "imÃ¡genes" = "imágenes"
    "ImÃ¡genes" = "Imágenes"
    "despuÃ©s" = "después"
    "DespuÃ©s" = "Después"
    "segÃºn" = "según"
    "SegÃºn" = "Según"
    "configuraciÃ³n" = "configuración"
    "ConfiguraciÃ³n" = "Configuración"
    "versiÃ³n" = "versión"
    "VersiÃ³n" = "Versión"
    "actualizaciÃ³n" = "actualización"
    "ActualizaciÃ³n" = "Actualización"
    "rotaciÃ³n" = "rotación"
    "RotaciÃ³n" = "Rotación"
    "automÃ¡tica" = "automática"
    "AutomÃ¡tica" = "Automática"
    "sincronizaciÃ³n" = "sincronización"
    "SincronizaciÃ³n" = "Sincronización"
    "rÃ¡pido" = "rápido"
    "RÃ¡pido" = "Rápido"
    "mÃ¡ximo" = "máximo"
    "MÃ¡ximo" = "Máximo"
    "tambiÃ©n" = "también"
    "TambiÃ©n" = "También"
    "más" = "más"
    "Más" = "Más"
}

# Aplicar reemplazos
foreach ($key in $replacements.Keys) {
    $content = $content -replace [regex]::Escape($key), $replacements[$key]
}

# Guardar el archivo corregido
Set-Content -Path $filePath -Value $content -Encoding UTF8

Write-Host "Corrección de caracteres UTF-8 completada en: $filePath"
