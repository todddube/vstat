/**
 * API Testing Module for Vibe Stats Extension
 * Tests both Claude and GitHub status API endpoints
 */

class APITester {
  constructor() {
    this.claude = {
      statusUrl: 'https://status.anthropic.com/api/v2/status.json',
      incidentsUrl: 'https://status.anthropic.com/api/v2/incidents.json',
      summaryUrl: 'https://status.anthropic.com/api/v2/summary.json',
      componentsUrl: 'https://status.anthropic.com/api/v2/components.json'
    };
    
    this.github = {
      statusUrl: 'https://www.githubstatus.com/api/v2/status.json',
      incidentsUrl: 'https://www.githubstatus.com/api/v2/incidents.json',
      summaryUrl: 'https://www.githubstatus.com/api/v2/summary.json',
      componentsUrl: 'https://www.githubstatus.com/api/v2/components.json'
    };

    this.results = {
      claude: {},
      github: {},
      combined: {}
    };
  }

  /**
   * Test all API endpoints for both services
   */
  async runAllTests() {
    console.log('🚀 Starting API Tests for Vibe Stats Extension');
    console.log('=' .repeat(60));

    try {
      // Test Claude APIs
      console.log('\n🎭 Testing Claude APIs...');
      this.results.claude = await this.testServiceAPIs('claude');
      
      // Test GitHub APIs
      console.log('\n🐱 Testing GitHub APIs...');
      this.results.github = await this.testServiceAPIs('github');
      
      // Test combined status logic
      console.log('\n🔄 Testing Combined Status Logic...');
      this.results.combined = await this.testCombinedStatus();
      
      // Generate report
      this.generateTestReport();
      
      return this.results;
    } catch (error) {
      console.error('❌ API test suite failed:', error);
      throw error;
    }
  }

  /**
   * Test API endpoints for a specific service
   */
  async testServiceAPIs(serviceName) {
    const serviceConfig = this[serviceName];
    const results = {
      service: serviceName,
      endpoints: {},
      status: 'unknown',
      incidents: [],
      components: [],
      errors: []
    };

    const endpoints = ['statusUrl', 'incidentsUrl', 'summaryUrl', 'componentsUrl'];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`  📡 Testing ${serviceName} ${endpoint}...`);
        const startTime = Date.now();
        
        const data = await this.fetchWithTimeout(serviceConfig[endpoint], 10000);
        const responseTime = Date.now() - startTime;
        
        results.endpoints[endpoint] = {
          status: 'success',
          responseTime,
          dataSize: JSON.stringify(data).length,
          data: data
        };
        
        // Extract key data
        if (endpoint === 'statusUrl' && data.status) {
          results.status = data.status.indicator || 'unknown';
        }
        if (endpoint === 'incidentsUrl' && Array.isArray(data.incidents)) {
          results.incidents = data.incidents.slice(0, 5);
        }
        if (endpoint === 'summaryUrl' && Array.isArray(data.components)) {
          results.components = data.components;
        }
        
