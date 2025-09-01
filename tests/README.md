# Claude Status Monitor - Test Suite

Comprehensive test suite for the Claude Status Monitor Chrome Extension, ensuring reliability, functionality, and user experience quality with both automated testing and visual validation capabilities.

## Quick Start

```bash
# Navigate to tests directory
cd tests

# Install test dependencies
npm install

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run visual tests and viewer
npm run test:visual        # Automated visual tests
npm run visual:viewer      # Interactive visual test viewer
npm run visual:validate    # Validate visual assets
```

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── popup-controller.test.js       # Tests for popup interface logic
│   ├── status-monitor.test.js         # Tests for background service logic
│   └── visual-integration.test.js     # Visual component validation tests
├── integration/             # Integration tests for component interactions
│   ├── api-integration.test.js        # Tests for API communication
│   └── popup-background-integration.test.js  # Popup-background communication tests
├── fixtures/                # Test data and mock responses
│   └── api-responses.js               # Mock API responses for testing
├── mocks/                   # Mock implementations
│   └── chrome-api.js                  # Chrome extension API mocks
├── visual-test-viewer.html  # Interactive visual testing interface
├── run-visual-tests.js      # Visual test runner and utilities
├── jest.setup.js           # Jest configuration and global test setup
├── package.json            # Test dependencies and scripts
├── run-tests.js           # Enhanced test runner with additional features
├── README.md              # This file
├── VISUAL_TESTING.md      # Comprehensive visual testing guide
└── coverage/              # Generated coverage reports
```

## Available Test Commands

### Basic Test Commands
```bash
npm test                    # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:coverage      # Run tests with coverage report
npm run test:watch         # Run tests in watch mode
npm run test:debug         # Run tests in debug mode
```

### Visual Testing Commands ✨ NEW
```bash
npm run test:visual        # Run automated visual integration tests
npm run visual:viewer      # Open interactive visual test viewer in browser
npm run visual:validate    # Validate all visual assets and icons exist
```

### Enhanced Test Runner
```bash
# Using the enhanced test runner
node run-tests.js all              # Run all tests (default)
node run-tests.js unit             # Run unit tests
node run-tests.js integration      # Run integration tests
node run-tests.js coverage         # Run with coverage
node run-tests.js watch            # Watch mode
node run-tests.js debug            # Debug mode
node run-tests.js ci               # CI mode

