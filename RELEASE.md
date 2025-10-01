# 🚀 Release Guide

Simple guide for creating releases of **Vibe Stats - AI Dev Tools Monitor**.

---

## Quick Start

### Create a Release (3 Options)

**Option 1: Automated Command Line (Recommended)**
```bash
npm run release:patch   # Bug fixes: 1.0.1 → 1.0.2
npm run release:minor   # New features: 1.0.1 → 1.1.0
npm run release:major   # Breaking changes: 1.0.1 → 2.0.0
```

**Option 2: GitHub Actions UI**
1. Go to **Actions** → **🚀 Release Build and Deploy**
2. Click **Run workflow** → Choose version type
3. Click **Run workflow** again

**Option 3: Manual Tag Creation**
```bash
git tag v1.0.2
git push origin v1.0.2  # Triggers automatic release
```

---

## What Happens Automatically

When you run a release command or push a tag:

1. ✅ Version bumped in `manifest.json` and `package.json`
2. ✅ Extension built and zipped
3. ✅ Changes committed to git
4. ✅ Git tag created
5. ✅ Pushed to GitHub
6. ✅ GitHub release created with zip file attached

---

## Version Types (Semantic Versioning)

| Type | Example | When to Use |
|------|---------|-------------|
| **Patch** | 1.0.1 → 1.0.2 | Bug fixes, documentation updates |
| **Minor** | 1.0.1 → 1.1.0 | New features, improvements |
| **Major** | 1.0.1 → 2.0.0 | Breaking changes, major redesigns |

---

## Prerequisites

Before creating a release:

1. **GitHub CLI installed and authenticated**
   ```bash
   # Install GitHub CLI from: https://cli.github.com/
   gh auth login
   ```

2. **Clean working directory**
   ```bash
   git status  # Should show "working tree clean"
   ```

3. **On main branch**
   ```bash
   git checkout main
   git pull origin main
   ```

4. **Tests passing**
   ```bash
   npm test
   npm run validate
   ```

---

## Command Reference

### Release Commands
```bash
npm run release              # Default: patch release
npm run release:patch        # Automated patch release
npm run release:minor        # Automated minor release
npm run release:major        # Automated major release
```

### Build Commands
```bash
npm run build                # Build extension
npm run build:clean          # Build and clean up
npm run prepare-release      # Validate + build
npm run validate             # Validate files only
```

### Version Commands
```bash
npm run version:check        # Check version sync
npm run version:sync         # Sync package.json to manifest.json
npm run version:bump patch   # Bump patch version
```

### Tag Commands
```bash
npm run tag:create           # Create release from current version
npm run tag:push             # Push tags to GitHub
```

---

## After Release

Once the release is created:

1. **Check GitHub**
   - View release: https://github.com/todddube/vstat/releases
   - Download `vibe-stats-v1.0.2.zip`

2. **Submit to Chrome Web Store**
   - Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Upload the zip file
   - Submit for review

3. **Test the Extension**
   - Load unpacked extension in Chrome
   - Verify all features work
   - Check status updates and popup

---

## Troubleshooting

### "Working directory is not clean"
```bash
git status              # Check what's uncommitted
git add .
git commit -m "Your changes"
```

### "GitHub CLI not authenticated"
```bash
gh --version           # Check if installed
gh auth login          # Authenticate
```

### "Not on main branch"
```bash
git checkout main
git pull origin main
```

### Version Mismatch
```bash
npm run version:check  # Check versions
npm run version:sync   # Sync versions
```

### Build Fails
```bash
npm run validate       # Check files
rm -rf build dist      # Clean directories
npm run build          # Rebuild
```

---

## Manual Release Process

If automated releases don't work:

### Step 1: Update Version
Edit `manifest.json` and `package.json`:
```json
{
  "version": "1.0.2"
}
```

### Step 2: Build
```bash
npm run build:clean
```

### Step 3: Commit
```bash
git add manifest.json package.json
git commit -m "Bump version to 1.0.2"
git push origin main
```

### Step 4: Create Tag
```bash
git tag v1.0.2
git push origin v1.0.2
```

This triggers the GitHub Actions workflow to create the release automatically.

### Step 5: Or Manually Create Release
```bash
gh release create v1.0.2 \
  dist/vibe-stats-v1.0.2.zip \
  manifest.json \
  --title "Vibe Stats v1.0.2" \
  --generate-notes \
  --latest
```

---

## Release Checklist

Before release:
- [ ] All tests pass: `npm test`
- [ ] Build validates: `npm run validate`
- [ ] Working directory clean: `git status`
- [ ] On main branch: `git branch`
- [ ] Up to date: `git pull`

After release:
- [ ] GitHub release created
- [ ] Zip file attached to release
- [ ] Extension tested locally
- [ ] Submitted to Chrome Web Store
- [ ] Store listing updated (if needed)

---

## Quick Reference Table

| Task | Command |
|------|---------|
| **Patch release** | `npm run release:patch` |
| **Minor release** | `npm run release:minor` |
| **Major release** | `npm run release:major` |
| **Build only** | `npm run build:clean` |
| **Validate only** | `npm run validate` |
| **Check version** | `npm run version:check` |
| **Test extension** | `npm test` |

---

## GitHub Actions Workflows

### Workflow 1: Manual Release
- **Trigger**: Actions → Run workflow → Choose version type
- **Does**: Complete automated release process

### Workflow 2: Tag-Triggered Release
- **Trigger**: Push a tag (`git push origin v1.0.2`)
- **Does**: Build extension and create GitHub release

### Workflow 3: PR Validation
- **Trigger**: Pull request created
- **Does**: Validate build and run tests

---

## Resources

- **GitHub CLI**: https://cli.github.com/
- **Semantic Versioning**: https://semver.org/
- **Chrome Web Store**: https://chrome.google.com/webstore/devconsole/
- **Repository**: https://github.com/todddube/vstat

---

🤖 **Generated with [Claude Code](https://claude.ai/code)**
