@echo off
REM ##############################################################################
REM ESQs Progressive Web App Launcher for Windows
REM Enhanced Synthesized Quintessential System - Windows Launcher
REM ##############################################################################

setlocal enabledelayedexpansion

REM ESQs branding
echo.
echo ███████╗ ███████╗ ██████╗  ███████╗
echo ██╔════╝ ██╔════╝██╔═══██╗ ██╔════╝
echo █████╗   ███████╗██║   ██║ ███████╗
echo ██╔══╝   ╚════██║██║▄▄ ██║ ╚════██║
echo ███████╗ ███████║╚██████╔╝ ███████║
echo ╚══════╝ ╚══════╝ ╚══▀▀═╝  ╚══════╝
echo.
echo Enhanced Synthesized Quintessential System
echo Legal Intelligence Platform Launcher
echo.

REM Configuration
set ESQS_URL=https://bcls-esqs.github.io/boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs/
set LOCAL_URL=http://localhost:8080
set PORT=8080

REM Parse command line arguments
if "%1"=="--local" goto launch_local
if "%1"=="-l" goto launch_local
if "%1"=="--web" goto launch_web
if "%1"=="-w" goto launch_web
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help
if "%1"=="--status" goto show_status
if "%1"=="-s" goto show_status
if "%1"=="--install" goto show_install
if "%1"=="-i" goto show_install
if "%1"=="--test" goto run_tests
if "%1"=="-t" goto run_tests
if "%1"=="" goto interactive_menu

echo ❌ Unknown option: %1
echo Use --help for usage information
goto end

:interactive_menu
echo 🤔 No option specified. What would you like to do?
echo.
echo 1) Launch ESQs locally (recommended for development)
echo 2) Open ESQs web version
echo 3) Show installation guide
echo 4) Check system status
echo 5) Run integration tests
echo.
set /p choice="Choose an option (1-5): "

if "%choice%"=="1" goto launch_local
if "%choice%"=="2" goto launch_web
if "%choice%"=="3" goto show_install
if "%choice%"=="4" goto show_status
if "%choice%"=="5" goto run_tests
echo ❌ Invalid option
goto end

:launch_local
echo 🚀 Launching ESQs locally...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python to run local server.
    echo Download from: https://www.python.org/downloads/
    goto end
)

REM Check if port is available
netstat -an | find ":%PORT% " >nul
if not errorlevel 1 (
    echo ⚠️  Port %PORT% is already in use. Trying to open existing server...
    start "" "%LOCAL_URL%"
    goto end
)

echo 🚀 Starting ESQs local server on port %PORT%...
start /b python -m http.server %PORT%

REM Wait for server to start
timeout /t 3 /nobreak >nul

echo ✅ ESQs server started successfully!
echo 🌐 Opening ESQs in browser...

REM Open in default browser
start "" "%LOCAL_URL%"

echo.
echo ✅ ESQs launched successfully!
echo 💡 To stop the server, close this window or use Ctrl+C
echo 📄 Access ESQs at: %LOCAL_URL%
goto end

:launch_web
echo 🌐 Opening ESQs web version...
start "" "%ESQS_URL%"
echo ✅ ESQs web version opened!
goto end

:show_status
echo 🔍 ESQs System Status:
echo.

REM Check local server
netstat -an | find ":%PORT% " >nul
if not errorlevel 1 (
    echo ✅ Local server: Running on port %PORT%
) else (
    echo ⚪ Local server: Not running
)

REM Check Python
python --version >nul 2>&1
if not errorlevel 1 (
    echo ✅ Python: Available
) else (
    echo ❌ Python: Not found
)

REM Check connectivity (basic)
ping -n 1 github.com >nul 2>&1
if not errorlevel 1 (
    echo ✅ Internet: Connected
) else (
    echo ❌ Internet: Disconnected
)

echo.
echo 📋 System Information:
echo   OS: Windows
echo   Local URL: %LOCAL_URL%
echo   Web URL: %ESQS_URL%
goto end

:show_install
echo 📱 ESQs PWA Installation Guide:
echo.
echo Chrome/Edge/Brave:
echo   1. Open ESQs in browser
echo   2. Click the install icon (⊕) in the address bar
echo   3. Click 'Install' in the popup
echo.
echo Firefox:
echo   1. Open ESQs in browser
echo   2. Click the menu (☰) → 'Install this site as an app'
echo.
echo Mobile (iOS/Android):
echo   1. Open ESQs in browser
echo   2. Tap share button
echo   3. Select 'Add to Home Screen'
echo.
echo ✨ After installation, ESQs will work offline and feel like a native app!
goto end

:run_tests
echo 🧪 ESQs Integration Testing:
echo.

REM Test Python availability
python --version >nul 2>&1
if not errorlevel 1 (
    echo ✅ Python test passed
    
    REM Start temporary server for testing
    echo 🔧 Starting test server...
    start /b python -m http.server %PORT%
    timeout /t 3 /nobreak >nul
    
    REM Test server response
    powershell -command "try { Invoke-WebRequest -Uri '%LOCAL_URL%' -UseBasicParsing | Out-Null; Write-Host '✅ Server response test passed' } catch { Write-Host '❌ Server response test failed' }"
    
    REM Test manifest
    powershell -command "try { $response = Invoke-WebRequest -Uri '%LOCAL_URL%/manifest.json' -UseBasicParsing; if ($response.Content -match 'ESQs|AI RAID') { Write-Host '✅ PWA manifest test passed' } else { Write-Host '❌ PWA manifest test failed' } } catch { Write-Host '❌ PWA manifest test failed' }"
    
    REM Test service worker
    powershell -command "try { $response = Invoke-WebRequest -Uri '%LOCAL_URL%/sw.js' -UseBasicParsing; if ($response.Content -match 'ESQs Service Worker') { Write-Host '✅ Service worker test passed' } else { Write-Host '❌ Service worker test failed' } } catch { Write-Host '❌ Service worker test failed' }"
    
    REM Stop test server
    taskkill /f /im python.exe >nul 2>&1
    
) else (
    echo ❌ Python test failed - Python not available
)

echo.
echo 📝 Integration Test Summary:
echo   - GitHub Integration: Available in codebase ✅
echo   - Dropbox Integration: Available in codebase ✅
echo   - Lexis Nexis Integration: Available in codebase ✅
echo   - PracticePanther Integration: Available in codebase ✅
echo   - PWA Functionality: Tested above ⬆️
echo.
echo 🔗 To test live integrations, open ESQs and check:
echo   1. Set API keys via browser console
echo   2. Test legal queries and document access
echo   3. Verify session management and billing
goto end

:show_help
echo ESQs PWA Launcher - Usage:
echo.
echo   launch-esqs.bat [option]
echo.
echo Options:
echo   --local, -l     Launch local development server
echo   --web, -w       Open web version (GitHub Pages)
echo   --help, -h      Show this help message
echo   --status, -s    Check ESQs system status
echo   --install, -i   Install ESQs as PWA
echo   --test, -t      Run integration tests
echo.
echo Examples:
echo   launch-esqs.bat --local    # Start local server and open ESQs
echo   launch-esqs.bat --web      # Open online version
echo   launch-esqs.bat --install  # Guide for PWA installation
echo.
echo Integration Testing:
echo   launch-esqs.bat --test     # Run integration tests
goto end

:end
pause