# Using the visual test runner
node run-visual-tests.js test      # Run visual tests
node run-visual-tests.js viewer    # Open visual viewer
node run-visual-tests.js validate  # Check visual assets
```

## Test Categories

### Unit Tests

#### PopupController Tests (`popup-controller.test.js`)
Tests for the popup interface functionality:
- **Constructor & Initialization**: Proper setup and initialization
- **Event Listeners**: Button clicks, tab switching, keyboard navigation
- **Status Loading**: Data fetching from background script and storage
- **Status Display**: UI updates for different status states
- **Services Display**: Service status indicators and mapping
- **Incidents Display**: Active and recent incident rendering
- **Tab Switching**: Navigation between different views
- **Refresh Functionality**: Manual refresh and error handling
- **Time Formatting**: Relative time display (5m ago, 2h ago)
- **Message Handling**: Communication with background script
- **Error States**: Error display and recovery mechanisms
- **Accessibility**: Keyboard navigation and ARIA labels
- **Auto Refresh**: Automatic data updates when popup is visible

#### StatusMonitor Tests (`status-monitor.test.js`)
Tests for the background service functionality:
- **Initialization**: Alarm setup and initial status checks
- **API Communication**: Fetching data from Anthropic status API
- **Data Processing**: Parsing and transforming API responses
- **Error Handling**: Network failures, timeouts, and retries
- **Storage Management**: Saving and retrieving status data
- **Icon Management**: Updating extension icons and badges
- **Incident Processing**: Filtering and formatting incidents
- **Component Status**: Service status determination and mapping
- **Alarm Management**: Periodic status checking
- **Badge Updates**: Extension badge text and colors

#### Visual Integration Tests (`visual-integration.test.js`) ✨ NEW
Comprehensive visual component validation:
- **Status Icon States**: Validates correct icon colors for all status states (operational, minor, major, critical, unknown)
- **Badge Indicators**: Tests extension badge text and background colors with different affected service counts
- **Service Status Icons**: Verifies service status indicators display correct symbols (✓, ⚠, ⚡, ✕, ?)
- **Incident Display**: Tests incident rendering with proper HTML formatting and escaping
- **Empty States**: Validates "no incidents" messaging and visual feedback
- **Visual Asset Validation**: Confirms all required icon files exist and are accessible
- **Accessibility Features**: Tests ARIA labels, alt text, and other accessibility attributes
- **Loading and Error States**: Validates visual feedback for loading and error conditions

### Integration Tests

#### API Integration (`api-integration.test.js`)
Tests for external API interactions:
- **Status API**: Fetching overall system status
- **Incidents API**: Retrieving current and historical incidents
- **Components API**: Getting individual service statuses
- **Error Scenarios**: API failures, timeouts, invalid responses
- **Rate Limiting**: Handling API rate limits
- **Data Consistency**: Ensuring data integrity across API calls

#### Popup-Background Integration (`popup-background-integration.test.js`)
Tests for communication between popup and background scripts:
- **Message Passing**: Request/response communication
- **Data Synchronization**: Ensuring consistent state
- **Force Refresh**: Manual status updates
- **Error Propagation**: Error handling across components
- **State Management**: Shared state consistency

## Visual Testing System ✨ NEW

### Interactive Visual Test Viewer
The `visual-test-viewer.html` provides a comprehensive browser-based interface for:

- **🎨 Icon State Testing**: View all status icons (green, yellow, red, gray) in real-time across all sizes (16px, 32px, 48px, 128px)
- **🏷️ Badge Simulation**: Test extension badge indicators with different affected service counts (0, 1, 2, 3, 4+)
- **📱 Popup Interface Simulation**: Interactive popup mockup that responds to status changes
- **🔧 Service Status Testing**: Validate service status icons and color coding
- **📋 Incident Display Testing**: Add test incidents and see how they render
- **🤖 Automated Test Sequences**: Run automated visual tests with real-time feedback

### Visual Testing Workflow

1. **Run Automated Visual Tests**:
   ```bash
   npm run test:visual
   ```
   - Validates icon color mappings
   - Tests badge indicator logic  
   - Checks service status displays
   - Verifies incident HTML formatting

2. **Manual Visual Inspection**:
   ```bash
   npm run visual:viewer
   ```
   - Opens interactive browser interface
   - Test all status states manually
   - Verify colors, sizing, and animations
   - Check responsive behavior

3. **Asset Validation**:
   ```bash
   npm run visual:validate
   ```
   - Ensures all required icons exist
   - Validates file naming conventions
   - Checks asset accessibility

### Status Icon Reference

| Status | Color | Files | Badge Behavior |
|--------|-------|-------|----------------|
| 🟢 Operational | Green | `claude-green-*.png` | No badge |
| 🟡 Minor Issues | Yellow | `claude-yellow-*.png` | Shows affected count |
| 🔴 Major Issues | Red | `claude-red-*.png` | Shows affected count |
| 🔴 Critical Issues | Red | `claude-red-*.png` | Shows count or "!" |
| ⚪ Unknown | Gray | `claude-gray-*.png` | No badge |

### Service Status Icons

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| Operational | ✓ | Green | All systems normal |
| Minor Issues | ⚠ | Yellow | Degraded performance |
| Major Issues | ⚡ | Orange | Partial outage |
| Critical Issues | ✕ | Red | Major outage |
| Unknown | ? | Gray | Status unclear |

## Test Fixtures and Mocks

### API Response Fixtures (`fixtures/api-responses.js`)
Realistic mock data for testing:
- **Status Responses**: Different system status scenarios
- **Incident Responses**: Various incident types and states
- **Component Responses**: Service status combinations
- **Error Responses**: API error scenarios

### Chrome API Mocks (`mocks/chrome-api.js`)
Complete Chrome extension API simulation with visual feedback:
- **Storage API**: Local storage operations
- **Alarms API**: Scheduled task management
- **Runtime API**: Message passing and lifecycle events
- **Action API**: Extension icon and badge management with console logging for visual tests

## Test Configuration

### Jest Configuration (`package.json`)
```json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "testMatch": ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  "collectCoverageFrom": ["../*.js", "!../node_modules/**", "!**/tests/**"],
  "verbose": true
}
```

### Global Test Setup (`jest.setup.js`)
- Chrome API mocks initialization
- Console log suppression for cleaner test output
- Global test utilities and helpers
- Test timeout configuration

## Writing Tests

### Test Structure Guidelines
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup for each test
    jest.clearAllMocks();
    chrome._resetMocks();
  });

  test('should do something specific', async () => {
    // Arrange
    const mockData = { /* test data */ };
    
    // Act
    const result = await functionUnderTest(mockData);
    
    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

### Visual Test Guidelines ✨ NEW
```javascript
test('should display correct visual state', async () => {
  // Test visual component behavior
  controller.updateStatusDisplay('critical', new Date().toISOString());
  
  // Verify visual changes
  expect(mockElements['status-indicator'].className).toBe('status-indicator status-critical');
  expect(mockElements['status-icon'].src).toBe('icons/claude-red-32.png');
  
  // Console output shows visual feedback
  console.log('🎨 Visual: Icon changed to red for critical status');
});
```

### Best Practices
- **Clear Test Names**: Use descriptive test names that explain what is being tested
- **Arrange-Act-Assert**: Structure tests with clear sections
- **Mock External Dependencies**: Use mocks for Chrome APIs, network requests, and timers
- **Test Error Cases**: Include tests for error scenarios and edge cases
- **Visual Validation**: Use visual tests to verify UI component behavior
- **Async Testing**: Properly handle async operations with async/await
- **Cleanup**: Reset mocks and state between tests

### Mock Usage Examples
```javascript
// Mock Chrome storage
chrome.storage.local.get.mockResolvedValue({
  status: 'operational',
  incidents: []
});

