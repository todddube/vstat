# Claude Status Monitor

A Chrome/Edge browser extension that monitors Anthropic's Claude service status in real-time, displaying service health through a browser toolbar icon and detailed incident information in a popup interface.

![Claude Status Monitor](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-green) ![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

## ✨ Features

- **🔄 Real-time Status Monitoring**: Automatic status checks every 5 minutes using Chrome Alarms API
- **🎨 Visual Status Indicators**: Custom-designed toolbar icons with sophisticated color coding
  - 🟢 **Green**: All systems operational
  - 🟡 **Yellow**: Minor issues with affected service count badge
  - 🔴 **Red**: Major/critical issues with alert badge (!)
  - ⚪ **Gray**: Status unknown or network error
- **📊 Enhanced Incident Reporting**: Date-enhanced incident titles with chronological sorting
- **📱 Two-Tab Interface**: Active issues and last 5 incidents with comprehensive details
- **⌨️ Keyboard Navigation**: Accessible shortcuts (Ctrl+R refresh, 1/2 for tabs)
- **🔄 Auto-refresh**: Updates every 30 seconds when popup is open
- **🧪 Comprehensive Testing**: Full test suite with visual validation tools
- **📦 Production Build System**: Automated zip creation for Chrome Web Store submission

## 🚀 Quick Start

### For End Users

1. **Install from Chrome Web Store** *(coming soon)*
2. **Or load unpacked for development**:
   ```bash
   git clone https://github.com/todddube/clstat.git
   cd clstat
   # Open chrome://extensions/ → Enable Developer Mode → Load Unpacked → Select this folder
   ```

### For Developers

```bash
# Clone the repository
git clone https://github.com/todddube/clstat.git
cd clstat

# Install test dependencies
cd tests && npm install && cd ..

# Run tests
npm test

# Build for production
npm run build

# Run visual tests
npm run test:visual
```

## 📋 Installation Instructions

### Method 1: Chrome Web Store *(Recommended)*
*Coming soon - Extension will be available on Chrome Web Store*

### Method 2: Load Unpacked (Development/Testing)

1. **Download the Extension**:
   ```bash
   git clone https://github.com/todddube/clstat.git
   # OR download ZIP from GitHub and extract
   ```

2. **Install in Chrome/Edge**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top-right corner)
   - Click **"Load unpacked"**
   - Select the `clstat` directory (or `build/` for production build)
   - The Claude status icon should appear in your browser toolbar

3. **Pin the Extension**:
   - Click the puzzle piece icon in the toolbar
   - Pin the Claude Status Monitor for easy access

### Method 3: Production Build
```bash
# Build production-ready extension
npm run build

# Load the ./build directory in Chrome
# This gives you the exact same files that would be on the Chrome Web Store
```

### System Requirements
- **Browser**: Chrome 88+ or Edge 88+ (Chromium-based)
- **Network**: Internet connection to access `status.anthropic.com`
- **Permissions**: Storage and Alarms (automatically granted)

## 🎯 Usage Guide

### 🚥 Status Icon Meanings

| Icon | Status | Badge | Description |
|------|--------|-------|-------------|
| 🟢 Green | Operational | None | All Claude services running normally |
| 🟡 Yellow | Minor Issues | Number (1-4+) | Some services affected, shows count |
| 🔴 Red | Major/Critical | ! or Number | Significant service disruption |
| ⚪ Gray | Unknown | None | Cannot determine status (network/API error) |

### 📱 Popup Interface

Click the extension icon to open a detailed status popup with two main sections:

#### 🚨 Active Issues Tab
- **Current Incidents**: Shows up to 5 unresolved incidents
- **Date-Enhanced Titles**: Incident names with formatted timestamps
- **Impact Color Coding**: 
  - 🟡 Yellow border: Minor impact
  - 🔴 Red border: Major/Critical impact
- **Latest Updates**: Most recent incident update information
- **Real-time Status**: Updates automatically every 30 seconds

#### 📚 Last 5 Incidents Tab
- **Recent History**: Shows 5 most recent incidents regardless of status
- **Full Details**: Complete incident information including:
  - Duration for resolved incidents
  - Comprehensive summaries
  - Resolution status and timing
- **Chronological Order**: Newest incidents first
- **Status Indicators**: Clear resolved/ongoing status

### ⌨️ Keyboard Shortcuts

- **Ctrl+R** (or Cmd+R): Force refresh status data
- **1**: Switch to Active Issues tab
- **2**: Switch to Last 5 Incidents tab
- **Tab/Shift+Tab**: Navigate between interface elements

## 🏗️ Architecture & Development

