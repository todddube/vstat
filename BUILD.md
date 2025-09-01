# Extension Build Guide

This guide explains how to build production-ready zip files for the Claude Status Monitor Chrome Extension for submission to the Chrome Web Store.

## Quick Start

```bash
# Build extension zip file
npm run build

# Build and clean up temporary files
npm run build:clean

# Just validate files without building
npm run validate

# Complete release preparation
npm run prepare-release
```

## Build Script Features

The `build-extension.js` script provides:

- ✅ **File Validation**: Ensures all required files exist before building
- ✅ **Selective Copying**: Only includes necessary files in the build
- ✅ **Manifest Validation**: Validates manifest.json structure and required fields
- ✅ **Size Reporting**: Shows build size and compression statistics
- ✅ **Automatic Zipping**: Creates production-ready zip files with version and date
- ✅ **Cross-Platform**: Works on Windows, macOS, and Linux
- ✅ **Build Reports**: Generates comprehensive build summaries

## Required Files

The build script validates that these essential files exist:

### Core Extension Files
- `manifest.json` - Extension configuration
- `background.js` - Service worker script
- `popup.js` - Popup interface logic
- `popup.html` - Popup interface HTML

### Icon Files (All Status States)
- **Green (Operational)**: `claude-green-16.png`, `claude-green-32.png`, `claude-green-48.png`, `claude-green-128.png`
- **Yellow (Minor Issues)**: `claude-yellow-16.png`, `claude-yellow-32.png`, `claude-yellow-48.png`, `claude-yellow-128.png`  
- **Red (Major/Critical)**: `claude-red-16.png`, `claude-red-32.png`, `claude-red-48.png`, `claude-red-128.png`
- **Gray (Unknown)**: `claude-gray-16.png`, `claude-gray-32.png`, `claude-gray-48.png`, `claude-gray-128.png`

### Optional Files
- `popup.css` - Popup styling (if exists)
- `README.md` - Documentation (if exists)
- `LICENSE` - License file (if exists)

## Excluded Files

The following files/directories are automatically excluded from builds:

- `.git/` - Git repository files
- `node_modules/` - Node.js dependencies
- `tests/` - Test suite
- `build/` - Previous build artifacts
- `dist/` - Previous distribution files
- `.claude/` - Claude Code configuration
- Build and development scripts (`build-extension.js`, `create_icons.js`, etc.)
- Development HTML files (`convert_*.html`)
- Documentation files (`*.md`)
- System files (`.DS_Store`, `Thumbs.db`)

## Build Commands

### Basic Build
```bash
npm run build
# or
node build-extension.js
```

**Output:**
- Creates `./build/` directory with extension files
- Creates `./dist/claude-status-monitor-v{version}-{date}.zip`
- Generates build report with size statistics

### Build with Cleanup
```bash
npm run build:clean
# or  
node build-extension.js --clean
```

**Difference:** Removes the `./build/` directory after creating the zip file, keeping only the distribution zip.

### Validation Only
```bash
npm run validate
# or
node build-extension.js --validate-only
```

**Purpose:** Checks that all required files exist without actually building. Useful for CI/CD pipelines or quick verification.

### Release Preparation
```bash
npm run prepare-release
```

**Process:** 
1. Validates all required files exist
2. Builds the extension zip
3. Provides release checklist and next steps

## Build Process

The build script follows this workflow:

### 1. **Initialization**
```
📁 Initializing build directories...
✅ Build directory: ./build
✅ Dist directory: ./dist
```

### 2. **File Validation**
```
🔍 Validating required files...
✅ All 20 required files found
```

### 3. **File Copying**
```
📋 Copying extension files...
   ✅ manifest.json
   ✅ background.js
   ✅ popup.js
   ✅ popup.html
   ✅ icons/claude-green-16.png
   ... (all files)
📋 Copied 20 files to build directory
```

### 4. **Manifest Validation**
```
📄 Validating manifest.json...
✅ Extension: Claude Status Monitor v1.0.0
✅ Manifest version: 3
```

### 5. **Size Calculation**
```
📊 Calculating build size...
📊 Build contains 20 files
📊 Total size: 145.6 KB (0.14 MB)
```

### 6. **Zip Creation**
```
📦 Creating zip file...
✅ Extension zip created: claude-status-monitor-v1.0.0-2025-01-01.zip
📦 Zip size: 89.3 KB
```

### 7. **Build Report**
```
📋 Build Report
==================================================
📦 Extension Details:
   Name: Claude Status Monitor
   Version: 1.0.0
   Description: Monitor Claude's status from Anthropic...
   Manifest Version: 3

📊 Build Statistics:
   Files: 20
   Build Size: 145.6 KB
   Zip Size: 89.3 KB
   Compression: 38.6%

📁 Output Files:
   Build Directory: ./build
   Zip File: ./dist/claude-status-monitor-v1.0.0-2025-01-01.zip

🚀 Next Steps:
   1. Test the extension by loading the build directory
   2. Upload the zip file to Chrome Web Store
   3. Review the extension in the Chrome Web Store dashboard

✅ Build completed successfully!
```

