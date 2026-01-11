/**
 * VState PopupController manages the extension popup interface
 * Handles status display for Claude, GitHub, OpenAI, and Gemini
 */
class VStatePopupController {
  constructor() {
    this.refreshing = false;
    this.errorRetryCount = 0;
    this.maxErrorRetries = 3;

    // Service configuration with status page URLs
    this.services = {
      claude: {
        name: 'Claude AI',
        statusUrl: 'https://status.anthropic.com',
        components: [
          { id: 'claude-web', name: 'Claude.ai', patterns: [/\bclaude\.ai\b/i, /\bweb\b/i] },
          { id: 'claude-api', name: 'API', patterns: [/\bapi\b/i] }
        ]
      },
      github: {
        name: 'GitHub',
        statusUrl: 'https://www.githubstatus.com',
        components: [
          { id: 'copilot', name: 'Copilot', patterns: [/\bcopilot\b/i] },
          { id: 'actions', name: 'Actions', patterns: [/\bactions\b/i] }
        ]
      },
      openai: {
        name: 'OpenAI',
        statusUrl: 'https://status.openai.com',
        components: [
          { id: 'chatgpt', name: 'ChatGPT', patterns: [/\bchatgpt\b/i, /\bchat\b/i] },
          { id: 'api', name: 'API', patterns: [/\bapi\b/i] }
        ]
      },
      gemini: {
        name: 'Gemini',
        statusUrl: 'https://aistudio.google.com/status',
        components: [
          { id: 'ai-studio', name: 'AI Studio', patterns: [/\bstudio\b/i] },
          { id: 'gemini-api', name: 'Gemini API', patterns: [/\bapi\b/i, /\bgemini\b/i] }
        ]
      }
    };

    // Cache DOM elements
    this.elements = {};

    this.init().catch(error => {
      console.error('Failed to initialize popup:', error);
      this.showError('Failed to initialize');
    });
  }

  /**
   * Cache frequently accessed DOM elements
   */
  cacheElements() {
    this.elements = {
      overallStatus: document.getElementById('overall-status'),
      statusDot: document.getElementById('status-dot'),
      statusText: document.getElementById('status-text'),
      statusIcon: document.getElementById('status-icon'),
      lastUpdated: document.getElementById('last-updated'),
      versionBadge: document.getElementById('version-badge'),
      refreshBtn: document.getElementById('refresh-btn'),
      aboutBtn: document.getElementById('about-btn'),
      aboutModal: document.getElementById('about-modal'),
      aboutClose: document.getElementById('about-close')
    };

    // Cache service card elements
    ['claude', 'github', 'openai', 'gemini'].forEach(service => {
      this.elements[`${service}Card`] = document.getElementById(`${service}-card`);
      this.elements[`${service}Status`] = document.getElementById(`${service}-status`);
      this.elements[`${service}Components`] = document.getElementById(`${service}-components`);
      this.elements[`${service}Incidents`] = document.getElementById(`${service}-incidents`);
    });
  }

  /**
   * Initialize the popup controller
   */
  async init() {
    try {
      this.cacheElements();
      this.loadVersion();
      this.setupEventListeners();
      this.setupKeyboardNavigation();
      await this.loadStatus();
      this.startAutoRefresh();
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  /**
   * Load and display version from manifest
   */
  loadVersion() {
    try {
      const manifest = chrome.runtime.getManifest();
      const version = manifest.version;

      if (this.elements.versionBadge) {
        this.elements.versionBadge.textContent = `v${version}`;
        this.elements.versionBadge.title = `${manifest.name} v${version}`;
      }
    } catch (error) {
      console.error('Error loading version:', error);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Refresh button
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.refreshStatus();
      });
    }

    // About modal
    if (this.elements.aboutBtn && this.elements.aboutModal && this.elements.aboutClose) {
      this.elements.aboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showAboutModal();
      });

      this.elements.aboutClose.addEventListener('click', (e) => {
        e.preventDefault();
        this.hideAboutModal();
      });

