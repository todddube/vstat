#!/usr/bin/env node

/**
 * Test runner for Claude Status Monitor Extension
 * Provides convenient commands for running different test suites
 */

const { spawn } = require('child_process');
const path = require('path');

// Test command configurations
const TEST_COMMANDS = {
  all: ['jest'],
  unit: ['jest', 'tests/unit'],
  integration: ['jest', 'tests/integration'],
  coverage: ['jest', '--coverage'],
  watch: ['jest', '--watch'],
  debug: ['node', '--inspect-brk', 'node_modules/.bin/jest', '--runInBand'],
  ci: ['jest', '--coverage', '--watchAll=false', '--passWithNoTests']
};

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
${colorize('Claude Status Monitor - Test Runner', 'bright')}

${colorize('Usage:', 'cyan')}
  node run-tests.js [command] [options]

${colorize('Commands:', 'cyan')}
  ${colorize('all', 'green')}         Run all tests (default)
  ${colorize('unit', 'green')}        Run unit tests only
  ${colorize('integration', 'green')} Run integration tests only
  ${colorize('coverage', 'green')}    Run tests with coverage report
  ${colorize('watch', 'green')}       Run tests in watch mode
  ${colorize('debug', 'green')}       Run tests in debug mode
  ${colorize('ci', 'green')}          Run tests in CI mode
  ${colorize('help', 'green')}        Show this help message

${colorize('Examples:', 'cyan')}
  node run-tests.js                    # Run all tests
  node run-tests.js unit               # Run unit tests
  node run-tests.js coverage           # Run with coverage
  node run-tests.js watch              # Watch mode for development

${colorize('Environment Variables:', 'cyan')}
  ${colorize('DEBUG=1', 'yellow')}                Enable verbose test output
  ${colorize('CI=1', 'yellow')}                   Enable CI mode automatically
`);
}

function runTests(command, args = []) {
  const testDir = path.dirname(__filename);
  
  console.log(colorize('🧪 Starting Claude Status Monitor tests...', 'cyan'));
  console.log(colorize(`📂 Test directory: ${testDir}`, 'blue'));
  console.log(colorize(`🔧 Command: ${command.join(' ')}`, 'blue'));
  console.log('');

  const child = spawn('npm', ['run', 'test', '--', ...command.slice(1), ...args], {
    cwd: testDir,
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (error) => {
    console.error(colorize(`❌ Failed to start tests: ${error.message}`, 'red'));
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(colorize('✅ All tests completed successfully!', 'green'));
    } else {
      console.log(colorize(`❌ Tests failed with exit code ${code}`, 'red'));
    }
    process.exit(code);
  });
}

function checkTestEnvironment() {
  const fs = require('fs');
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error(colorize('❌ package.json not found. Please run from tests directory.', 'red'));
    console.log(colorize('💡 Try: cd tests && npm install', 'yellow'));
    process.exit(1);
  }

  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.error(colorize('❌ Dependencies not installed.', 'red'));
    console.log(colorize('💡 Run: npm install', 'yellow'));
    process.exit(1);
  }
}

function main() {
  const command = process.argv[2] || 'all';
  const additionalArgs = process.argv.slice(3);

  if (command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  // Check if running in CI environment
  if (process.env.CI === '1' || process.env.CI === 'true') {
    console.log(colorize('🤖 CI mode detected', 'yellow'));
    runTests(TEST_COMMANDS.ci, additionalArgs);
    return;
  }

  // Validate command
  if (!TEST_COMMANDS[command]) {
    console.error(colorize(`❌ Unknown command: ${command}`, 'red'));
    console.log(colorize('💡 Available commands:', 'yellow'), Object.keys(TEST_COMMANDS).join(', '));
    console.log(colorize('📖 Use "help" for more information', 'blue'));
    process.exit(1);
  }

  // Check environment
  checkTestEnvironment();

  // Set debug mode if requested
  if (process.env.DEBUG === '1') {
    process.env.JEST_DEBUG = '1';
    console.log(colorize('🐛 Debug mode enabled', 'yellow'));
  }

  // Run tests
  runTests(TEST_COMMANDS[command], additionalArgs);
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log(colorize('\n🛑 Test execution interrupted', 'yellow'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(colorize('\n🛑 Test execution terminated', 'yellow'));
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { runTests, TEST_COMMANDS };