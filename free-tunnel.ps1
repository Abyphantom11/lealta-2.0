# Script para crear túneles gratuitos sin claves
param(
    [int]$Port = 3000,
    [string]$Method = "localtunnel"
)

Write-Host "🚀 Iniciando túnel gratuito..." -ForegroundColor Green
Write-Host "Puerto: $Port" -ForegroundColor Yellow
Write-Host "Método: $Method" -ForegroundColor Yellow
Write-Host ""

switch ($Method) {
    "localtunnel" {
        Write-Host "Usando localtunnel sin subdomain personalizado..." -ForegroundColor Cyan
        Write-Host "Ejecuta: lt --port $Port" -ForegroundColor White
        Write-Host ""
        Write-Host "Si pide clave, usa otro método con: .\free-tunnel.ps1 -Method serveo" -ForegroundColor Yellow
    }
    "serveo" {
        Write-Host "Usando serveo.net (requiere SSH)..." -ForegroundColor Cyan
        Write-Host "Ejecuta: ssh -R 80:localhost:$Port serveo.net" -ForegroundColor White
        Write-Host ""
        Write-Host "Tu URL será algo como: https://random.serveo.net" -ForegroundColor Green
    }
    "cloudflare" {
        Write-Host "Usando Cloudflare Tunnel (requiere descarga)..." -ForegroundColor Cyan
        Write-Host "1. Descarga cloudflared desde: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor White
        Write-Host "2. Ejecuta: cloudflared tunnel --url http://localhost:$Port" -ForegroundColor White
    }
    "ngrok" {
        Write-Host "Usando ngrok (plan gratuito)..." -ForegroundColor Cyan
        Write-Host "1. Instala: npm install -g @ngrok/ngrok" -ForegroundColor White
        Write-Host "2. Ejecuta: ngrok http $Port" -ForegroundColor White
        Write-Host "3. Para uso permanente, registrate gratis en ngrok.com" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "💡 Otros métodos disponibles:" -ForegroundColor Magenta
Write-Host "  .\free-tunnel.ps1 -Method localtunnel" -ForegroundColor Gray
Write-Host "  .\free-tunnel.ps1 -Method serveo" -ForegroundColor Gray
Write-Host "  .\free-tunnel.ps1 -Method cloudflare" -ForegroundColor Gray
Write-Host "  .\free-tunnel.ps1 -Method ngrok" -ForegroundColor Gray
