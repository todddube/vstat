#!/usr/bin/env node

/**
 * Extension Build Script for Vibe Stats - Dev Tools Status Monitor
 * Creates production-ready zip files for Chrome Web Store submission
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

class ExtensionBuilder {
  constructor() {
    this.rootDir = __dirname;
    this.buildDir = path.join(this.rootDir, 'build');
    this.distDir = path.join(this.rootDir, 'dist');
    
    // Define required files for the extension
    this.requiredFiles = {
      // Core extension files
      core: [
        'manifest.json',
        'background.js',
        'popup.js',
        'popup.html'
      ],
      
      // Icon files
      icons: [
        'icons/ai-vibe-16.png',
        'icons/ai-vibe-32.png',
        'icons/ai-vibe-48.png',
        'icons/ai-vibe-128.png'
      ],
      
      // Optional files
      optional: [
        'popup.css',
        'README.md',
        'LICENSE'
      ]
    };
    
    // Files/directories to exclude
    this.excludePatterns = [
      '.git',
      '.gitignore',
      'node_modules',
      'build',
      'dist',
      '.claude',
      'build-extension.js',
      '*.md',
      '*.log',
      '.DS_Store',
      'Thumbs.db'
    ];
  }

  /**
   * Initialize build directories
   */
  initDirectories() {
    console.log(colorize('📁 Initializing build directories...', 'cyan'));
    
    // Clean and create build directory
    if (fs.existsSync(this.buildDir)) {
      fs.rmSync(this.buildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.buildDir, { recursive: true });
    
    // Create dist directory if it doesn't exist
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }
    
    console.log(colorize(`✅ Build directory: ${this.buildDir}`, 'green'));
    console.log(colorize(`✅ Dist directory: ${this.distDir}`, 'green'));
  }

  /**
   * Validate that all required files exist
   */
  validateRequiredFiles() {
    console.log(colorize('🔍 Validating required files...', 'cyan'));
    
    const missingFiles = [];
    const allRequired = [...this.requiredFiles.core, ...this.requiredFiles.icons];
    
    allRequired.forEach(file => {
      const filePath = path.join(this.rootDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length > 0) {
      console.log(colorize('❌ Missing required files:', 'red'));
      missingFiles.forEach(file => {
        console.log(colorize(`   - ${file}`, 'red'));
      });
      throw new Error('Missing required files. Please ensure all files exist before building.');
    }
    
    console.log(colorize(`✅ All ${allRequired.length} required files found`, 'green'));
  }

  /**
   * Copy files to build directory
   */
  copyFiles() {
    console.log(colorize('📋 Copying extension files...', 'cyan'));
    
    let copiedCount = 0;
    const allFiles = [
      ...this.requiredFiles.core,
      ...this.requiredFiles.icons,
      ...this.requiredFiles.optional
    ];
    
    allFiles.forEach(file => {
      const sourcePath = path.join(this.rootDir, file);
      const targetPath = path.join(this.buildDir, file);
      
      if (fs.existsSync(sourcePath)) {
        // Create directory if it doesn't exist
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy file
        fs.copyFileSync(sourcePath, targetPath);
        console.log(colorize(`   ✅ ${file}`, 'green'));
        copiedCount++;
      } else if (this.requiredFiles.optional.includes(file)) {
        console.log(colorize(`   ⚠️  ${file} (optional, skipped)`, 'yellow'));
      }
    });
    
    console.log(colorize(`📋 Copied ${copiedCount} files to build directory`, 'blue'));
  }

  /**
   * Validate manifest.json and version consistency
   */
  validateManifest() {
    console.log(colorize('📄 Validating manifest.json...', 'cyan'));

    const manifestPath = path.join(this.buildDir, 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    try {
      const manifest = JSON.parse(manifestContent);

      // Check required fields
      const requiredFields = ['manifest_version', 'name', 'version', 'description'];
      const missingFields = requiredFields.filter(field => !manifest[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required manifest fields: ${missingFields.join(', ')}`);
      }

      console.log(colorize(`✅ Extension: ${manifest.name} v${manifest.version}`, 'green'));
      console.log(colorize(`✅ Manifest version: ${manifest.manifest_version}`, 'green'));

      // Validate version consistency
      this.validateVersionConsistency(manifest);

      return manifest;
    } catch (error) {
      console.log(colorize('❌ Invalid manifest.json:', 'red'));
      console.log(colorize(`   ${error.message}`, 'red'));
      throw error;
    }
  }

  /**
   * Validate version consistency across files
   */
  validateVersionConsistency(manifest) {
    console.log(colorize('🔍 Validating version consistency...', 'cyan'));

    const manifestVersion = manifest.version;

    // Check package.json version if it exists
    const packagePath = path.join(this.buildDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);

        if (packageJson.version !== manifestVersion) {
          console.log(colorize(`⚠️  Version mismatch: manifest.json (${manifestVersion}) vs package.json (${packageJson.version})`, 'yellow'));
          console.log(colorize('   Consider running: npm run version:sync', 'yellow'));
        } else {
          console.log(colorize(`✅ Package.json version matches: ${manifestVersion}`, 'green'));
        }
      } catch (error) {
        console.log(colorize('⚠️  Could not validate package.json version', 'yellow'));
      }
    }

    // Check for hardcoded versions in HTML files
    const htmlFiles = ['popup.html'];
    htmlFiles.forEach(htmlFile => {
      const htmlPath = path.join(this.buildDir, htmlFile);
      if (fs.existsSync(htmlPath)) {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Look for hardcoded version patterns
        const versionPatterns = [
          /Version\s+\d+\.\d+\.\d+/g,
          /version.*\d+\.\d+\.\d+/gi
        ];

        let foundHardcodedVersions = false;
        versionPatterns.forEach(pattern => {
          const matches = htmlContent.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Skip if it's the loading placeholder
              if (!match.includes('Loading version')) {
                console.log(colorize(`⚠️  Potential hardcoded version in ${htmlFile}: ${match}`, 'yellow'));
                console.log(colorize('   Consider using dynamic version loading from manifest', 'yellow'));
                foundHardcodedVersions = true;
              }
            });
          }
        });

        if (!foundHardcodedVersions) {
          console.log(colorize(`✅ No hardcoded versions found in ${htmlFile}`, 'green'));
        }
      }
    });
  }

  /**
   * Calculate build size
   */
  calculateBuildSize() {
    console.log(colorize('📊 Calculating build size...', 'cyan'));
    
    let totalSize = 0;
    let fileCount = 0;
    
    const calculateDirSize = (dirPath) => {
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          calculateDirSize(filePath);
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      });
    };
    
    calculateDirSize(this.buildDir);
    
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const sizeKB = (totalSize / 1024).toFixed(2);
    
    console.log(colorize(`📊 Build contains ${fileCount} files`, 'blue'));
    console.log(colorize(`📊 Total size: ${sizeKB} KB (${sizeMB} MB)`, 'blue'));
    
    // Warn if size is getting large for Chrome Web Store
    if (totalSize > 20 * 1024 * 1024) { // 20MB
      console.log(colorize('⚠️  Warning: Extension size exceeds 20MB', 'yellow'));
    }
    
    return { totalSize, fileCount, sizeKB, sizeMB };
  }

  /**
   * Create zip file
   */
  createZip(manifest, options = {}) {
    console.log(colorize('📦 Creating zip file...', 'cyan'));

    const version = manifest.version;
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // For release builds, use cleaner naming
    const zipName = options.isRelease ?
      `vibe-stats-v${version}.zip` :
      `vibe-stats-v${version}-${timestamp}.zip`;

    const zipPath = path.join(this.distDir, zipName);
    
    try {
      // Use native zip command or 7zip if available
      const buildDirName = path.basename(this.buildDir);
      const buildParentDir = path.dirname(this.buildDir);
      
      // Try different zip commands based on platform
      let zipCommand;
      if (process.platform === 'win32') {
        // Windows - try PowerShell Compress-Archive
        zipCommand = `powershell -Command "Compress-Archive -Path '${this.buildDir}\\*' -DestinationPath '${zipPath}' -Force"`;
      } else {
        // Unix-like systems
        zipCommand = `cd "${buildParentDir}" && zip -r "${zipPath}" "${buildDirName}"`;
      }
      
      execSync(zipCommand, { stdio: 'pipe' });
      
      // Verify zip was created
      if (fs.existsSync(zipPath)) {
        const zipStats = fs.statSync(zipPath);
        const zipSizeMB = (zipStats.size / (1024 * 1024)).toFixed(2);
        
        console.log(colorize(`✅ Extension zip created: ${zipName}`, 'green'));
        console.log(colorize(`📦 Zip size: ${zipSizeMB} MB`, 'green'));
        
        return { zipPath, zipName, zipSize: zipStats.size };
      } else {
        throw new Error('Zip file was not created');
      }
    } catch (error) {
      console.log(colorize('❌ Failed to create zip file:', 'red'));
      console.log(colorize(`   ${error.message}`, 'red'));
      
      // Fallback: provide manual instructions
      console.log(colorize('\n💡 Manual zip creation:', 'yellow'));
      console.log(colorize(`   1. Navigate to: ${this.buildDir}`, 'yellow'));
      console.log(colorize('   2. Select all files and folders', 'yellow'));
      console.log(colorize('   3. Create zip archive', 'yellow'));
      console.log(colorize(`   4. Save as: ${zipName}`, 'yellow'));
      
      throw error;
    }
  }

  /**
   * Generate build report
   */
  generateBuildReport(manifest, buildStats, zipInfo, options = {}, releaseInfo = null) {
    console.log(colorize('\n📋 Build Report', 'bright'));
    console.log(colorize('='.repeat(50), 'blue'));

    console.log(colorize('📦 Extension Details:', 'cyan'));
    console.log(`   Name: ${manifest.name}`);
    console.log(`   Version: ${manifest.version}`);
    console.log(`   Description: ${manifest.description}`);
    console.log(`   Manifest Version: ${manifest.manifest_version}`);

    console.log(colorize('\n📊 Build Statistics:', 'cyan'));
    console.log(`   Files: ${buildStats.fileCount}`);
    console.log(`   Build Size: ${buildStats.sizeKB} KB`);
    console.log(`   Zip Size: ${(zipInfo.zipSize / 1024).toFixed(2)} KB`);
    console.log(`   Compression: ${((1 - zipInfo.zipSize / buildStats.totalSize) * 100).toFixed(1)}%`);

    console.log(colorize('\n📁 Output Files:', 'cyan'));
    console.log(`   Build Directory: ${this.buildDir}`);
    console.log(`   Zip File: ${zipInfo.zipPath}`);

    if (releaseInfo) {
      console.log(colorize('\n🎉 GitHub Release:', 'cyan'));
      console.log(`   Version: ${releaseInfo.version}`);
      console.log(`   Release URL: ${releaseInfo.releaseUrl}`);
      console.log(`   Tag: v${releaseInfo.version}`);
    }

    if (options.createRelease) {
      console.log(colorize('\n🚀 Release Build Next Steps:', 'cyan'));
      if (releaseInfo) {
        console.log('   1. ✅ GitHub release created successfully');
        console.log('   2. Download zip from GitHub release for Chrome Web Store');
        console.log('   3. Submit to Chrome Web Store Developer Dashboard');
      } else {
        console.log('   1. ⚠️  GitHub release creation failed');
        console.log('   2. Manually create release or check GitHub CLI setup');
        console.log('   3. Upload the zip file to Chrome Web Store');
      }
    } else if (options.isRelease) {
      console.log(colorize('\n🚀 Release Build Next Steps:', 'cyan'));
      console.log('   1. This is a release build - ready for manual upload');
      console.log('   2. Use --create-release flag to automate GitHub release');
      console.log('   3. Upload zip to Chrome Web Store Developer Dashboard');
    } else {
      console.log(colorize('\n🚀 Development Build Next Steps:', 'cyan'));
      console.log('   1. Test the extension by loading the build directory');
      console.log('   2. Upload the zip file to Chrome Web Store');
      console.log('   3. Review the extension in the Chrome Web Store dashboard');
    }

    console.log(colorize('\n✅ Build completed successfully!', 'green'));
  }

  /**
   * Clean up build directory (optional)
   */
  cleanup(keepBuild = true) {
    if (!keepBuild && fs.existsSync(this.buildDir)) {
      console.log(colorize('🧹 Cleaning up build directory...', 'yellow'));
      fs.rmSync(this.buildDir, { recursive: true, force: true });
      console.log(colorize('✅ Build directory cleaned', 'green'));
    }
  }

  /**
   * Validate GitHub CLI and authentication
   */
  validateGitHubCLI() {
    try {
      execSync('gh --version', { stdio: 'pipe' });
      execSync('gh auth status', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current version and bump it
   */
  bumpVersion(currentVersion, bumpType) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (bumpType) {
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'major':
        return `${major + 1}.0.0`;
      default:
        throw new Error(`Invalid bump type: ${bumpType}. Use patch, minor, or major.`);
    }
  }

  /**
   * Update version in package.json and manifest.json
   */
  updateVersionFiles(newVersion) {
    console.log(colorize(`📝 Updating version to ${newVersion}...`, 'cyan'));

    // Update package.json
    const packagePath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      packageJson.version = newVersion;
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    }

    // Update manifest.json
    const manifestPath = path.join(this.rootDir, 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    manifest.version = newVersion;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    console.log(colorize(`✅ Updated files to version ${newVersion}`, 'green'));
  }

  /**
   * Create GitHub release with tag
   */
  async createGitHubRelease(manifest, buildStats, zipInfo, bumpType) {
    console.log(colorize('🎉 Creating GitHub release...', 'cyan'));

    try {
      // Get current version and bump it
      const currentVersion = manifest.version;
      const newVersion = this.bumpVersion(currentVersion, bumpType);

      // Update version files
      this.updateVersionFiles(newVersion);

      // Commit version changes
      execSync('git add package.json manifest.json');
      execSync(`git commit -m "Bump version to ${newVersion}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`);

      // Create tag
      execSync(`git tag -a v${newVersion} -m "Release version ${newVersion}"`);

      // Push changes and tags
      execSync('git push origin main');
      execSync('git push origin --tags');

      // Generate release notes
      const releaseNotes = `## Vibe Stats v${newVersion} ⚡

${manifest.description}

### 📦 Extension Details
- **Version**: ${newVersion}
- **Size**: ${buildStats.sizeKB} KB (${buildStats.fileCount} files)
- **Manifest Version**: ${manifest.manifest_version}

### 🚀 Installation
1. Download the \`vibe-stats-v${newVersion}.zip\` file from this release
2. Open Chrome/Edge and navigate to \`chrome://extensions/\`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extracted extension folder
5. The extension icon will appear in your browser toolbar

### 🔧 Development
- Monitor Claude AI and GitHub Copilot status in real-time
- AI-themed vibe indicators with smart status aggregation
- Auto-refresh every 5 minutes with manual refresh option
- Detailed incident reporting and status history

### 📊 Build Statistics
- Files: ${buildStats.fileCount}
- Uncompressed: ${buildStats.sizeKB} KB
- Compressed: ${(zipInfo.zipSize / 1024).toFixed(2)} KB
- Compression: ${((1 - zipInfo.zipSize / buildStats.totalSize) * 100).toFixed(1)}%

---

🤖 *Generated with [Claude Code](https://claude.ai/code)*`;

      // Create GitHub release with file upload
      execSync(`gh release create v${newVersion} "${zipInfo.zipPath}" --title "Vibe Stats v${newVersion}" --notes "${releaseNotes.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, { stdio: 'inherit' });

      // Get release URL
      const releaseUrl = execSync(`gh release view v${newVersion} --json url --jq .url`, { encoding: 'utf8' }).trim();

      console.log(colorize(`✅ Created GitHub release v${newVersion}`, 'green'));
      console.log(colorize(`🔗 Release URL: ${releaseUrl}`, 'blue'));

      return { version: newVersion, releaseUrl };
    } catch (error) {
      console.log(colorize('❌ Failed to create GitHub release:', 'red'));
      console.log(colorize(error.message, 'red'));
      throw error;
    }
  }

  /**
   * Main build process
   */
  async build(options = {}) {
    const startTime = Date.now();

    console.log(colorize('🚀 Starting Vibe Stats Extension Build ⚡', 'bright'));
    console.log(colorize('='.repeat(60), 'blue'));

    try {
      // Initialize
      this.initDirectories();

      // Validate required files
      this.validateRequiredFiles();

      // Copy files
      this.copyFiles();

      // Validate manifest
      const manifest = this.validateManifest();

      // Calculate build stats
      const buildStats = this.calculateBuildSize();

      // Create zip
      const zipInfo = this.createZip(manifest, options);

      // Handle GitHub release if requested
      let releaseInfo = null;
      if (options.createRelease && options.bumpType) {
        if (!this.validateGitHubCLI()) {
          console.log(colorize('⚠️  GitHub CLI not available or not authenticated. Skipping release creation.', 'yellow'));
          console.log(colorize('   Install GitHub CLI and run: gh auth login', 'yellow'));
        } else {
          try {
            releaseInfo = await this.createGitHubRelease(manifest, buildStats, zipInfo, options.bumpType);
          } catch (error) {
            console.log(colorize('⚠️  Release creation failed, but build succeeded', 'yellow'));
          }
        }
      }

      // Generate report
      const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(colorize(`\n⏱️  Build completed in ${buildTime}s`, 'blue'));

      this.generateBuildReport(manifest, buildStats, zipInfo, options, releaseInfo);

      // Cleanup if requested
      this.cleanup(options.keepBuild !== false);

      return {
        success: true,
        manifest,
        buildStats,
        zipInfo,
        releaseInfo,
        buildTime: parseFloat(buildTime)
      };

    } catch (error) {
      console.log(colorize('\n❌ Build failed:', 'red'));
      console.log(colorize(`   ${error.message}`, 'red'));

      // Cleanup on failure
      this.cleanup(false);

      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Command line interface
 */
function printUsage() {
  console.log(`
${colorize('Vibe Stats ⚡ - Extension Builder', 'bright')}

${colorize('Usage:', 'cyan')}
  node build-extension.js [options]

${colorize('Options:', 'cyan')}
  ${colorize('--help', 'green')}             Show this help message
  ${colorize('--clean', 'green')}            Remove build directory after creating zip
  ${colorize('--release', 'green')}          Create release build (clean naming)
  ${colorize('--validate-only', 'green')}    Only validate files, don't build
  ${colorize('--create-release <type>', 'green')} Create GitHub release (patch|minor|major)

${colorize('Examples:', 'cyan')}
  node build-extension.js                    # Build extension zip
  node build-extension.js --clean            # Build and clean up
  node build-extension.js --release          # Release build
  node build-extension.js --validate-only    # Just validate files
  node build-extension.js --create-release patch  # Build and create patch release
  node build-extension.js --create-release minor  # Build and create minor release

${colorize('GitHub Release:', 'cyan')}
  The --create-release option will:
  1. Bump version (patch/minor/major)
  2. Update package.json and manifest.json
  3. Build extension zip
  4. Commit version changes
  5. Create Git tag
  6. Push to GitHub
  7. Create GitHub release with zip attachment

${colorize('Prerequisites for GitHub Release:', 'cyan')}
  - Clean working directory (no uncommitted changes)
  - GitHub CLI installed and authenticated (gh auth login)
  - Push access to the repository

${colorize('Output:', 'cyan')}
  Build files: ./build/
  Zip files: ./dist/
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const builder = new ExtensionBuilder();

  if (args.includes('--validate-only')) {
    console.log(colorize('🔍 Validation Mode', 'bright'));
    try {
      builder.validateRequiredFiles();
      console.log(colorize('✅ All files validated successfully!', 'green'));
    } catch (error) {
      console.log(colorize('❌ Validation failed:', 'red'));
      console.log(colorize(`   ${error.message}`, 'red'));
      process.exit(1);
    }
    return;
  }

  // Check for create-release option
  let createRelease = false;
  let bumpType = null;
  const createReleaseIndex = args.findIndex(arg => arg === '--create-release');
  if (createReleaseIndex !== -1) {
    createRelease = true;
    bumpType = args[createReleaseIndex + 1];

    if (!bumpType || !['patch', 'minor', 'major'].includes(bumpType)) {
      console.log(colorize('❌ Invalid or missing bump type for --create-release', 'red'));
      console.log(colorize('   Use: --create-release patch|minor|major', 'yellow'));
      process.exit(1);
    }

    // Check working directory is clean
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.log(colorize('❌ Working directory is not clean:', 'red'));
        console.log(status);
        console.log(colorize('Please commit or stash changes before creating a release.', 'yellow'));
        process.exit(1);
      }
    } catch (error) {
      console.log(colorize('❌ Failed to check git status. Ensure you are in a git repository.', 'red'));
      process.exit(1);
    }
  }

  const options = {
    keepBuild: !args.includes('--clean'),
    isRelease: args.includes('--release') || createRelease,
    createRelease,
    bumpType
  };

  const result = await builder.build(options);

  if (!result.success) {
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log(colorize('\n🛑 Build interrupted', 'yellow'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(colorize('\n🛑 Build terminated', 'yellow'));
  process.exit(0);
});

if (require.main === module) {
  main().catch(error => {
    console.error(colorize('💥 Unexpected error:', 'red'), error);
    process.exit(1);
  });
}

module.exports = ExtensionBuilder;