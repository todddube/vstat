#!/usr/bin/env node

/**
 * Extension Build Script for Claude Status Monitor
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
        'icons/claude-green-16.png',
        'icons/claude-green-32.png',
        'icons/claude-green-48.png',
        'icons/claude-green-128.png',
        'icons/claude-yellow-16.png',
        'icons/claude-yellow-32.png',
        'icons/claude-yellow-48.png',
        'icons/claude-yellow-128.png',
        'icons/claude-red-16.png',
        'icons/claude-red-32.png',
        'icons/claude-red-48.png',
        'icons/claude-red-128.png',
        'icons/claude-gray-16.png',
        'icons/claude-gray-32.png',
        'icons/claude-gray-48.png',
        'icons/claude-gray-128.png'
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
      'tests',
      'build',
      'dist',
      '.claude',
      'build-extension.js',
      'create_icons.js',
      'create_colored_icons.js',
      'convert_svg_to_png.html',
      'convert_all_icons.html',
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
   * Validate manifest.json
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
      
      return manifest;
    } catch (error) {
      console.log(colorize('❌ Invalid manifest.json:', 'red'));
      console.log(colorize(`   ${error.message}`, 'red'));
      throw error;
    }
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
  createZip(manifest) {
    console.log(colorize('📦 Creating zip file...', 'cyan'));
    
    const version = manifest.version;
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const zipName = `claude-status-monitor-v${version}-${timestamp}.zip`;
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
  generateBuildReport(manifest, buildStats, zipInfo) {
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
    
    console.log(colorize('\n🚀 Next Steps:', 'cyan'));
    console.log('   1. Test the extension by loading the build directory');
    console.log('   2. Upload the zip file to Chrome Web Store');
    console.log('   3. Review the extension in the Chrome Web Store dashboard');
    
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
   * Main build process
   */
  async build(options = {}) {
    const startTime = Date.now();
    
    console.log(colorize('🚀 Starting Claude Status Monitor Extension Build', 'bright'));
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
      const zipInfo = this.createZip(manifest);
      
      // Generate report
      const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(colorize(`\n⏱️  Build completed in ${buildTime}s`, 'blue'));
      
      this.generateBuildReport(manifest, buildStats, zipInfo);
      
      // Cleanup if requested
      this.cleanup(options.keepBuild !== false);
      
      return {
        success: true,
        manifest,
        buildStats,
        zipInfo,
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
${colorize('Claude Status Monitor - Extension Builder', 'bright')}

${colorize('Usage:', 'cyan')}
  node build-extension.js [options]

${colorize('Options:', 'cyan')}
  ${colorize('--help', 'green')}          Show this help message
  ${colorize('--clean', 'green')}         Remove build directory after creating zip
  ${colorize('--validate-only', 'green')} Only validate files, don't build

${colorize('Examples:', 'cyan')}
  node build-extension.js              # Build extension zip
  node build-extension.js --clean      # Build and clean up
  node build-extension.js --validate-only  # Just validate files

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
  
  const options = {
    keepBuild: !args.includes('--clean')
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