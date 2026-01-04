# Release Guide

Quick reference for releasing Vibe Stats.

## Quick Release

### Automated (Recommended)

```bash
npm run release:patch   # Bug fixes: 1.0.0 → 1.0.1
npm run release:minor   # Features:  1.0.0 → 1.1.0
npm run release:major   # Breaking:  1.0.0 → 2.0.0
```

### Manual

```bash
# 1. Update version in manifest.json

# 2. Sync and build
npm run version:sync
npm run build:clean

# 3. Commit and tag
git add .
git commit -m "v1.2.6 - Description"
git push origin main
git tag v1.2.6
git push origin v1.2.6

# 4. Create release
gh release create v1.2.6 ./dist/*.zip --title "v1.2.6" --generate-notes
```

## Pre-Release Checklist

- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run validate`
- [ ] Working directory clean
- [ ] On main branch

## Post-Release

1. Download zip from [GitHub Releases](https://github.com/todddube/vstat/releases)
2. Submit to [Chrome Web Store](https://chrome.google.com/webstore/devconsole/)
3. Test in clean browser profile

## Version History

### v1.2.6 (2026-01-04)
- Error handling improvements
- Performance optimizations (DOM caching, storage pruning)
- Accessibility improvements
- Enhanced status indicator visibility

### v1.2.5 (2025-12-22)
- Modern light theme UI redesign
- Improved popup styling

### v1.2.0 (2025-11-02)
- Bug fixes and improvements

### v1.1.0 (2025-10-11)
- Minor release with enhancements

### v1.0.4 (2025-10-04)
- Streamlined dual-service monitoring

---

See [BUILD.md](BUILD.md) for detailed build and release instructions.
