#!/usr/bin/env node

/**
 * Version Synchronization Script for Vibe Stats
 * Ensures package.json and manifest.json versions are in sync
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

class VersionSync {
  constructor() {
    this.rootDir = path.join(__dirname, '..', '..');
    this.manifestPath = path.join(this.rootDir, 'manifest.json');
    this.packagePath = path.join(this.rootDir, 'package.json');
  }

  /**
   * Read and parse JSON file
   */
  readJsonFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write JSON file with formatting
   */
  writeJsonFile(filePath, data) {
    try {
      const content = JSON.stringify(data, null, 2) + '\n';
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check if versions are in sync
   */
  checkVersions() {
    console.log(colorize('🔍 Checking version synchronization...', 'cyan'));

    const manifest = this.readJsonFile(this.manifestPath);
    const packageJson = this.readJsonFile(this.packagePath);

    const manifestVersion = manifest.version;
    const packageVersion = packageJson.version;

    console.log(`   Manifest version: ${manifestVersion}`);
    console.log(`   Package version:  ${packageVersion}`);

    // Check for hardcoded versions in HTML files
    this.checkHtmlVersions(manifestVersion);

    return {
      manifest,
      packageJson,
      manifestVersion,
      packageVersion,
      inSync: manifestVersion === packageVersion
    };
  }

  /**
   * Check for hardcoded versions in HTML files
   */
  checkHtmlVersions(expectedVersion) {
    console.log(colorize('🔍 Checking HTML files for hardcoded versions...', 'cyan'));

    const htmlFiles = ['popup.html'];
    let foundIssues = false;

    htmlFiles.forEach(htmlFile => {
      const htmlPath = path.join(this.rootDir, htmlFile);
      if (fs.existsSync(htmlPath)) {
        try {
          const htmlContent = fs.readFileSync(htmlPath, 'utf8');

          // Look for hardcoded version patterns
          const versionPatterns = [
            /Version\s+\d+\.\d+\.\d+/g,
            /version.*\d+\.\d+\.\d+/gi
          ];

          versionPatterns.forEach(pattern => {
            const matches = htmlContent.match(pattern);
            if (matches) {
              matches.forEach(match => {
                // Skip if it's the loading placeholder
                if (!match.includes('Loading version')) {
                  console.log(colorize(`⚠️  Hardcoded version in ${htmlFile}: ${match}`, 'yellow'));
                  console.log(colorize(`   Expected: Dynamic loading from manifest (${expectedVersion})`, 'yellow'));
                  foundIssues = true;
                }
              });
            }
          });

          if (!foundIssues) {
            console.log(colorize(`✅ ${htmlFile} uses dynamic version loading`, 'green'));
          }
        } catch (error) {
          console.log(colorize(`⚠️  Could not check ${htmlFile}: ${error.message}`, 'yellow'));
        }
      }
    });

    return !foundIssues;
  }

  /**
   * Sync versions - manifest.json is the source of truth
   */
  syncToManifest() {
    console.log(colorize('🔄 Syncing package.json to manifest.json version...', 'cyan'));

    const { manifest, packageJson, manifestVersion, packageVersion, inSync } = this.checkVersions();

    if (inSync) {
      console.log(colorize('✅ Versions are already in sync!', 'green'));
      return { updated: false, version: manifestVersion };
    }

    // Update package.json to match manifest.json
    packageJson.version = manifestVersion;
    this.writeJsonFile(this.packagePath, packageJson);

    console.log(colorize(`✅ Updated package.json: ${packageVersion} → ${manifestVersion}`, 'green'));
    return { updated: true, version: manifestVersion, previousVersion: packageVersion };
  }

  /**
   * Sync versions - package.json is the source of truth
   */
  syncToPackage() {
    console.log(colorize('🔄 Syncing manifest.json to package.json version...', 'cyan'));

    const { manifest, packageJson, manifestVersion, packageVersion, inSync } = this.checkVersions();

    if (inSync) {
      console.log(colorize('✅ Versions are already in sync!', 'green'));
      return { updated: false, version: packageVersion };
    }

    // Update manifest.json to match package.json
    manifest.version = packageVersion;
    this.writeJsonFile(this.manifestPath, manifest);

    console.log(colorize(`✅ Updated manifest.json: ${manifestVersion} → ${packageVersion}`, 'green'));
    return { updated: true, version: packageVersion, previousVersion: manifestVersion };
  }

  /**
   * Set specific version in both files
   */
  setVersion(newVersion) {
    console.log(colorize(`🔧 Setting version to ${newVersion} in both files...`, 'cyan'));

    // Validate version format (basic semver check)
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(newVersion)) {
      throw new Error('Invalid version format. Use semantic versioning (x.y.z)');
    }

    const manifest = this.readJsonFile(this.manifestPath);
    const packageJson = this.readJsonFile(this.packagePath);

    const oldManifestVersion = manifest.version;
    const oldPackageVersion = packageJson.version;

    // Update both files
    manifest.version = newVersion;
    packageJson.version = newVersion;

    this.writeJsonFile(this.manifestPath, manifest);
    this.writeJsonFile(this.packagePath, packageJson);

    console.log(colorize(`✅ Updated manifest.json: ${oldManifestVersion} → ${newVersion}`, 'green'));
    console.log(colorize(`✅ Updated package.json: ${oldPackageVersion} → ${newVersion}`, 'green'));

    return {
      updated: true,
      version: newVersion,
      previousVersions: {
        manifest: oldManifestVersion,
        package: oldPackageVersion
      }
    };
  }

  /**
   * Bump version (patch, minor, or major)
   */
  bumpVersion(bumpType = 'patch') {
    console.log(colorize(`🔼 Bumping ${bumpType} version...`, 'cyan'));

    const { manifestVersion } = this.checkVersions();
    const [major, minor, patch] = manifestVersion.split('.').map(Number);

    let newVersion;
    switch (bumpType) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        throw new Error('Invalid bump type. Use: patch, minor, or major');
    }

    return this.setVersion(newVersion);
  }
}

