# Visual Testing Guide

This guide explains how to use the visual testing tools to see and validate the status icons and UI components of the Claude Status Monitor extension during testing.

## Quick Start

```bash
# Navigate to tests directory
cd tests

# Install dependencies (if not already done)
npm install

# Run visual tests
npm run test:visual

# Open interactive visual viewer
npm run visual:viewer

# Validate visual assets
npm run visual:validate
```

## Visual Testing Tools

### 1. Interactive Visual Test Viewer (`visual-test-viewer.html`)

A comprehensive HTML interface that lets you:

- **View all status icon variations** (green, yellow, red, gray) in different sizes
- **Test extension badge indicators** with different affected service counts
- **Simulate popup interface states** with real-time status changes
- **Visualize service status indicators** with proper icons and colors
- **Test incident displays** with active and resolved incidents
- **Run automated visual test sequences** 

**Features:**
- ✅ Live icon previews for all status states
- ✅ Badge simulation with count variations
- ✅ Interactive popup state testing
- ✅ Incident simulation and display
- ✅ Automated test sequences
- ✅ Real-time visual feedback

### 2. Visual Integration Tests (`visual-integration.test.js`)

Automated tests that validate:

- **Status icon color mapping** - Ensures correct colors for each status
- **Badge indicator logic** - Tests badge text and colors
- **Service status displays** - Validates service icon rendering
- **Incident visual formatting** - Checks incident display HTML
- **Empty state messaging** - Verifies proper fallback displays
- **Asset validation** - Confirms all required icons exist

### 3. Visual Test Runner (`run-visual-tests.js`)

Command-line tool for:
- Running automated visual tests
- Opening the interactive viewer
- Validating visual assets
- Future: Screenshot generation

## Usage Examples

### Manual Visual Testing

1. **Open the Visual Test Viewer:**
   ```bash
   npm run visual:viewer
   ```

2. **Test different scenarios:**
   - Click status buttons to see icon changes
   - Adjust affected service counts for badge testing
   - Simulate incidents to see popup changes
   - Run automated test sequences

### Automated Visual Testing

1. **Run the visual integration tests:**
   ```bash
   npm run test:visual
   ```

2. **Check console output for visual feedback:**
   ```
   🎨 Visual: Icon changed to {"16":"icons/claude-red-16.png",...}
   🏷️  Visual: Badge text set to "2"
   📝 Visual: Extension title set to "Claude Status: Major Issues (2 services affected)"
   ```

### Asset Validation

1. **Validate all required icons exist:**
   ```bash
   npm run visual:validate
   ```

2. **Check output for missing assets:**
   ```
   📊 Asset Status: 16/16 icons found
   ✅ All required icons found!
   ```

## Visual Test Workflow

### Recommended Testing Process:

1. **Run Automated Tests First**
   ```bash
   npm run test:visual
   ```
   - Validates icon mappings
   - Tests badge logic
   - Checks service status displays
   - Verifies incident formatting

2. **Manual Visual Inspection**
   ```bash
   npm run visual:viewer
   ```
   - Open browser viewer
   - Test each status state manually
   - Verify colors and sizing
   - Check responsive behavior

3. **Asset Validation**
   ```bash
   npm run visual:validate
   ```
   - Ensure all icons exist
   - Check for missing assets
   - Validate file structure

## Status Icon Reference

### Icon Colors by Status:
- 🟢 **Operational**: Green (`claude-green-*.png`)
- 🟡 **Minor Issues**: Yellow (`claude-yellow-*.png`)
- 🔴 **Major/Critical Issues**: Red (`claude-red-*.png`)
- ⚪ **Unknown**: Gray (`claude-gray-*.png`)

### Icon Sizes:
- `16px` - Small toolbar icon
- `32px` - Standard popup icon  
- `48px` - Medium icon
- `128px` - Large extension icon

### Badge Indicators:
- **No Badge**: Operational status
- **Number Badge**: Count of affected services (1-4+)
- **Alert Badge**: Critical status with exclamation mark (!)

## Service Status Icons

| Status | Icon | Color | Class |
|--------|------|-------|-------|
| Operational | ✓ | Green | `.service-icon.operational` |
| Minor Issues | ⚠ | Yellow | `.service-icon.minor` |
| Major Issues | ⚡ | Orange | `.service-icon.major` |
| Critical Issues | ✕ | Red | `.service-icon.critical` |
| Unknown | ? | Gray | `.service-icon.unknown` |

## Incident Display Styling

### Active Incidents:
- Color-coded by impact level
- Status indicators (investigating, monitoring, resolved)
- Truncated text with full details on hover
- Time formatting (5m ago, 2h ago, etc.)

### Recent Incidents:
- Duration information when resolved
- Latest update summaries
- Resolved incidents show completion status
- Historical grouping by timeframe

## Testing Checklist

### Visual Validation Checklist:

- [ ] **Icon States**: All status icons display correct colors
- [ ] **Badge Variations**: Badge shows proper counts and colors  
- [ ] **Popup Interface**: Status changes update all UI elements
- [ ] **Service Indicators**: Service status icons match component status
- [ ] **Incident Display**: Incidents format correctly with proper styling
- [ ] **Empty States**: "No incidents" messages show appropriately
- [ ] **Error States**: Error messages and retry options display
- [ ] **Accessibility**: ARIA labels and alt text provide status info
- [ ] **Responsive Design**: UI works at different screen sizes
- [ ] **Asset Loading**: All icons load without errors

### Automated Test Coverage:

- ✅ Status-to-color mapping validation
- ✅ Badge logic with service count variations
- ✅ Service status icon rendering
- ✅ Incident HTML generation and escaping
- ✅ Empty state message display
- ✅ Accessibility attribute setting
- ✅ Asset existence validation

## Troubleshooting

### Common Issues:

1. **Missing Icons**
   ```bash
   npm run visual:validate
   ```
   Check output for missing icon files. Run icon generation scripts if needed.

2. **Visual Viewer Won't Open**
   - Ensure `visual-test-viewer.html` exists in tests directory
   - Manually open the file in your browser
   - Check browser console for JavaScript errors

3. **Tests Failing**
   - Check that extension files (`popup.js`, `background.js`) exist
   - Verify test mocks are properly configured
   - Review Jest configuration in `package.json`

4. **Icons Not Displaying**
   - Verify icon paths are correct (`../icons/claude-*.png`)
   - Check that icons directory exists at project root
   - Ensure icon files have correct naming convention

### Debug Tips:

- Use browser Developer Tools to inspect element styles
- Check console for JavaScript errors in visual viewer
- Review network tab for failed asset loads
- Use Jest `--verbose` flag for detailed test output

## Future Enhancements

### Planned Features:
- **Screenshot Generation**: Automated visual regression testing
- **Accessibility Testing**: Enhanced screen reader validation  
- **Performance Testing**: Icon loading time measurements
- **Cross-browser Testing**: Validation across different browsers
- **Responsive Testing**: Validation at different viewport sizes

### Contributing:

When adding new visual tests:
1. Update `visual-integration.test.js` with new test cases
2. Add corresponding controls to `visual-test-viewer.html` 
3. Update this documentation with new features
4. Ensure all tests pass before submitting changes