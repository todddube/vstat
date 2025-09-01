# Vibe Stats Extension Testing Suite ⚡

Comprehensive testing framework for the Vibe Stats browser extension, including API endpoint testing, visual component validation, and interactive test viewer.

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Run specific test types
npm run test:api      # Test API endpoints only
npm run test:visual   # Test icons and badges only
npm run test:viewer   # Open interactive test viewer
```

## 📋 Test Categories

### 📡 API Endpoint Testing
- **Claude APIs**: Tests all Anthropic status API endpoints
- **GitHub APIs**: Tests all GitHub status API endpoints  
- **Response Validation**: Checks JSON structure and data integrity
- **Performance Monitoring**: Measures response times and data sizes
- **Combined Logic**: Tests status priority and combination logic

### 🎨 Visual Component Testing
- **Icon File Validation**: Checks all required lightning bolt icons exist
- **Badge Color Testing**: Validates badge colors for all status states
- **Status Combinations**: Tests all status + badge text combinations
- **Color Consistency**: Ensures consistent color scheme across components

### 🌐 Interactive Test Viewer
- **Web-based Interface**: Rich HTML interface for comprehensive testing
- **Real-time API Testing**: Live tests against actual API endpoints
- **Visual Component Demo**: Interactive preview of all status states
- **Detailed Reporting**: Comprehensive test results and statistics

## 🗂️ Directory Structure

```
tests/
├── api-tester.js          # API endpoint testing module
├── visual-tester.js       # Visual component testing module  
├── test-runner.js         # Main test runner and CLI
├── test-viewer.html       # Interactive web-based test interface
├── simple-server.js       # HTTP server for web testing
├── package.json          # Test dependencies and scripts
└── README.md             # This documentation
```

## 🔧 Test Modules

### API Tester (`api-tester.js`)
```javascript
const APITester = require('./api-tester');
const tester = new APITester();
const results = await tester.runAllTests();
```

**Features:**
- Tests both Claude and GitHub status APIs
- Validates JSON response structure
- Measures performance metrics
- Tests combined status logic
- Handles network errors gracefully

### Visual Tester (`visual-tester.js`)
```javascript
const VisualTester = require('./visual-tester');  
const tester = new VisualTester();
const results = await tester.runAllTests();
```

**Features:**
- Validates icon file existence and sizes
- Tests all status/badge combinations
- Generates HTML previews
- Validates color consistency
- Exports results for web viewer

### Test Runner (`test-runner.js`)
```bash
# Run all tests with export and viewer
node test-runner.js --export --viewer

# Run specific test types
node test-runner.js --api
node test-runner.js --visual
```

**Features:**
- Command-line interface
- Colored output and progress reporting
- Comprehensive final reports
- JSON export capability
- Automatic viewer launching

## 🌐 Interactive Test Viewer

The `test-viewer.html` provides a rich web interface for testing:

### Features
- **Real-time API Testing**: Live tests against production APIs
- **Visual Component Demo**: Interactive preview of all extension states
- **Detailed Reporting**: Comprehensive test results with statistics
- **Status Simulation**: Preview how the extension looks in different states
- **Console Logging**: Real-time test execution logs

### Usage
```bash
# Option 1: Direct file access
open tests/test-viewer.html

# Option 2: Via npm script
npm run test:viewer

# Option 3: HTTP server (for advanced testing)
cd tests && npm run serve
# Then open http://localhost:3000
```

## 📊 Test Results

### Console Output
Tests provide colored console output with:
- ✅ Success indicators with timing and size info
- ❌ Error indicators with detailed error messages  
- 📊 Summary statistics and overall pass/fail status
- 🎯 Next steps and recommendations

### JSON Export
Results can be exported to `test-results.json`:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "duration": 5.23,
  "results": {
    "api": { /* API test results */ },
    "visual": { /* Visual test results */ }
  },
  "summary": {
    "overallSuccess": true,
    "testsRun": { "api": true, "visual": true }
  }
}
```

## 🔍 What Gets Tested

### API Endpoints
- **Claude Status**: `https://status.anthropic.com/api/v2/status.json`
- **Claude Incidents**: `https://status.anthropic.com/api/v2/incidents.json`
- **Claude Summary**: `https://status.anthropic.com/api/v2/summary.json`
- **GitHub Status**: `https://www.githubstatus.com/api/v2/status.json`
- **GitHub Incidents**: `https://www.githubstatus.com/api/v2/incidents.json`
- **GitHub Summary**: `https://www.githubstatus.com/api/v2/summary.json`

### Status Combinations
- **operational** + no badge → Green icon
- **minor** + count badge → Yellow icon with number
- **major/critical** + alert badge → Red icon with "!" or count
- **unknown** → Gray icon, no badge

### Icon Files
- `icons/lightning-16.png` (16x16px)
- `icons/lightning-32.png` (32x32px)  
- `icons/lightning-48.png` (48x48px)
- `icons/lightning-128.png` (128x128px)

## 🐛 Troubleshooting

### Common Issues

#### Tests Fail with Network Errors
```bash
# Check internet connection and API availability
curl -s https://status.anthropic.com/api/v2/status.json
curl -s https://www.githubstatus.com/api/v2/status.json
```

#### Missing Icon Files
```bash
# Verify icon files exist
ls -la icons/lightning-*.png
```

#### Test Viewer Not Opening
```bash
# Try manual opening
open tests/test-viewer.html

# Or use HTTP server
cd tests && node simple-server.js
# Then open http://localhost:3000
```

#### Permission Errors
```bash
# Make test runner executable (Unix-like systems)
chmod +x tests/test-runner.js
```

### Debug Mode
Run tests with detailed logging:
```bash
NODE_ENV=development npm test
```

## 🚀 Integration with Extension

Tests are designed to mirror the extension's actual logic:

- **Status Priority Logic**: Tests use the same priority hierarchy as `background.js`
- **Color Schemes**: Badge and icon colors match extension implementation
- **API Endpoints**: Tests use identical URLs and request patterns
- **Error Handling**: Tests validate the same error conditions the extension handles

## 📈 Continuous Testing

For development workflows:

```bash
# Quick validation before building
npm run validate && npm test

# Full pre-release testing  
npm run prepare-release && npm test

# Visual testing during development
npm run test:viewer  # Keep open for quick visual checks
```

## 🎯 Best Practices

1. **Run tests before each build**: `npm test && npm run build`
2. **Use the visual viewer for UI changes**: `npm run test:viewer`
3. **Check API status if tests fail**: APIs might be temporarily unavailable
4. **Export results for debugging**: `node test-runner.js --export`
5. **Test in both success and failure scenarios**: Temporarily block network access

---

**Made with ❤️ for robust extension development**