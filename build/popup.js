/**
 * PopupController manages the extension popup interface
 * Handles status display, incident management, and user interactions
 */
class PopupController {
  constructor() {
    this.refreshing = false;
    this.errorRetryCount = 0;
    this.maxErrorRetries = 3;
    this.init().catch(error => {
      console.error('Failed to initialize popup:', error);
      this.showError('Failed to initialize');
    });
  }

  /**
   * Initialize the popup controller
   */
  async init() {
    try {
      await this.loadStatus();
      this.setupEventListeners();
      this.setupKeyboardNavigation();
      this.startAutoRefresh();
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners with error handling
   */
  setupEventListeners() {
    try {
      // Refresh button with debouncing
      const refreshBtn = document.getElementById('refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.refreshStatus();
        });
      }

      // Tab switching functionality
      document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const tabName = e.target.getAttribute('data-tab');
          if (tabName) {
            this.switchTab(tabName);
          }
        });
      });

      // Handle popup visibility changes
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.onPopupVisible();
        }
      });


    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  /**
   * Set up keyboard navigation for accessibility
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.refreshStatus();
      }
      
      if (e.key >= '1' && e.key <= '2') {
        const tabIndex = parseInt(e.key) - 1;
        const tabs = ['active', 'recent'];
        if (tabs[tabIndex]) {
          this.switchTab(tabs[tabIndex]);
        }
      }
    });
  }

  /**
   * Start auto-refresh when popup is visible
   */
  startAutoRefresh() {
    // Refresh data every 30 seconds when popup is open
    this.autoRefreshInterval = setInterval(() => {
      if (!document.hidden && !this.refreshing) {
        this.loadStatus();
      }
    }, 30000);
  }

  /**
   * Handle popup becoming visible
   */
  async onPopupVisible() {
    try {
      await this.loadStatus();
    } catch (error) {
      console.error('Error refreshing on popup visible:', error);
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }

  /**
   * Load status data with enhanced error handling and retry logic
   */
  async loadStatus() {
    try {
      // Try to get fresh data via message first, fallback to storage
      const response = await this.sendMessage({ action: 'getStatus' });
      
      let data;
      if (response?.status === 'success') {
        data = response.data;
      } else {
        // Fallback to direct storage access
        data = await chrome.storage.local.get([
          'status', 'incidents', 'historicalIncidents', 'lastFiveIncidents', 
          'components', 'lastUpdated', 'lastError'
        ]);
      }
      
      if (data.status) {
        this.updateStatusDisplay(data.status, data.lastUpdated, data.lastError);
        this.updateServicesDisplay(data.components || []);
        this.updateIncidentsDisplay(data.incidents || []);
        this.updateRecentIncidentsDisplay(data.lastFiveIncidents || []);
        this.errorRetryCount = 0; // Reset on success
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
   * Send message to background script with timeout
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
   * Update status display with error state handling
   */
  updateStatusDisplay(status, lastUpdated, lastError) {
    try {
      const statusIndicator = document.getElementById('status-indicator');
      const statusIcon = document.getElementById('status-icon');
      const lastUpdatedEl = document.getElementById('last-updated');

      if (statusIndicator) {
        statusIndicator.className = `status-indicator status-${status}`;
        statusIndicator.setAttribute('aria-label', `Status: ${this.getStatusText(status)}`);
      }
      
      if (statusIcon) {
        const iconColor = this.getIconColor(status);
        statusIcon.src = `icons/claude-${iconColor}-32.png`;
        statusIcon.alt = `Claude status: ${this.getStatusText(status)}`;
      }

      if (lastUpdatedEl) {
        if (lastUpdated) {
          const date = new Date(lastUpdated);
          const timeAgo = this.formatTime(date);
          lastUpdatedEl.textContent = `Updated: ${timeAgo}`;
          
          if (lastError) {
            const errorDate = new Date(lastError.timestamp);
            const errorAgo = this.formatTime(errorDate);
            lastUpdatedEl.title = `Last error: ${lastError.message} (${errorAgo})`;
          } else {
            lastUpdatedEl.removeAttribute('title');
          }
        } else {
          lastUpdatedEl.textContent = 'No data available';
        }
      }
    } catch (error) {
      console.error('Error updating status display:', error);
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

  /**
   * Update services display with component status
   */
  updateServicesDisplay(components) {
    const serviceMapping = {
      'claude.ai': ['Claude Frontend', 'Claude.ai Website', 'claude.ai'],
      'Console': ['Anthropic Console', 'console.anthropic.com', 'Console'],
      'API': ['Anthropic API', 'api.anthropic.com', 'API'],
      'Claude Code': ['Claude Code Extension', 'Claude Code', 'Code Editor']
    };

    const serviceItems = document.querySelectorAll('.service-item');
    serviceItems.forEach((item, index) => {
      const serviceNameEl = item.querySelector('.service-name');
      const serviceIconEl = item.querySelector('.service-icon');
      const serviceName = serviceNameEl.textContent;
      
      // Find matching component
      const possibleNames = serviceMapping[serviceName] || [serviceName];
      const component = components.find(comp => 
        possibleNames.some(name => 
          comp.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(comp.name.toLowerCase())
        )
      );

      let status = 'unknown';
      let icon = '?';
      
      if (component) {
        status = this.mapComponentStatus(component.status);
        icon = this.getServiceIcon(status);
      }

      serviceIconEl.className = `service-icon ${status}`;
      serviceIconEl.textContent = icon;
      serviceIconEl.setAttribute('title', component ? `${component.name}: ${component.status}` : `${serviceName}: Status unknown`);
    });
  }

  /**
   * Map component status to our internal status levels
   */
  mapComponentStatus(status) {
    if (!status) return 'unknown';
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'operational') return 'operational';
    if (statusLower.includes('degraded') || statusLower.includes('minor')) return 'minor';
    if (statusLower.includes('major') || statusLower.includes('partial')) return 'major';
    if (statusLower.includes('outage') || statusLower.includes('critical')) return 'critical';
    return 'unknown';
  }

  /**
   * Get emoji/symbol for service status
   */
  getServiceIcon(status) {
    switch (status) {
      case 'operational': return '✓';
      case 'minor': return '⚠';
      case 'major': return '⚡';
      case 'critical': return '✕';
      default: return '?';
    }
  }

  updateIncidentsDisplay(incidents) {
    const container = document.getElementById('incidents-container');
    
    if (!container) return;
    
    if (!incidents || incidents.length === 0) {
      container.innerHTML = '<div class="no-incidents">No active incidents 🎉</div>';
      return;
    }

    container.innerHTML = incidents.map(incident => this.renderIncident(incident)).join('');
  }

  /**
   * Update recent incidents display (last 5)
   */
  updateRecentIncidentsDisplay(incidents) {
    const container = document.getElementById('recent-incidents-container');
    
    if (!container) return;
    
    if (!incidents || incidents.length === 0) {
      container.innerHTML = '<div class="no-incidents">No recent incidents found</div>';
      return;
    }

    container.innerHTML = incidents.map(incident => this.renderRecentIncident(incident)).join('');
  }

  updateHistoricalDisplay(historicalIncidents) {
    const container = document.getElementById('historical-container');
    
    if (!container) return; // Element might not exist yet
    
    if (!historicalIncidents || historicalIncidents.length === 0) {
      container.innerHTML = '<div class="no-incidents">No incidents in past 24 hours 🎉</div>';
      return;
    }

    container.innerHTML = historicalIncidents.map(incident => this.renderHistoricalIncident(incident)).join('');
  }

  renderIncident(incident) {
    const impactClass = incident.impact ? `impact-${incident.impact}` : '';
    const statusClass = incident.status ? incident.status.replace(/\s+/g, '-').toLowerCase() : '';
    
    let updateText = '';
    if (incident.updates && incident.updates.length > 0) {
      updateText = `
        <div class="incident-update">
          ${this.truncateText(incident.updates[0].body, 120)}
        </div>
      `;
    }

    return `
      <div class="incident ${impactClass}">
        <div class="incident-name">${this.escapeHtml(incident.titleWithDate || incident.name)}</div>
        <span class="incident-status ${statusClass}">${incident.status}</span>
        ${updateText}
        <div class="incident-date">${this.formatTime(new Date(incident.created_at))}</div>
      </div>
    `;
  }

  /**
   * Render a recent incident with full details
   */
  renderRecentIncident(incident) {
    const impactClass = incident.impact ? `impact-${incident.impact}` : '';
    const statusClass = incident.status ? incident.status.replace(/\s+/g, '-').toLowerCase() : '';
    const isResolved = incident.status === 'resolved';
    
    let durationText = '';
    if (incident.duration) {
      durationText = `<span class="incident-duration">Duration: ${incident.duration}</span>`;
    }

    let updatesText = '';
    if (incident.updates && incident.updates.length > 0) {
      const latestUpdate = incident.updates[0];
      updatesText = `
        <div class="incident-update">
          <strong>Latest:</strong> ${this.truncateText(latestUpdate.body, 100)}
        </div>
      `;
    }

    return `
      <div class="historical-incident ${impactClass} ${isResolved ? 'resolved' : ''}">
        <div class="incident-header">
          <div class="incident-name">${this.escapeHtml(incident.titleWithDate || incident.name)}</div>
          <span class="incident-status ${statusClass}">${incident.status}</span>
        </div>
        ${updatesText}
        <div class="incident-meta">
          <div class="incident-date">${this.formatTime(new Date(incident.created_at))}</div>
          ${durationText}
        </div>
      </div>
    `;
  }

  renderHistoricalIncident(incident) {
    const impactClass = incident.impact ? `impact-${incident.impact}` : '';
    const statusClass = incident.status ? incident.status.replace(/\s+/g, '-').toLowerCase() : '';
    const isResolved = incident.status === 'resolved';
    
    let durationText = '';
    if (incident.duration) {
      durationText = `<span class="incident-duration">Duration: ${incident.duration}</span>`;
    }

    return `
      <div class="historical-incident ${impactClass} ${isResolved ? 'resolved' : ''}">
        <div class="incident-header">
          <div class="incident-name">${this.escapeHtml(incident.name)}</div>
          <span class="incident-status ${statusClass}">${incident.status}</span>
        </div>
        <div class="incident-summary">
          ${this.escapeHtml(incident.summary || 'No summary available')}
        </div>
        <div class="incident-meta">
          <div class="incident-date">${this.formatTime(new Date(incident.created_at))}</div>
          ${durationText}
        </div>
      </div>
    `;
  }

  /**
   * Refresh status with proper debouncing and error handling
   */
  async refreshStatus() {
    if (this.refreshing) return;
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (!refreshBtn) return;
    
    this.refreshing = true;
    const originalText = refreshBtn.textContent;
    
    try {
      refreshBtn.textContent = 'Refreshing...';
      refreshBtn.disabled = true;
      refreshBtn.setAttribute('aria-busy', 'true');

      const response = await this.sendMessage({ action: 'forceRefresh' });
      
      if (response?.status === 'error') {
        throw new Error(response.error || 'Refresh failed');
      }
      
      // Wait a moment for the background script to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await this.loadStatus();
      
    } catch (error) {
      console.error('Refresh failed:', error);
      this.showTemporaryMessage('Refresh failed. Please try again.', 'error');
    } finally {
      refreshBtn.textContent = originalText;
      refreshBtn.disabled = false;
      refreshBtn.removeAttribute('aria-busy');
      this.refreshing = false;
    }
  }

  /**
   * Show temporary message to user
   */
  showTemporaryMessage(message, type = 'info') {
    const lastUpdatedEl = document.getElementById('last-updated');
    if (!lastUpdatedEl) return;
    
    const originalText = lastUpdatedEl.textContent;
    const originalClass = lastUpdatedEl.className;
    
    lastUpdatedEl.textContent = message;
    lastUpdatedEl.className = `last-updated ${type}`;
    
    setTimeout(() => {
      lastUpdatedEl.textContent = originalText;
      lastUpdatedEl.className = originalClass;
    }, 3000);
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

  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show no data state with helpful message
   */
  showNoData() {
    const lastUpdatedEl = document.getElementById('last-updated');
    const incidentsContainer = document.getElementById('incidents-container');
    
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = 'No data available';
    }
    
    if (incidentsContainer) {
      incidentsContainer.innerHTML = 
        '<div class="loading">Click refresh to load data</div>';
    }
  }

  /**
   * Show error state with retry option
   */
  showError(message = 'Failed to load data') {
    const lastUpdatedEl = document.getElementById('last-updated');
    const incidentsContainer = document.getElementById('incidents-container');
    
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = message;
      lastUpdatedEl.className = 'last-updated error';
    }
    
    if (incidentsContainer) {
      incidentsContainer.innerHTML = 
        '<div class="no-incidents error">Error loading incidents. <button onclick="location.reload()">Retry</button></div>';
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
  const controller = new PopupController();
  
  // Cleanup when popup closes
  window.addEventListener('beforeunload', () => {
    controller.cleanup();
  });
});