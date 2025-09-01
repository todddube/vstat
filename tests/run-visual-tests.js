#!/usr/bin/env node

/**
 * Visual Test Runner for Claude Status Monitor Extension
 * Provides commands for running visual tests and opening interactive viewer
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

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

function printUsage() {
  console.log(`
${colorize('Claude Status Monitor - Visual Test Runner', 'bright')}

${colorize('Usage:', 'cyan')}
  node run-visual-tests.js [command] [options]

${colorize('Commands:', 'cyan')}
  ${colorize('test', 'green')}         Run visual integration tests  
  ${colorize('viewer', 'green')}       Open interactive visual test viewer
  ${colorize('validate', 'green')}     Validate visual assets and icons
  ${colorize('screenshot', 'green')}   Generate test screenshots (requires browser)
  ${colorize('help', 'green')}         Show this help message

${colorize('Examples:', 'cyan')}
  node run-visual-tests.js test        # Run automated visual tests
  node run-visual-tests.js viewer      # Open browser with visual test viewer
  node run-visual-tests.js validate    # Check all visual assets exist

${colorize('Visual Testing Workflow:', 'cyan')}
  1. ${colorize('run-visual-tests.js test', 'yellow')}      → Run automated tests
  2. ${colorize('run-visual-tests.js viewer', 'yellow')}    → Manual visual inspection
  3. ${colorize('run-visual-tests.js validate', 'yellow')}  → Asset verification
`);
}

async function runVisualTests() {
  console.log(colorize('🧪 Running Visual Integration Tests...', 'cyan'));
  
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npm', ['run', 'test', '--', 'visual-integration.test.js'], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(colorize('✅ Visual tests completed successfully!', 'green'));
        console.log(colorize('💡 Next: Run "node run-visual-tests.js viewer" for manual inspection', 'blue'));
        resolve();
      } else {
        console.log(colorize(`❌ Visual tests failed with exit code ${code}`, 'red'));
        reject(new Error(`Tests failed with code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      console.error(colorize(`Failed to start visual tests: ${error.message}`, 'red'));
      reject(error);
    });
  });
}

function openVisualViewer() {
  console.log(colorize('🎨 Opening Visual Test Viewer...', 'cyan'));
  
  const viewerPath = path.join(__dirname, 'visual-test-viewer.html');
  
  if (!fs.existsSync(viewerPath)) {
    console.error(colorize('❌ Visual test viewer not found!', 'red'));
    console.log(colorize('💡 Make sure visual-test-viewer.html exists in tests directory', 'yellow'));
    return;
  }

  // Try to open the HTML file in the default browser
  const command = process.platform === 'win32' ? 'start' : 
                 process.platform === 'darwin' ? 'open' : 'xdg-open';
  
  exec(`${command} "${viewerPath}"`, (error) => {
    if (error) {
      console.log(colorize('⚠️  Could not auto-open browser. Please manually open:', 'yellow'));
      console.log(colorize(`📁 ${viewerPath}`, 'blue'));
    } else {
      console.log(colorize('🌐 Visual test viewer opened in browser', 'green'));
    }
  });

  console.log(colorize('\n📋 Visual Testing Checklist:', 'cyan'));
  console.log('  ✅ Test all status icon states (operational, minor, major, critical, unknown)');
  console.log('  ✅ Verify badge indicators with different affected service counts');
  console.log('  ✅ Check popup interface with various status scenarios');
  console.log('  ✅ Validate service status icons and colors');
  console.log('  ✅ Test incident display formatting and empty states');
  console.log('  ✅ Confirm accessibility features (ARIA labels, alt text)');
}

async function validateAssets() {
  console.log(colorize('🔍 Validating Visual Assets...', 'cyan'));
  
  const iconsDir = path.join(__dirname, '../icons');
  const requiredIcons = [
    'claude-green-16.png', 'claude-green-32.png', 'claude-green-48.png', 'claude-green-128.png',
    'claude-yellow-16.png', 'claude-yellow-32.png', 'claude-yellow-48.png', 'claude-yellow-128.png', 
    'claude-red-16.png', 'claude-red-32.png', 'claude-red-48.png', 'claude-red-128.png',
    'claude-gray-16.png', 'claude-gray-32.png', 'claude-gray-48.png', 'claude-gray-128.png'
  ];

  if (!fs.existsSync(iconsDir)) {
    console.log(colorize(`❌ Icons directory not found: ${iconsDir}`, 'red'));
    console.log(colorize('💡 Run icon generation scripts to create required assets', 'yellow'));
    return;
  }

  let foundIcons = 0;
  let missingIcons = [];

  console.log(colorize(`📁 Checking icons in: ${iconsDir}`, 'blue'));
  
  requiredIcons.forEach(iconName => {
    const iconPath = path.join(iconsDir, iconName);
    if (fs.existsSync(iconPath)) {
      foundIcons++;
      console.log(colorize(`  ✅ ${iconName}`, 'green'));
    } else {
      missingIcons.push(iconName);
      console.log(colorize(`  ❌ ${iconName}`, 'red'));
    }
  });

  console.log(colorize(`\n📊 Asset Summary: ${foundIcons}/${requiredIcons.length} icons found`, 'cyan'));
  
  if (missingIcons.length > 0) {
    console.log(colorize('🚨 Missing Icons:', 'red'));
    missingIcons.forEach(icon => {
      console.log(colorize(`   - ${icon}`, 'red'));
    });
    console.log(colorize('\n💡 To create missing icons:', 'yellow'));
    console.log('   1. Run icon generation scripts in the root directory');
    console.log('   2. Check create_icons.js and create_colored_icons.js');
    console.log('   3. Ensure SVG source files are available');
  } else {
    console.log(colorize('🎉 All required icons found!', 'green'));
  }

  // Check other visual assets
  const otherAssets = [
    { file: 'visual-test-viewer.html', desc: 'Visual test viewer' },
    { file: 'unit/visual-integration.test.js', desc: 'Visual integration tests' }
  ];

  console.log(colorize('\n📄 Other Visual Test Assets:', 'cyan'));
  otherAssets.forEach(asset => {
    const assetPath = path.join(__dirname, asset.file);
    if (fs.existsSync(assetPath)) {
      console.log(colorize(`  ✅ ${asset.desc}`, 'green'));
    } else {
      console.log(colorize(`  ❌ ${asset.desc}`, 'red'));
    }
  });
}

async function generateScreenshots() {
  console.log(colorize('📸 Screenshot generation feature coming soon...', 'yellow'));
  console.log(colorize('💡 For now, use the visual test viewer for manual inspection', 'blue'));
  
  // Future enhancement: Use puppeteer or playwright to generate automated screenshots
  // of different extension states for visual regression testing
}

async function main() {
  const command = process.argv[2] || 'help';

  try {
    switch (command) {
      case 'test':
        await runVisualTests();
        break;
        
      case 'viewer':
        openVisualViewer();
        break;
        
      case 'validate':
        await validateAssets();
        break;
        
      case 'screenshot':
        await generateScreenshots();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        printUsage();
        break;
        
      default:
        console.error(colorize(`❌ Unknown command: ${command}`, 'red'));
        console.log(colorize('💡 Use "help" to see available commands', 'yellow'));
        process.exit(1);
    }
  } catch (error) {
    console.error(colorize(`❌ Error: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log(colorize('\n🛑 Visual test execution interrupted', 'yellow'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(colorize('\n🛑 Visual test execution terminated', 'yellow'));
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = {
  runVisualTests,
  openVisualViewer,
  validateAssets,
  generateScreenshots
};