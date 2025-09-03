# Script universal para corregir caracteres UTF-8 malformados
# Uso: .\fix-utf8-universal.ps1 "ruta\al\archivo.tsx"

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

if (!(Test-Path $FilePath)) {
    Write-Error "El archivo $FilePath no existe."
    exit 1
}

Write-Host "Corrigiendo caracteres UTF-8 en: $FilePath"

# Leer el contenido del archivo
$content = Get-Content -Path $FilePath -Raw -Encoding UTF8

# Mapeo completo de caracteres malformados UTF-8
$replacements = @{
    # Vocales con acentos
    "Ã¡" = "á"
    "Ã©" = "é" 
    "Ã­" = "í"
    "Ã³" = "ó"
    "Ãº" = "ú"
    "Ã±" = "ñ"
    
    # Vocales mayúsculas con acentos
    "Ã" = "Á"
    "Ã‰" = "É"
    "Ã" = "Í"
    "Ã"" = "Ó"
    "Ãš" = "Ú"
    "Ã'" = "Ñ"
    
    # Palabras comunes problemáticas
    "CÃ©dula" = "Cédula"
    "cÃ©dula" = "cédula"
    "NÃºmero" = "Número"
    "nÃºmero" = "número"
    "DÃ­a" = "Día"
    "dÃ­a" = "día"
    "categorÃ­a" = "categoría"
    "BÃºsqueda" = "Búsqueda"
    "especÃ­ficos" = "específicos"
    "SecciÃ³n" = "Sección"
    "vacÃ­o" = "vacío"
    "FunciÃ³n" = "Función"
    "imÃ¡genes" = "imágenes"
    "despuÃ©s" = "después"
    "configuraciÃ³n" = "configuración"
    "versiÃ³n" = "versión"
    "actualizaciÃ³n" = "actualización"
    "rotaciÃ³n" = "rotación"
    "automÃ¡tica" = "automática"
    "sincronizaciÃ³n" = "sincronización"
    "rÃ¡pido" = "rápido"
    "mÃ¡ximo" = "máximo"
    "tambiÃ©n" = "también"
    "segÃºn" = "según"
    
    # Flecha problemática
    "â†" = "←"
    "├óÔÇá┬É" = "←"
}

$changesCount = 0

# Aplicar reemplazos
foreach ($malformed in $replacements.Keys) {
    $correct = $replacements[$malformed]
    if ($content -match [regex]::Escape($malformed)) {
        $content = $content -replace [regex]::Escape($malformed), $correct
        $changesCount++
        Write-Host "Corregido: '$malformed' → '$correct'"
    }
}

# Guardar el archivo corregido solo si hubo cambios
if ($changesCount -gt 0) {
    Set-Content -Path $FilePath -Value $content -Encoding UTF8
    Write-Host "✅ Corrección completada. Se realizaron $changesCount correcciones en: $FilePath" -ForegroundColor Green
} else {
    Write-Host "✅ No se encontraron caracteres malformados en: $FilePath" -ForegroundColor Green
}
