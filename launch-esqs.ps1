# ##############################################################################
# ESQs Progressive Web App Launcher for PowerShell
# Enhanced Synthesized Quintessential System - PowerShell Launcher
# ##############################################################################

param(
    [string]$Action = "",
    [switch]$Local,
    [switch]$Web,
    [switch]$Help,
    [switch]$Status,
    [switch]$Install,
    [switch]$Test
)

# Configuration
$ESQS_URL = "https://bcls-esqs.github.io/boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs/"
$LOCAL_URL = "http://localhost:8080"
$PORT = 8080

# ESQs branding
function Show-ESQsBranding {
    Write-Host ""
    Write-Host "███████╗ ███████╗ ██████╗  ███████╗" -ForegroundColor Magenta
    Write-Host "██╔════╝ ██╔════╝██╔═══██╗ ██╔════╝" -ForegroundColor Magenta
    Write-Host "█████╗   ███████╗██║   ██║ ███████╗" -ForegroundColor Magenta
    Write-Host "██╔══╝   ╚════██║██║▄▄ ██║ ╚════██║" -ForegroundColor Magenta
    Write-Host "███████╗ ███████║╚██████╔╝ ███████║" -ForegroundColor Magenta
    Write-Host "╚══════╝ ╚══════╝ ╚══▀▀═╝  ╚══════╝" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Enhanced Synthesized Quintessential System" -ForegroundColor Cyan
    Write-Host "Legal Intelligence Platform Launcher" -ForegroundColor Yellow
    Write-Host ""
}

function Test-PortInUse {
    param([int]$Port)
    
    try {
        $listener = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties()
        $connections = $listener.GetActiveTcpListeners()
        return $connections | Where-Object { $_.Port -eq $Port }
    }
    catch {
        return $false
    }
}

function Start-ESQsLocalServer {
    Write-Host "🚀 Starting ESQs local server..." -ForegroundColor Blue
    
    # Check if Python is available
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Python not found"
        }
        Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Python not found. Please install Python to run local server." -ForegroundColor Red
        Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
        return $false
    }
    
    # Check if port is available
    if (Test-PortInUse -Port $PORT) {
        Write-Host "⚠️  Port $PORT is already in use. Opening existing server..." -ForegroundColor Yellow
        Start-Process $LOCAL_URL
        return $true
    }
    
    # Start server
    try {
        $serverProcess = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", $PORT -WindowStyle Hidden -PassThru
        Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        # Verify server is running
        try {
            $response = Invoke-WebRequest -Uri $LOCAL_URL -UseBasicParsing -TimeoutSec 5
            Write-Host "✅ ESQs server started successfully on port $PORT" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "❌ Failed to start ESQs server" -ForegroundColor Red
            if ($serverProcess -and !$serverProcess.HasExited) {
                $serverProcess.Kill()
            }
            return $false
        }
    }
    catch {
        Write-Host "❌ Failed to start Python server" -ForegroundColor Red
        return $false
    }
}

function Open-Browser {
    param([string]$Url)
    
    Write-Host "🌐 Opening ESQs in browser..." -ForegroundColor Blue
    try {
        Start-Process $Url
        return $true
    }
    catch {
        Write-Host "⚠️  Please open $Url in your browser" -ForegroundColor Yellow
        return $false
    }
}

function Show-Help {
    Write-Host "ESQs PWA Launcher - Usage:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  .\launch-esqs.ps1 [options]"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Local          Launch local development server"
    Write-Host "  -Web            Open web version (GitHub Pages)"
    Write-Host "  -Help           Show this help message"
    Write-Host "  -Status         Check ESQs system status"
    Write-Host "  -Install        Install ESQs as PWA"
    Write-Host "  -Test           Run integration tests"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\launch-esqs.ps1 -Local     # Start local server and open ESQs"
    Write-Host "  .\launch-esqs.ps1 -Web       # Open online version"
    Write-Host "  .\launch-esqs.ps1 -Install   # Guide for PWA installation"
    Write-Host ""
    Write-Host "Integration Testing:" -ForegroundColor Yellow
    Write-Host "  .\launch-esqs.ps1 -Test      # Run integration tests"
}

