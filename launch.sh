#!/bin/bash

# ESQs Launcher Script
# Quick setup and launch script for the Enhanced Synthesized Quintessential System

echo "🏛️  ESQs - Enhanced Synthesized Quintessential System"
echo "================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ] || [ ! -f "manifest.json" ]; then
    echo "❌ Error: ESQs files not found in current directory"
    echo ""
    echo "Please run this script from the ESQs repository directory:"
    echo "  cd boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs"
    echo "  ./launch.sh"
    echo ""
    echo "If you're seeing git repository errors:"
    echo "  ESQs is a web application, not a command-line tool!"
    echo "  You need to access it through your browser."
    echo ""
    exit 1
fi

echo "✅ ESQs installation detected"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to find available port
find_port() {
    local port=8000
    while netstat -ln 2>/dev/null | grep -q ":$port "; do
        port=$((port + 1))
    done
    echo $port
}

# Function to open browser (cross-platform)
open_browser() {
    local url="$1"
    if command_exists xdg-open; then
        xdg-open "$url" 2>/dev/null &
    elif command_exists open; then
        open "$url" 2>/dev/null &
    elif command_exists start; then
        start "$url" 2>/dev/null &
    else
        echo "🌐 Please open your browser manually to: $url"
    fi
}

# Function to launch with Python
launch_python() {
    local port=$(find_port)
    local url="http://localhost:$port"
    echo "🚀 Starting ESQs web server on port $port..."
    echo "📱 Opening browser to: $url"
    echo ""
    echo "💡 ESQs will open automatically in your browser"
    echo "🔧 If you were having git errors before, you're now accessing ESQs correctly!"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Try to open browser after a short delay
    (sleep 2 && open_browser "$url") &
    
    if command_exists python3; then
        python3 -m http.server $port
    elif command_exists python; then
        python -m http.server $port
    else
        echo "❌ Python not found"
        return 1
    fi
}

# Function to launch with Node.js
launch_node() {
    local port=$(find_port)
    local url="http://localhost:$port"
    echo "🚀 Starting ESQs web server on port $port..."
    echo "📱 Opening browser to: $url"
    echo ""
    echo "💡 ESQs will open automatically in your browser"
    echo "🔧 If you were having git errors before, you're now accessing ESQs correctly!"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Try to open browser after a short delay
    (sleep 3 && open_browser "$url") &
    
    npx serve . -p $port
}

# Function to launch with PHP
launch_php() {
    local port=$(find_port)
    local url="http://localhost:$port"
    echo "🚀 Starting ESQs web server on port $port..."
    echo "📱 Opening browser to: $url"
    echo ""
    echo "💡 ESQs will open automatically in your browser"
    echo "🔧 If you were having git errors before, you're now accessing ESQs correctly!"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Try to open browser after a short delay
    (sleep 2 && open_browser "$url") &
    
    php -S localhost:$port
}

# Main launcher logic
echo "🔍 Detecting available web server options..."
echo ""

if command_exists npx; then
    echo "Found: Node.js (npx)"
    launch_node
elif command_exists python3 || command_exists python; then
    echo "Found: Python"
    launch_python
elif command_exists php; then
    echo "Found: PHP"
    launch_php
else
    echo "❌ No suitable web server found"
    echo ""
    echo "Please install one of the following:"
    echo "  • Node.js (recommended): https://nodejs.org/"
    echo "  • Python 3: https://python.org/"
    echo "  • PHP: https://php.net/"
    echo ""
    echo "Then run this script again."
    echo ""
    echo "Alternative: Open index.html directly in your browser"
    echo "(Note: Some features may not work without a web server)"
    echo ""
    echo "💡 Remember: ESQs is a web application!"
    echo "   Don't try to access it with git commands."
    exit 1
fi