# ESQs - Enhanced Synthesized Quintessential System
## Setup and Access Guide

### Overview
ESQs is a Progressive Web Application (PWA) designed for legal professionals. It provides AI-powered legal intelligence, document management, and case analysis capabilities.

### ⚠️ Important: This is a Web Application
**ESQs is NOT a command-line tool.** If you're seeing git repository errors, you're likely trying to access ESQs incorrectly.

### How to Access ESQs

#### Option 1: Web Browser Access (Recommended)
1. Open your web browser
2. Navigate to the hosted ESQs URL or serve locally
3. The system will load as a modern web application

#### Option 2: Local Development Setup
```bash
# Clone the repository (if you haven't already)
git clone https://github.com/BCLS-ESQs/boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs.git

# Navigate to the directory
cd boyack-christiansen-Enhanced-Synthizied-Quintessential-System-ESQs

# Start a local web server
python3 -m http.server 8000

# Or using Node.js
npx serve .

# Open browser to http://localhost:8000
```

#### Option 3: Install as PWA
1. Open ESQs in Chrome, Edge, or Safari
2. Look for "Install" prompt or "Add to Home Screen"
3. Install as a standalone app

### Features Available Through Web Interface

#### 🏛️ Legal Integrations
- **GitHub Integration**: Auto-save sessions and documents
- **Lexis Integration**: Legal research and case law
- **Dropbox Archive**: Document management and storage
- **PracticePanther**: Case management integration

#### 🤖 AI Capabilities
- Multi-AI routing system (Claude, GPT, Gemini)
- Token usage optimization
- Session management and billing
- Document analysis and synthesis

#### 📱 Progressive Web App Features
- Works offline
- Mobile responsive
- Desktop installation
- File handling integration

### Common Issues

#### "fatal: not a git repository" Error
This error occurs when trying to run git commands outside of a git repository. ESQs doesn't require git commands for normal operation.

**Solution**: Access ESQs through the web interface instead of command line.

#### Cannot Find ESQs Files
If you're looking for specific files or functionality:

1. **Client Data**: Managed through Dropbox integration
2. **Session Logs**: Auto-saved via GitHub integration  
3. **Research**: Accessed through Lexis integration
4. **Case Files**: Organized via PracticePanther integration

### Getting Started

1. **Open ESQs in your browser**
2. **Connect integrations** (GitHub, Dropbox, Lexis as needed)
3. **Start a client session** using the interface
4. **Use AI assistance** for legal research and analysis

### Need Help?

- Check the web interface for built-in help
- Review integration status in the sidebar
- Use the AI assistant for guidance
- Contact support through the application

---

**Remember**: ESQs is designed to be accessed through its web interface, not through command-line git operations.