/**
 * Command line interface
 */
function printUsage() {
  console.log(`
${colorize('Vibe Stats ⚡ - Version Synchronization', 'bright')}

${colorize('Usage:', 'cyan')}
  node sync-version.js [command] [options]

${colorize('Commands:', 'cyan')}
  ${colorize('check', 'green')}              Check if versions are in sync
  ${colorize('sync-to-manifest', 'green')}   Sync package.json to manifest.json
  ${colorize('sync-to-package', 'green')}    Sync manifest.json to package.json
  ${colorize('set <version>', 'green')}      Set specific version in both files
  ${colorize('bump [type]', 'green')}        Bump version (patch|minor|major)

${colorize('Examples:', 'cyan')}
  node sync-version.js check              # Check sync status
  node sync-version.js sync-to-manifest   # Use manifest as source
  node sync-version.js set 1.2.3          # Set to specific version
  node sync-version.js bump patch         # Bump patch version
  node sync-version.js bump minor         # Bump minor version
  node sync-version.js bump major         # Bump major version
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  const versionSync = new VersionSync();

  try {
    switch (command) {
      case 'check':
        {
          const result = versionSync.checkVersions();
          if (result.inSync) {
            console.log(colorize(`✅ Versions are in sync: ${result.manifestVersion}`, 'green'));
          } else {
            console.log(colorize('❌ Versions are out of sync!', 'red'));
            console.log(colorize('   Run sync command to fix', 'yellow'));
            process.exit(1);
          }
        }
        break;

      case 'sync-to-manifest':
        versionSync.syncToManifest();
        break;

      case 'sync-to-package':
        versionSync.syncToPackage();
        break;

      case 'set':
        {
          const version = args[1];
          if (!version) {
            console.log(colorize('❌ Please specify a version', 'red'));
            console.log('   Example: node sync-version.js set 1.2.3');
            process.exit(1);
          }
          versionSync.setVersion(version);
        }
        break;

      case 'bump':
        {
          const bumpType = args[1] || 'patch';
          versionSync.bumpVersion(bumpType);
        }
        break;

      default:
        console.log(colorize(`❌ Unknown command: ${command}`, 'red'));
        printUsage();
        process.exit(1);
    }

    console.log(colorize('\n✅ Version sync completed!', 'green'));

  } catch (error) {
    console.log(colorize(`❌ Error: ${error.message}`, 'red'));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(colorize('💥 Unexpected error:', 'red'), error);
    process.exit(1);
  });
}

module.exports = VersionSync;