@echo off
REM ESQs Launcher Script for Windows
REM Quick setup and launch script for the Enhanced Synthesized Quintessential System

echo.
echo 🏛️  ESQs - Enhanced Synthesized Quintessential System
echo =================================================
echo.

REM Check if we're in the right directory
if not exist "index.html" (
    echo ❌ Error: ESQs files not found in current directory
    echo.
    echo Please run this script from the ESQs repository directory:
    echo   cd boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs
    echo   launch.bat
    echo.
    pause
    exit /b 1
)

if not exist "manifest.json" (
    echo ❌ Error: ESQs files not found in current directory
    echo.
    echo Please run this script from the ESQs repository directory:
    echo   cd boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs
    echo   launch.bat
    echo.
    pause
    exit /b 1
)

echo ✅ ESQs installation detected
echo.

REM Find available port
set port=8000
:find_port
netstat -an | find ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    set /a port+=1
    goto find_port
)

echo 🔍 Detecting available web server options...
echo.

REM Check for Node.js/npx
where npx >nul 2>&1
if %errorlevel% equ 0 (
    echo Found: Node.js ^(npx^)
    echo 🚀 Starting ESQs web server on port %port%...
    echo 📱 Open your browser to: http://localhost:%port%
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    npx serve . -p %port%
    goto end
)

REM Check for Python 3
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo Found: Python
    echo 🚀 Starting ESQs web server on port %port%...
    echo 📱 Open your browser to: http://localhost:%port%
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server %port%
    goto end
)

REM Check for Python 3 specifically
where python3 >nul 2>&1
if %errorlevel% equ 0 (
    echo Found: Python 3
    echo 🚀 Starting ESQs web server on port %port%...
    echo 📱 Open your browser to: http://localhost:%port%
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python3 -m http.server %port%
    goto end
)

REM Check for PHP
where php >nul 2>&1
if %errorlevel% equ 0 (
    echo Found: PHP
    echo 🚀 Starting ESQs web server on port %port%...
    echo 📱 Open your browser to: http://localhost:%port%
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    php -S localhost:%port%
    goto end
)

REM No web server found
echo ❌ No suitable web server found
echo.
echo Please install one of the following:
echo   • Node.js ^(recommended^): https://nodejs.org/
echo   • Python 3: https://python.org/
echo   • PHP: https://php.net/
echo.
echo Then run this script again.
echo.
echo Alternative: Open index.html directly in your browser
echo ^(Note: Some features may not work without a web server^)
echo.
pause
exit /b 1

:end
echo.
echo ESQs server stopped.
pause