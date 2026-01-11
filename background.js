/**
 * VStateMonitor class handles monitoring of AI service status
 * Monitors: Claude, GitHub Copilot, OpenAI, and Google Gemini
 * Uses Chrome alarms API for reliable background execution
 */
class VStateMonitor {
  constructor() {
    // Claude API endpoints (Anthropic)
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

    // OpenAI API endpoints
    this.openai = {
      statusUrl: 'https://status.openai.com/api/v2/status.json',
      incidentsUrl: 'https://status.openai.com/api/v2/incidents.json',
      summaryUrl: 'https://status.openai.com/api/v2/summary.json',
      componentsUrl: 'https://status.openai.com/api/v2/components.json'
    };

    // Google Gemini/AI Studio - uses Google Cloud status
    this.gemini = {
      statusUrl: 'https://status.cloud.google.com/incidents.json',
      summaryUrl: 'https://status.cloud.google.com/incidents.json'
    };

    this.alarmName = 'vstateCheck';
    this.intervalMinutes = 5;
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.animationInterval = null;
    this.animationStartTime = null;
    this.maxAnimationDuration = 30 * 60 * 1000; // 30 minutes max animation
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

      // Initial status check for all services
      await this.checkAllStatuses();
    } catch (error) {
      console.error('Failed to initialize VState monitor:', error);
      this.handleError(error, 'initialization');
    }
  }

  /**
   * Check status for all AI services
   */
  async checkAllStatuses(retryCount = 0) {
    try {
      const [claudeResults, githubResults, openaiResults, geminiResults] = await Promise.allSettled([
        this.checkServiceStatus('claude'),
        this.checkServiceStatus('github'),
        this.checkServiceStatus('openai'),
        this.checkGeminiStatus()
      ]);

      // Process results for all services
      const claudeStatus = this.extractStatusFromResult(claudeResults, 'claude');
      const githubStatus = this.extractStatusFromResult(githubResults, 'github');
      const openaiStatus = this.extractStatusFromResult(openaiResults, 'openai');
      const geminiStatus = this.extractGeminiStatusFromResult(geminiResults);

      // Combine status and determine overall state
      const combinedStatus = this.combineAllStatuses(claudeStatus, githubStatus, openaiStatus, geminiStatus);

      // Store the status data
      await this.updateVStateStatus(claudeStatus, githubStatus, openaiStatus, geminiStatus, combinedStatus);
      await this.updateBadgeIcon(combinedStatus.indicator);

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
   * Check status for a specific service (claude, github, or openai)
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
      status: this.extractStatusIndicator(statusData),
      incidents: this.extractIncidentsFromResult(incidentsData),
      components: this.extractComponentsFromResult(summaryData)
    };
  }

  /**
   * Check Gemini status from Google Cloud status page
   * Google uses a different format than Atlassian Statuspage
   */
  async checkGeminiStatus() {
    try {
      // For Gemini, we'll check Google Cloud's general status
      // and filter for AI-related services
      const response = await this.fetchData(this.gemini.statusUrl);

      // Google Cloud status returns an array of incidents
      const incidents = Array.isArray(response) ? response : [];

      // Filter for AI/Gemini related incidents - check multiple fields
      const aiIncidents = incidents.filter(incident => {
        // Check all text fields for AI-related keywords
        const fieldsToCheck = [
          incident.external_desc,
          incident.service_name,
          incident.uri,
          JSON.stringify(incident.affected_products || []),
          JSON.stringify(incident.updates || [])
        ].filter(Boolean).join(' ').toLowerCase();

        return fieldsToCheck.includes('gemini') ||
               fieldsToCheck.includes('ai studio') ||
               fieldsToCheck.includes('vertex ai') ||
               fieldsToCheck.includes('generative ai') ||
               fieldsToCheck.includes('ai platform') ||
               fieldsToCheck.includes('cloud ai');
      });

      // Map incidents to standard format first
      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const mappedIncidents = aiIncidents
        .map(inc => ({
          name: inc.external_desc || inc.service_name || 'Google AI Incident',
          status: this.mapGoogleStatus(inc),
          created_at: inc.begin || inc.created || inc.modified,
          resolved_at: inc.end,
          impact: this.mapGoogleSeverity(inc.severity),
          incident_updates: (inc.updates || []).slice(0, 3).map(u => ({
            body: u.text || u.description || u.when,
            created_at: u.when || u.created || u.modified,
            status: u.status || 'update'
          }))
        }))
        .filter(inc => {
          // Only include incidents from last 14 days
          if (!inc.created_at) return false;
          const incDate = new Date(inc.created_at);
          return incDate >= fourteenDaysAgo;
        })
        .slice(0, 5);

      // Determine status based on ACTIVE (unresolved) incidents only
      const activeIncidents = mappedIncidents.filter(inc =>
        inc.status !== 'resolved'
      );

      let status = 'operational';
      if (activeIncidents.length > 0) {
        const severity = activeIncidents.some(inc =>
          inc.impact === 'critical' || inc.impact === 'major'
        ) ? 'major' : 'minor';
        status = severity;
      }

      return {
        service: 'gemini',
        status: { indicator: status },
        incidents: mappedIncidents,
        components: [
          { name: 'AI Studio', status: status },
          { name: 'Gemini API', status: status }
        ]
      };
    } catch (error) {
      console.warn('Gemini status check failed:', error);
      return {
        service: 'gemini',
        status: { indicator: 'unknown' },
        incidents: [],
        components: [
          { name: 'AI Studio', status: 'unknown' },
          { name: 'Gemini API', status: 'unknown' }
        ]
      };
    }
  }

  /**
   * Map Google Cloud status to standard status
   */
  mapGoogleStatus(incident) {
    if (!incident) return 'unknown';

    // Check if resolved
    if (incident.end) {
      const endDate = new Date(incident.end);
      if (endDate < new Date()) return 'resolved';
    }

    const status = incident.most_recent_update?.status?.toLowerCase() || '';
    if (status.includes('resolved') || status.includes('closed')) return 'resolved';
    if (status.includes('investigating')) return 'investigating';
    if (status.includes('identified')) return 'identified';
    if (status.includes('monitoring')) return 'monitoring';

    return 'investigating';
  }

  /**
   * Map Google severity to standard impact
   */
  mapGoogleSeverity(severity) {
    if (!severity) return 'minor';
    const sev = severity.toLowerCase();
    if (sev === 'high' || sev === 'critical') return 'critical';
    if (sev === 'medium') return 'major';
    return 'minor';
  }

  /**
   * Extract Gemini status from Promise result
   */
  extractGeminiStatusFromResult(result) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
    return {
      service: 'gemini',
      status: { indicator: 'unknown' },
      incidents: [],
      components: []
    };
  }

  /**
   * Combine statuses from all services
   */
  combineAllStatuses(claudeStatus, githubStatus, openaiStatus, geminiStatus) {
    // Priority: critical > major > minor > operational
    const statusPriority = {
      'critical': 4,
      'major': 3,
      'minor': 2,
      'operational': 1,
      'unknown': 0
    };

    const getIndicator = (status) => {
      if (!status) return 'unknown';
      if (typeof status === 'string') return status;
      return status.status?.indicator || status.indicator || 'unknown';
    };

    const statuses = [
      { name: 'Claude', level: statusPriority[getIndicator(claudeStatus)] || 0 },
      { name: 'GitHub', level: statusPriority[getIndicator(githubStatus)] || 0 },
      { name: 'OpenAI', level: statusPriority[getIndicator(openaiStatus)] || 0 },
      { name: 'Gemini', level: statusPriority[getIndicator(geminiStatus)] || 0 }
    ];

    const maxLevel = Math.max(...statuses.map(s => s.level));
    const combinedIndicator = Object.keys(statusPriority).find(key =>
      statusPriority[key] === maxLevel
    ) || 'unknown';

    // Count affected services
    const affectedServices = statuses.filter(s => s.level > 1).map(s => s.name);

    return {
      indicator: combinedIndicator,
      description: this.getCombinedDescription(combinedIndicator, affectedServices),
      affectedServices,
      claude: claudeStatus,
      github: githubStatus,
      openai: openaiStatus,
      gemini: geminiStatus
    };
  }

  /**
   * Get combined status description
   */
  getCombinedDescription(indicator, affectedServices = []) {
    if (indicator === 'operational') {
      return 'All AI tools are vibing!';
    }

    if (affectedServices.length > 0) {
      const serviceList = affectedServices.join(', ');
      const descriptions = {
        'minor': `Minor issues with ${serviceList}`,
        'major': `Major issues affecting ${serviceList}`,
        'critical': `Critical outage: ${serviceList}`,
        'unknown': 'Unable to determine status'
      };
      return descriptions[indicator] || descriptions.unknown;
    }

    const descriptions = {
      'operational': 'All AI tools are vibing!',
      'minor': 'Minor issues detected',
      'major': 'Major issues affecting services',
      'critical': 'Critical issues detected',
      'unknown': 'Unable to determine status'
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
          'User-Agent': 'Vibe Stats Extension'
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
   * Extract status indicator from Promise.allSettled result
   */
  extractStatusIndicator(result) {
    if (result.status === 'fulfilled' && result.value?.status?.indicator) {
      return result.value.status;
    }
    return { indicator: 'unknown' };
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

    return { service: serviceName, status: { indicator: 'unknown' }, incidents: [], components: [] };
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
    const unknownStatus = {
      indicator: 'unknown',
      description: 'Unable to check status'
    };

    await chrome.storage.local.set({
      vstateStatus: unknownStatus,
      lastError: {
        message: error.message,
        timestamp: Date.now()
      }
    });

    await this.updateBadgeIcon('unknown');
    this.handleError(error, 'status-check');
  }

  /**
   * Generic error handler with categorization
   */
  handleError(error, category) {
    console.error(`[${category}] Error:`, error);
  }

  /**
   * Get recent active incidents (unresolved) with formatted titles
   */
  getRecentIncidents(incidents) {
    if (!Array.isArray(incidents)) return [];

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
        updates: (incident.incident_updates || []).slice(0, 1).map(update => ({
          body: update.body,
          created_at: update.created_at,
          status: update.status
        }))
      }));
  }

  /**
   * Format incident title with date
   */
  formatIncidentTitle(name, createdAt) {
    if (!createdAt) return name;

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
   * Calculate duration between two times
   */
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
   * Update VState status data in storage
   * Includes pruning to prevent storage accumulation
   */
  async updateVStateStatus(claudeStatus, githubStatus, openaiStatus, geminiStatus, combinedStatus) {
    const currentTime = new Date().toISOString();
    const maxIncidents = 50;

    // Prune incidents to prevent storage bloat
    const claudeIncidents = this.pruneIncidents(claudeStatus?.incidents || [], maxIncidents);
    const githubIncidents = this.pruneIncidents(githubStatus?.incidents || [], maxIncidents);
    const openaiIncidents = this.pruneIncidents(openaiStatus?.incidents || [], maxIncidents);
    const geminiIncidents = this.pruneIncidents(geminiStatus?.incidents || [], maxIncidents);

    await chrome.storage.local.set({
      // Combined status
      vstateStatus: combinedStatus,

      // Individual service data
      claudeStatus: claudeStatus,
      githubStatus: githubStatus,
      openaiStatus: openaiStatus,
      geminiStatus: geminiStatus,

      // Individual incidents (pruned)
      claudeIncidents: claudeIncidents,
      githubIncidents: githubIncidents,
      openaiIncidents: openaiIncidents,
      geminiIncidents: geminiIncidents,

      // Individual components
      claudeComponents: claudeStatus?.components || [],
      githubComponents: githubStatus?.components || [],
      openaiComponents: openaiStatus?.components || [],
      geminiComponents: geminiStatus?.components || [],

      // Timestamps
      lastUpdated: currentTime,
      lastSuccessfulCheck: Date.now()
    });
  }

  /**
   * Prune incidents array to only include last 14 days and limit count
   */
  pruneIncidents(incidents, maxCount = 4, maxDays = 14) {
    if (!Array.isArray(incidents)) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);

    return incidents
      .filter(incident => {
        const incidentDate = new Date(incident.created_at);
        return incidentDate >= cutoffDate;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, maxCount);
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

      // Update title with version and status
      const manifest = chrome.runtime.getManifest();
      const version = manifest.version;
      const statusText = this.getStatusText(status);
      const titleSuffix = affectedCount > 0 ? ` (${affectedCount} affected)` : '';
      await chrome.action.setTitle({
        title: `Vibe Stats v${version} - ${statusText}${titleSuffix}`
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

    return components.filter(component => {
      const isNotOperational = component.status &&
        component.status.toLowerCase() !== 'operational';
      return isNotOperational;
    }).length;
  }

  getIconPath(color) {
    return {
      "16": `icons/ai-vibe-16.png`,
      "32": `icons/ai-vibe-32.png`,
      "48": `icons/ai-vibe-48.png`,
      "128": `icons/ai-vibe-128.png`
    };
  }

  /**
   * Handle icon animation for different statuses
   */
  handleIconAnimation(status) {
    this.clearAnimation();

    if (status !== 'operational' && status !== 'none') {
      let isVisible = true;
      this.animationStartTime = Date.now();

      this.animationInterval = setInterval(async () => {
        try {
          if (Date.now() - this.animationStartTime > this.maxAnimationDuration) {
            console.log('Animation max duration reached, stopping animation');
            this.clearAnimation();
            await chrome.action.setBadgeBackgroundColor({
              color: this.getBadgeColor(status)
            });
            return;
          }

          if (isVisible) {
            await chrome.action.setBadgeBackgroundColor({
              color: [255, 0, 0, 100]
            });
          } else {
            await chrome.action.setBadgeBackgroundColor({
              color: this.getBadgeColor(status)
            });
          }
          isVisible = !isVisible;
        } catch (error) {
          console.error('Animation error:', error);
          this.clearAnimation();
        }
      }, 1000);
    }
  }

  /**
   * Clear animation interval and reset state
   */
  clearAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    this.animationStartTime = null;
  }

  getBadgeColor(status) {
    switch (status) {
      case 'none':
      case 'operational':
        return '#22c55e';
      case 'minor':
        return '#eab308';
      case 'major':
      case 'critical':
        return '#ef4444';
      default:
        return '#64748b';
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
    return true;
  }

  if (message.action === 'getStatus') {
    (async () => {
      try {
        const data = await chrome.storage.local.get([
          'vstateStatus', 'claudeStatus', 'githubStatus', 'openaiStatus', 'geminiStatus',
          'claudeIncidents', 'githubIncidents', 'openaiIncidents', 'geminiIncidents',
          'lastUpdated', 'lastError'
        ]);
        sendResponse({ status: 'success', data });
      } catch (error) {
        sendResponse({ status: 'error', error: error.message });
      }
    })();
    return true;
  }
});
