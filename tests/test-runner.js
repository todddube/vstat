#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Vibe Stats Extension
 * Runs API tests, visual tests, and generates reports
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Import test modules
const APITester = require('./api-tester');
const VisualTester = require('./visual-tester');

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

class TestRunner {
  constructor() {
    this.results = {
      api: null,
      visual: null,
      summary: {}
    };
    this.startTime = Date.now();
  }

  /**
   * Main test runner entry point
   */
  async run(options = {}) {
    console.log(colorize('⚡ Vibe Stats Extension Test Suite', 'bright'));
    console.log(colorize('=' .repeat(60), 'blue'));
    console.log(`Started: ${new Date().toLocaleString()}`);
    console.log('');

    try {
      // Parse command line options
      const testTypes = this.parseTestTypes(options);
      
      // Run selected tests
      if (testTypes.api) {
        await this.runAPITests();
      }
      
      if (testTypes.visual) {
        await this.runVisualTests();
      }
      
      if (testTypes.all || (!testTypes.api && !testTypes.visual)) {
        await this.runAPITests();
        await this.runVisualTests();
      }

      // Generate comprehensive report
      this.generateFinalReport();
      
      // Export results if requested
      if (options.export) {
        await this.exportResults();
      }

      // Open viewer if requested
      if (options.viewer) {
        this.openViewer();
      }

      return this.results;

    } catch (error) {
      console.log(colorize(`\n❌ Test suite failed: ${error.message}`, 'red'));
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments for test types
   */
  parseTestTypes(options) {
    return {
      all: options.all || (!options.api && !options.visual),
      api: options.api || false,
      visual: options.visual || false
    };
  }

  /**
   * Run API tests
   */
  async runAPITests() {
    console.log(colorize('\n📡 Running API Tests', 'cyan'));
    console.log('-' .repeat(40));

    try {
      const apiTester = new APITester();
      this.results.api = await apiTester.runAllTests();
      
      console.log(colorize('✅ API tests completed successfully', 'green'));
    } catch (error) {
      console.log(colorize(`❌ API tests failed: ${error.message}`, 'red'));
      throw error;
    }
  }

  /**
   * Run visual tests
   */
  async runVisualTests() {
    console.log(colorize('\n🎨 Running Visual Tests', 'cyan'));
    console.log('-' .repeat(40));

    try {
      const visualTester = new VisualTester();
      this.results.visual = await visualTester.runAllTests();
      
      console.log(colorize('✅ Visual tests completed successfully', 'green'));
    } catch (error) {
      console.log(colorize(`❌ Visual tests failed: ${error.message}`, 'red'));
      throw error;
    }
  }

  /**
   * Generate comprehensive final report
   */
  generateFinalReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log(colorize('\n📋 Final Test Report', 'bright'));
    console.log(colorize('=' .repeat(60), 'blue'));

    // Test execution summary
    console.log(colorize('\n⏱️  Execution Summary:', 'magenta'));
    console.log(`   Duration: ${duration}s`);
    console.log(`   Completed: ${new Date().toLocaleString()}`);

    // API test results
    if (this.results.api) {
      const api = this.results.api;
      console.log(colorize('\n📡 API Test Results:', 'magenta'));
      console.log(`   Claude Endpoints: ${Object.keys(api.claude.endpoints).length}`);
      console.log(`   GitHub Endpoints: ${Object.keys(api.github.endpoints).length}`);
      console.log(`   Combined Tests: ${api.combined.length}`);
      console.log(`   Total Errors: ${api.claude.errors.length + api.github.errors.length}`);
      
      // Status summary
      console.log(`   Current Status: Claude(${api.claude.status}) | GitHub(${api.github.status})`);
    }

    // Visual test results  
    if (this.results.visual) {
      const visual = this.results.visual;
      const iconCount = Object.keys(visual.icons).length;
      const iconSuccess = Object.values(visual.icons).filter(icon => icon.status === 'success').length;
      const badgeCount = Object.keys(visual.badges).length * 6; // 6 badge states per status
      
      console.log(colorize('\n🎨 Visual Test Results:', 'magenta'));
      console.log(`   Icon Files: ${iconSuccess}/${iconCount} valid`);
      console.log(`   Badge Combinations: ${badgeCount} tested`);
      console.log(`   Total Errors: ${visual.errors.length}`);
    }

    // Overall success status
    const overallSuccess = this.calculateOverallSuccess();
    const statusColor = overallSuccess ? 'green' : 'red';
    const statusText = overallSuccess ? 'PASSED' : 'FAILED';
    
    console.log(colorize(`\n🎯 Overall Result: ${statusText}`, statusColor));
    
    // Next steps
    console.log(colorize('\n🚀 Next Steps:', 'cyan'));
    if (overallSuccess) {
      console.log('   ✅ All tests passed - extension is ready for testing');
      console.log('   📦 Run "npm run build" to create production build');
      console.log('   🌐 Open tests/test-viewer.html for interactive testing');
    } else {
      console.log('   ❌ Fix failing tests before proceeding');
      console.log('   🔍 Check error details above');
      console.log('   🌐 Use tests/test-viewer.html for detailed analysis');
    }

    console.log(colorize('=' .repeat(60), 'blue'));
  }

  /**
   * Calculate overall success status
   */
  calculateOverallSuccess() {
    let success = true;

    // Check API results
    if (this.results.api) {
      const api = this.results.api;
      const apiSuccess = 
        api.claude.errors.length === 0 && 
        api.github.errors.length === 0 &&
        api.combined.every(test => test.passed);
      success = success && apiSuccess;
    }

    // Check visual results
    if (this.results.visual) {
      const visual = this.results.visual;
      const visualSuccess = visual.errors.length === 0;
      success = success && visualSuccess;
    }

    return success;
  }

  /**
   * Export test results to JSON
   */
  async exportResults() {
    const exportData = {
      timestamp: new Date().toISOString(),
      duration: ((Date.now() - this.startTime) / 1000),
      results: this.results,
      summary: {
        overallSuccess: this.calculateOverallSuccess(),
        testsRun: {
          api: !!this.results.api,
          visual: !!this.results.visual
        }
      }
    };

    const outputPath = path.join(__dirname, 'test-results.json');
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
      console.log(colorize(`\n📄 Results exported: ${outputPath}`, 'green'));
    } catch (error) {
      console.log(colorize(`\n❌ Failed to export results: ${error.message}`, 'red'));
    }
  }

