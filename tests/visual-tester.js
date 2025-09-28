/**
 * Visual Testing Module for Vibe Stats Extension
 * Tests icons, badges, and visual components
 */

const fs = require('fs');
const path = require('path');

class VisualTester {
  constructor() {
    this.iconSizes = [16, 32, 48, 128];
    this.statusStates = ['operational', 'minor', 'major', 'critical', 'unknown'];
    this.badgeStates = ['none', '1', '2', '3', '4+', '!'];
    this.results = {
      icons: {},
      badges: {},
      errors: []
    };
  }

  /**
   * Run all visual tests
   */
  async runAllTests() {
    console.log('🎨 Starting Visual Tests for Vibe Stats Extension');
    console.log('=' .repeat(60));

    try {
      // Test icon files
      console.log('\n🖼️  Testing Icon Files...');
      await this.testIconFiles();
      
      // Test badge combinations
      console.log('\n🏷️  Testing Badge States...');
      await this.testBadgeStates();
      
      // Generate visual test report
      this.generateVisualReport();
      
      return this.results;
    } catch (error) {
      console.error('❌ Visual test suite failed:', error);
      throw error;
    }
  }

  /**
   * Test that all required icon files exist and are valid
   */
  async testIconFiles() {
    const iconsDir = path.join(__dirname, '..', 'icons');
    
    for (const size of this.iconSizes) {
      const iconPath = path.join(iconsDir, `ai-vibe-${size}.png`);
      
      try {
        // Check if file exists
        const exists = fs.existsSync(iconPath);
        
        if (exists) {
          // Get file stats
          const stats = fs.statSync(iconPath);
          const fileSizeKB = Math.round(stats.size / 1024);
          
          this.results.icons[`ai-vibe-${size}.png`] = {
            status: 'success',
            exists: true,
            size: stats.size,
            sizeKB: fileSizeKB,
            path: iconPath
          };
          
          console.log(`    ✅ ai-vibe-${size}.png (${fileSizeKB}KB)`);
        } else {
          this.results.icons[`ai-vibe-${size}.png`] = {
            status: 'missing',
            exists: false,
            path: iconPath
          };
          
          console.log(`    ❌ ai-vibe-${size}.png - Missing`);
          this.results.errors.push(`Missing icon file: ai-vibe-${size}.png`);
        }
        
      } catch (error) {
        console.log(`    ❌ ai-vibe-${size}.png - Error: ${error.message}`);
        this.results.icons[`ai-vibe-${size}.png`] = {
          status: 'error',
          error: error.message,
          path: iconPath
        };
        this.results.errors.push(`Icon file error: ai-vibe-${size}.png - ${error.message}`);
      }
    }
  }

  /**
   * Test different badge state combinations
   */
  async testBadgeStates() {
    for (const status of this.statusStates) {
      this.results.badges[status] = {};
      
      for (const badge of this.badgeStates) {
        const combination = `${status}-${badge}`;
        
        try {
          // Test badge color logic
          const badgeColor = this.getBadgeColor(status);
          const badgeText = this.getBadgeText(status, badge);
          const iconColor = this.getIconColor(status);
          const statusText = this.getStatusText(status);
          
          this.results.badges[status][badge] = {
            status: 'success',
            badgeColor,
            badgeText,
            iconColor,
            statusText,
            combination
          };
          
          console.log(`    ✅ ${status} + ${badge}: ${badgeText} (${badgeColor})`);
          
        } catch (error) {
          console.log(`    ❌ ${status} + ${badge}: ${error.message}`);
          this.results.badges[status][badge] = {
            status: 'error',
            error: error.message,
            combination
          };
          this.results.errors.push(`Badge combination error: ${combination} - ${error.message}`);
        }
      }
    }
  }