      this.elements.aboutModal.addEventListener('click', (e) => {
        if (e.target === this.elements.aboutModal) {
          this.hideAboutModal();
        }
      });
    }

    // Incident toggles
    document.querySelectorAll('.toggle-btn').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const service = toggle.getAttribute('data-service');
        this.toggleIncidents(service, toggle);
      });
    });

    // Service card clicks - open status page
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on the toggle button
        if (e.target.closest('.toggle-btn')) return;

        const service = card.getAttribute('data-service');
        if (this.services[service]) {
          chrome.tabs.create({ url: this.services[service].statusUrl });
        }
      });
    });

    // Handle popup visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.onPopupVisible();
      }
    });
  }

  /**
   * Set up keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.elements.aboutModal?.classList.contains('show')) {
          this.hideAboutModal();
          return;
        }
      }

      if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        this.refreshStatus();
      }
    });
  }

  /**
   * Toggle incidents visibility for a service
   */
  toggleIncidents(service, toggle) {
    const container = this.elements[`${service}Incidents`];
    if (!container) return;

    const isExpanded = toggle.classList.contains('expanded');

    if (isExpanded) {
      toggle.classList.remove('expanded');
      container.classList.remove('show');
    } else {
      toggle.classList.add('expanded');
      container.classList.add('show');
      this.loadServiceIncidents(service);
    }
  }

  /**
   * Load incidents for a specific service
   */
  async loadServiceIncidents(service) {
    const container = this.elements[`${service}Incidents`];
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading incidents...</div>';

    try {
      const result = await chrome.storage.local.get([`${service}Incidents`]);
      const incidents = result[`${service}Incidents`] || [];

      if (incidents.length === 0) {
        container.innerHTML = '<div class="no-incidents">No recent incidents</div>';
        return;
      }

      const recentIncidents = incidents.slice(0, 5);
      container.innerHTML = recentIncidents.map(incident => this.renderIncident(incident)).join('');

    } catch (error) {
      console.error(`Error loading ${service} incidents:`, error);
      container.innerHTML = '<div class="no-incidents">Error loading incidents</div>';
    }
  }

  /**
   * Render a single incident
   */
  renderIncident(incident) {
    const impactClass = incident.impact ? `impact-${incident.impact}` : '';
    const statusClass = incident.status === 'resolved' ? 'resolved' : '';

    let updateText = '';
    if (incident.incident_updates?.length > 0 || incident.updates?.length > 0) {
      const updates = incident.incident_updates || incident.updates || [];
      if (updates[0]?.body) {
        updateText = `<div class="incident-desc">${this.truncateText(updates[0].body, 100)}</div>`;
      }
    }

    const title = incident.titleWithDate || incident.name || 'Unknown incident';
    const dateStr = incident.created_at ? this.formatTime(new Date(incident.created_at)) : '';

    return `
      <div class="incident-item ${impactClass}">
        <div class="incident-title">${this.escapeHtml(title)}</div>
        <div class="incident-meta">
          <span class="incident-status-tag ${statusClass}">${incident.status || 'unknown'}</span>
          ${dateStr ? `<span class="incident-time">${dateStr}</span>` : ''}
        </div>
        ${updateText}
      </div>
    `;
  }

  /**
   * Handle popup becoming visible
   */
  onPopupVisible() {
    chrome.storage.local.get(['lastUpdated'], (result) => {
      if (result.lastUpdated) {
        const timeSince = Date.now() - new Date(result.lastUpdated).getTime();
        if (timeSince > 30000) {
          this.loadStatus();
        }
      }
    });
  }

  /**
   * Start auto-refresh interval
   */
  startAutoRefresh() {
    this.autoRefreshInterval = setInterval(() => {
      if (!document.hidden && !this.refreshing) {
        this.loadStatus();
      }
    }, 120000); // 2 minutes
  }

  /**
   * Load status data from storage
   */
  async loadStatus() {
    try {
      const result = await chrome.storage.local.get([
        'vstateStatus', 'claudeStatus', 'githubStatus', 'openaiStatus', 'geminiStatus',
        'claudeIncidents', 'githubIncidents', 'openaiIncidents', 'geminiIncidents',
        'lastUpdated', 'lastError'
      ]);

      if (result.vstateStatus) {
        this.updateOverallStatus(result.vstateStatus, result.lastUpdated);
        this.updateServiceCard('claude', result.claudeStatus);
        this.updateServiceCard('github', result.githubStatus);
        this.updateServiceCard('openai', result.openaiStatus);
        this.updateServiceCard('gemini', result.geminiStatus);
        this.errorRetryCount = 0;
      } else {
        this.showNoData();
      }
    } catch (error) {
      console.error('Failed to load status:', error);

      if (this.errorRetryCount < this.maxErrorRetries) {
        this.errorRetryCount++;
        setTimeout(() => this.loadStatus(), 1000 * this.errorRetryCount);
      } else {
        this.showError('Unable to load status data');
      }
    }
  }

  /**
   * Update overall status display
   */
  updateOverallStatus(status, lastUpdated) {
    const indicator = status.indicator || 'unknown';
    const description = status.description || this.getStatusText(indicator);

    // Update overall status banner
    if (this.elements.overallStatus) {
      this.elements.overallStatus.className = `status-banner ${indicator}`;
    }

    if (this.elements.statusDot) {
      this.elements.statusDot.className = `status-indicator ${indicator}`;
    }

    if (this.elements.statusText) {
      this.elements.statusText.textContent = description;
    }

    // Update last updated time
    if (this.elements.lastUpdated && lastUpdated) {
      const date = new Date(lastUpdated);
      this.elements.lastUpdated.textContent = `Updated: ${this.formatTime(date)}`;
    }
  }

  /**
   * Update a service card with status data
   */
  updateServiceCard(serviceName, serviceData) {
    const statusEl = this.elements[`${serviceName}Status`];
    const componentsEl = this.elements[`${serviceName}Components`];

    if (!statusEl) return;

    // Get status indicator
    let indicator = 'unknown';
    if (serviceData?.status?.indicator) {
      indicator = serviceData.status.indicator;
    } else if (typeof serviceData?.status === 'string') {
      indicator = serviceData.status;
    }

    // Update status badge
    statusEl.className = `card-status ${indicator}`;
    const statusIcon = statusEl.querySelector('.status-icon');
    const statusLabel = statusEl.querySelector('.status-label');

    if (statusIcon) {
      statusIcon.className = `status-icon ${indicator}`;
      statusIcon.innerHTML = this.getStatusIcon(indicator);
    }

    if (statusLabel) {
      statusLabel.textContent = this.getStatusLabel(indicator);
    }

    // Update components
    if (componentsEl && serviceData?.components) {
      this.updateServiceComponents(serviceName, componentsEl, serviceData.components);
    }
  }

  /**
   * Update service components display
   */
  updateServiceComponents(serviceName, container, components) {
    const serviceConfig = this.services[serviceName];
    if (!serviceConfig) return;

    const html = serviceConfig.components.map(configComp => {
      // Find matching component from API data
      const apiComp = components.find(c => {
        const name = c.name?.toLowerCase() || '';
        return configComp.patterns.some(p => p.test(name));
      });

      const status = apiComp?.status?.toLowerCase() || 'operational';
      const statusClass = this.mapStatusClass(status);
      const statusText = this.getComponentStatusText(status);

      return `
        <div class="component-item">
          <span class="component-name">${configComp.name}</span>
          <div class="component-status">
            <div class="component-dot ${statusClass}"></div>
            <span class="component-text">${statusText}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Map status string to CSS class
   */
  mapStatusClass(status) {
    if (!status) return 'unknown';
    const s = status.toLowerCase();
    if (s === 'operational') return '';
    if (s.includes('degraded') || s.includes('minor')) return 'minor';
    if (s.includes('major') || s.includes('partial')) return 'major';
    if (s.includes('outage') || s.includes('critical')) return 'critical';
    return 'unknown';
  }

  /**
   * Get component status text
   */
  getComponentStatusText(status) {
    if (!status) return 'UNKNOWN';
    const s = status.toLowerCase();
    if (s === 'operational') return 'OK';
    if (s.includes('degraded')) return 'DEGRADED';
    if (s.includes('minor')) return 'MINOR';
    if (s.includes('major')) return 'MAJOR';
    if (s.includes('partial')) return 'PARTIAL';
    if (s.includes('outage')) return 'OUTAGE';
    return 'UNKNOWN';
  }

  /**
   * Get status icon HTML
   */
  getStatusIcon(status) {
    switch (status) {
      case 'operational': return '&#10003;';
      case 'minor': return '&#9888;';
      case 'major': return '&#9889;';
      case 'critical': return '&#10007;';
      default: return '?';
    }
  }

  /**
   * Get status label text
   */
  getStatusLabel(status) {
    switch (status) {
      case 'operational': return 'Operational';
      case 'minor': return 'Minor Issues';
      case 'major': return 'Major Issues';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  }

  /**
   * Get human-readable status text
   */
  getStatusText(status) {
    switch (status) {
      case 'operational':
        return 'All Systems Operational';
      case 'minor':
        return 'Minor Issues Detected';
      case 'major':
        return 'Major Issues Detected';
      case 'critical':
        return 'Critical Issues Detected';
      default:
        return 'Status Unknown';
    }
  }

  /**
   * Refresh status with debouncing
   */
  async refreshStatus() {
    if (this.refreshing) return;
    if (!this.elements.refreshBtn) return;

    this.refreshing = true;
    const originalText = this.elements.refreshBtn.textContent;

    try {
      this.elements.refreshBtn.textContent = 'Refreshing...';
      this.elements.refreshBtn.disabled = true;

      const response = await this.sendMessage({ action: 'forceRefresh' });

      if (response?.status === 'error') {
        throw new Error(response.error || 'Refresh failed');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.loadStatus();

    } catch (error) {
      console.error('Refresh failed:', error);
      this.showTemporaryMessage('Refresh failed. Please try again.', 'error');
    } finally {
      this.elements.refreshBtn.textContent = originalText;
      this.elements.refreshBtn.disabled = false;
      this.refreshing = false;
    }
  }

  /**
   * Send message to background script
   */
  async sendMessage(message, timeout = 5000) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => resolve(null), timeout);

      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeoutId);
        if (chrome.runtime.lastError) {
          console.warn('Message error:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Show temporary message to user
   */
  showTemporaryMessage(message, type = 'info') {
    if (!this.elements.lastUpdated) return;

    const originalText = this.elements.lastUpdated.textContent;
    const originalClass = this.elements.lastUpdated.className;

    this.elements.lastUpdated.textContent = message;
    this.elements.lastUpdated.className = `last-updated ${type}`;

    setTimeout(() => {
      this.elements.lastUpdated.textContent = originalText;
      this.elements.lastUpdated.className = originalClass;
    }, 3000);
  }

  /**
   * Show no data state
   */
  showNoData() {
    if (this.elements.lastUpdated) {
      this.elements.lastUpdated.textContent = 'No data available - Click refresh';
    }
  }

  /**
   * Show error state
   */
  showError(message = 'Failed to load data') {
    if (this.elements.lastUpdated) {
      this.elements.lastUpdated.textContent = message;
      this.elements.lastUpdated.className = 'last-updated error';
    }
  }

  /**
   * Format time as relative string
   */
  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  /**
   * Truncate text to max length
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  /**
   * Escape HTML entities
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show the About modal
   */
  async showAboutModal() {
    try {
      const manifest = chrome.runtime.getManifest();

      const titleEl = document.getElementById('about-title');
      const versionEl = document.getElementById('about-version');
      const descriptionEl = document.getElementById('about-description');
      const authorEl = document.getElementById('about-author');

      if (titleEl) titleEl.textContent = manifest.name;
      if (versionEl) versionEl.textContent = `Version ${manifest.version}`;
      if (descriptionEl) descriptionEl.textContent = manifest.description;

      if (authorEl && manifest.author) {
        const authorText = manifest.author;
        const urlMatch = authorText.match(/https?:\/\/[^\s]+/);
        const nameMatch = authorText.match(/^([^-]+)/);

        if (nameMatch && urlMatch) {
          authorEl.textContent = nameMatch[1].trim();
          authorEl.href = urlMatch[0];
        }
      }

      if (this.elements.aboutModal) {
        this.elements.aboutModal.classList.add('show');
        if (this.elements.aboutClose) {
          this.elements.aboutClose.focus();
        }
      }
    } catch (error) {
      console.error('Error showing about modal:', error);
    }
  }

  /**
   * Hide the About modal
   */
  hideAboutModal() {
    if (this.elements.aboutModal) {
      this.elements.aboutModal.classList.remove('show');
      if (this.elements.aboutBtn) {
        this.elements.aboutBtn.focus();
      }
    }
  }

  /**
   * Cleanup when popup closes
   */
  cleanup() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const controller = new VStatePopupController();

  window.addEventListener('beforeunload', () => {
    controller.cleanup();
  });
});
