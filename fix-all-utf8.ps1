# Script para corregir UTF-8 en todos los archivos TSX/JSX del proyecto
# Uso: .\fix-all-utf8.ps1

$projectPath = "c:\Users\abrah\lealta 2.0v\lealta-2.0\src"

Write-Host "🔧 Iniciando corrección masiva de caracteres UTF-8 en el proyecto..." -ForegroundColor Cyan

# Buscar todos los archivos TSX y JSX
$files = Get-ChildItem -Path $projectPath -Recurse -Include "*.tsx", "*.jsx", "*.ts", "*.js" | Where-Object { !$_.PSIsContainer }

Write-Host "📁 Encontrados $($files.Count) archivos para revisar..." -ForegroundColor Yellow

$totalChanges = 0

foreach ($file in $files) {
    Write-Host "`n📄 Procesando: $($file.FullName.Replace($projectPath, '.'))" -ForegroundColor White
    
    # Leer contenido
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Mapeo de correcciones UTF-8
    $replacements = @{
        "Ã¡" = "á"; "Ã©" = "é"; "Ã­" = "í"; "Ã³" = "ó"; "Ãº" = "ú"; "Ã±" = "ñ"
        "Ã" = "Á"; "Ã‰" = "É"; "Ã" = "Í"; "Ã"" = "Ó"; "Ãš" = "Ú"; "Ã'" = "Ñ"
        "CÃ©dula" = "Cédula"; "cÃ©dula" = "cédula"; "NÃºmero" = "Número"; "nÃºmero" = "número"
        "DÃ­a" = "Día"; "dÃ­a" = "día"; "categorÃ­a" = "categoría"; "BÃºsqueda" = "Búsqueda"
        "especÃ­ficos" = "específicos"; "SecciÃ³n" = "Sección"; "vacÃ­o" = "vacío"
        "FunciÃ³n" = "Función"; "imÃ¡genes" = "imágenes"; "despuÃ©s" = "después"
        "configuraciÃ³n" = "configuración"; "versiÃ³n" = "versión"; "actualizaciÃ³n" = "actualización"
        "rotaciÃ³n" = "rotación"; "automÃ¡tica" = "automática"; "sincronizaciÃ³n" = "sincronización"
        "rÃ¡pido" = "rápido"; "mÃ¡ximo" = "máximo"; "tambiÃ©n" = "también"; "segÃºn" = "según"
        "â†" = "←"; "├óÔÇá┬É" = "←"
    }
    
    $fileChanges = 0
    
    # Aplicar correcciones
    foreach ($malformed in $replacements.Keys) {
        $correct = $replacements[$malformed]
        if ($content -match [regex]::Escape($malformed)) {
            $content = $content -replace [regex]::Escape($malformed), $correct
            $fileChanges++
            Write-Host "   ✓ '$malformed' → '$correct'" -ForegroundColor Green
        }
    }
    
    # Guardar si hubo cambios
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "   💾 Archivo guardado con $fileChanges correcciones" -ForegroundColor Green
        $totalChanges += $fileChanges
    } else {
        Write-Host "   ✅ Sin cambios necesarios" -ForegroundColor Gray
    }
}

Write-Host "`n🎉 Corrección completada!" -ForegroundColor Cyan
Write-Host "📊 Total de correcciones realizadas: $totalChanges" -ForegroundColor Green
Write-Host "📁 Archivos procesados: $($files.Count)" -ForegroundColor Yellow
