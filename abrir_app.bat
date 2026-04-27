@echo off
echo ===================================================
echo Iniciando motor de analisis de Baloto...
echo El servidor se ejecutara en una nueva ventana.
echo ===================================================
start "Servidor PHP Baloto" php -S localhost:8000
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000"
