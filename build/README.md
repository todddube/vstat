# Vibe Stats - AI Dev Tools Status Monitor

A Chrome/Edge browser extension that monitors the real-time status of AI developer tools (Claude AI and GitHub Copilot) with cool AI-themed vibe indicators and comprehensive incident reporting through an intuitive popup interface.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-green) ![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![AI Powered](https://img.shields.io/badge/AI-Powered-00d4ff?style=flat&logo=openai&logoColor=white)

📄 **[Privacy Policy](https://todddube.github.io/vstat/)** - Learn about our data collection and privacy practices

## ✨ Features

- **🔄 Real-time Status Monitoring**: Automatic status checks every 5 minutes for Claude AI and GitHub Copilot
- **🤖 Cool AI-Themed Vibe Icons**: Modern gradient design with cyan/orange color scheme (no purple!)
  - 🟢 **Green**: All dev tools are vibing! 🔥
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
   git clone https://github.com/todddube/vstat.git
   cd vstat
   # Open chrome://extensions/ → Enable Developer Mode → Load Unpacked → Select this folder
   ```

### For Developers

```bash
# Clone the repository
git clone https://github.com/todddube/vstat.git
cd vstat

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
   - Select the `vstat` directory (or `build/` for production build)
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
- **Network**: Internet connection to access status APIs (status.anthropic.com, www.githubstatus.com)
- **Permissions**: Storage and Alarms (automatically granted)

## 🎯 Usage Guide

### 🚥 Status Icon Meanings

| Icon | Status | Badge | Description |
|------|--------|-------|-------------|
| ⚡ Green | Operational | None | All dev tools are vibing! 🔥 |
| ⚡ Yellow | Minor Issues | Number (1-4+) | Some services affected, shows count |
| ⚡ Red | Major/Critical | ! or Number | Significant service disruption |
| ⚡ Gray | Unknown | None | Cannot determine status (network/API error) |

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
vstat/
├── 📄 manifest.json              # Extension configuration (Manifest V3)
├── ⚙️ background.js              # Service worker (dual-service monitoring)
├── 🎨 popup.html                 # Popup interface HTML
├── 📱 popup.js                   # Popup interface logic
├── 🤖 icons/                     # Cool AI-themed vibe icons (16px to 128px)
│   ├── ai-vibe-16.png            # Toolbar icon (small)
│   ├── ai-vibe-32.png            # Standard icon
│   ├── ai-vibe-48.png            # Large icon
│   └── ai-vibe-128.png           # Extension page icon
├── 🛠️ dev/                       # Development tools and assets
│   ├── scripts/                  # Utility scripts (version sync, etc.)
│   └── README.md                 # Development tools documentation
├── 🎨 design/                    # Design assets and tools
│   └── cool-vibe-icons.html     # Icon generator tool
├── 🧪 tests/                     # Comprehensive test suite
│   ├── unit/                     # Unit tests for components
│   ├── integration/              # Integration tests
│   ├── visual-test-viewer.html   # Interactive visual testing
│   ├── VISUAL_TESTING.md         # Visual testing guide
│   └── README.md                 # Testing documentation
├── 🔧 build-extension.js         # Production build script
├── 📖 BUILD.md                   # Build system documentation
└── 📚 README.md                  # This documentation
```

### 🔧 Core Components

#### Service Worker (`background.js`)
- **VStateMonitor Class**: Handles dual-service monitoring (Claude + GitHub Copilot)
- **API Integration**: Fetches from both Anthropic and GitHub status endpoints
- **Smart Retry Logic**: Exponential backoff for failed requests
- **AI Vibe Icon Management**: Updates browser AI-themed vibe icons and badges
- **Efficient Storage**: Uses Chrome storage API for data persistence

#### Popup Interface (`popup.js` + `popup.html`)
- **VStatePopupController Class**: Manages dual-service interactive interface
- **Real-time Updates**: Auto-refresh with visual feedback for both services
- **Accessibility**: Full keyboard navigation and screen reader support
- **Error Handling**: Graceful degradation and user feedback

#### AI-Themed Vibe Icon System
- **Four Status States**: Green, Yellow, Red, Gray AI-themed vibe icons
- **High-Resolution Optimized**: Clear, modern design for contemporary displays
- **Multiple Sizes**: 16px, 32px, 48px, 128px for different contexts
- **AI Theme**: Modern gradient design reflecting AI/dev tools aesthetic
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
- **📦 `./dist/vibe-stats-v1.1.0-YYYY-MM-DD.zip`**: Production zip for Chrome Web Store
- **📊 Build Report**: Detailed statistics and next steps

### Chrome Web Store Submission
1. Run `npm run build` to create production zip
2. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Upload the zip file from `./dist/` directory
4. Complete store listing information and submit for review

**📖 [Complete Build Documentation](BUILD.md)**

## 🚀 Release Management

### Automated Release Workflow

The project includes a GitHub Action for automated releases that handles version bumping, building, tagging, and creating GitHub releases.

#### Quick Release Commands

```bash
# Check version sync status
npm run version:check

# Sync versions (manifest.json is source of truth)
npm run version:sync

# Prepare for release (build and validate)
npm run prepare-release

# Ready for GitHub Action release
npm run release:patch    # For patch releases (1.0.0 → 1.0.1)
npm run release:minor    # For minor releases (1.0.0 → 1.1.0)
npm run release:major    # For major releases (1.0.0 → 2.0.0)
```

#### GitHub Action Release Process

The automated release workflow is triggered manually from the GitHub Actions tab:

1. **Go to GitHub Actions**: Navigate to the Actions tab in your repository
2. **Select Release Workflow**: Choose "Release Build and Deploy"
3. **Run Workflow**: Click "Run workflow" and specify:
   - **Version Type**: patch, minor, or major
   - **Release Notes**: Optional custom notes for the release

#### What the GitHub Action Does

The automated workflow performs these steps:

1. **📋 Version Management**:
   - Reads current version from `manifest.json`
   - Bumps version according to semver (patch/minor/major)
   - Updates both `manifest.json` and `package.json`

2. **🔍 Validation & Build**:
   - Validates all extension files
   - Runs the build process with `npm run build:clean`
   - Creates production-ready zip file

3. **📝 Git Operations**:
   - Commits version changes to repository
   - Creates and pushes git tag (e.g., `v1.2.3`)
   - Pushes changes to main branch

4. **🚀 GitHub Release**:
   - Creates GitHub release with changelog
   - Attaches extension zip file and manifest
   - Generates Chrome Web Store submission notes

5. **📦 Chrome Web Store Prep**:
   - Provides submission checklist
   - Includes store description template
   - Ready-to-upload zip file

#### Manual Version Management

For more granular control, use the version sync utilities:

```bash
# Set specific version
npm run version:set 1.2.3

# Bump version types
npm run version:bump patch   # 1.0.0 → 1.0.1
npm run version:bump minor   # 1.0.0 → 1.1.0
npm run version:bump major   # 1.0.0 → 2.0.0

# Check if manifest.json and package.json are in sync
npm run version:check

# Sync package.json to manifest.json version
npm run version:sync

# Check About popup version consistency
npm run about:check
```

#### Release Workflow Best Practices

1. **Pre-Release Checklist**:
   - ✅ All tests pass: `npm test`
   - ✅ Visual tests validate: `npm run test:visual`
   - ✅ Build succeeds: `npm run prepare-release`
   - ✅ Extension loads and works in Chrome

2. **Release Types**:
   - **Patch**: Bug fixes, small improvements
   - **Minor**: New features, significant enhancements
   - **Major**: Breaking changes, major redesigns

3. **Post-Release**:
   - ✅ Download zip from GitHub release
   - ✅ Submit to Chrome Web Store Developer Dashboard
   - ✅ Test released version in clean browser profile

#### Release Files Structure

After a GitHub Action release, you'll find:

```
📦 GitHub Release Assets:
├── 📁 vibe-stats-v1.2.3.zip      # Ready for Chrome Web Store
├── 📄 manifest.json              # Updated manifest file
└── 📝 Release Notes               # Automated changelog

🌐 Chrome Web Store Submission:
├── 📋 Submission checklist
├── 📝 Store description template
└── 🔗 Developer dashboard link
```

**📖 [Complete Build Documentation](BUILD.md)**
**🚀 [Detailed Release Guide](RELEASE.md)**

## 🔗 API Integration

### Dual-Service API Integration

**Anthropic Status APIs (Claude AI)**:
- Status: `https://status.anthropic.com/api/v2/status.json`
- Incidents: `https://status.anthropic.com/api/v2/incidents.json`
- Summary: `https://status.anthropic.com/api/v2/summary.json`

**GitHub Status APIs (GitHub Copilot)**:
- Status: `https://www.githubstatus.com/api/v2/status.json`
- Incidents: `https://www.githubstatus.com/api/v2/incidents.json`
- Summary: `https://www.githubstatus.com/api/v2/summary.json`

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
   git clone https://github.com/todddube/vstat.git
   cd vstat
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

The extension uses custom AI-themed vibe icons optimized for high-resolution displays. Icon development tools are located in the `dev/icon-generator/` folder:

#### AI Vibe Icon Generator
```bash
# Open the HTML icon generator in your browser
start dev/icon-generator/create-ai-vibe-icons.html
# Or double-click the file to open in default browser
```

**See `dev/README.md` for detailed usage instructions.**

#### Icon Features
- **AI-Themed Design**: Modern aesthetic reflecting AI and dev tools monitoring
- **Contemporary Gradient**: AI-themed colors for clear visibility
- **High-Resolution Optimized**: Clean design optimized for modern displays
- **Enhanced Contrast**: Clear definition and modern styling
- **Four Sizes**: 16px (toolbar), 32px (standard), 48px (large), 128px (extension page)

#### Icon Development Workflow
1. Open `dev/icon-generator/create-ai-vibe-icons.html` in browser
2. Icons are auto-generated with download links
3. Download all four sizes (ai-vibe-16.png through ai-vibe-128.png)  
4. Replace existing files in `icons/` folder
5. Reload extension in Chrome to see changes

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
- **🚀 [RELEASE.md](RELEASE.md)** - Comprehensive release workflow and automated deployment guide
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
- [🚀 Release Guide](RELEASE.md)
- [🧪 Testing Guide](tests/README.md)
- [🎨 Visual Testing](tests/VISUAL_TESTING.md)
- [🌐 Interactive Test Viewer](tests/visual-test-viewer.html)

**Made with ❤️ for the Claude community**
