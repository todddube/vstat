# VState - Vibe Code Status Monitor 🔥

**Your dev tools vibe check in real-time!**

VState monitors the status of your essential development tools - Claude AI and GitHub Copilot - so you always know when your coding superpowers are ready to roll.

![VState Extension](icons/vstate-48.png)

## ✨ Features

### 🔥 **Multi-Service Monitoring**
- **Claude AI**: Monitor claude.ai, API, and console status
- **GitHub Copilot**: Track GitHub services and Copilot availability
- **Real-time Updates**: Automatic checks every 5 minutes
- **Visual Status Indicators**: Color-coded icons show overall vibe

### 🎨 **Beautiful UI**
- **Gradient-powered design** with modern aesthetics
- **Emoji-enhanced** service indicators 🤖🐙⚡🔧
- **Smooth animations** and hover effects
- **Dark theme ready** with professional styling

### 📊 **Smart Status Tracking**
- **Combined Status Logic**: Shows worst-case scenario across all services
- **Service-specific Icons**: Individual status for each tool
- **Incident History**: View recent and active incidents
- **Background Monitoring**: Keep running even when browser is closed

### 🎯 **Developer-Focused**
- **Quick Access**: One click to see all your tools' status
- **Keyboard Shortcuts**: 
  - `Ctrl+R` / `Cmd+R` - Refresh status
  - `Ctrl+I` / `Cmd+I` - Open About modal
  - `1` / `2` - Switch between Active/Recent incidents
- **Auto-refresh**: Stay updated without manual intervention

## 🚀 Installation

### Chrome Web Store
*Coming soon - building for release!*

### Manual Installation (Developer)
1. Download or clone this repository
2. Run `node build-vstate.js` to build the extension
3. Open Chrome/Edge and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `build` folder

## 🔧 Development

### Build the Extension
```bash
# Build for production
node build-vstate.js

# The build creates:
# - /build/ - Unpacked extension for development
# - /dist/ - Zip file ready for Chrome Web Store
```

### Generate Custom Icons
```bash
# Open the icon generator
open generate-vstate-icons.html
# Click "Generate All Icons" and download your custom V icons
```

### File Structure
```
vstate/
├── manifest.json          # Extension manifest
├── background.js          # Service worker for monitoring
├── popup.html            # Main popup interface  
├── popup.js              # Popup logic and UI
├── icons/                # Status icons (V-themed)
├── build-vstate.js       # Build script
└── generate-vstate-icons.html  # Icon generator
```

## 🎨 Status Colors

- 🟢 **Green**: All systems operational - your dev tools are vibing!
- 🟡 **Yellow**: Minor issues detected - some hiccups in the matrix
- 🔴 **Red**: Major issues - time for a coffee break ☕
- ⚫ **Gray**: Unknown status - checking the vibe...

## 🔗 Monitored Services

### Claude AI (Anthropic)
- **claude.ai** - Main web interface
- **Claude API** - REST API endpoints  
- **Console** - Developer console access
- **Source**: https://status.anthropic.com/

### GitHub (Microsoft)
- **GitHub Copilot** - AI pair programming
- **GitHub API** - REST/GraphQL APIs
- **Actions & Workflows** - CI/CD pipelines
- **Source**: https://www.githubstatus.com/

## 🎭 The Vibe Philosophy

VState isn't just a status monitor - it's your coding companion that keeps tabs on the tools that make you superhuman. When Claude is down, we know. When GitHub Copilot hiccups, we're on it. 

**Because your vibe is only as good as your tools' vibe.** 🔥

## 🤝 Contributing

Got ideas to make VState even more fire? 

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-idea`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-idea`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Todd Dube**
- GitHub: [@todddube](https://github.com/todddube)
- Created with ❤️ for the developer community

---

*Keep your dev tools vibe in check with VState! 🔥*