  /**
   * Open test viewer in browser
   */
  openViewer() {
    const viewerPath = path.join(__dirname, 'test-viewer.html');
    
    console.log(colorize('\n🌐 Opening test viewer...', 'cyan'));
    
    try {
      // Different commands for different platforms
      let command;
      if (process.platform === 'win32') {
        command = 'start';
      } else if (process.platform === 'darwin') {
        command = 'open';
      } else {
        command = 'xdg-open';
      }
      
      spawn(command, [viewerPath], { 
        detached: true,
        stdio: 'ignore'
      });
      
      console.log(colorize(`✅ Test viewer opened: ${viewerPath}`, 'green'));
    } catch (error) {
      console.log(colorize(`❌ Failed to open viewer: ${error.message}`, 'red'));
      console.log(colorize(`📂 Manually open: ${viewerPath}`, 'yellow'));
    }
  }
}

/**
 * Command line interface
 */
function printUsage() {
  console.log(`
${colorize('Vibe Stats ⚡ - Test Runner', 'bright')}

${colorize('Usage:', 'cyan')}
  npm test                    # Run all tests
  npm run test:api           # Run only API tests  
  npm run test:visual        # Run only visual tests
  npm run viewer             # Open test viewer

${colorize('Options:', 'cyan')}
  --api                      Run API endpoint tests
  --visual                   Run visual component tests
  --export                   Export results to JSON
  --viewer                   Open interactive test viewer
  --help                     Show this help

${colorize('Examples:', 'cyan')}
  node test-runner.js --api --export
  node test-runner.js --visual --viewer
  node test-runner.js --export --viewer

${colorize('Output Files:', 'cyan')}
  test-results.json          Exported test results
  test-viewer.html           Interactive test interface
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }
  
  const options = {
    api: args.includes('--api'),
    visual: args.includes('--visual'),
    export: args.includes('--export'),
    viewer: args.includes('--viewer'),
    all: !args.includes('--api') && !args.includes('--visual')
  };
  
  const runner = new TestRunner();
  await runner.run(options);
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log(colorize('\n🛑 Tests interrupted', 'yellow'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(colorize('\n🛑 Tests terminated', 'yellow'));
  process.exit(0);
});

if (require.main === module) {
  main().catch(error => {
    console.error(colorize('💥 Unexpected error:', 'red'), error);
    process.exit(1);
  });
}

module.exports = TestRunner;