@echo off
cd /d "c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front"
echo.
echo Iniciando servidor Frontend em http://localhost:5500
echo.
echo Pressione CTRL+C para parar o servidor
echo.
python -m http.server 5500
pause