### 📁 Project Structure
```
clstat/
├── 📄 manifest.json              # Extension configuration (Manifest V3)
├── ⚙️ background.js              # Service worker (status monitoring)
├── 🎨 popup.html                 # Popup interface HTML
├── 📱 popup.js                   # Popup interface logic
├── 🖼️ icons/                     # Status icons (16px to 128px, all states)
├── 🧪 tests/                     # Comprehensive test suite
│   ├── unit/                     # Unit tests for components
│   ├── integration/              # Integration tests
│   ├── visual-test-viewer.html   # Interactive visual testing
│   ├── VISUAL_TESTING.md         # Visual testing guide
│   └── README.md                 # Testing documentation
├── 🔧 build-extension.js         # Production build script
├── 📖 BUILD.md                   # Build system documentation
├── 🎯 create_icons.js            # Icon generation utilities
├── 🎨 create_colored_icons.js    # Status-specific icon creation
└── 📚 README.md                  # This documentation
```

### 🔧 Core Components

#### Service Worker (`background.js`)
- **StatusMonitor Class**: Handles all background monitoring
- **API Integration**: Fetches from Anthropic's status endpoints
- **Smart Retry Logic**: Exponential backoff for failed requests
- **Icon Management**: Updates browser icon and badge based on status
- **Efficient Storage**: Uses Chrome storage API for data persistence

#### Popup Interface (`popup.js` + `popup.html`)
- **PopupController Class**: Manages interactive interface
- **Real-time Updates**: Auto-refresh with visual feedback
- **Accessibility**: Full keyboard navigation and screen reader support
- **Error Handling**: Graceful degradation and user feedback

#### Icon System
- **Four Status States**: Green, Yellow, Red, Gray
- **Multiple Sizes**: 16px, 32px, 48px, 128px for different contexts
- **Custom Design**: Anthropic-inspired aesthetic with monitoring elements
- **Badge Integration**: Dynamic count badges and alert indicators

## 🧪 Testing

### Comprehensive Test Suite

The extension includes a full testing framework with both automated and visual testing capabilities:

```bash
# Run all tests
npm test

# Run visual tests with browser interface
npm run test:visual

# Open interactive visual testing tool
npm run visual:viewer

# Validate visual assets
npm run visual:validate
```

### Test Coverage
- ✅ **Unit Tests**: Core functionality and component behavior
- ✅ **Integration Tests**: API communication and data flow
- ✅ **Visual Tests**: Icon states, badge indicators, and UI components
- ✅ **Accessibility Tests**: Keyboard navigation and screen reader support
- ✅ **Error Scenario Tests**: Network failures, API errors, edge cases

### Visual Testing Tools
- **Interactive Test Viewer**: Browser-based interface for testing all visual states
- **Automated Visual Validation**: Programmatic testing of icon colors and badge states
- **Asset Validation**: Ensures all required icons exist and are properly named
- **Real-time Visual Feedback**: See changes as they happen during testing

**📖 [Complete Testing Documentation](tests/README.md)**

## 📦 Building for Production

### Quick Build Commands

```bash
# Validate all files before building
npm run validate

# Build production-ready zip file
npm run build

# Build and clean up temporary files  
npm run build:clean

# Complete release preparation (validate + build)
npm run prepare-release
```

### Build Output
- **📁 `./build/`**: Temporary directory with processed extension files
- **📦 `./dist/claude-status-monitor-v1.0.0-YYYY-MM-DD.zip`**: Production zip for Chrome Web Store
- **📊 Build Report**: Detailed statistics and next steps

### Chrome Web Store Submission
1. Run `npm run build` to create production zip
2. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Upload the zip file from `./dist/` directory
4. Complete store listing information and submit for review

**📖 [Complete Build Documentation](BUILD.md)**

## 🔗 API Integration

### Anthropic Status Page APIs
- **Status Endpoint**: `https://status.anthropic.com/api/v2/status.json`
  - Overall system status (operational, minor, major, critical)
- **Incidents Endpoint**: `https://status.anthropic.com/api/v2/incidents.json`
  - Current and historical incident data
- **Summary Endpoint**: `https://status.anthropic.com/api/v2/summary.json`
  - Component-level status information

### Status Mapping Logic
| API Response | Extension Status | Icon Color | Badge |
|--------------|------------------|------------|--------|
| `none`, `operational` | Operational | 🟢 Green | None |
| `minor` | Minor Issues | 🟡 Yellow | Service count |
| `major`, `critical` | Major Issues | 🔴 Red | ! or count |
| Network/Parse Error | Unknown | ⚪ Gray | None |

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: 14.0.0+ (for testing and build tools)
- **Chrome/Edge**: Latest version for testing
- **Git**: For version control

### Development Workflow

1. **Clone and Setup**:
   ```bash
   git clone https://github.com/todddube/clstat.git
   cd clstat
   cd tests && npm install && cd ..
   ```

2. **Load in Browser**:
   - Open `chrome://extensions/`
   - Enable Developer Mode
   - Load Unpacked → Select project directory

3. **Development Cycle**:
   ```bash
   # Make changes to code
   
   # Test changes
   npm test
   
   # Test visual components
   npm run test:visual
   
   # Build for testing
   npm run build
   
   # Reload extension in Chrome
   ```

