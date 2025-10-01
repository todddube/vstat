# Release Workflow Guide

This document explains how to create releases for **Vibe Stats - AI Dev Tools Monitor** using both automated and manual workflows.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Command Line Release (Automated)](#command-line-release-automated)
3. [Manual Tag & Release](#manual-tag--release)
4. [GitHub Actions Workflows](#github-actions-workflows)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Automated Release (Recommended)
```bash
# Create a patch release (1.0.1 → 1.0.2)
npm run release:patch

# Create a minor release (1.0.1 → 1.1.0)
npm run release:minor

# Create a major release (1.0.1 → 2.0.0)
npm run release:major
```

This will:
- ✅ Bump version in `manifest.json` and `package.json`
- ✅ Build extension zip file
- ✅ Commit version changes
- ✅ Create annotated git tag
- ✅ Push to GitHub (commits + tags)
- ✅ Create GitHub release with zip attachment

---

## 🔧 Command Line Release (Automated)

### Prerequisites

1. **Clean working directory** - No uncommitted changes
   ```bash
   git status  # Should show "working tree clean"
   ```

2. **GitHub CLI installed and authenticated**
   ```bash
   # Install GitHub CLI
   # Windows (via winget):
   winget install --id GitHub.cli

   # Or download from: https://cli.github.com/

   # Authenticate
   gh auth login
   ```

3. **On main branch**
   ```bash
   git checkout main
   git pull origin main
   ```

### Release Commands

#### Patch Release (Bug Fixes)
```bash
npm run release:patch
```
- Use for: Bug fixes, documentation updates, minor tweaks
- Version bump: `1.0.1` → `1.0.2`

#### Minor Release (New Features)
```bash
npm run release:minor
```
- Use for: New features, backwards-compatible changes
- Version bump: `1.0.1` → `1.1.0`

#### Major Release (Breaking Changes)
```bash
npm run release:major
```
- Use for: Breaking changes, major redesigns
- Version bump: `1.0.1` → `2.0.0`

### What Happens During Release

1. **Pre-flight Checks**
   - Validates working directory is clean
   - Checks you're on main/master branch
   - Verifies GitHub CLI is installed and authenticated
   - Validates all required extension files exist

2. **Version Bump**
   - Reads current version from `manifest.json`
   - Bumps version based on type (patch/minor/major)
   - Updates `package.json` and `manifest.json`

3. **Build Extension**
   - Validates all required files
   - Copies files to `./build/` directory
   - Creates production zip in `./dist/`
   - Validates manifest and version consistency

4. **Git Operations**
   - Stages version changes: `git add package.json manifest.json`
   - Commits with formatted message
   - Creates annotated tag: `git tag -a vX.Y.Z`
   - Pushes commits: `git push origin main`
   - Pushes tags: `git push origin --tags`

5. **GitHub Release**
   - Creates GitHub release from tag
   - Attaches extension zip file
   - Includes comprehensive release notes
   - Marks as latest release

### Example Output
```bash
$ npm run release:patch

🔍 Validating release prerequisites for patch release...
✅ Working directory is clean
✅ On main branch
✅ Remote origin: https://github.com/todddube/vstat.git
🚀 Starting Vibe Stats Extension Build ⚡
============================================================
📁 Initializing build directories...
✅ Build directory: C:\...\vstat\build
✅ Dist directory: C:\...\vstat\dist
🔍 Validating required files...
✅ All 8 required files found
📋 Copying extension files...
   ✅ manifest.json
   ✅ background.js
   ✅ popup.js
   ✅ popup.html
   ... [more files]
📈 Bumping version: 1.0.1 → 1.0.2 (patch)
📝 Updating version to 1.0.2...
✅ Updated files to version 1.0.2
📝 Committing version bump...
🏷️  Creating tag v1.0.2...
🚀 Pushing to GitHub...
🎉 Creating GitHub release...
✅ Created GitHub release v1.0.2
🔗 Release URL: https://github.com/todddube/vstat/releases/tag/v1.0.2
```

---

## 🏷️ Manual Tag & Release

If you prefer manual control or the automated script doesn't work:

### Step 1: Prepare Release
```bash
# Validate and build
npm run prepare-release
```

### Step 2: Manually Bump Version
Edit `manifest.json` and `package.json` to update version:
```json
{
  "version": "1.0.2"
}
```

### Step 3: Commit Changes
```bash
git add manifest.json package.json
git commit -m "Bump version to 1.0.2"
git push origin main
```

### Step 4: Create Tag
```bash
# Create annotated tag
git tag -a v1.0.2 -m "Release version 1.0.2"

# Push tag to GitHub
git push origin v1.0.2
```

### Step 5: Create GitHub Release
The tag push will automatically trigger the GitHub Actions workflow to create the release.

**OR** manually create release:
```bash
# Using GitHub CLI
gh release create v1.0.2 \
  dist/vibe-stats-v1.0.2.zip \
  manifest.json \
  --title "🤖 Vibe Stats v1.0.2 - AI Dev Tools Monitor" \
  --generate-notes \
  --latest
```

---

## 🤖 GitHub Actions Workflows

### Workflow 1: Manual Release (workflow_dispatch)

Trigger manually from GitHub Actions tab:

1. Go to **Actions** → **🚀 Release Build and Deploy**
2. Click **Run workflow**
3. Select version type: `patch`, `minor`, or `major`
4. Add optional release notes
5. Click **Run workflow**

### Workflow 2: Tag-Triggered Release (push tags)

Automatically triggers when you push a tag:

```bash
# Create and push tag
git tag v1.0.2
git push origin v1.0.2
```

The workflow will:
- ✅ Checkout repository
- ✅ Validate extension files
- ✅ Build extension zip
- ✅ Create GitHub release with artifacts
- ✅ Generate release notes

### Workflow 3: PR Build Validation (pull_request)

Automatically runs on pull requests to validate:
- ✅ All tests pass
- ✅ Extension files validate
- ✅ Build process succeeds

---

## 📦 NPM Scripts Reference

### Release Scripts
```bash
npm run release              # Shortcut for release:patch
npm run release:patch        # Automated patch release (1.0.1 → 1.0.2)
npm run release:minor        # Automated minor release (1.0.1 → 1.1.0)
npm run release:major        # Automated major release (1.0.1 → 2.0.0)
```

### Manual Release Scripts
```bash
npm run release:patch:manual # Build only, no git/GitHub operations
npm run release:minor:manual # Build only, no git/GitHub operations
npm run release:major:manual # Build only, no git/GitHub operations
```

### Build Scripts
```bash
npm run build                # Build extension (keep build dir)
npm run build:clean          # Build and remove build dir
npm run build:release        # Release build (clean naming)
npm run validate             # Validate files only
npm run prepare-release      # Validate + build
```

### Tag Scripts
```bash
npm run tag:create           # Create release from current version
npm run tag:push             # Push tags to GitHub
```

### Version Scripts
```bash
npm run version:check        # Check version consistency
npm run version:sync         # Sync package.json to manifest.json
npm run version:set          # Manually set version
npm run version:bump         # Bump version (interactive)
npm run version:validate     # Full validation (version + about + files)
```

---

## 🐛 Troubleshooting

### "Working directory is not clean"
```bash
# Check what's uncommitted
git status

# Commit or stash changes
git add .
git commit -m "Your changes"

# Or stash
git stash
```

### "GitHub CLI not available or not authenticated"
```bash
# Check if gh is installed
gh --version

# If not installed, install from: https://cli.github.com/

# Authenticate
gh auth login
```

### "Not on main/master branch"
```bash
# Check current branch
git branch

# Switch to main
git checkout main
git pull origin main
```

### "Failed to create zip file"
The build script will provide manual instructions. Alternatively:
```bash
# Windows (PowerShell)
Compress-Archive -Path build\* -DestinationPath dist\vibe-stats-v1.0.2.zip

# Unix/Mac
cd build && zip -r ../dist/vibe-stats-v1.0.2.zip .
```

### Release created but no zip attached
Manually upload the zip:
```bash
gh release upload v1.0.2 dist/vibe-stats-v1.0.2.zip
```

### Tag already exists
Delete and recreate:
```bash
# Delete local tag
git tag -d v1.0.2

# Delete remote tag
git push origin :refs/tags/v1.0.2

# Recreate tag
git tag -a v1.0.2 -m "Release version 1.0.2"
git push origin v1.0.2
```

---

## 📝 Best Practices

### Before Release
- [ ] All tests pass: `npm test`
- [ ] Build validates: `npm run validate`
- [ ] Version synced: `npm run version:check`
- [ ] Working directory clean: `git status`
- [ ] On main branch: `git branch`
- [ ] Up to date: `git pull origin main`

### Version Numbering (Semantic Versioning)
- **Patch (1.0.x)**: Bug fixes, documentation, minor tweaks
- **Minor (1.x.0)**: New features, backwards-compatible changes
- **Major (x.0.0)**: Breaking changes, major redesigns

### Release Checklist
1. ✅ Run automated release: `npm run release:patch`
2. ✅ Verify release on GitHub: Check releases page
3. ✅ Download zip from release
4. ✅ Test extension locally (load unpacked)
5. ✅ Submit to Chrome Web Store
6. ✅ Update store listing if needed
7. ✅ Announce release (optional)

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| **Patch release** | `npm run release:patch` |
| **Minor release** | `npm run release:minor` |
| **Major release** | `npm run release:major` |
| **Build only** | `npm run build:clean` |
| **Validate only** | `npm run validate` |
| **Check version** | `npm run version:check` |
| **Create tag** | `git tag v1.0.2 && git push origin v1.0.2` |
| **Manual release** | `gh release create v1.0.2 dist/*.zip --generate-notes` |

---

## 🔗 Resources

- **GitHub CLI Docs**: https://cli.github.com/manual/
- **Semantic Versioning**: https://semver.org/
- **Chrome Web Store**: https://chrome.google.com/webstore/devconsole/
- **Repository**: https://github.com/todddube/vstat

---

🤖 **Generated with [Claude Code](https://claude.ai/code)**
