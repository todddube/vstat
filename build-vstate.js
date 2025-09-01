#!/usr/bin/env node

/**
 * VState Extension Build Script 
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

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  log(`\n🚀 ${title}`, 'cyan');
  log('='.repeat(60), 'blue');
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logError = (message) => log(`❌ ${message}`, 'red');

class VStateBuildScript {
  constructor() {
    this.rootDir = process.cwd();
    this.buildDir = path.join(this.rootDir, 'build');
    this.distDir = path.join(this.rootDir, 'dist');
    this.startTime = Date.now();
    
    // Required files for the extension
    this.requiredFiles = [
      'manifest.json',
      'background.js',
      'popup.js',
      'popup.html',
      // VState icons (update for new naming)
      'icons/vstate-green-16.png',
      'icons/vstate-green-32.png',
      'icons/vstate-green-48.png',
      'icons/vstate-green-128.png',
      'icons/vstate-yellow-16.png',
      'icons/vstate-yellow-32.png',
      'icons/vstate-yellow-48.png',
      'icons/vstate-yellow-128.png',
      'icons/vstate-red-16.png',
      'icons/vstate-red-32.png',
      'icons/vstate-red-48.png',
      'icons/vstate-red-128.png',
      'icons/vstate-gray-16.png',
      'icons/vstate-gray-32.png',
      'icons/vstate-gray-48.png',
      'icons/vstate-gray-128.png'
    ];

    // Optional files
    this.optionalFiles = [
      'popup.css',
      'README.md',
      'LICENSE'
    ];
  }

  run() {
    try {
      logSection('Starting VState Extension Build');
      
      this.initializeDirectories();
      this.validateFiles();
      this.copyFiles();
      this.validateManifest();
      this.calculateBuildStats();
      this.createZipFile();
      this.generateReport();
      
      this.logBuildTime();
      logSuccess('Build completed successfully!');
      
    } catch (error) {
      logError(`Build failed: ${error.message}`);
      process.exit(1);
    }
  }

  initializeDirectories() {
    log('📁 Initializing build directories...');
    
    // Create directories if they don't exist
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }
    
    logSuccess(`Build directory: ${this.buildDir}`);
    logSuccess(`Dist directory: ${this.distDir}`);
  }

  validateFiles() {
    log('🔍 Validating required files...');
    
    const missingFiles = [];
    this.requiredFiles.forEach(file => {
      const filePath = path.join(this.rootDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length > 0) {
      logError(`Missing required files: ${missingFiles.join(', ')}`);
      throw new Error(`Missing required files. Please ensure all files exist.`);
    }
    
    logSuccess(`All ${this.requiredFiles.length} required files found`);
  }

  copyFiles() {
    log('📋 Copying extension files...');
    
    let copiedCount = 0;
    
    // Copy required files
    this.requiredFiles.forEach(file => {
      this.copyFile(file);
      copiedCount++;
    });
    
    // Copy optional files if they exist
    this.optionalFiles.forEach(file => {
      if (fs.existsSync(path.join(this.rootDir, file))) {
        this.copyFile(file);
        copiedCount++;
      } else {
        logWarning(`${file} (optional, skipped)`);
      }
    });
    
    log(`📋 Copied ${copiedCount} files to build directory`);
  }

  copyFile(file) {
    const sourcePath = path.join(this.rootDir, file);
    const destPath = path.join(this.buildDir, file);
    
    // Create directory structure if needed
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(sourcePath, destPath);
    logSuccess(file);
  }

  validateManifest() {
    log('📄 Validating manifest.json...');
    
    const manifestPath = path.join(this.buildDir, 'manifest.json');
    const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    this.manifestData = manifestData;
    
    logSuccess(`Extension: ${manifestData.name} v${manifestData.version}`);
    logSuccess(`Manifest version: ${manifestData.manifest_version}`);
  }

  calculateBuildStats() {
    log('📊 Calculating build size...');
    
    const files = this.getAllFiles(this.buildDir);
    this.fileCount = files.length;
    this.totalSize = files.reduce((sum, file) => {
      return sum + fs.statSync(file).size;
    }, 0);
    
    log(`📊 Build contains ${this.fileCount} files`);
    log(`📊 Total size: ${(this.totalSize / 1024).toFixed(2)} KB (${(this.totalSize / 1024 / 1024).toFixed(2)} MB)`);
  }

  getAllFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.getAllFiles(itemPath));
      } else {
        files.push(itemPath);
      }
    });
    
    return files;
  }

  createZipFile() {
    log('📦 Creating zip file...');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const zipFileName = `vstate-v${this.manifestData.version}-${timestamp}.zip`;
    const zipPath = path.join(this.distDir, zipFileName);
    
    this.zipFileName = zipFileName;
    this.zipPath = zipPath;
    
    // Use system zip command
    try {
      const cwd = process.cwd();
      process.chdir(this.buildDir);
      
      if (process.platform === 'win32') {
        // Windows PowerShell command
        execSync(`powershell -command "Compress-Archive -Path * -DestinationPath '${zipPath}' -Force"`, {
          stdio: 'pipe'
        });
      } else {
        // Unix zip command
        execSync(`zip -r "${zipPath}" .`, { stdio: 'pipe' });
      }
      
      process.chdir(cwd);
      
      this.zipSize = fs.statSync(zipPath).size;
      logSuccess(`Extension zip created: ${zipFileName}`);
      log(`📦 Zip size: ${(this.zipSize / 1024 / 1024).toFixed(2)} MB`);
      
    } catch (error) {
      throw new Error(`Failed to create zip file: ${error.message}`);
    }
  }

  generateReport() {
    const buildTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    logSection(`Build Report`);
    
    log('📦 Extension Details:', 'cyan');
    log(`   Name: ${this.manifestData.name}`);
    log(`   Version: ${this.manifestData.version}`);
    log(`   Description: ${this.manifestData.description}`);
    log(`   Manifest Version: ${this.manifestData.manifest_version}`);
    
    log('\n📊 Build Statistics:', 'cyan');
    log(`   Files: ${this.fileCount}`);
    log(`   Build Size: ${(this.totalSize / 1024).toFixed(2)} KB`);
    log(`   Zip Size: ${(this.zipSize / 1024).toFixed(2)} KB`);
    log(`   Compression: ${(((this.totalSize - this.zipSize) / this.totalSize) * 100).toFixed(1)}%`);
    
    log('\n📁 Output Files:', 'cyan');
    log(`   Build Directory: ${this.buildDir}`);
    log(`   Zip File: ${this.zipPath}`);
    
    log('\n🚀 Next Steps:', 'cyan');
    log('   1. Test the extension by loading the build directory');
    log('   2. Upload the zip file to Chrome Web Store');
    log('   3. Review the extension in the Chrome Web Store dashboard');
  }

  logBuildTime() {
    const buildTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    log(`\n⏱️  Build completed in ${buildTime}s\n`);
  }
}

// Run the build script
const builder = new VStateBuildScript();
builder.run();