function Show-Status {
    Write-Host "🔍 ESQs System Status:" -ForegroundColor Cyan
    Write-Host ""
    
    # Check local server
    if (Test-PortInUse -Port $PORT) {
        Write-Host "✅ Local server: Running on port $PORT" -ForegroundColor Green
    }
    else {
        Write-Host "⚪ Local server: Not running" -ForegroundColor Yellow
    }
    
    # Check Python
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Python: Available ($pythonVersion)" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Python: Not found" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Python: Not found" -ForegroundColor Red
    }
    
    # Check web connectivity
    try {
        $response = Invoke-WebRequest -Uri $ESQS_URL -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Web version: Available" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Web version: Unavailable" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Web version: Unavailable" -ForegroundColor Red
    }
    
    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    Write-Host "✅ PowerShell: $psVersion" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📋 System Information:" -ForegroundColor Blue
    Write-Host "  OS: $($env:OS)"
    Write-Host "  PowerShell Version: $psVersion"
    Write-Host "  Local URL: $LOCAL_URL"
    Write-Host "  Web URL: $ESQS_URL"
}

function Show-InstallGuide {
    Write-Host "📱 ESQs PWA Installation Guide:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Chrome/Edge/Brave:" -ForegroundColor Yellow
    Write-Host "  1. Open ESQs in browser"
    Write-Host "  2. Click the install icon (⊕) in the address bar"
    Write-Host "  3. Click 'Install' in the popup"
    Write-Host ""
    Write-Host "Firefox:" -ForegroundColor Yellow
    Write-Host "  1. Open ESQs in browser"
    Write-Host "  2. Click the menu (☰) → 'Install this site as an app'"
    Write-Host ""
    Write-Host "Mobile (iOS/Android):" -ForegroundColor Yellow
    Write-Host "  1. Open ESQs in browser"
    Write-Host "  2. Tap share button"
    Write-Host "  3. Select 'Add to Home Screen'"
    Write-Host ""
    Write-Host "✨ After installation, ESQs will work offline and feel like a native app!" -ForegroundColor Green
}

function Invoke-IntegrationTests {
    Write-Host "🧪 ESQs Integration Testing:" -ForegroundColor Cyan
    Write-Host ""
    
    # Test Python availability
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Python test passed ($pythonVersion)" -ForegroundColor Green
            
            # Start temporary server for testing
            Write-Host "🔧 Starting test server..." -ForegroundColor Blue
            $testServer = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", $PORT -WindowStyle Hidden -PassThru
            Start-Sleep -Seconds 3
            
            try {
                # Test server response
                $response = Invoke-WebRequest -Uri $LOCAL_URL -UseBasicParsing -TimeoutSec 5
                Write-Host "✅ Server response test passed" -ForegroundColor Green
                
                # Test manifest
                try {
                    $manifestResponse = Invoke-WebRequest -Uri "$LOCAL_URL/manifest.json" -UseBasicParsing -TimeoutSec 5
                    if ($manifestResponse.Content -match "ESQs|AI RAID") {
                        Write-Host "✅ PWA manifest test passed" -ForegroundColor Green
                    }
                    else {
                        Write-Host "❌ PWA manifest test failed" -ForegroundColor Red
                    }
                }
                catch {
                    Write-Host "❌ PWA manifest test failed" -ForegroundColor Red
                }
                
                # Test service worker
                try {
                    $swResponse = Invoke-WebRequest -Uri "$LOCAL_URL/sw.js" -UseBasicParsing -TimeoutSec 5
                    if ($swResponse.Content -match "ESQs Service Worker") {
                        Write-Host "✅ Service worker test passed" -ForegroundColor Green
                    }
                    else {
                        Write-Host "❌ Service worker test failed" -ForegroundColor Red
                    }
                }
                catch {
                    Write-Host "❌ Service worker test failed" -ForegroundColor Red
                }
            }
            catch {
                Write-Host "❌ Server response test failed" -ForegroundColor Red
            }
            finally {
                # Stop test server
                if ($testServer -and !$testServer.HasExited) {
                    $testServer.Kill()
                    Write-Host "🛑 Test server stopped" -ForegroundColor Blue
                }
            }
        }
        else {
            Write-Host "❌ Python test failed - Python not available" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Python test failed - Python not available" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📝 Integration Test Summary:" -ForegroundColor Yellow
    Write-Host "  - GitHub Integration: Available in codebase ✅"
    Write-Host "  - Dropbox Integration: Available in codebase ✅"
    Write-Host "  - Lexis Nexis Integration: Available in codebase ✅"
    Write-Host "  - PracticePanther Integration: Available in codebase ✅"
    Write-Host "  - PWA Functionality: Tested above ⬆️"
    Write-Host ""
    Write-Host "🔗 To test live integrations, open ESQs and check:" -ForegroundColor Blue
    Write-Host "  1. Set API keys via browser console"
    Write-Host "  2. Test legal queries and document access"
    Write-Host "  3. Verify session management and billing"
}

