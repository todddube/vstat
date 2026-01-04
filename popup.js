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

    // Cache DOM elements for better performance
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
      statusIndicator: document.getElementById('status-indicator'),
      statusIcon: document.getElementById('status-icon'),
      lastUpdated: document.getElementById('last-updated'),
      versionBadge: document.getElementById('version-badge'),
      refreshBtn: document.getElementById('refresh-btn'),
      aboutBtn: document.getElementById('about-btn'),
      aboutModal: document.getElementById('about-modal'),
      aboutClose: document.getElementById('about-close'),
      demoBtn: document.getElementById('demo-btn'),
      claudeIncidents: document.getElementById('claude-incidents'),
      claudeIncidentsContent: document.getElementById('claude-incidents-content'),
      githubIncidents: document.getElementById('github-incidents'),
      githubIncidentsContent: document.getElementById('github-incidents-content')
    };
  }

  /**
   * Initialize the popup controller
   */
  async init() {
    try {
      this.cacheElements();
      this.loadVersion();
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
   * Load and display version from manifest
   */
  loadVersion() {
    try {
      const manifest = chrome.runtime.getManifest();
      const version = manifest.version;

      // Update version badge in header (use cached element)
      if (this.elements.versionBadge) {
        this.elements.versionBadge.textContent = `v${version}`;
        this.elements.versionBadge.title = `${manifest.name} v${version}`;
      }

      // Update extension icon tooltip with version
      this.updateExtensionTitle(version);
    } catch (error) {
      console.error('Error loading version:', error);
    }
  }

  /**
   * Update extension icon tooltip with version and status
   */
  async updateExtensionTitle(version, status = null) {
    try {
      let title = `Vibe Stats v${version}`;
      if (status && status !== 'operational') {
        title += ` - ${this.getStatusText(status)}`;
      } else if (status === 'operational') {
        title += ' - All Systems Go!';
      }
      await chrome.action.setTitle({ title });
    } catch (error) {
      console.log('Could not update extension title:', error);
    }
  }

  /**
   * Set up event listeners with error handling
   */
  setupEventListeners() {
    try {
      // Refresh button with debouncing (use cached element)
      if (this.elements.refreshBtn) {
        this.elements.refreshBtn.addEventListener('click', (e) => {
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

      // About modal functionality (use cached elements)
      if (this.elements.aboutBtn && this.elements.aboutModal && this.elements.aboutClose) {
        this.elements.aboutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.showAboutModal();
        });

        this.elements.aboutClose.addEventListener('click', (e) => {
          e.preventDefault();
          this.hideAboutModal();
        });

        // Close modal when clicking outside content
        this.elements.aboutModal.addEventListener('click', (e) => {
          if (e.target === this.elements.aboutModal) {
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

      // Demo button click handler (use cached element)
      if (this.elements.demoBtn) {
        this.elements.demoBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (this.demoTimer) {
            this.resetDemo();
          } else {
            this.startStatusDemo();
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
        'vstateStatus', 'claudeStatus', 'githubStatus',
        'claudeIncidents', 'githubIncidents'
      ]);

      let incidents = [];
      let sectionTitle = '';

      if (sectionName === 'claude') {
        incidents = result.claudeIncidents || [];
        sectionTitle = '🤖 Claude AI Recent Issues';
      } else if (sectionName === 'github') {
        incidents = result.githubIncidents || [];
        sectionTitle = '🐙 GitHub Services Recent Issues';
      }

      // Get recent incidents (last 5)
      const recentIncidents = incidents.slice(0, 5);

      const headerClass = sectionName === 'claude' ? 'claude-header' : 'github-header';

      if (recentIncidents.length === 0) {
        incidentsContent.innerHTML = `
          <div class="section-incident-header ${headerClass}">
            <strong>${sectionTitle}</strong>
          </div>
          <div class="no-incidents">
            No recent incidents - all systems operational! 🎉
          </div>
        `;
      } else {
        incidentsContent.innerHTML = `
          <div class="section-incident-header-lg ${headerClass}">
            <strong>${sectionTitle}</strong>
          </div>
          ${recentIncidents.map(incident => this.renderIncident(incident)).join('')}
        `;
      }

    } catch (error) {
      console.error('Error loading section incidents:', error);
      const headerClass = sectionName === 'claude' ? 'claude-header' : 'github-header';
      const displayName = this.getSectionDisplayName(sectionName);
      incidentsContent.innerHTML = `
        <div class="section-incident-header ${headerClass}">
          <strong>${displayName} Recent Issues</strong>
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
      'github-actions': 'GitHub Actions'
    };
    return serviceNames[serviceName] || serviceName;
  }

  /**
   * Get section display name
   */
  getSectionDisplayName(sectionName) {
    const names = {
      'claude': '🤖 Claude AI',
      'github': '🐙 GitHub Services'
    };
    return names[sectionName] || sectionName;
  }

  /**
   * Handle when popup becomes visible
   */
  onPopupVisible() {
    // Auto-refresh if data is older than 30 seconds
    chrome.storage.local.get(['lastUpdated'], (result) => {
      if (chrome.runtime.lastError) {
        console.warn('Storage error in onPopupVisible:', chrome.runtime.lastError);
        return;
      }
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
        'claudeIncidents', 'githubIncidents',
        'lastUpdated', 'lastError'
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

    // Update Claude service icons based on status data - using regex patterns for robust matching
    const claudeServices = {
      'claude-web': [/\bclaude\.ai\b/i, /\bclaude\s+frontend\b/i, /\bweb\s+interface\b/i, /\bclaude\.ai\s+website\b/i],
      'claude-api': [/\bapi\b/i, /\bclaude\s+api\b/i, /\banthropic\s+api\b/i, /\bapi\.anthropic\.com\b/i],
      'claude-dashboard': [/\bconsole\b/i, /\banthropic\s+console\b/i, /\bconsole\.anthropic\.com\b/i, /\bdashboard\b/i],
      'claude-docs': [/\bdocumentation\b/i, /\bdocs\b/i, /\bsupport\b/i, /\bdocs\.anthropic\.com\b/i, /\bhelp\s+center\b/i]
    };

    Object.entries(claudeServices).forEach(([serviceId, patterns]) => {
      const serviceEl = document.querySelector(`[data-service="${serviceId}"]`);
      if (!serviceEl) return;

      const iconEl = serviceEl.querySelector('.service-icon');
      if (!iconEl) return;

      // Find matching component in Claude status
      let status = 'unknown';
      if (claudeStatus.components) {
        const component = claudeStatus.components.find(comp => {
          return patterns.some(pattern => pattern.test(comp.name));
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
   * Update GitHub services display
   */
  updateGitHubServices(githubStatus) {
    if (!githubStatus) return;

    // Update GitHub service icons based on status data - using regex patterns for robust matching
    const githubServices = {
      'github-copilot': [/\bcopilot\b/i, /\bgithub\s+copilot\b/i, /\bcopilot\s+for\s+business\b/i, /\bcopilot\s+for\s+individuals\b/i],
      'github-api': [/\bapi\s+requests?\b/i, /\bgithub\s+api\b/i, /\brest\s+api\b/i, /\bgraphql\s+api\b/i],
      'github-codespaces': [/\bcodespaces\b/i, /\bgithub\s+codespaces\b/i, /\bcloud\s+development\b/i],
      'github-actions': [/\bactions\b/i, /\bgithub\s+actions\b/i, /\bworkflows\b/i, /\bci\/cd\b/i]
    };

    Object.entries(githubServices).forEach(([serviceId, patterns]) => {
      const serviceEl = document.querySelector(`[data-service="${serviceId}"]`);
      if (!serviceEl) return;

      const iconEl = serviceEl.querySelector('.service-icon');
      if (!iconEl) return;

      // Find matching component in GitHub status
      let status = 'unknown';
      if (githubStatus.components) {
        const component = githubStatus.components.find(comp => {
          return patterns.some(pattern => pattern.test(comp.name));
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
      // Use cached elements for better performance
      if (this.elements.statusIndicator) {
        this.elements.statusIndicator.className = `status-indicator status-${status}`;
        this.elements.statusIndicator.setAttribute('aria-label', `Status: ${this.getStatusText(status)}`);
      }

      if (this.elements.statusIcon) {
        this.elements.statusIcon.src = `icons/ai-vibe-32.png`;
        this.elements.statusIcon.alt = `Vibe Stats status: ${this.getStatusText(status)} ⚡`;

        // Add pulse animation for non-operational statuses
        if (status !== 'operational' && status !== 'none') {
          this.elements.statusIcon.style.animation = 'pulse 2s ease-in-out infinite';
        } else {
          this.elements.statusIcon.style.animation = '';
        }
      }

      if (this.elements.lastUpdated) {
        if (lastUpdated) {
          const date = new Date(lastUpdated);
          const timeAgo = this.formatTime(date);
          this.elements.lastUpdated.textContent = `Updated: ${timeAgo}`;

          if (lastError) {
            const errorDate = new Date(lastError.timestamp);
            const errorAgo = this.formatTime(errorDate);
            this.elements.lastUpdated.title = `Last error: ${lastError.message} (${errorAgo})`;
          } else {
            this.elements.lastUpdated.removeAttribute('title');
          }
        } else {
          this.elements.lastUpdated.textContent = 'No data available';
        }
      }

      // Update extension icon tooltip with current status
      const manifest = chrome.runtime.getManifest();
      this.updateExtensionTitle(manifest.version, status);
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
    if (!this.elements.refreshBtn) return;

    this.refreshing = true;
    const originalText = this.elements.refreshBtn.textContent;

    try {
      this.elements.refreshBtn.textContent = 'Refreshing...';
      this.elements.refreshBtn.disabled = true;
      this.elements.refreshBtn.setAttribute('aria-busy', 'true');

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
      this.elements.refreshBtn.textContent = originalText;
      this.elements.refreshBtn.disabled = false;
      this.elements.refreshBtn.removeAttribute('aria-busy');
      this.refreshing = false;
    }
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
    if (this.elements.lastUpdated) {
      this.elements.lastUpdated.textContent = 'No data available - Click refresh';
    }
  }

  /**
   * Show error state with retry option
   */
  showError(message = 'Failed to load data') {
    if (this.elements.lastUpdated) {
      this.elements.lastUpdated.textContent = message;
      this.elements.lastUpdated.className = 'last-updated error';
    }
  }

  /**
   * Show the About modal with manifest information
   */
  async showAboutModal() {
    try {
      const manifest = chrome.runtime.getManifest();

      // Update modal content with manifest data (non-cached elements - only used in modal)
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

      // Show the modal (use cached element)
      if (this.elements.aboutModal) {
        this.elements.aboutModal.classList.add('show');
        // Focus the close button for accessibility
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
      // Return focus to the about button
      if (this.elements.aboutBtn) {
        this.elements.aboutBtn.focus();
      }
    }
  }

  
  /**
   * Start status demo - cycles through different status states
   */
  startStatusDemo() {
    if (!this.elements.demoBtn) return;

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

    // Update button (use cached element)
    this.elements.demoBtn.disabled = true;
    this.elements.demoBtn.innerHTML = '🔄 Running Demo...';

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
    if (this.elements.demoBtn) {
      this.elements.demoBtn.disabled = false;
      this.elements.demoBtn.innerHTML = '🎬 Demo';
    }

    // Restore status after a moment
    setTimeout(() => {
      this.restoreOriginalStatus();
    }, 2000);
  }
  
  /**
   * Apply demo status to UI elements
   */
  applyDemoStatus(status, issueCount = 0) {
    // Update main status indicator (use cached element)
    if (this.elements.statusIndicator) {
      this.elements.statusIndicator.className = `status-indicator status-${status}`;
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
    if (!this.elements.statusIndicator) return null;

    const classes = this.elements.statusIndicator.className.split(' ');
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