        console.log(`    ✅ Success (${responseTime}ms, ${Math.round(results.endpoints[endpoint].dataSize/1024)}KB)`);
        
      } catch (error) {
        console.log(`    ❌ Failed: ${error.message}`);
        results.endpoints[endpoint] = {
          status: 'error',
          error: error.message
        };
        results.errors.push({ endpoint, error: error.message });
      }
    }

    return results;
  }

  /**
   * Test the combined status logic
   */
  async testCombinedStatus() {
    const testScenarios = [
      {
        name: 'Both Operational',
        claude: 'operational',
        github: 'operational',
        expected: 'operational'
      },
      {
        name: 'Claude Minor, GitHub Operational',
        claude: 'minor',
        github: 'operational',
        expected: 'minor'
      },
      {
        name: 'Claude Operational, GitHub Major',
        claude: 'operational',
        github: 'major',
        expected: 'major'
      },
      {
        name: 'Both Critical',
        claude: 'critical',
        github: 'critical',
        expected: 'critical'
      },
      {
        name: 'One Unknown',
        claude: 'unknown',
        github: 'operational',
        expected: 'operational'
      }
    ];

    const results = [];
    
    for (const scenario of testScenarios) {
      const combined = this.combineStatuses(scenario.claude, scenario.github);
      const passed = combined === scenario.expected;
      
      results.push({
        ...scenario,
        actual: combined,
        passed
      });
      
      console.log(`  ${passed ? '✅' : '❌'} ${scenario.name}: expected ${scenario.expected}, got ${combined}`);
    }

    return results;
  }

  /**
   * Combine status logic (mirrors background.js)
   */
  combineStatuses(claudeStatus, githubStatus) {
    const statusPriority = {
      'critical': 4,
      'major': 3, 
      'minor': 2,
      'operational': 1,
      'unknown': 0
    };

    const claudeLevel = statusPriority[claudeStatus] || 0;
    const githubLevel = statusPriority[githubStatus] || 0;
    
    const maxLevel = Math.max(claudeLevel, githubLevel);
    return Object.keys(statusPriority).find(key => 
      statusPriority[key] === maxLevel
    ) || 'unknown';
  }

  /**
   * Fetch data with timeout
   */
  async fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Vibe Stats Extension Test Suite'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    console.log('\n📊 API Test Report');
    console.log('=' .repeat(60));
    
    // Service summaries
    for (const serviceName of ['claude', 'github']) {
      const service = this.results[serviceName];
      const endpoints = Object.keys(service.endpoints);
      const successCount = endpoints.filter(ep => service.endpoints[ep].status === 'success').length;
      const avgResponseTime = this.calculateAverageResponseTime(service.endpoints);
      
      console.log(`\n🏷️  ${serviceName.toUpperCase()} Service:`);
      console.log(`   Status: ${service.status}`);
      console.log(`   Endpoints: ${successCount}/${endpoints.length} successful`);
      console.log(`   Avg Response Time: ${avgResponseTime}ms`);
      console.log(`   Active Incidents: ${service.incidents.length}`);
      console.log(`   Components: ${service.components.length}`);
      
      if (service.errors.length > 0) {
        console.log(`   ❌ Errors: ${service.errors.length}`);
        service.errors.forEach(error => {
          console.log(`      - ${error.endpoint}: ${error.error}`);
        });
      }
    }

    // Combined status tests
    console.log('\n🔄 Combined Status Tests:');
    const combinedTests = this.results.combined;
    const passedTests = combinedTests.filter(test => test.passed).length;
    console.log(`   Tests: ${passedTests}/${combinedTests.length} passed`);
    
    const failedTests = combinedTests.filter(test => !test.passed);
    if (failedTests.length > 0) {
      console.log('   ❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`      - ${test.name}: expected ${test.expected}, got ${test.actual}`);
      });
    }

    // Overall status
    const overallSuccess = 
      Object.values(this.results.claude.endpoints).every(ep => ep.status === 'success') &&
      Object.values(this.results.github.endpoints).every(ep => ep.status === 'success') &&
      combinedTests.every(test => test.passed);
    
    console.log(`\n${overallSuccess ? '✅' : '❌'} Overall Status: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
    console.log('=' .repeat(60));
  }

  /**
   * Calculate average response time for endpoints
   */
  calculateAverageResponseTime(endpoints) {
    const successfulEndpoints = Object.values(endpoints).filter(ep => 
      ep.status === 'success' && ep.responseTime
    );
    
    if (successfulEndpoints.length === 0) return 0;
    
    const totalTime = successfulEndpoints.reduce((sum, ep) => sum + ep.responseTime, 0);
    return Math.round(totalTime / successfulEndpoints.length);
  }

  /**
   * Export results for web viewer
   */
  exportResults() {
    return {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        claudeStatus: this.results.claude.status,
        githubStatus: this.results.github.status,
        claudeEndpoints: Object.keys(this.results.claude.endpoints).length,
        githubEndpoints: Object.keys(this.results.github.endpoints).length,
        totalErrors: this.results.claude.errors.length + this.results.github.errors.length,
        combinedTestsPassed: this.results.combined.filter(test => test.passed).length,
        combinedTestsTotal: this.results.combined.length
      }
    };
  }
}

module.exports = APITester;