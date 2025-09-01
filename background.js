/**
 * VStateMonitor class handles monitoring of Claude and GitHub Copilot service status
 * Uses Chrome alarms API for reliable background execution
 */
class VStateMonitor {
  constructor() {
    // Claude API endpoints
    this.claude = {
      statusUrl: 'https://status.anthropic.com/api/v2/status.json',
      incidentsUrl: 'https://status.anthropic.com/api/v2/incidents.json',
      summaryUrl: 'https://status.anthropic.com/api/v2/summary.json',
      componentsUrl: 'https://status.anthropic.com/api/v2/components.json'
    };
    
    // GitHub API endpoints
    this.github = {
      statusUrl: 'https://www.githubstatus.com/api/v2/status.json',
      incidentsUrl: 'https://www.githubstatus.com/api/v2/incidents.json',
      summaryUrl: 'https://www.githubstatus.com/api/v2/summary.json',
      componentsUrl: 'https://www.githubstatus.com/api/v2/components.json'
    };
    
    this.alarmName = 'vstateCheck';
    this.intervalMinutes = 5;
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.animationInterval = null;
  }

  /**
   * Initialize the VState monitor
   * Sets up alarms for periodic checking
   */
  async init() {
    try {
      // Clear any existing alarm and create new one
      await chrome.alarms.clear(this.alarmName);
      await chrome.alarms.create(this.alarmName, { 
        periodInMinutes: this.intervalMinutes 
      });
      
      // Initial status check for both services
      await this.checkAllStatuses();
    } catch (error) {
      console.error('Failed to initialize VState monitor:', error);
      this.handleError(error, 'initialization');
    }
  }

  /**
   * Check status for both Claude and GitHub services
   */
  async checkAllStatuses(retryCount = 0) {
    try {
      const [claudeResults, githubResults] = await Promise.allSettled([
        this.checkServiceStatus('claude'),
        this.checkServiceStatus('github')
      ]);

      // Process results for both services
      const claudeStatus = this.extractStatusFromResult(claudeResults, 'claude');
      const githubStatus = this.extractStatusFromResult(githubResults, 'github');

      // Combine status and determine overall state
      const combinedStatus = this.combineStatuses(claudeStatus, githubStatus);
      
      // Store the status data
      await this.updateVStateStatus(claudeStatus, githubStatus, combinedStatus);
      await this.updateBadgeIcon(combinedStatus);
      
      // Store success timestamp
      await chrome.storage.local.set({ lastSuccessfulCheck: Date.now() });
      
    } catch (error) {
      console.error('Failed to check VState status (attempt', retryCount + 1, '):', error);
      
      if (retryCount < this.maxRetries) {
        setTimeout(() => this.checkAllStatuses(retryCount + 1), this.retryDelay * (retryCount + 1));
        return;
      }
      
      // Final failure - set unknown status
      await this.handleCheckFailure(error);
    }
  }

  /**
   * Check status for a specific service (claude or github)
   */
  async checkServiceStatus(serviceName) {
    const serviceConfig = this[serviceName];
    if (!serviceConfig) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const [statusData, incidentsData, summaryData] = await Promise.allSettled([
      this.fetchData(serviceConfig.statusUrl),
      this.fetchData(serviceConfig.incidentsUrl),
      this.fetchData(serviceConfig.summaryUrl)
    ]);

    return {
      service: serviceName,
      status: this.extractStatusFromResult(statusData),
      incidents: this.extractIncidentsFromResult(incidentsData),
      components: this.extractComponentsFromResult(summaryData)
    };
  }

  /**
   * Combine statuses from multiple services
   */
  combineStatuses(claudeStatus, githubStatus) {
    // Priority: critical > major > minor > operational
    const statusPriority = {
      'critical': 4,
      'major': 3, 
      'minor': 2,
      'operational': 1,
      'unknown': 0
    };

    const claudeLevel = statusPriority[claudeStatus?.status?.indicator] || 0;
    const githubLevel = statusPriority[githubStatus?.status?.indicator] || 0;
    
    const maxLevel = Math.max(claudeLevel, githubLevel);
    const combinedIndicator = Object.keys(statusPriority).find(key => 
      statusPriority[key] === maxLevel
    ) || 'unknown';

    return {
      indicator: combinedIndicator,
      description: this.getCombinedDescription(claudeStatus, githubStatus, combinedIndicator),
      claude: claudeStatus,
      github: githubStatus
    };
  }