// Mock Chrome runtime messages with visual feedback
chrome.runtime.sendMessage.mockImplementation((message, callback) => {
  callback({ status: 'success', data: mockData });
});

// Mock Chrome action API with visual logging
chrome.action.setIcon.mockImplementation(({ path }) => {
  console.log(`🎨 Visual: Icon changed to ${JSON.stringify(path)}`);
  return Promise.resolve();
});

// Mock timers for testing time-based functionality
jest.useFakeTimers();
// ... test code ...
jest.advanceTimersByTime(5000);
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory when running:
```bash
npm run test:coverage
```

### Coverage Targets
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Visual tests contribute to coverage by validating UI component logic and visual state management.

## Continuous Integration

### CI Configuration
The test suite is designed to work in CI environments:
```bash
# CI mode automatically detected
CI=1 npm test

# Or explicitly use CI command
node run-tests.js ci

# Include visual validation in CI
npm run visual:validate  # Asset validation
npm run test:visual      # Automated visual tests
```

### Environment Variables
- `CI=1`: Enables CI mode (no watch, coverage reporting)
- `DEBUG=1`: Enables verbose test output
- `JEST_DEBUG=1`: Enables Jest debugging

## Visual Testing in CI ✨ NEW

Visual tests are CI-friendly:
- **Asset Validation**: Confirms all icons exist before deployment
- **Automated Visual Tests**: Validates visual logic without requiring a browser
- **Console Logging**: Provides visual feedback in CI logs
- **No Browser Required**: Visual integration tests run in jsdom environment

## Troubleshooting

### Common Issues

#### Tests Failing Due to Timers
```javascript
// Use fake timers for time-dependent tests
jest.useFakeTimers();
// ... test code ...
jest.advanceTimersByTime(1000);
jest.useRealTimers(); // Restore in cleanup
```

#### Chrome API Mocks Not Working
```javascript
// Ensure mocks are reset between tests
beforeEach(() => {
  chrome._resetMocks();
});
```

#### Visual Assets Missing ✨ NEW
```bash
# Check for missing icons
npm run visual:validate

# Review console output:
# ❌ Missing: claude-red-32.png
# 💡 Run icon generation scripts to create missing assets
```

#### Visual Viewer Not Opening ✨ NEW
```bash
# Manual browser opening
# Open tests/visual-test-viewer.html directly in your browser
# Check browser console for JavaScript errors
# Verify icon paths are correct (../icons/claude-*.png)
```

#### Async Operations Not Completing
```javascript
// Ensure promises are properly awaited
await functionThatReturnsPromise();
// Or use done callback for complex async scenarios
test('async test', (done) => {
  asyncFunction().then(() => {
    expect(result).toBe(expected);
    done();
  });
});
```

### Debug Mode
Run tests in debug mode to troubleshoot issues:
```bash
npm run test:debug
# Then connect Chrome DevTools to localhost:9229

# Visual debugging
npm run visual:viewer  # Open interactive visual debugger
```

## Contributing

### Adding New Tests
1. Create test file in appropriate directory (`unit/` or `integration/`)
2. Follow existing naming conventions (`*.test.js`)
3. Include comprehensive test cases for happy path and error scenarios
4. Update fixtures if new mock data is needed
5. Add visual tests for UI components using `visual-integration.test.js` patterns
6. Ensure tests pass and maintain coverage targets

### Adding Visual Tests ✨ NEW
1. Add test cases to `visual-integration.test.js`
2. Update `visual-test-viewer.html` with new interactive controls
3. Document visual states in `VISUAL_TESTING.md`
4. Ensure visual assets exist and are validated
5. Test both automated and manual visual validation

### Updating Mocks
1. Update mock implementations in `mocks/` directory
2. Add new API responses to `fixtures/api-responses.js`
3. Include visual feedback logging in Chrome API mocks
4. Ensure backward compatibility with existing tests
5. Document any breaking changes

### Test Review Checklist
- [ ] Tests cover both success and failure scenarios
- [ ] Mocks are properly configured and reset
- [ ] Async operations are properly handled
- [ ] Test names are descriptive and clear
- [ ] Visual components are validated when applicable
- [ ] Visual assets are confirmed to exist
- [ ] Code coverage targets are maintained
- [ ] Tests run successfully in both local and CI environments
- [ ] Visual tests provide meaningful feedback in console output

## Additional Resources

- 📖 **[Visual Testing Guide](VISUAL_TESTING.md)** - Comprehensive guide to visual testing tools and workflows
- 🎨 **Visual Test Viewer** - Interactive browser-based testing interface (`visual-test-viewer.html`)
- 🔍 **Asset Validation** - Automated checking of all visual assets and icons
- 🤖 **Automated Visual Tests** - Programmatic validation of visual component behavior

The enhanced test suite now provides both traditional unit/integration testing and comprehensive visual validation, ensuring your Claude Status Monitor extension works correctly and looks great!