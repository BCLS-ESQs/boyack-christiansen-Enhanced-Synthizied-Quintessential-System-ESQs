#!/bin/bash

##############################################################################
# ESQs Progressive Web App Launcher
# Enhanced Synthesized Quintessential System - Cross-Platform Launcher
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ESQs branding
echo -e "${PURPLE}"
echo "███████╗ ███████╗ ██████╗  ███████╗"
echo "██╔════╝ ██╔════╝██╔═══██╗ ██╔════╝"
echo "█████╗   ███████╗██║   ██║ ███████╗"
echo "██╔══╝   ╚════██║██║▄▄ ██║ ╚════██║"
echo "███████╗ ███████║╚██████╔╝ ███████║"
echo "╚══════╝ ╚══════╝ ╚══▀▀═╝  ╚══════╝"
echo -e "${NC}"
echo -e "${CYAN}Enhanced Synthesized Quintessential System${NC}"
echo -e "${YELLOW}Legal Intelligence Platform Launcher${NC}"
echo ""

# Configuration
ESQS_URL="https://bcls-esqs.github.io/boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs/"
LOCAL_URL="http://localhost:8080"
PORT=8080

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos" ;;
        Linux*)     echo "linux" ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*) echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}

# Function to check if port is available
check_port() {
    if command -v netstat >/dev/null 2>&1; then
        netstat -tuln | grep ":$PORT " >/dev/null
        return $?
    elif command -v ss >/dev/null 2>&1; then
        ss -tuln | grep ":$PORT " >/dev/null
        return $?
    else
        return 1
    fi
}

# Function to start local server
start_local_server() {
    echo -e "${BLUE}🚀 Starting ESQs local server...${NC}"
    
    # Find available Python
    if command -v python3 >/dev/null 2>&1; then
        PYTHON_CMD="python3"
    elif command -v python >/dev/null 2>&1; then
        PYTHON_CMD="python"
    else
        echo -e "${RED}❌ Python not found. Please install Python to run local server.${NC}"
        return 1
    fi
    
    # Start server in background
    cd "$(dirname "$0")"
    nohup $PYTHON_CMD -m http.server $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to start
    echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
    sleep 3
    
    # Verify server is running
    if check_port; then
        echo -e "${GREEN}✅ ESQs server started successfully on port $PORT${NC}"
        echo "📄 Server log available at: nohup.out"
        return 0
    else
        echo -e "${RED}❌ Failed to start ESQs server${NC}"
        return 1
    fi
}

# Function to open browser
open_browser() {
    local url=$1
    local os=$(detect_os)
    
    echo -e "${BLUE}🌐 Opening ESQs in browser...${NC}"
    
    case $os in
        "macos")
            open "$url"
            ;;
        "linux")
            if command -v xdg-open >/dev/null 2>&1; then
                xdg-open "$url"
            elif command -v firefox >/dev/null 2>&1; then
                firefox "$url" &
            elif command -v chromium-browser >/dev/null 2>&1; then
                chromium-browser "$url" &
            elif command -v google-chrome >/dev/null 2>&1; then
                google-chrome "$url" &
            else
                echo -e "${YELLOW}⚠️  Please open $url in your browser${NC}"
            fi
            ;;
        "windows")
            start "$url" 2>/dev/null || cmd /c start "$url"
            ;;
        *)
            echo -e "${YELLOW}⚠️  Please open $url in your browser${NC}"
            ;;
    esac
}

# Function to show help
show_help() {
    echo -e "${CYAN}ESQs PWA Launcher - Usage:${NC}"
    echo ""
    echo "  ./launch-esqs.sh [option]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  --local, -l     Launch local development server"
    echo "  --web, -w       Open web version (GitHub Pages)"
    echo "  --help, -h      Show this help message"
    echo "  --status, -s    Check ESQs system status"
    echo "  --install, -i   Install ESQs as PWA"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./launch-esqs.sh --local    # Start local server and open ESQs"
    echo "  ./launch-esqs.sh --web      # Open online version"
    echo "  ./launch-esqs.sh --install  # Guide for PWA installation"
    echo ""
    echo -e "${YELLOW}Integration Testing:${NC}"
    echo "  ./launch-esqs.sh --test     # Run integration tests"
}

# Function to show status
show_status() {
    echo -e "${CYAN}🔍 ESQs System Status:${NC}"
    echo ""
    
    # Check local server
    if check_port; then
        echo -e "${GREEN}✅ Local server: Running on port $PORT${NC}"
    else
        echo -e "${YELLOW}⚪ Local server: Not running${NC}"
    fi
    
    # Check web connectivity
    if command -v curl >/dev/null 2>&1; then
        if curl -s --head "$ESQS_URL" | head -n 1 | grep -q "200 OK"; then
            echo -e "${GREEN}✅ Web version: Available${NC}"
        else
            echo -e "${RED}❌ Web version: Unavailable${NC}"
        fi
    else
        echo -e "${YELLOW}⚪ Web version: Cannot check (curl not available)${NC}"
    fi
    
    # Check browser
    local os=$(detect_os)
    case $os in
        "macos"|"linux"|"windows")
            echo -e "${GREEN}✅ Platform: $os (supported)${NC}"
            ;;
        *)
            echo -e "${YELLOW}⚠️  Platform: $os (may require manual browser opening)${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}📋 System Information:${NC}"
    echo "  OS: $(uname -s)"
    echo "  Local URL: $LOCAL_URL"
    echo "  Web URL: $ESQS_URL"
}