  /**
   * Get badge color for status (mirrors background.js logic)
   */
  getBadgeColor(status) {
    switch (status) {
      case 'none':
      case 'operational':
        return '#4CAF50'; // Green
      case 'minor':
        return '#FFC107'; // Yellow
      case 'major':
      case 'critical':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  }

  /**
   * Get badge text based on status and count
   */
  getBadgeText(status, badge) {
    if (badge === 'none') return '';
    
    switch (status) {
      case 'critical':
        return badge === '!' || badge.includes('+') ? badge : (parseInt(badge) || '!');
      case 'major':
        return badge === '!' || badge.includes('+') ? badge : (parseInt(badge) || '!');
      case 'minor':
        return badge === '!' ? '?' : (parseInt(badge) || '');
      case 'operational':
      case 'none':
        return '';
      default:
        return '';
    }
  }

  /**
   * Get icon color for status
   */
  getIconColor(status) {
    switch (status) {
      case 'none':
      case 'operational':
        return 'green';
      case 'minor':
        return 'yellow';
      case 'major':
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Get status text (mirrors background.js logic)
   */
  getStatusText(status) {
    switch (status) {
      case 'none':
      case 'operational':
        return 'All Systems Operational';
      case 'minor':
        return 'Minor Issues';
      case 'major':
        return 'Major Issues';
      case 'critical':
        return 'Critical Issues';
      default:
        return 'Status Unknown';
    }
  }

  /**
   * Generate visual test report
   */
  generateVisualReport() {
    console.log('\n🎨 Visual Test Report');
    console.log('=' .repeat(60));
    
    // Icon test results
    console.log('\n🖼️  Icon Files:');
    const iconTests = Object.keys(this.results.icons);
    const iconSuccess = iconTests.filter(icon => 
      this.results.icons[icon].status === 'success'
    ).length;
    
    console.log(`   Files: ${iconSuccess}/${iconTests.length} valid`);
    
    if (iconSuccess > 0) {
      const totalIconSize = Object.values(this.results.icons)
        .filter(icon => icon.sizeKB)
        .reduce((sum, icon) => sum + icon.sizeKB, 0);
      console.log(`   Total Size: ${totalIconSize}KB`);
    }
    
    // Badge test results
    console.log('\n🏷️  Badge States:');
    const badgeTests = Object.keys(this.results.badges).length * this.badgeStates.length;
    const badgeSuccess = Object.values(this.results.badges).reduce((count, status) => {
      return count + Object.values(status).filter(badge => badge.status === 'success').length;
    }, 0);
    
    console.log(`   Combinations: ${badgeSuccess}/${badgeTests} valid`);
    
    // Status breakdown
    console.log('\n📊 Status Combinations:');
    for (const status of this.statusStates) {
      const statusBadges = this.results.badges[status] || {};
      const statusSuccess = Object.values(statusBadges).filter(badge => badge.status === 'success').length;
      const statusColor = this.getIconColor(status);
      const badgeColor = this.getBadgeColor(status);
      
      console.log(`   ${status}: ${statusSuccess}/${this.badgeStates.length} (icon: ${statusColor}, badge: ${badgeColor})`);
    }
    
    // Errors summary
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors Found: ${this.results.errors.length}`);
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    // Overall status
    const overallSuccess = 
      iconSuccess === iconTests.length && 
      badgeSuccess === badgeTests.length &&
      this.results.errors.length === 0;
    
    console.log(`\n${overallSuccess ? '✅' : '❌'} Overall Status: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
    console.log('=' .repeat(60));
  }

  /**
   * Export results for web viewer
   */
  exportResults() {
    return {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        iconFiles: Object.keys(this.results.icons).length,
        iconsValid: Object.values(this.results.icons).filter(icon => icon.status === 'success').length,
        badgeCombinations: Object.keys(this.results.badges).length * this.badgeStates.length,
        badgesValid: Object.values(this.results.badges).reduce((count, status) => {
          return count + Object.values(status).filter(badge => badge.status === 'success').length;
        }, 0),
        totalErrors: this.results.errors.length
      }
    };
  }

  /**
   * Generate HTML preview for visual testing
   */
  generateHTMLPreview() {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vibe Stats Visual Test Preview</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-section { margin: 30px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .test-item { padding: 15px; border: 1px solid #ddd; border-radius: 4px; text-align: center; }
        .icon-preview { width: 48px; height: 48px; margin: 10px auto; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .badge-preview { position: relative; display: inline-block; }
        .badge { position: absolute; top: -8px; right: -8px; background: red; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; display: flex; align-items: center; justify-content: center; }
        .status-operational { color: #4CAF50; }
        .status-minor { color: #FFC107; }
        .status-major { color: #FF9800; }
        .status-critical { color: #F44336; }
        .status-unknown { color: #9E9E9E; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ Vibe Stats Visual Test Preview</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <div class="test-section">
            <h2>🖼️ Icon Files</h2>
            <div class="test-grid">`;

    // Add icon previews
    for (const size of this.iconSizes) {
      const iconResult = this.results.icons[`ai-vibe-${size}.png`];
      const status = iconResult?.status || 'missing';
      const statusClass = status === 'success' ? 'status-operational' : 'status-critical';
      
      html += `
                <div class="test-item">
                    <div class="icon-preview">
                        ${status === 'success' ? '⚡' : '❌'}
                    </div>
                    <h4>ai-vibe-${size}.png</h4>
                    <p class="${statusClass}">${status.toUpperCase()}</p>
                    ${iconResult?.sizeKB ? `<p>${iconResult.sizeKB}KB</p>` : ''}
                </div>`;
    }

    html += `
            </div>
        </div>
        
        <div class="test-section">
            <h2>🏷️ Badge States</h2>
            <div class="test-grid">`;

    // Add badge previews
    for (const status of this.statusStates) {
      const badgeColor = this.getBadgeColor(status);
      const iconColor = this.getIconColor(status);
      const statusText = this.getStatusText(status);
      
      html += `
                <div class="test-item">
                    <div class="badge-preview">
                        <div class="icon-preview">⚡</div>
                        <div class="badge" style="background-color: ${badgeColor}">!</div>
                    </div>
                    <h4 class="status-${status}">${status.toUpperCase()}</h4>
                    <p>${statusText}</p>
                    <p><small>Icon: ${iconColor} | Badge: ${badgeColor}</small></p>
                </div>`;
    }

    html += `
            </div>
        </div>
    </div>
</body>
</html>`;

    return html;
  }
}

module.exports = VisualTester;