  /**
   * Get combined status description
   */
  getCombinedDescription(claudeStatus, githubStatus, indicator) {
    const descriptions = {
      'operational': 'All dev tools are vibing! 🔥',
      'minor': 'Minor issues detected in your dev tools',
      'major': 'Major issues affecting your dev tools',
      'critical': 'Critical issues - dev tools are down!',
      'unknown': 'Unable to determine dev tools status'
    };
    
    return descriptions[indicator] || descriptions.unknown;
  }

  /**
   * Fetch data with timeout and proper error handling
   */
  async fetchData(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Claude Status Monitor Extension'
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
   * Extract status from Promise.allSettled result or service result
   */
  extractStatusFromResult(result, serviceName = null) {
    // Handle service-specific results (from checkServiceStatus)
    if (serviceName && result.status === 'fulfilled' && result.value) {
      return result.value;
    }
    
    // Handle individual API call results  
    if (result.status === 'fulfilled' && result.value?.status?.indicator) {
      return result.value.status.indicator;
    }
    
    return 'unknown';
  }

  /**
   * Extract incidents from Promise.allSettled result
   */
  extractIncidentsFromResult(result) {
    if (result.status === 'fulfilled' && Array.isArray(result.value?.incidents)) {
      return result.value.incidents;
    }
    return [];
  }

  /**
   * Extract components from Promise.allSettled result
   */
  extractComponentsFromResult(result) {
    if (result.status === 'fulfilled' && Array.isArray(result.value?.components)) {
      return result.value.components;
    }
    return [];
  }

  /**
   * Handle check failure with proper error tracking
   */
  async handleCheckFailure(error) {
    await this.updateStatus('unknown', [], [], [], []);
    await this.updateBadgeIcon('unknown', []);
    await chrome.storage.local.set({ 
      lastError: {
        message: error.message,
        timestamp: Date.now()
      }
    });
    this.handleError(error, 'status-check');
  }

  /**
   * Generic error handler with categorization
   */
  handleError(error, category) {
    console.error(`[${category}] Error:`, error);
    // Could integrate with crash reporting service here
  }


  /**
   * Get recent active incidents (unresolved) with formatted titles
   */
  getRecentIncidents(incidents) {
    return incidents
      .filter(incident => incident.status !== 'resolved')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(incident => ({
        name: incident.name,
        titleWithDate: this.formatIncidentTitle(incident.name, incident.created_at),
        status: incident.status,
        created_at: incident.created_at,
        shortlink: incident.shortlink,
        impact: incident.impact,
        updates: incident.incident_updates.slice(0, 1).map(update => ({
          body: update.body,
          created_at: update.created_at,
          status: update.status
        }))
      }));
  }

  /**
   * Get last 5 incidents regardless of status with formatted titles
   */
  getLastFiveIncidents(incidents) {
    return incidents
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(incident => ({
        name: incident.name,
        titleWithDate: this.formatIncidentTitle(incident.name, incident.created_at),
        status: incident.status,
        created_at: incident.created_at,
        resolved_at: incident.resolved_at,
        shortlink: incident.shortlink,
        impact: incident.impact,
        duration: incident.resolved_at ? 
          this.calculateDuration(incident.created_at, incident.resolved_at) : null,
        summary: this.generateIncidentSummary(incident),
        updates: incident.incident_updates.slice(0, 2).map(update => ({
          body: update.body,
          created_at: update.created_at,
          status: update.status
        }))
      }));
  }

  getHistoricalIncidents(incidents) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return incidents
      .filter(incident => new Date(incident.created_at) >= last24Hours)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3)
      .map(incident => ({
        name: incident.name,
        status: incident.status,
        created_at: incident.created_at,
        resolved_at: incident.resolved_at,
        impact: incident.impact,
        summary: this.generateIncidentSummary(incident),
        duration: incident.resolved_at ? 
          this.calculateDuration(incident.created_at, incident.resolved_at) : null,
        updates: incident.incident_updates.map(update => ({
          body: update.body,
          created_at: update.created_at,
          status: update.status
        }))
      }));
  }

  generateIncidentSummary(incident) {
    if (!incident.incident_updates || incident.incident_updates.length === 0) {
      return `${incident.impact || 'Minor'} impact incident affecting Claude services.`;
    }
    
    const firstUpdate = incident.incident_updates[incident.incident_updates.length - 1];
    const lastUpdate = incident.incident_updates[0];
    
    let summary = `${incident.impact || 'Minor'} impact: `;
    
    if (incident.status === 'resolved') {
      summary += `Issue resolved. ${lastUpdate.body.slice(0, 100)}...`;
    } else {
      summary += `${firstUpdate.body.slice(0, 100)}...`;
    }
    
    return summary;
  }

  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Format incident title with date
   */
  formatIncidentTitle(name, createdAt) {
    const date = new Date(createdAt);
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr} ${timeStr} - ${name}`;
  }

  /**
   * Update VState status data in storage
   */
  async updateVStateStatus(claudeStatus, githubStatus, combinedStatus) {
    const currentTime = new Date().toISOString();
    
    await chrome.storage.local.set({
      // Combined status
      vstateStatus: combinedStatus,
      
      // Individual service data
      claudeStatus: claudeStatus,
      githubStatus: githubStatus,
      
      // Individual incidents
      claudeIncidents: claudeStatus?.incidents || [],
      githubIncidents: githubStatus?.incidents || [],
      
      // Individual components
      claudeComponents: claudeStatus?.components || [],
      githubComponents: githubStatus?.components || [],
      
      // Timestamps
      lastUpdated: currentTime,
      lastSuccessfulCheck: Date.now()
    });
  }

  async updateStatus(status, incidents, historicalIncidents, components, lastFiveIncidents) {
    await chrome.storage.local.set({
      status: status,
      incidents: incidents,
      historicalIncidents: historicalIncidents || [],
      lastFiveIncidents: lastFiveIncidents || [],
      components: components || [],
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Update badge icon with error handling and animation
   */
  async updateBadgeIcon(status, components = []) {
    try {
      const iconPath = this.getIconPath(status);
      
      await chrome.action.setIcon({ path: iconPath });
      
      // Start icon animation for non-operational states
      this.handleIconAnimation(status);

      // Count affected services
      const affectedCount = this.countAffectedServices(components);
      
      let badgeText = '';
      if (status === 'critical') {
        badgeText = affectedCount > 0 ? affectedCount.toString() : '!';
      } else if (status === 'major') {
        badgeText = affectedCount > 0 ? affectedCount.toString() : '!';
      } else if (status === 'minor') {
        badgeText = affectedCount > 0 ? affectedCount.toString() : '?';
      }
      
      await chrome.action.setBadgeText({ text: badgeText });

      if (badgeText) {
        await chrome.action.setBadgeBackgroundColor({
          color: this.getBadgeColor(status)
        });
      }
      
      // Update title with status and affected count
      const statusText = this.getStatusText(status);
      const titleSuffix = affectedCount > 0 ? ` (${affectedCount} service${affectedCount > 1 ? 's' : ''} affected)` : '';
      await chrome.action.setTitle({
        title: `Vibe Stats ⚡: ${statusText}${titleSuffix}`
      });
      
    } catch (error) {
      console.error('Failed to update badge icon:', error);
    }
  }

  /**
   * Count services that are not operational
   */
  countAffectedServices(components) {
    if (!Array.isArray(components)) return 0;
    
    // Key service components to track
    const keyServices = [
      'claude.ai', 'claude frontend', 'claude.ai website',
      'anthropic console', 'console.anthropic.com', 'console',
      'anthropic api', 'api.anthropic.com', 'api',
      'claude code', 'code editor'
    ];
    
    return components.filter(component => {
      const name = component.name.toLowerCase();
      const isKeyService = keyServices.some(service => 
        name.includes(service) || service.includes(name)
      );
      const isNotOperational = component.status && 
        component.status.toLowerCase() !== 'operational';
      
      return isKeyService && isNotOperational;
    }).length;
  }

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

  getIconPath(color) {
    return {
      "16": `icons/lightning-16.png`,
      "32": `icons/lightning-32.png`,
      "48": `icons/lightning-48.png`,
      "128": `icons/lightning-128.png`
    };
  }

  /**
   * Handle icon animation for different statuses
   */
  handleIconAnimation(status) {
    // Clear any existing animation interval
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    // Start animation for problematic statuses
    if (status !== 'operational' && status !== 'none') {
      let isVisible = true;
      const iconPath = this.getIconPath(status);
      
      this.animationInterval = setInterval(async () => {
        try {
          if (isVisible) {
            // Create a transparent icon for blink effect
            const transparentIcon = {
              "16": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAANSURBVDiNY/z//z8DAAj8Av6IXwbgAAAAAElFTkSuQmCC",
              "32": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAANSURBVFiF7cEBAQAAAIKg/q+uiQYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4AwAAAP//AwBQgAEc7L0AAAAASUVORK5CYII=",
              "48": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAANSURBVGiB7cEBDQAAAMKg909tDjegAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAUAAAD//wNAjAEczL0AAAAASUVORK5CYII=",
              "128": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAOSURBVHic7cEBAQAAAIIg/69uSAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQgAEAAAH//wMLQAB1zL0AAAAASUVORK5CYII="
            };
            await chrome.action.setIcon({ path: transparentIcon });
          } else {
            await chrome.action.setIcon({ path: iconPath });
          }
          isVisible = !isVisible;
        } catch (error) {
          console.error('Animation error:', error);
        }
      }, 800); // Blink every 800ms
    }
  }

  getBadgeColor(status) {
    switch (status) {
      case 'none':
      case 'operational':
        return '#4CAF50';
      case 'minor':
        return '#FFC107';
      case 'major':
      case 'critical':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  }

  /**
   * Get human-readable status text
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
}

// Global monitor instance
let vstateMonitor = null;

// Event listeners using modern async patterns
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('VState extension installed/updated:', details.reason);
  try {
    vstateMonitor = new VStateMonitor();
    await vstateMonitor.init();
  } catch (error) {
    console.error('Failed to initialize VState on install:', error);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('VState extension startup');
  try {
    vstateMonitor = new VStateMonitor();
    await vstateMonitor.init();
  } catch (error) {
    console.error('Failed to initialize VState on startup:', error);
  }
});

// Handle alarm events for periodic checks
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'vstateCheck' && vstateMonitor) {
    await vstateMonitor.checkAllStatuses();
  }
});

// Service worker message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'forceRefresh') {
    (async () => {
      try {
        if (!vstateMonitor) {
          vstateMonitor = new VStateMonitor();
          await vstateMonitor.init();
        }
        await vstateMonitor.checkAllStatuses();
        sendResponse({ status: 'refreshing', timestamp: Date.now() });
      } catch (error) {
        console.error('VState force refresh failed:', error);
        sendResponse({ status: 'error', error: error.message });
      }
    })();
    return true; // Indicates async response
  }
  
  if (message.action === 'getStatus') {
    (async () => {
      try {
        const data = await chrome.storage.local.get([
          'vstateStatus', 'claudeStatus', 'githubStatus', 'claudeIncidents', 
          'githubIncidents', 'lastUpdated', 'lastError'
        ]);
        sendResponse({ status: 'success', data });
      } catch (error) {
        sendResponse({ status: 'error', error: error.message });
      }
    })();
    return true; // Indicates async response
  }
});