function Show-InteractiveMenu {
    Write-Host "🤔 No option specified. What would you like to do?" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1) Launch ESQs locally (recommended for development)"
    Write-Host "2) Open ESQs web version"
    Write-Host "3) Show installation guide"
    Write-Host "4) Check system status"
    Write-Host "5) Run integration tests"
    Write-Host ""
    
    $choice = Read-Host "Choose an option (1-5)"
    
    switch ($choice) {
        "1" { $Local = $true }
        "2" { $Web = $true }
        "3" { $Install = $true }
        "4" { $Status = $true }
        "5" { $Test = $true }
        default {
            Write-Host "❌ Invalid option" -ForegroundColor Red
            return
        }
    }
}

# Main execution
Show-ESQsBranding

# Parse legacy action parameter
if ($Action -ne "") {
    switch ($Action.ToLower()) {
        "local" { $Local = $true }
        "web" { $Web = $true }
        "help" { $Help = $true }
        "status" { $Status = $true }
        "install" { $Install = $true }
        "test" { $Test = $true }
        default {
            Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
            Write-Host "Use -Help for usage information"
            exit 1
        }
    }
}

# Execute based on parameters
if ($Local) {
    Write-Host "🚀 Launching ESQs locally..." -ForegroundColor Green
    if (Start-ESQsLocalServer) {
        Start-Sleep -Seconds 2
        Open-Browser -Url $LOCAL_URL
        Write-Host ""
        Write-Host "✅ ESQs launched successfully!" -ForegroundColor Green
        Write-Host "💡 To stop the server, close the Python process or use Ctrl+C" -ForegroundColor Yellow
        Write-Host "📄 Access ESQs at: $LOCAL_URL" -ForegroundColor Blue
    }
}
elseif ($Web) {
    Write-Host "🌐 Opening ESQs web version..." -ForegroundColor Green
    Open-Browser -Url $ESQS_URL
    Write-Host "✅ ESQs web version opened!" -ForegroundColor Green
}
elseif ($Help) {
    Show-Help
}
elseif ($Status) {
    Show-Status
}
elseif ($Install) {
    Show-InstallGuide
}
elseif ($Test) {
    Invoke-IntegrationTests
}
else {
    Show-InteractiveMenu
    
    # Re-run with selected option
    if ($Local) { & $MyInvocation.MyCommand.Path -Local }
    elseif ($Web) { & $MyInvocation.MyCommand.Path -Web }
    elseif ($Install) { & $MyInvocation.MyCommand.Path -Install }
    elseif ($Status) { & $MyInvocation.MyCommand.Path -Status }
    elseif ($Test) { & $MyInvocation.MyCommand.Path -Test }
}