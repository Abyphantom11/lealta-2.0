@echo off
echo 🚀 Alternativas GRATUITAS a ngrok
echo.
echo Selecciona una opción:
echo 1. Cloudflare Tunnel (Recomendado)
echo 2. Serveo.net (SSH)
echo 3. Bore.pub
echo 4. LocalXpose (Free tier)
echo.
set /p choice="Elige (1-4): "

if "%choice%"=="1" goto cloudflare
if "%choice%"=="2" goto serveo
if "%choice%"=="3" goto bore
if "%choice%"=="4" goto localxpose

:cloudflare
echo.
echo 📡 Usando Cloudflare Tunnel...
echo Descargando si no existe...
if not exist "cloudflared.exe" (
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
)
echo Iniciando túnel en puerto 3000...
.\cloudflared.exe tunnel --url http://localhost:3000
goto end

:serveo
echo.
echo 📡 Usando Serveo.net...
echo Tu URL será algo como: https://random.serveo.net
ssh -R 80:localhost:3000 serveo.net
goto end

:bore
echo.
echo 📡 Usando Bore.pub...
echo Instalando bore si no existe...
where bore >nul 2>nul
if %errorlevel% neq 0 (
    echo Instala Rust primero: https://rustup.rs/
    echo Luego ejecuta: cargo install bore-cli
    pause
    goto end
)
bore local 3000 --to bore.pub
goto end

:localxpose
echo.
echo 📡 Usando LocalXpose...
echo Descarga desde: https://localxpose.io/download
echo Ejecuta: loclx tunnel http --to localhost:3000
goto end

:end
pause
