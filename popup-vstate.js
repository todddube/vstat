/**
 * VState PopupController manages the extension popup interface
 * Handles status display, service expansion, and user interactions
 */
class VStatePopupController {
  constructor() {
    this.refreshing = false;
    this.errorRetryCount = 0;
    this.maxErrorRetries = 3;
    this.expandedServices = new Set();
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

      // Expandable service items
      document.querySelectorAll('.expandable-service').forEach(service => {
        service.addEventListener('click', (e) => {
          e.preventDefault();
          const serviceName = service.getAttribute('data-service');
          this.toggleServiceExpansion(serviceName);
        });
      });

      // Handle popup visibility changes
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.onPopupVisible();
        }
      });

      // About modal functionality
      const aboutBtn = document.getElementById('about-btn');
      const aboutModal = document.getElementById('about-modal');
      const aboutClose = document.getElementById('about-close');

      if (aboutBtn && aboutModal && aboutClose) {
        aboutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.showAboutModal();
        });

        aboutClose.addEventListener('click', (e) => {
          e.preventDefault();
          this.hideAboutModal();
        });

        // Close modal when clicking outside content
        aboutModal.addEventListener('click', (e) => {
          if (e.target === aboutModal) {
            this.hideAboutModal();
          }
        });
      }

    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  /**
   * Set up keyboard navigation for accessibility
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Close about modal with Escape key
      if (e.key === 'Escape') {
        const aboutModal = document.getElementById('about-modal');
        if (aboutModal && aboutModal.classList.contains('show')) {
          this.hideAboutModal();
          return;
        }
      }

      // Refresh with Ctrl+R or F5
      if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        this.refreshStatus();
        return;
      }

      // Navigate services with arrow keys when focused
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('expandable-service')) {
          e.preventDefault();
          const services = Array.from(document.querySelectorAll('.expandable-service'));
          const currentIndex = services.indexOf(focused);
          const nextIndex = e.key === 'ArrowDown' 
            ? (currentIndex + 1) % services.length 
            : (currentIndex - 1 + services.length) % services.length;
          services[nextIndex].focus();
        }
      }

      // Activate service expansion with Enter or Space
      if (e.key === 'Enter' || e.key === ' ') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('expandable-service')) {
          e.preventDefault();
          const serviceName = focused.getAttribute('data-service');
          this.toggleServiceExpansion(serviceName);
        }
      }
    });
  }

  /**
   * Toggle service expansion to show/hide incidents
   */
  toggleServiceExpansion(serviceName) {
    const service = document.querySelector(`[data-service="${serviceName}"]`);
    const isExpanded = this.expandedServices.has(serviceName);
    
    if (isExpanded) {
      // Collapse
      this.expandedServices.delete(serviceName);
      service.classList.remove('expanded');
      this.hideServiceIncidents(serviceName);
    } else {
      // Expand
      this.expandedServices.add(serviceName);
      service.classList.add('expanded');
      this.showServiceIncidents(serviceName);
    }
  }

  /**
   * Show incidents for a specific service
   */
  async showServiceIncidents(serviceName) {
    const sectionName = serviceName.startsWith('claude') ? 'claude' : 'github';
    const incidentsContainer = document.getElementById(`${sectionName}-incidents`);
    const incidentsContent = document.getElementById(`${sectionName}-incidents-content`);
    
    if (!incidentsContainer || !incidentsContent) return;
    
    // Show the container
    incidentsContainer.style.display = 'block';
    incidentsContent.innerHTML = '<div class="loading">🔄 Loading incidents...</div>';
    
    try {
      // Get status data from storage
      const result = await chrome.storage.local.get(['vstateStatus', 'claudeStatus', 'githubStatus', 'claudeIncidents', 'githubIncidents']);
      
      let incidents = [];
      if (sectionName === 'claude') {
        incidents = result.claudeIncidents || [];
      } else {
        incidents = result.githubIncidents || [];
      }
      
      // Filter incidents for specific service if needed
      const filteredIncidents = this.filterIncidentsForService(incidents, serviceName);
      
      if (filteredIncidents.length === 0) {
        incidentsContent.innerHTML = `<div class="no-incidents">No recent incidents for ${this.getServiceDisplayName(serviceName)} 🎉</div>`;
      } else {
        incidentsContent.innerHTML = filteredIncidents.map(incident => this.renderIncident(incident)).join('');
      }
      
    } catch (error) {
      console.error('Error loading service incidents:', error);
      incidentsContent.innerHTML = '<div class="no-incidents error">Error loading incidents</div>';
    }
  }

  /**
   * Hide incidents for a specific service
   */
  hideServiceIncidents(serviceName) {
    const sectionName = serviceName.startsWith('claude') ? 'claude' : 'github';
    const incidentsContainer = document.getElementById(`${sectionName}-incidents`);
    
    if (incidentsContainer) {
      incidentsContainer.style.display = 'none';
    }
  }

  /**
   * Filter incidents based on service type
   */
  filterIncidentsForService(incidents, serviceName) {
    // For now, return all incidents for the service provider
    // Could be enhanced to filter by specific service components
    return incidents.slice(0, 5); // Show max 5 recent incidents
  }

  /**
   * Get display name for service
   */
  getServiceDisplayName(serviceName) {
    const serviceNames = {
      'claude-web': 'Claude Web',
      'claude-api': 'Claude API',
      'claude-dashboard': 'Claude Dashboard',
      'claude-docs': 'Claude Docs/Support',
      'github-copilot': 'GitHub Copilot',
      'github-api': 'GitHub API',
      'github-codespaces': 'GitHub Codespaces',
      'github-actions': 'GitHub Actions'
    };
    return serviceNames[serviceName] || serviceName;
  }

  /**
   * Handle when popup becomes visible
   */
  onPopupVisible() {
    // Auto-refresh if data is older than 30 seconds
    chrome.storage.local.get(['lastUpdated'], (result) => {
      const lastUpdated = result.lastUpdated;
      if (lastUpdated) {
        const timeSince = Date.now() - lastUpdated;
        if (timeSince > 30000) { // 30 seconds
          this.loadStatus();
        }
      }
    });
  }

  /**
   * Start auto-refresh interval
   */
  startAutoRefresh() {
    // Refresh every 2 minutes when popup is open
    this.autoRefreshInterval = setInterval(() => {
      if (!document.hidden && !this.refreshing) {
        this.loadStatus();
      }
    }, 120000);
  }

  /**
   * Load status data from storage
   */
  async loadStatus() {
    try {
      const result = await chrome.storage.local.get([
        'vstateStatus', 'claudeStatus', 'githubStatus', 
        'claudeIncidents', 'githubIncidents', 'lastUpdated', 'lastError'
      ]);

      if (result.vstateStatus) {
        this.updateStatusDisplay(result.vstateStatus, result.lastUpdated, result.lastError);
        this.updateClaudeServices(result.claudeStatus);
        this.updateGitHubServices(result.githubStatus);
        this.errorRetryCount = 0; // Reset error count on success
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
   * Update Claude services display
   */
  updateClaudeServices(claudeStatus) {
    if (!claudeStatus) return;

    // Update Claude service icons based on status data
    const claudeServices = {
      'claude-web': 'claude.ai',
      'claude-api': 'API',
      'claude-dashboard': 'Console',
      'claude-docs': 'Documentation'
    };

    Object.entries(claudeServices).forEach(([serviceId, componentName]) => {
      const serviceEl = document.querySelector(`[data-service="${serviceId}"]`);
      if (!serviceEl) return;

      const iconEl = serviceEl.querySelector('.service-icon');
      if (!iconEl) return;

      // Find matching component in Claude status
      let status = 'unknown';
      if (claudeStatus.components) {
        const component = claudeStatus.components.find(comp => 
          comp.name.toLowerCase().includes(componentName.toLowerCase()) ||
          componentName.toLowerCase().includes(comp.name.toLowerCase())
        );
        if (component) {
          status = this.mapComponentStatus(component.status);
        }
      }

      iconEl.className = `service-icon ${status}`;
      iconEl.textContent = this.getServiceIcon(status);
    });
  }

  /**
   * Update GitHub services display
   */
  updateGitHubServices(githubStatus) {
    if (!githubStatus) return;

    // Update GitHub service icons based on status data
    const githubServices = {
      'github-copilot': 'Copilot',
      'github-api': 'API',
      'github-codespaces': 'Codespaces',
      'github-actions': 'Actions'
    };

    Object.entries(githubServices).forEach(([serviceId, componentName]) => {
      const serviceEl = document.querySelector(`[data-service="${serviceId}"]`);
      if (!serviceEl) return;

      const iconEl = serviceEl.querySelector('.service-icon');
      if (!iconEl) return;

      // Find matching component in GitHub status
      let status = 'unknown';
      if (githubStatus.components) {
        const component = githubStatus.components.find(comp => 
          comp.name.toLowerCase().includes(componentName.toLowerCase()) ||
          componentName.toLowerCase().includes(comp.name.toLowerCase())
        );
        if (component) {
          status = this.mapComponentStatus(component.status);
        }
      }

      iconEl.className = `service-icon ${status}`;
      iconEl.textContent = this.getServiceIcon(status);
    });
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
        statusIcon.src = `icons/vstate-${iconColor}-32.png`;
        statusIcon.alt = `VState status: ${this.getStatusText(status)}`;
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

  /**
   * Render incident for display
   */
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
    
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = 'No data available - Click refresh';
    }
  }

  /**
   * Show error state with retry option
   */
  showError(message = 'Failed to load data') {
    const lastUpdatedEl = document.getElementById('last-updated');
    
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = message;
      lastUpdatedEl.className = 'last-updated error';
    }
  }

  /**
   * Show the About modal with manifest information
   */
  async showAboutModal() {
    try {
      const manifest = chrome.runtime.getManifest();
      
      // Update modal content with manifest data
      const titleEl = document.getElementById('about-title');
      const versionEl = document.getElementById('about-version');
      const descriptionEl = document.getElementById('about-description');
      const authorEl = document.getElementById('about-author');

      if (titleEl) titleEl.textContent = manifest.name;
      if (versionEl) versionEl.textContent = `Version ${manifest.version}`;
      if (descriptionEl) descriptionEl.textContent = manifest.description;
      
      // Extract author name and URL from the author field
      if (authorEl && manifest.author) {
        const authorText = manifest.author;
        const urlMatch = authorText.match(/https?:\/\/[^\s]+/);
        const nameMatch = authorText.match(/^([^-]+)/);
        
        if (nameMatch && urlMatch) {
          const authorName = nameMatch[1].trim();
          const authorUrl = urlMatch[0];
          authorEl.textContent = authorName;
          authorEl.href = authorUrl;
        } else {
          authorEl.textContent = authorText;
          authorEl.href = '#';
        }
      }

      // Show the modal
      const modal = document.getElementById('about-modal');
      if (modal) {
        modal.classList.add('show');
        // Focus the close button for accessibility
        const closeBtn = document.getElementById('about-close');
        if (closeBtn) {
          closeBtn.focus();
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
    const modal = document.getElementById('about-modal');
    if (modal) {
      modal.classList.remove('show');
      // Return focus to the about button
      const aboutBtn = document.getElementById('about-btn');
      if (aboutBtn) {
        aboutBtn.focus();
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
  
  // Cleanup when popup closes
  window.addEventListener('beforeunload', () => {
    controller.cleanup();
  });
});
