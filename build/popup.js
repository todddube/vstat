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
    this.fontScale = 1.0;
    this.minFontScale = 0.7;
    this.maxFontScale = 1.5;
    this.fontScaleStep = 0.1;
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
      await this.loadFontScale();
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

      // Section incident toggle buttons
      document.querySelectorAll('.section-incidents-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          const sectionName = toggle.getAttribute('data-section');
          this.toggleSectionIncidents(sectionName);
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

      
      // Service item click handlers for external links
      document.querySelectorAll('.service-item[data-url]').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const url = item.getAttribute('data-url');
          if (url) {
            chrome.tabs.create({ url: url });
          }
        });
      });
      
      // Status link click handlers
      document.querySelectorAll('.status-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const url = link.getAttribute('href');
          if (url) {
            chrome.tabs.create({ url: url });
          }
        });
      });
      
      // Demo button click handler
      const startDemoBtn = document.getElementById('demo-btn');
      
      if (startDemoBtn) {
        startDemoBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (this.demoTimer) {
            this.resetDemo();
          } else {
            this.startStatusDemo();
          }
        });
      }

      // Font scaling button handlers
      const fontIncreaseBtn = document.getElementById('font-increase');
      const fontDecreaseBtn = document.getElementById('font-decrease');
      
      if (fontIncreaseBtn) {
        fontIncreaseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.increaseFontSize();
        });
      }
      
      if (fontDecreaseBtn) {
        fontDecreaseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.decreaseFontSize();
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

      // Navigate section toggles with arrow keys when focused
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('section-incidents-toggle')) {
          e.preventDefault();
          const toggles = Array.from(document.querySelectorAll('.section-incidents-toggle'));
          const currentIndex = toggles.indexOf(focused);
          const nextIndex = e.key === 'ArrowDown' 
            ? (currentIndex + 1) % toggles.length 
            : (currentIndex - 1 + toggles.length) % toggles.length;
          toggles[nextIndex].focus();
        }
      }

      // Activate section incidents with Enter or Space
      if (e.key === 'Enter' || e.key === ' ') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('section-incidents-toggle')) {
          e.preventDefault();
          const sectionName = focused.getAttribute('data-section');
          this.toggleSectionIncidents(sectionName);
        }
      }
    });
  }

  /**
   * Toggle section incidents to show/hide recent issues
   */
  toggleSectionIncidents(sectionName) {
    const toggle = document.querySelector(`[data-section="${sectionName}"]`);
    const incidentsContainer = document.getElementById(`${sectionName}-incidents`);
    
    if (!toggle || !incidentsContainer) return;
    
    const isExpanded = toggle.classList.contains('expanded');
    
    if (isExpanded) {
      // Collapse
      toggle.classList.remove('expanded');
      incidentsContainer.style.display = 'none';
    } else {
      // Expand
      toggle.classList.add('expanded');
      incidentsContainer.style.display = 'block';
      this.loadSectionIncidents(sectionName);
    }
  }

  /**
   * Load incidents for a section (claude or github)
   */
  async loadSectionIncidents(sectionName) {
    const incidentsContent = document.getElementById(`${sectionName}-incidents-content`);
    if (!incidentsContent) return;
    
    // Show loading state
    incidentsContent.innerHTML = '<div class="loading">🔄 Loading incidents...</div>';
    
    try {
      // Get status data from storage
      const result = await chrome.storage.local.get([
        'vstateStatus', 'claudeStatus', 'githubStatus', 'azureStatus',
        'claudeIncidents', 'githubIncidents', 'azureIncidents'
      ]);
      
      let incidents = [];
      let sectionTitle = '';
      
      if (sectionName === 'claude') {
        incidents = result.claudeIncidents || [];
        sectionTitle = '🤖 Claude AI Recent Issues';
      } else if (sectionName === 'github') {
        incidents = result.githubIncidents || [];
        sectionTitle = '🐙 GitHub Services Recent Issues';
      } else if (sectionName === 'azure') {
        incidents = result.azureIncidents || [];
        sectionTitle = '☁️ Azure DevOps Recent Issues';
      }
      
      // Get recent incidents (last 5)
      const recentIncidents = incidents.slice(0, 5);
      
      if (recentIncidents.length === 0) {
        const headerColor = this.getSectionHeaderColor(sectionName);
        const gradientEndColor = this.getSectionGradientEndColor(sectionName);
        incidentsContent.innerHTML = `
          <div style="padding: 10px; background: linear-gradient(135deg, ${headerColor} 0%, ${gradientEndColor} 100%); border-radius: 6px; color: white; margin-bottom: 10px;">
            <strong style="text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${sectionTitle}</strong>
          </div>
          <div class="no-incidents">
            No recent incidents - all systems operational! 🎉
          </div>
        `;
      } else {
        const headerColor = this.getSectionHeaderColor(sectionName);
        const gradientEndColor = this.getSectionGradientEndColor(sectionName);
        incidentsContent.innerHTML = `
          <div style="margin-bottom: 15px; padding: 10px; background: linear-gradient(135deg, ${headerColor} 0%, ${gradientEndColor} 100%); border-radius: 6px; color: white;">
            <strong style="font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${sectionTitle}</strong>
          </div>
          ${recentIncidents.map(incident => this.renderIncident(incident)).join('')}
        `;
      }
      
    } catch (error) {
      console.error('Error loading section incidents:', error);
      const headerColor = this.getSectionHeaderColor(sectionName);
      const gradientEndColor = this.getSectionGradientEndColor(sectionName);
      const displayName = this.getSectionDisplayName(sectionName);
      incidentsContent.innerHTML = `
        <div style="padding: 10px; background: linear-gradient(135deg, ${headerColor} 0%, ${gradientEndColor} 100%); border-radius: 6px; color: white; margin-bottom: 10px;">
          <strong style="text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${displayName} Recent Issues</strong>
        </div>
        <div class="no-incidents error">
          Error loading incidents for ${displayName}
        </div>
      `;
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
      'github-actions': 'GitHub Actions',
      'azure-pipelines': 'Azure Pipelines',
      'azure-repos': 'Azure Repos',
      'azure-boards': 'Azure Boards',
      'azure-artifacts': 'Azure Artifacts'
    };
    return serviceNames[serviceName] || serviceName;
  }

  /**
   * Get section header color
   */
  getSectionHeaderColor(sectionName) {
    const colors = {
      'claude': '#D97706',
      'github': '#24292E',
      'azure': '#0078d4'
    };
    return colors[sectionName] || '#64748b';
  }

  /**
   * Get section gradient end color
   */
  getSectionGradientEndColor(sectionName) {
    const colors = {
      'claude': '#DC2626',
      'github': '#0D1117',
      'azure': '#106ebe'
    };
    return colors[sectionName] || '#475569';
  }

  /**
   * Get section display name
   */
  getSectionDisplayName(sectionName) {
    const names = {
      'claude': '🤖 Claude AI',
      'github': '🐙 GitHub Services',
      'azure': '☁️ Azure DevOps'
    };
    return names[sectionName] || sectionName;
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
        'vstateStatus', 'claudeStatus', 'githubStatus', 'azureStatus',
        'claudeIncidents', 'githubIncidents', 'azureIncidents', 
        'lastUpdated', 'lastError'
      ]);

      if (result.vstateStatus) {
        this.updateStatusDisplay(result.vstateStatus, result.lastUpdated, result.lastError);
        this.updateClaudeServices(result.claudeStatus);
        this.updateGitHubServices(result.githubStatus);
        this.updateAzureServices(result.azureStatus);
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
      'claude-web': ['claude.ai', 'claude frontend', 'claude.ai website', 'web interface'],
      'claude-api': ['API', 'claude api', 'anthropic api', 'api.anthropic.com'],
      'claude-dashboard': ['Console', 'anthropic console', 'console.anthropic.com', 'dashboard'],
      'claude-docs': ['Documentation', 'docs', 'support', 'docs.anthropic.com', 'documentation site', 'help center']
    };

    Object.entries(claudeServices).forEach(([serviceId, componentNames]) => {
      const serviceEl = document.querySelector(`[data-service="${serviceId}"]`);
      if (!serviceEl) return;

      const iconEl = serviceEl.querySelector('.service-icon');
      if (!iconEl) return;

      // Find matching component in Claude status
      let status = 'unknown';
      if (claudeStatus.components) {
        // Debug: Log component names for troubleshooting
        if (serviceId === 'claude-docs') {
          console.log('Claude components available:', claudeStatus.components.map(c => c.name));
          console.log('Looking for:', componentNames);
        }
        
        const component = claudeStatus.components.find(comp => {
          const compName = comp.name.toLowerCase();
          return componentNames.some(name => 
            compName.includes(name.toLowerCase()) ||
            name.toLowerCase().includes(compName)
          );
        });
        if (component) {
          status = this.mapComponentStatus(component.status);
          if (serviceId === 'claude-docs') {
            console.log('Found matching component:', component.name, 'Status:', component.status, 'Mapped to:', status);
          }
        } else if (serviceId === 'claude-docs') {
          console.log('No matching component found for claude-docs');
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
      'github-copilot': ['Copilot', 'github copilot', 'copilot for business', 'copilot for individuals'],
      'github-api': ['API', 'github api', 'rest api', 'graphql api', 'api requests'],
      'github-codespaces': ['Codespaces', 'github codespaces', 'cloud development environment'],
      'github-actions': ['Actions', 'github actions', 'workflows', 'ci/cd']
    };

    Object.entries(githubServices).forEach(([serviceId, componentNames]) => {
      const serviceEl = document.querySelector(`[data-service="${serviceId}"]`);
      if (!serviceEl) return;

      const iconEl = serviceEl.querySelector('.service-icon');
      if (!iconEl) return;

      // Find matching component in GitHub status
      let status = 'unknown';
      if (githubStatus.components) {
        const component = githubStatus.components.find(comp => {
          const compName = comp.name.toLowerCase();
          return componentNames.some(name => 
            compName.includes(name.toLowerCase()) ||
            name.toLowerCase().includes(compName)
          );
        });
        if (component) {
          status = this.mapComponentStatus(component.status);
        }
      }

      iconEl.className = `service-icon ${status}`;
      iconEl.textContent = this.getServiceIcon(status);
    });
  }

  /**
   * Update Azure services display
   */
  updateAzureServices(azureStatus) {
    if (!azureStatus) return;

    // Update Azure service icons based on status data
    const azureServices = {
      'azure-pipelines': ['pipelines', 'build and release', 'ci/cd'],
      'azure-repos': ['repos', 'repositories', 'source control', 'git'],
      'azure-boards': ['boards', 'work items', 'agile tools'],
      'azure-artifacts': ['artifacts', 'packages', 'feeds']
    };

    Object.entries(azureServices).forEach(([serviceId, componentNames]) => {
      const serviceEl = document.querySelector(`[data-service="${serviceId}"]`);
      if (!serviceEl) return;

      const iconEl = serviceEl.querySelector('.service-icon');
      if (!iconEl) return;

      // Find matching component in Azure status
      let status = 'unknown';
      if (azureStatus.components) {
        const component = azureStatus.components.find(comp => {
          const compName = comp.name.toLowerCase();
          return componentNames.some(name => 
            compName.includes(name.toLowerCase()) ||
            name.toLowerCase().includes(compName)
          );
        });
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
        statusIcon.src = `icons/ai-vibe-32.png`;
        statusIcon.alt = `Vibe Stats status: ${this.getStatusText(status)} ⚡`;
        
        // Add pulse animation for non-operational statuses
        if (status !== 'operational' && status !== 'none') {
          statusIcon.style.animation = 'pulse 2s ease-in-out infinite';
        } else {
          statusIcon.style.animation = '';
        }
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
   * Start status demo - cycles through different status states
   */
  startStatusDemo() {
    const startBtn = document.getElementById('demo-btn');
    
    // Demo states with issue counts for badge simulation
    const demoStates = [
      { status: 'operational', description: 'All systems operational - AI tools vibing!', issueCount: 0 },
      { status: 'minor', description: 'Minor issues - 2 services affected', issueCount: 2 },
      { status: 'major', description: 'Major issues - 4 services disrupted', issueCount: 4 },
      { status: 'critical', description: 'Critical - 6 services down!', issueCount: 6 },
      { status: 'unknown', description: 'Status unknown - unable to connect', issueCount: 0 }
    ];
    
    let currentStateIndex = 0;
    const totalDuration = 15000; // 15 seconds
    const stateInterval = totalDuration / demoStates.length; // 3 seconds per state
    
    // Update button
    startBtn.disabled = true;
    startBtn.innerHTML = '🔄 Running Demo...';
    
    // Store original status for reset
    this.originalStatus = this.getCurrentStatus();
    
    const demoTimer = setInterval(() => {
      // Move to next state
      if (currentStateIndex < demoStates.length) {
        const state = demoStates[currentStateIndex];
        this.applyDemoStatus(state.status, state.issueCount);
        currentStateIndex++;
      } else {
        // End demo
        clearInterval(demoTimer);
        this.endDemo();
      }
    }, stateInterval);
    
    // Store timer for cleanup
    this.demoTimer = demoTimer;
    
    // Start with first state immediately
    this.applyDemoStatus(demoStates[0].status, demoStates[0].issueCount);
  }
  
  /**
   * Reset demo to original status
   */
  resetDemo() {
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
    
    this.endDemo();
    
    // Restore original status
    if (this.originalStatus) {
      this.restoreOriginalStatus();
    }
  }
  
  /**
   * End the demo and reset UI
   */
  endDemo() {
    const startBtn = document.getElementById('demo-btn');
    
    startBtn.disabled = false;
    startBtn.innerHTML = '🎬 Demo';
    
    // Restore status after a moment
    setTimeout(() => {
      this.restoreOriginalStatus();
    }, 2000);
  }
  
  /**
   * Apply demo status to UI elements
   */
  applyDemoStatus(status, issueCount = 0) {
    // Update main status indicator
    const statusIndicator = document.getElementById('status-indicator');
    if (statusIndicator) {
      statusIndicator.className = `status-indicator status-${status}`;
    }
    
    // Update all service icons to show the demo status
    document.querySelectorAll('.service-icon').forEach(icon => {
      icon.className = `service-icon ${status}`;
      icon.textContent = this.getServiceIcon(status);
    });
    
    // Update actual extension badge and icon
    this.updateExtensionBadge(status, issueCount);
  }
  
  /**
   * Update actual extension badge during demo
   */
  async updateExtensionBadge(status, issueCount = 0) {
    try {
      // Set badge text based on status and issue count
      let badgeText = '';
      if (status === 'critical' && issueCount > 0) {
        badgeText = issueCount.toString();
      } else if (status === 'major' && issueCount > 0) {
        badgeText = issueCount.toString();
      } else if (status === 'minor' && issueCount > 0) {
        badgeText = issueCount.toString();
      } else if (status === 'critical') {
        badgeText = '!';
      }
      
      await chrome.action.setBadgeText({ text: badgeText });
      
      // Set badge color
      const badgeColors = {
        'operational': '#10b981',
        'minor': '#f59e0b',
        'major': '#f97316',
        'critical': '#ef4444',
        'unknown': '#64748b'
      };
      
      if (badgeText) {
        await chrome.action.setBadgeBackgroundColor({ color: badgeColors[status] || '#64748b' });
      }
      
      // Update title to show current demo status
      await chrome.action.setTitle({
        title: `Vibe Stats - DEMO: ${status.toUpperCase()}${issueCount > 0 ? ` (${issueCount} issues)` : ''}`
      });
      
    } catch (error) {
      console.log('Demo: Could not update extension badge (normal in popup context)');
    }
  }
  
  /**
   * Get current status for restoration
   */
  getCurrentStatus() {
    const statusIndicator = document.getElementById('status-indicator');
    if (!statusIndicator) return null;
    
    const classes = statusIndicator.className.split(' ');
    const statusClass = classes.find(cls => cls.startsWith('status-'));
    return statusClass ? statusClass.replace('status-', '') : 'unknown';
  }
  
  /**
   * Restore original status after demo
   */
  async restoreOriginalStatus() {
    // Reload actual status
    await this.loadStatus();
    
    // Clear demo badge and restore normal title
    try {
      await chrome.action.setBadgeText({ text: '' });
      await chrome.action.setTitle({ title: 'Vibe Stats - AI Dev Tools Monitor 🤖⚡' });
    } catch (error) {
      console.log('Could not reset extension badge (normal in popup context)');
    }
  }

  /**
   * Load saved font scale from storage
   */
  async loadFontScale() {
    try {
      const result = await chrome.storage.local.get(['fontScale']);
      if (result.fontScale !== undefined) {
        this.fontScale = Math.max(this.minFontScale, Math.min(this.maxFontScale, result.fontScale));
      }
      this.applyFontScale();
      this.updateFontScaleIndicator();
    } catch (error) {
      console.error('Error loading font scale:', error);
    }
  }

  /**
   * Save font scale to storage
   */
  async saveFontScale() {
    try {
      await chrome.storage.local.set({ fontScale: this.fontScale });
    } catch (error) {
      console.error('Error saving font scale:', error);
    }
  }

  /**
   * Apply font scale to CSS custom property
   */
  applyFontScale() {
    document.documentElement.style.setProperty('--font-scale', this.fontScale.toString());
  }

  /**
   * Update the font scale indicator display
   */
  updateFontScaleIndicator() {
    const indicator = document.getElementById('font-scale-indicator');
    if (indicator) {
      indicator.textContent = `${Math.round(this.fontScale * 100)}%`;
    }
  }

  /**
   * Increase font size
   */
  async increaseFontSize() {
    if (this.fontScale < this.maxFontScale) {
      this.fontScale = Math.min(this.maxFontScale, this.fontScale + this.fontScaleStep);
      this.fontScale = Math.round(this.fontScale * 10) / 10; // Round to 1 decimal place
      this.applyFontScale();
      this.updateFontScaleIndicator();
      await this.saveFontScale();
    }
  }

  /**
   * Decrease font size
   */
  async decreaseFontSize() {
    if (this.fontScale > this.minFontScale) {
      this.fontScale = Math.max(this.minFontScale, this.fontScale - this.fontScaleStep);
      this.fontScale = Math.round(this.fontScale * 10) / 10; // Round to 1 decimal place
      this.applyFontScale();
      this.updateFontScaleIndicator();
      await this.saveFontScale();
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

// Removed old openTestFile function - replaced with status demo functionality