4. **Debugging**:
   - **Background Script**: `chrome://extensions/` → "Inspect views: service worker"
   - **Popup Interface**: Right-click extension icon → "Inspect popup"
   - **Console Logs**: Check both background and popup consoles

### Icon Development

Generate custom status icons:
```bash
# Generate base icons with sophisticated design
node create_icons.js

# Generate status-specific colored versions
node create_colored_icons.js
```

Icons feature:
- **Abstract "A" Shape**: Anthropic/API monitoring aesthetic
- **Status Indicator Dot**: Visual monitoring element
- **Connection Lines**: Network visualization
- **Modern Color Palette**: Professional status colors

## 🔧 Configuration

### Extension Settings
The extension uses sensible defaults that work for most users:

- **Check Interval**: 5 minutes (background monitoring)
- **Popup Auto-refresh**: 30 seconds (when open)
- **Retry Logic**: 3 attempts with exponential backoff
- **Cache Duration**: 5 minutes for API responses

### Customization
Advanced users can modify settings by editing:
- **Check Frequency**: `background.js` → `intervalMinutes`
- **API Endpoints**: `background.js` → URL constants
- **UI Behavior**: `popup.js` → refresh intervals and timeouts

## 🐛 Troubleshooting

### Common Issues

#### 🔴 Extension Not Loading
**Symptoms**: Extension doesn't appear in toolbar
**Solutions**:
- ✅ Verify `manifest.json` syntax with `npm run validate`
- ✅ Check all required files exist
- ✅ Enable Developer Mode in `chrome://extensions/`
- ✅ Look for error messages in Extensions page

#### 🟡 Status Not Updating
**Symptoms**: Icon stays gray or doesn't change
**Solutions**:
- ✅ Check internet connection to `status.anthropic.com`
- ✅ Inspect service worker console for API errors
- ✅ Try manual refresh with Ctrl+R in popup
- ✅ Check Chrome's network requests in DevTools

#### 🔴 Popup Not Opening
**Symptoms**: Clicking icon does nothing or shows errors
**Solutions**:
- ✅ Right-click icon → "Inspect popup" to see errors
- ✅ Check popup console for JavaScript errors
- ✅ Reload extension from Extensions page
- ✅ Verify popup files exist and are valid

#### 🔄 Performance Issues
**Symptoms**: Browser slowdown or high memory usage
**Solutions**:
- ✅ Check service worker console for excessive API calls
- ✅ Clear extension storage data
- ✅ Restart browser to reset extension state
- ✅ Update to latest version

### Debug Tools
- **Service Worker Console**: `chrome://extensions/` → "service worker"
- **Popup Inspector**: Right-click icon → "Inspect popup"  
- **Extension Storage**: DevTools → Application → Storage → Extension
- **Network Monitor**: DevTools → Network tab for API calls

### Getting Help
- 📖 Check [BUILD.md](BUILD.md) for build-related issues
- 🧪 Review [tests/README.md](tests/README.md) for testing problems
- 🎨 See [tests/VISUAL_TESTING.md](tests/VISUAL_TESTING.md) for visual testing
- 🐛 Open an issue on GitHub for persistent problems

## 📚 Documentation Index

- **📖 [BUILD.md](BUILD.md)** - Complete build system documentation and Chrome Web Store submission guide
- **🧪 [tests/README.md](tests/README.md)** - Comprehensive testing guide with automated and visual testing
- **🎨 [tests/VISUAL_TESTING.md](tests/VISUAL_TESTING.md)** - Visual testing tools and interactive test viewer
- **📱 [tests/visual-test-viewer.html](tests/visual-test-viewer.html)** - Interactive browser-based testing interface

## 🤝 Contributing

### Development Contributions
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Test** your changes: `npm test && npm run test:visual`
4. **Build** and validate: `npm run prepare-release`
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to your fork: `git push origin feature/amazing-feature`
7. **Create** a Pull Request with detailed description

### Code Standards
- ✅ **ES6+ JavaScript** with modern async/await patterns
- ✅ **Comprehensive Testing** - Both unit and visual tests required
- ✅ **Manifest V3** compliance for Chrome extensions
- ✅ **Accessibility** support with ARIA labels and keyboard navigation
- ✅ **Error Handling** with graceful degradation
- ✅ **Documentation** updates for new features

### Testing Requirements
- ✅ All existing tests must pass: `npm test`
- ✅ Visual tests must validate: `npm run test:visual`
- ✅ Build process must succeed: `npm run build`
- ✅ Manual testing in Chrome required for UI changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Acknowledgments

- **Anthropic** for providing the status page API
- **Chrome Extensions API** for the robust platform
- **Community Contributors** for testing and feedback
- **Open Source Libraries** used in testing framework

---

**🔗 Quick Links**
- [📦 Build Documentation](BUILD.md)
- [🧪 Testing Guide](tests/README.md) 
- [🎨 Visual Testing](tests/VISUAL_TESTING.md)
- [🌐 Interactive Test Viewer](tests/visual-test-viewer.html)

**Made with ❤️ for the Claude community**