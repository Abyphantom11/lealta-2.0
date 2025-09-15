# Script para limpiar espacios en blanco al final de las líneas
$filePath = "src\app\staff\page.tsx"
$content = Get-Content $filePath
$cleanContent = $content | ForEach-Object { $_.TrimEnd() }
$cleanContent | Set-Content $filePath -Encoding UTF8
Write-Host "Espacios en blanco eliminados de $filePath"
