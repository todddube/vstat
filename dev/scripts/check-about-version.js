#!/usr/bin/env node

/**
 * About Version Checker for Vibe Stats
 * Ensures About popup shows correct version from manifest
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function checkAboutVersion() {
  const rootDir = path.join(__dirname, '..', '..');
  const manifestPath = path.join(rootDir, 'manifest.json');
  const popupPath = path.join(rootDir, 'popup.html');

  try {
    // Read manifest version
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    const manifestVersion = manifest.version;

    console.log(colorize('🔍 Checking About popup version...', 'cyan'));
    console.log(`   Manifest version: ${manifestVersion}`);

    // Check popup.html
    const popupContent = fs.readFileSync(popupPath, 'utf8');

    // Look for hardcoded versions
    const versionPattern = /id="about-version"[^>]*>([^<]+)</;
    const match = popupContent.match(versionPattern);

    if (match) {
      const aboutVersionText = match[1].trim();
      console.log(`   About popup text: "${aboutVersionText}"`);

      if (aboutVersionText === 'Loading version...') {
        console.log(colorize('✅ About popup uses dynamic version loading', 'green'));
        console.log(colorize('✅ Version will be loaded from manifest at runtime', 'green'));
        return true;
      } else if (aboutVersionText.includes(manifestVersion)) {
        console.log(colorize('⚠️  About popup has hardcoded version but matches manifest', 'yellow'));
        console.log(colorize('   Consider using dynamic loading: "Loading version..."', 'yellow'));
        return true;
      } else {
        console.log(colorize('❌ About popup version does not match manifest', 'red'));
        console.log(colorize('   Update popup.html to use: "Loading version..."', 'red'));
        return false;
      }
    } else {
      console.log(colorize('⚠️  Could not find about-version element in popup.html', 'yellow'));
      return false;
    }

  } catch (error) {
    console.log(colorize(`❌ Error: ${error.message}`, 'red'));
    return false;
  }
}

function main() {
  console.log(colorize('🚀 Vibe Stats - About Version Checker', 'cyan'));
  console.log('');

  const isValid = checkAboutVersion();

  console.log('');
  if (isValid) {
    console.log(colorize('✅ About version check passed!', 'green'));
  } else {
    console.log(colorize('❌ About version check failed!', 'red'));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkAboutVersion };