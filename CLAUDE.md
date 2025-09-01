# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vibe Stats** is a Chrome/Edge browser extension that monitors the status of developer tools (Claude AI and GitHub Copilot) in real-time. The extension displays service health through animated lightning bolt indicators and provides detailed incident information through a popup interface.

This project has been rebranded from "Claude Status Monitor" to "Vibe Stats - Dev Tools Status Monitor" to encompass both Claude and GitHub Copilot monitoring.

## Commands

### Development Commands
```bash
# Build production-ready extension zip
npm run build

# Build and clean up temporary files  
npm run build:clean

# Validate all files before building
npm run validate

# Complete release preparation (validate + build)
npm run prepare-release
```

### Testing Commands
```bash
# Run all tests (if tests directory exists)
npm test

# Visual testing commands (if available)
npm run test:visual
npm run visual:viewer
npm run visual:validate
```

## Architecture

### Core Components

**Service Worker (`background.js`)**
- `VStateMonitor` class handles all background monitoring
- Monitors both Claude (`status.anthropic.com`) and GitHub (`www.githubstatus.com`) APIs
- Uses Chrome Alarms API for reliable 5-minute periodic checks
- Manages extension icons, badges, and status indicators
- Implements smart retry logic with exponential backoff

**Popup Interface (`popup.js` + `popup.html`)**
- `VStatePopupController` class manages the interactive interface
- Dual-service status display with expandable service details
- Real-time updates with 30-second auto-refresh when popup is open
- Keyboard navigation and accessibility support

**Icon System**
- Lightning bolt themed icons in 4 sizes: 16px, 32px, 48px, 128px
- Single icon set with color changes via CSS filters or badge indicators
- Badge text shows affected service counts or alert indicators

### Status Monitoring Logic

**Combined Status Priority**: critical > major > minor > operational > unknown

**Status Mapping**:
- `operational/none` → Green icon, "All dev tools are vibing! 🔥"
- `minor` → Yellow icon with affected service count badge
- `major/critical` → Red icon with "!" or service count badge
- Network/API errors → Gray icon, "Status Unknown"

### Data Flow

1. **Background Service**: Fetches status from both APIs every 5 minutes
2. **Data Processing**: Combines statuses using priority hierarchy
3. **Storage**: Uses Chrome storage API for persistence
4. **UI Updates**: Updates extension icon, badge, and popup content
5. **Error Handling**: Graceful degradation with retry logic

### API Integration

**Anthropic Status APIs**:
- Status: `https://status.anthropic.com/api/v2/status.json`
- Incidents: `https://status.anthropic.com/api/v2/incidents.json`
- Summary: `https://status.anthropic.com/api/v2/summary.json`

**GitHub Status APIs**:
- Status: `https://www.githubstatus.com/api/v2/status.json`
- Incidents: `https://www.githubstatus.com/api/v2/incidents.json`
- Summary: `https://www.githubstatus.com/api/v2/summary.json`

## Development Workflow

### Loading Extension for Development
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select project directory
4. Icon appears in browser toolbar

### Debugging
- **Background Script**: `chrome://extensions/` → "Inspect views: service worker"  
- **Popup Interface**: Right-click extension icon → "Inspect popup"
- **Storage Data**: DevTools → Application → Storage → Extension

### Build Process
The `build-extension.js` script:
1. Validates all required files exist
2. Copies extension files to `./build/` directory
3. Creates production zip in `./dist/` directory
4. Provides build statistics and next steps

### Required Files for Extension
**Core files**: `manifest.json`, `background.js`, `popup.js`, `popup.html`
**Icons**: `icons/lightning-16.png`, `icons/lightning-32.png`, `icons/lightning-48.png`, `icons/lightning-128.png`

## Code Conventions

- **Modern JavaScript**: ES6+ with async/await patterns
- **Manifest V3**: Chrome Extensions Manifest V3 compliance
- **Error Handling**: Try/catch blocks with graceful degradation
- **Accessibility**: ARIA labels and keyboard navigation support
- **Storage**: Chrome storage API for data persistence
- **Naming**: "VState" prefix for classes (`VStateMonitor`, `VStatePopupController`)

## Key Implementation Details

### Status Updates
- Background service runs checks every 5 minutes via Chrome Alarms
- Popup auto-refreshes every 30 seconds when open
- Manual refresh available via Ctrl+R or refresh button

### Icon Animation
- Badge flashing (not icon blinking) for non-operational statuses
- Animation clears automatically when status returns to operational

### Incident Processing
- Recent incidents filtered by unresolved status
- Historical incidents show last 5 regardless of status
- Incident titles enhanced with formatted timestamps
- Duration calculation for resolved incidents

### Storage Schema
Key storage items: `vstateStatus`, `claudeStatus`, `githubStatus`, `claudeIncidents`, `githubIncidents`, `lastUpdated`, `lastError`

## Troubleshooting

### Common Issues
- **Extension not loading**: Check `manifest.json` syntax with `npm run validate`
- **Status not updating**: Inspect service worker console for API errors
- **Popup not opening**: Right-click icon → "Inspect popup" for JavaScript errors

The extension includes comprehensive error handling and will show "Status Unknown" with gray icons when API calls fail.