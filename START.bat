@echo off
REM ===================================================
REM   HCI Vitta - Sistema de Triagem Clinica com IA
REM   Script de Inicio para Windows
REM ===================================================

setlocal enabledelayedexpansion
color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║        HCI Vitta - Sistema de Triagem Clinica      ║
echo ║            INICIALIZADOR PARA WINDOWS              ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Verificar se está no diretório correto
cd /d "c:\Projetos Facul\trabalhoPI5"

if not exist "docker-compose.yml" (
    color 0C
    echo.
    echo [ERRO] docker-compose.yml nao encontrado!
    echo.
    echo Verifique se voce esta no diretorio correto:
    echo c:\Projetos Facul\trabalhoPI5
    echo.
    pause
    exit /b 1
)

echo [1/5] Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo [ERRO] Docker nao encontrado!
    echo Instale o Docker Desktop: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo [✓] Docker OK
echo.

echo [2/5] Parando containers antigos (se existirem)...
docker-compose down >nul 2>&1
echo [✓] Done
echo.

echo [3/5] Iniciando Backend, Database e IA Engine...
echo.
echo   Aguarde ~30 segundos enquanto os servicos iniciam...
echo   (Uma nova janela se abrira com os logs)
echo.

start "HCI Vitta - Containers" cmd /k "cd /d c:\Projetos Facul\trabalhoPI5 && docker-compose up --build"

REM Aguarda os containers iniciarem
timeout /t 12 /nobreak

echo.
echo [4/5] Iniciando servidor Frontend (Python)...
echo.
echo   URL: http://localhost:5500
echo.

start "HCI Vitta - Frontend Server" cmd /k "cd /d c:\Projetos Facul\trabalhoPI5\frontend-chatAI\front && python -m http.server 5500"

timeout /t 3 /nobreak

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║              SISTEMA INICIADO COM SUCESSO!         ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo [5/5] Abrindo navegador...
echo.

timeout /t 1 /nobreak

REM Abrir navegador
start http://localhost:5500/html/login.html

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║                    URLS DE ACESSO                  ║
echo ╠════════════════════════════════════════════════════╣
echo ║ Frontend:     http://localhost:5500/html/login.html║
echo ║ Backend API:  http://localhost:3000                ║
echo ║ pgAdmin:      http://localhost:8080                ║
echo ║ IA Engine:    http://localhost:5000                ║
echo ╠════════════════════════════════════════════════════╣
echo ║ Credenciais:                                        ║
echo ║ pgAdmin:      admin@pgadmin.org / 090106           ║
echo ║ PostgreSQL:   postgres / 090106                    ║
echo ║ App:          Cadastre novo usuario                ║
echo ╠════════════════════════════════════════════════════╣
echo ║ TROUBLESHOOTING:                                    ║
echo ║ - Se frontend nao carrega, espere mais tempo       ║
echo ║ - Se backend nao responde, verifique a outra janela║
echo ║ - Logs do Docker aparecem em outra janela          ║
echo ║ - Para parar: CTRL+C em ambas as janelas           ║
echo ║ - Ou execute: docker-compose down                  ║
echo ╚════════════════════════════════════════════════════╝
echo.

pause
