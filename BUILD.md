# Build & Release Guide

Complete guide for building, testing, and releasing Vibe Stats.

## Table of Contents

- [Build Commands](#build-commands)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Release Process](#release-process)
- [Chrome Web Store Submission](#chrome-web-store-submission)
- [Troubleshooting](#troubleshooting)

## Build Commands

### Quick Reference

| Command | Description |
|---------|-------------|
| `npm run build` | Build production zip |
| `npm run build:clean` | Build and clean temp files |
| `npm run validate` | Validate extension files |
| `npm run prepare-release` | Validate + build |
| `npm test` | Run test suite |

### Build Process

```bash
# Validate all files
npm run validate

# Build production-ready zip
npm run build

# Build and clean up
npm run build:clean

# Full release preparation
npm run prepare-release
```

### Build Output

- `./build/` - Temporary build directory
- `./dist/vibe-stats-v{VERSION}-{DATE}.zip` - Production zip file

## Development Setup

### Prerequisites

- **Node.js**: 14.0.0+
- **Chrome/Edge**: 88+
- **Git**: For version control
- **GitHub CLI**: For releases (`gh`)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/todddube/vstat.git
cd vstat

# Install test dependencies
cd tests && npm install && cd ..
```

### Load Extension

1. Open `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select the `vstat` directory

### Development Workflow

```bash
# Make code changes

# Validate changes
npm run validate

# Run tests
npm test

# Reload extension in Chrome
# (Click refresh icon on extension card)
```

### Debugging

| Tool | Access |
|------|--------|
| Service Worker | `chrome://extensions/` → "service worker" |
| Popup | Right-click icon → "Inspect popup" |
| Storage | DevTools → Application → Storage |
| Network | DevTools → Network tab |

## Testing

### Test Commands

```bash
# Run all tests
npm test

# Visual tests
npm run test:visual

# Interactive test viewer
npm run visual:viewer

# Validate assets
npm run visual:validate
```

### Test Coverage

- Unit tests for core functionality
- Integration tests for API communication
- Visual tests for UI components
- Accessibility tests

See [tests/README.md](tests/README.md) for detailed testing documentation.

## Release Process

### Version Management

```bash
# Check version sync
npm run version:check

# Sync package.json to manifest.json
npm run version:sync

# Bump version
npm run version:bump patch   # 1.0.0 → 1.0.1
npm run version:bump minor   # 1.0.0 → 1.1.0
npm run version:bump major   # 1.0.0 → 2.0.0
```

### Automated Release

```bash
# Patch release (bug fixes)
npm run release:patch

# Minor release (new features)
npm run release:minor

# Major release (breaking changes)
npm run release:major
```

### Manual Release

#### Step 1: Update Version

Edit `manifest.json`:
```json
{
  "version": "1.2.6"
}
```

Sync version:
```bash
npm run version:sync
```

#### Step 2: Build

```bash
npm run build:clean
```

#### Step 3: Commit and Tag

```bash
git add .
git commit -m "v1.2.6 - Release notes here"
git push origin main

git tag v1.2.6
git push origin v1.2.6
```

#### Step 4: Create GitHub Release

```bash
gh release create v1.2.6 ./dist/vibe-stats-v1.2.6.zip \
  --title "v1.2.6 - Release Title" \
  --notes "Release notes here"
```

### Release Checklist

**Before Release:**
- [ ] All tests pass: `npm test`
- [ ] Build validates: `npm run validate`
- [ ] Working directory clean: `git status`
- [ ] On main branch
- [ ] Up to date with remote

**After Release:**
- [ ] GitHub release created
- [ ] Zip file attached
- [ ] Extension tested locally
- [ ] Submitted to Chrome Web Store

## Chrome Web Store Submission

### Prerequisites

- [Chrome Developer Account](https://chrome.google.com/webstore/devconsole/)
- One-time $5 registration fee
- Privacy policy URL

### Submission Steps

1. Build production zip: `npm run build`
2. Go to [Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Click **New Item** or update existing
4. Upload zip from `./dist/`
5. Fill in store listing details
6. Submit for review

### Store Listing Assets

Required:
- Icon: 128x128 PNG
- Screenshots: 1280x800 or 640x400
- Description: Up to 132 characters (short), full description

### Review Timeline

- Initial review: 1-3 business days
- Updates: Usually faster
- Rejections: Check email for specific issues

## Troubleshooting

### Common Issues

#### Build Fails

```bash
# Clean and rebuild
rm -rf build dist
npm run build
```

#### Version Mismatch

```bash
npm run version:check
npm run version:sync
```

#### Extension Not Loading

- Check `manifest.json` syntax
- Verify all files exist
- Check Chrome console for errors

#### GitHub CLI Issues

```bash
# Verify installation
gh --version

# Re-authenticate
gh auth login
```

### Getting Help

- [GitHub Issues](https://github.com/todddube/vstat/issues)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)

## Architecture

### Core Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration |
| `background.js` | Service worker, status monitoring |
| `popup.html` | Popup interface markup |
| `popup.js` | Popup controller logic |
| `icons/` | AI-themed vibe icons |

### Status Monitoring

- **Check Interval**: 5 minutes (via Chrome Alarms API)
- **API Timeout**: 10 seconds
- **Retry Logic**: 3 attempts with exponential backoff
- **Storage**: Chrome local storage

### Data Flow

1. Service worker fetches status APIs
2. Combines status from both services
3. Updates extension icon and badge
4. Stores data in Chrome storage
5. Popup reads from storage on open

---

See also:
- [README.md](README.md) - Project overview
- [RELEASE.md](RELEASE.md) - Detailed release workflow
- [tests/README.md](tests/README.md) - Testing documentation