## File Structure

### Before Build
```
clstat/
├── manifest.json
├── background.js
├── popup.js
├── popup.html
├── icons/
│   ├── claude-green-16.png
│   ├── claude-green-32.png
│   └── ... (all status icons)
├── tests/ (excluded)
├── build-extension.js (excluded)
└── README.md (excluded)
```

### After Build
```
clstat/
├── ... (original files)
├── build/                    # Temporary build directory
│   ├── manifest.json
│   ├── background.js
│   ├── popup.js
│   ├── popup.html
│   └── icons/
│       └── ... (all icons)
└── dist/                     # Distribution directory
    └── claude-status-monitor-v1.0.0-2025-01-01.zip
```

## Chrome Web Store Submission

### Pre-Submission Checklist

1. **Test the Extension**:
   ```bash
   # Build the extension
   npm run build
   
   # Load ./build directory in Chrome
   # - Open chrome://extensions/
   # - Enable "Developer mode"
   # - Click "Load unpacked"
   # - Select the ./build directory
   # - Test all functionality
   ```

2. **Validate Manifest**:
   - Ensure all required permissions are listed
   - Verify icon paths are correct
   - Check version number follows semantic versioning
   - Validate content security policy

3. **Check File Sizes**:
   - Individual files should be < 5MB
   - Total uncompressed extension should be < 20MB
   - Optimize large assets if necessary

### Submission Process

1. **Prepare Zip File**:
   ```bash
   npm run build:clean
   ```

2. **Upload to Chrome Web Store**:
   - Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Click "New Item"
   - Upload the zip file from `./dist/`
   - Fill in store listing details

3. **Store Listing Requirements**:
   - Extension name and description
   - Screenshots (1280x800 or 640x400)
   - Icon (128x128 PNG)
   - Category selection
   - Privacy policy (if collecting data)

## Troubleshooting

### Common Build Issues

#### Missing Required Files
```
❌ Missing required files:
   - icons/claude-red-32.png
   - icons/claude-yellow-128.png
```

**Solution:** Run icon generation scripts to create missing icons:
```bash
node create_colored_icons.js
```

#### Invalid Manifest
```
❌ Invalid manifest.json:
   Missing required manifest fields: version, description
```

**Solution:** Update `manifest.json` with required fields:
```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "Extension description"
}
```

#### Zip Creation Failed
```
❌ Failed to create zip file:
   Command failed: powershell -Command "Compress-Archive..."
```

**Solution:** Manual zip creation:
1. Navigate to `./build` directory
2. Select all files and folders
3. Create zip archive
4. Save to `./dist` directory

#### Size Warnings
```
⚠️  Warning: Extension size exceeds 20MB
```

**Solution:** 
- Check for large unnecessary files
- Optimize images and assets
- Remove development files from build

### Platform-Specific Notes

#### Windows
- Uses PowerShell `Compress-Archive` for zip creation
- Handles file paths with backslashes
- May require execution policy changes for PowerShell

#### macOS/Linux  
- Uses command-line `zip` utility
- Handles file paths with forward slashes
- Requires zip command to be installed

#### Node.js Version
- Requires Node.js 14.0.0 or higher
- Uses modern JavaScript features
- Cross-platform path handling

## Advanced Usage

### Custom Build Configuration

You can modify `build-extension.js` to customize the build process:

```javascript
// Add custom files to include
this.requiredFiles.custom = [
  'styles.css',
  'config.json'
];

// Add custom exclusion patterns
this.excludePatterns.push(
  'draft_*',
  '*.backup'
);
```

### Automated Builds

For CI/CD integration:

```yaml
# GitHub Actions example
- name: Build Extension
  run: |
    npm run validate
    npm run build:clean
    
- name: Upload Artifact
  uses: actions/upload-artifact@v3
  with:
    name: extension-build
    path: dist/*.zip
```

### Version Management

The build script reads version from `manifest.json`. To update:

```json
{
  "version": "1.1.0"
}
```

The zip file will automatically be named with the new version.

## Security Considerations

### Content Security Policy
Ensure your `manifest.json` includes appropriate CSP:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Permissions
Only request necessary permissions:

```json
{
  "permissions": [
    "storage",
    "alarms"
  ],
  "host_permissions": [
    "https://status.anthropic.com/*"
  ]
}
```

### File Validation
The build script automatically:
- Validates manifest structure
- Checks for required files
- Excludes sensitive development files
- Sanitizes file paths

## Performance Tips

### Icon Optimization
- Use PNG format for all icons
- Optimize images for web (reduce file size)
- Ensure all required sizes are available
- Use consistent naming convention

### Code Optimization
- Minify JavaScript if needed
- Remove console.log statements
- Optimize asset loading
- Use efficient storage operations

### Build Speed
- Keep build directory clean between builds
- Exclude unnecessary files early
- Use SSD storage for build operations
- Limit file system operations

---

**Need help?** Check the build script help:
```bash
node build-extension.js --help
```