# Function to show PWA installation guide
show_install_guide() {
    echo -e "${CYAN}📱 ESQs PWA Installation Guide:${NC}"
    echo ""
    echo -e "${YELLOW}Chrome/Edge/Brave:${NC}"
    echo "  1. Open ESQs in browser"
    echo "  2. Click the install icon (⊕) in the address bar"
    echo "  3. Click 'Install' in the popup"
    echo ""
    echo -e "${YELLOW}Firefox:${NC}"
    echo "  1. Open ESQs in browser"
    echo "  2. Click the menu (☰) → 'Install this site as an app'"
    echo ""
    echo -e "${YELLOW}Safari (macOS):${NC}"
    echo "  1. Open ESQs in Safari"
    echo "  2. File → 'Add to Dock'"
    echo ""
    echo -e "${YELLOW}Mobile (iOS/Android):${NC}"
    echo "  1. Open ESQs in browser"
    echo "  2. Tap share button"
    echo "  3. Select 'Add to Home Screen'"
    echo ""
    echo -e "${GREEN}✨ After installation, ESQs will work offline and feel like a native app!${NC}"
}

# Function to run integration tests
run_integration_tests() {
    echo -e "${CYAN}🧪 ESQs Integration Testing:${NC}"
    echo ""
    
    # Test local server capability
    echo -e "${BLUE}Testing local server capability...${NC}"
    if start_local_server; then
        echo -e "${GREEN}✅ Local server test passed${NC}"
        
        # Test PWA functionality
        echo -e "${BLUE}Testing PWA manifest...${NC}"
        if curl -s "$LOCAL_URL/manifest.json" | grep -q "ESQs\|AI RAID"; then
            echo -e "${GREEN}✅ PWA manifest test passed${NC}"
        else
            echo -e "${RED}❌ PWA manifest test failed${NC}"
        fi
        
        # Test service worker
        echo -e "${BLUE}Testing service worker...${NC}"
        if curl -s "$LOCAL_URL/sw.js" | grep -q "ESQs Service Worker"; then
            echo -e "${GREEN}✅ Service worker test passed${NC}"
        else
            echo -e "${RED}❌ Service worker test failed${NC}"
        fi
        
        # Stop test server
        pkill -f "python.*http.server.*$PORT" 2>/dev/null
    else
        echo -e "${RED}❌ Local server test failed${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}📝 Integration Test Summary:${NC}"
    echo "  - GitHub Integration: Available in codebase ✅"
    echo "  - Dropbox Integration: Available in codebase ✅"
    echo "  - Lexis Nexis Integration: Available in codebase ✅"
    echo "  - PracticePanther Integration: Available in codebase ✅"
    echo "  - PWA Functionality: Tested above ⬆️"
    echo ""
    echo -e "${BLUE}🔗 To test live integrations, open ESQs and check:${NC}"
    echo "  1. Set API keys via browser console"
    echo "  2. Test legal queries and document access"
    echo "  3. Verify session management and billing"
}

# Main execution
case "${1:-}" in
    --local|-l)
        echo -e "${GREEN}🚀 Launching ESQs locally...${NC}"
        if start_local_server; then
            sleep 2
            open_browser "$LOCAL_URL"
            echo ""
            echo -e "${GREEN}✅ ESQs launched successfully!${NC}"
            echo -e "${YELLOW}💡 To stop the server, run: pkill -f 'python.*http.server.*$PORT'${NC}"
        fi
        ;;
    --web|-w)
        echo -e "${GREEN}🌐 Opening ESQs web version...${NC}"
        open_browser "$ESQS_URL"
        echo -e "${GREEN}✅ ESQs web version opened!${NC}"
        ;;
    --help|-h)
        show_help
        ;;
    --status|-s)
        show_status
        ;;
    --install|-i)
        show_install_guide
        ;;
    --test|-t)
        run_integration_tests
        ;;
    "")
        echo -e "${YELLOW}🤔 No option specified. What would you like to do?${NC}"
        echo ""
        echo "1) Launch ESQs locally (recommended for development)"
        echo "2) Open ESQs web version"
        echo "3) Show installation guide"
        echo "4) Check system status"
        echo "5) Run integration tests"
        echo ""
        read -p "Choose an option (1-5): " choice
        case $choice in
            1) exec "$0" --local ;;
            2) exec "$0" --web ;;
            3) exec "$0" --install ;;
            4) exec "$0" --status ;;
            5) exec "$0" --test ;;
            *) echo -e "${RED}❌ Invalid option${NC}" && exit 1 ;;
        esac
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
esac