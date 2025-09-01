# Claude Status Monitor

A Chrome/Edge browser extension that monitors Anthropic's Claude service status in real-time, displaying service health through a browser toolbar icon and detailed incident information in a popup interface.

## Features

- **Real-time Status Monitoring**: Automatic status checks every 5 minutes
- **Refined Visual Indicators**: Custom-designed toolbar icon inspired by Anthropic's aesthetic
  - 🟢 **Green**: All systems operational
  - 🟡 **Yellow**: Minor issues with "?" badge
  - 🔴 **Red**: Major/critical issues with "!" badge  
  - ⚪ **Gray**: Status unknown or network error
- **Enhanced Incident Reporting**: Date-enhanced incident titles with chronological sorting
- **Two-Tab Interface**: Active issues and last 5 incidents with full details
- **Keyboard Navigation**: Accessible shortcuts (Ctrl+R refresh, 1/2 for tabs)
- **Auto-refresh**: Updates every 30 seconds when popup is open

## Installation

### Chrome/Edge (Developer Mode)
1. Download or clone this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The Claude status icon should appear in your browser toolbar

### Requirements
- Chrome 88+ or Edge 88+ (Chromium-based)
- Internet connection to access status.anthropic.com

## Usage

### Status Icon
- **🟢 Green**: All systems operational
- **🟡 Yellow + "?"**: Minor issues detected  
- **🔴 Red + "!"**: Major/critical issues
- **⚪ Gray**: Status unknown or network error

### Popup Interface
Click the extension icon to open the status popup with two tabs:

#### Active Issues Tab
- Shows current unresolved incidents (up to 5)
- Displays incident titles with date/time stamps
- Color-coded by impact level (minor = yellow border, major/critical = red border)
- Includes latest incident updates

#### Last 5 Incidents Tab  
- Shows most recent 5 incidents regardless of resolution status
- Full incident details with duration for resolved issues
- Chronological sorting (newest first)
- Enhanced summaries and status information

### Keyboard Shortcuts
- **Ctrl+R**: Refresh status data
- **1**: Switch to Active Issues tab
- **2**: Switch to Last 5 Incidents tab

## Architecture

### Manifest V3 Design
- **Service Worker**: Background monitoring using Chrome Alarms API
- **Popup Interface**: Interactive status display with accessibility features
- **Local Storage**: Secure data persistence using Chrome storage API

### Core Components

#### Background Service Worker (`background.js`)
- `StatusMonitor` class handles periodic status checks
- Fetches data from Anthropic's status page API endpoints
- Updates browser icon and badge based on service status
- Implements retry logic with exponential backoff

#### Popup Interface (`popup.js` + `popup.html`)
- `PopupController` class manages two-tab interface
- Real-time status updates with auto-refresh
- Enhanced incident display with formatted dates
- Keyboard navigation and accessibility features

#### API Endpoints
- `https://status.anthropic.com/api/v2/status.json` - Overall service status
- `https://status.anthropic.com/api/v2/incidents.json` - Incident data
- `https://status.anthropic.com/api/v2/summary.json` - Additional service info

## Development

### File Structure
```
clstat/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── popup.html            # Popup interface  
├── popup.js              # Popup logic
├── icons/                # Status icons (SVG/PNG)
├── create_icons.js       # Icon generation script
├── create_colored_icons.js # Colored icon generation
└── README.md            # This file
```

### Icon Generation
```bash
node create_colored_icons.js  # Generate refined status-colored icons
node create_icons.js          # Generate sophisticated base icons with gradients
```

The icons feature a custom design inspired by Anthropic's visual aesthetic:
- **Abstract "A" shape**: Geometric design suggesting both "Anthropic" and "API monitoring"
- **Status indicator dot**: Visual monitoring element in the top-right
- **Connection lines**: Subtle network/monitoring visualization elements  
- **Modern color palette**: Emerald green, amber yellow, clear red, neutral gray
- **Optimized for browser display**: Clean, scalable SVG and PNG formats

### Testing
1. Load extension in developer mode
2. Check background service worker console for status check logs
3. Test popup functionality and tab switching
4. Verify incident titles show proper date formatting
5. Test keyboard navigation shortcuts

### Status Mapping
| API Status | Icon Color | Badge | Description |
|-----------|-----------|--------|-------------|
| `none`, `operational` | Green | None | All systems operational |
| `minor` | Yellow | `?` | Minor issues detected |
| `major`, `critical` | Red | `!` | Major/critical issues |
| `unknown` | Gray | None | Status unknown/error |

## Troubleshooting

### Common Issues

**Extension not loading**
- Verify all files are present in directory
- Check manifest.json syntax
- Enable Developer mode in browser

**Status not updating**  
- Check internet connection to status.anthropic.com
- Look for errors in background service worker console
- Try manual refresh with Ctrl+R

**Popup not opening**
- Right-click extension icon → "Inspect popup"
- Check for JavaScript errors in developer console
- Reload extension if needed

### Debug Access
- **Background logs**: Go to `chrome://extensions/` → Click "Inspect views: background page"
- **Popup debug**: Right-click extension icon → "Inspect popup"
- **Storage inspection**: Developer console → Application tab → Storage → Local Storage

## Privacy & Security

- **No data collection**: Extension doesn't track or store personal information
- **Local storage only**: All data stored securely in browser's local storage
- **Minimal permissions**: Only requests access to status.anthropic.com
- **No external dependencies**: Self-contained with no CDN or third-party scripts

## Browser Compatibility

### Supported Browsers
- **Chrome 88+**: Full feature support
- **Edge 88+**: Full feature support (Chromium-based)

### Known Limitations
- Service workers have execution time limits in some browsers
- Network requests subject to browser CORS policies
- Icon updates may have slight delays during high system load

## Contributing

This extension is designed to be simple and focused. Key areas for potential enhancement:

- Additional notification methods (desktop notifications)
- Configurable refresh intervals
- Historical incident tracking
- Custom status page integrations

## License

This project is provided as-is for monitoring Claude service status. Modify and distribute according to your needs.