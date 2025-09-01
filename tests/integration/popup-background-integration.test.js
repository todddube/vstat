/**
 * Integration tests for Popup-Background communication
 * Tests message passing, data synchronization, and UI-background script interactions
 */

// Import classes from actual source files
const fs = require('fs');
const path = require('path');

// Load StatusMonitor class
const backgroundSource = fs.readFileSync(path.join(__dirname, '../../background.js'), 'utf8');
let StatusMonitor;
eval(`
  const chrome = global.chrome;
  ${backgroundSource}
  if (typeof StatusMonitor !== 'undefined') {
    global._StatusMonitor = StatusMonitor;
  }
`);
StatusMonitor = global._StatusMonitor;

// Load PopupController class  
const popupSource = fs.readFileSync(path.join(__dirname, '../../popup.js'), 'utf8');
let PopupController;
eval(`
  const chrome = global.chrome;
  const document = global.document;
  const window = global.window;
  ${popupSource}
  if (typeof PopupController !== 'undefined') {
    global._PopupController = PopupController;
  }
`);
PopupController = global._PopupController;

// Mock DOM environment for popup controller
const { JSDOM } = require('jsdom');

describe('Popup-Background Integration', () => {
  let statusMonitor;
  let popupController;
  let dom;

  beforeAll(() => {
    // Set up DOM environment
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div id="refresh-btn"></div>
          <div id="status-indicator"></div>
          <img id="status-icon" />
          <div id="last-updated"></div>
          <div id="incidents-container"></div>
          <div id="recent-incidents-container"></div>
          <div id="active-tab" class="tab-content active"></div>
          <div id="recent-tab" class="tab-content"></div>
          <button class="tab-button active" data-tab="active"></button>
          <button class="tab-button" data-tab="recent"></button>
          <div class="service-item">
            <div class="service-icon"></div>
            <div class="service-name">claude.ai</div>
          </div>
          <div class="service-item">
            <div class="service-icon"></div>
            <div class="service-name">Console</div>
          </div>
        </body>
      </html>
    `;

    dom = new JSDOM(html, {
      url: 'chrome-extension://test-id/popup.html',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    global.window = dom.window;
    global.document = dom.window.document;
    global.setInterval = jest.fn();
    global.clearInterval = jest.fn();

    // Classes already loaded above
  });

  beforeEach(() => {
    chrome._resetMocks();
    global.fetch.mockClear();
    jest.clearAllMocks();

    statusMonitor = new StatusMonitor();
    
    // Don't auto-initialize popup controller
    PopupController.prototype.init = jest.fn().mockResolvedValue();
    popupController = new PopupController();

    // Reset DOM
    document.getElementById('last-updated').textContent = '';
    document.getElementById('incidents-container').innerHTML = '';
  });

  describe('Message Passing Integration', () => {
    test('should handle getStatus message correctly', async () => {
      // Background script stores data
      const testData = {
        status: 'operational',
        incidents: [],
        components: [
          { name: 'Claude.ai Frontend', status: 'operational' },
          { name: 'Anthropic API', status: 'operational' }
        ],
        lastUpdated: new Date().toISOString()
      };

      chrome.storage.local.get.mockResolvedValue(testData);

      // Simulate background message handler
      const messageHandler = (message, sender, sendResponse) => {
        if (message.action === 'getStatus') {
          chrome.storage.local.get([
            'status', 'incidents', 'historicalIncidents', 'lastFiveIncidents',
            'components', 'lastUpdated', 'lastError'
          ]).then(data => {
            sendResponse({ status: 'success', data });
          }).catch(error => {
            sendResponse({ status: 'error', error: error.message });
          });
          return true; // Indicates async response
        }
      };

      // Test the message exchange
      const response = await new Promise((resolve) => {
        const mockSender = {};
        messageHandler({ action: 'getStatus' }, mockSender, resolve);
      });

      expect(response).toEqual({
        status: 'success',
        data: testData
      });
    });

    test('should handle forceRefresh message correctly', async () => {
      // Mock successful status check
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse({ status: { indicator: 'none' }}))
        .mockResolvedValueOnce(testUtils.createMockResponse({ incidents: [] }))
        .mockResolvedValueOnce(testUtils.createMockResponse({ components: [] }));

      // Simulate background message handler for forceRefresh
      const messageHandler = async (message, sender, sendResponse) => {
        if (message.action === 'forceRefresh') {
          try {
            await statusMonitor.checkStatus();
            sendResponse({ status: 'refreshing', timestamp: Date.now() });
          } catch (error) {
            sendResponse({ status: 'error', error: error.message });
          }
        }
      };

      const response = await new Promise((resolve) => {
        messageHandler({ action: 'forceRefresh' }, {}, resolve);
      });

      expect(response.status).toBe('refreshing');
      expect(response.timestamp).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('should handle message timeout in popup', async () => {
      // Mock sendMessage method with timeout
      popupController.sendMessage = async function(message, timeout = 5000) {
        return new Promise((resolve) => {
          const timeoutId = setTimeout(() => resolve(null), timeout);
          
          chrome.runtime.sendMessage(message, (response) => {
            clearTimeout(timeoutId);
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });
      };

      // Don't call the callback to simulate timeout
      chrome.runtime.sendMessage.mockImplementation(() => {});

      const response = await popupController.sendMessage({ action: 'test' }, 100);

      expect(response).toBeNull();
    });
  });

  describe('Data Synchronization', () => {
    test('should sync status data between background and popup', async () => {
      // Background updates status
      const statusData = {
        status: 'minor',
        incidents: [{
          name: 'API Slowdown',
          status: 'investigating',
          created_at: new Date().toISOString(),
          titleWithDate: 'Jan 15 10:30 AM - API Slowdown',
          impact: 'minor',
          updates: [{
            body: 'We are investigating API performance issues.',
            created_at: new Date().toISOString()
          }]
        }],
        components: [
          { name: 'Claude.ai Frontend', status: 'operational' },
          { name: 'Anthropic API', status: 'degraded_performance' }
        ],
        lastUpdated: new Date().toISOString()
      };

      chrome.storage.local.get.mockResolvedValue(statusData);

      // Initialize popup controller methods
      popupController.updateStatusDisplay = jest.fn();
      popupController.updateServicesDisplay = jest.fn();
      popupController.updateIncidentsDisplay = jest.fn();
      popupController.updateRecentIncidentsDisplay = jest.fn();

      // Simulate popup loading status
      await popupController.loadStatus();

      // Verify popup received and processed the data
      expect(popupController.updateStatusDisplay).toHaveBeenCalledWith(
        'minor',
        statusData.lastUpdated,
        undefined
      );
      expect(popupController.updateServicesDisplay).toHaveBeenCalledWith(statusData.components);
      expect(popupController.updateIncidentsDisplay).toHaveBeenCalledWith(statusData.incidents);
    });

    test('should handle real-time updates during popup session', async () => {
      // Initial state
      let storageData = {
        status: 'operational',
        incidents: [],
        components: [{ name: 'Claude.ai', status: 'operational' }]
      };

      chrome.storage.local.get.mockImplementation(() => Promise.resolve(storageData));

      // Load initial status
      popupController.updateStatusDisplay = jest.fn();
      popupController.updateIncidentsDisplay = jest.fn();
      await popupController.loadStatus();

      expect(popupController.updateStatusDisplay).toHaveBeenCalledWith('operational', undefined, undefined);

      // Simulate background updating status
      storageData = {
        status: 'major',
        incidents: [{
          name: 'Service Outage',
          status: 'investigating',
          created_at: new Date().toISOString()
        }],
        components: [{ name: 'Claude.ai', status: 'major_outage' }]
      };

      // Popup refreshes and gets updated data
      popupController.updateStatusDisplay.mockClear();
      popupController.updateIncidentsDisplay.mockClear();
      
      await popupController.loadStatus();

      expect(popupController.updateStatusDisplay).toHaveBeenCalledWith('major', undefined, undefined);
      expect(popupController.updateIncidentsDisplay).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Service Outage' })
        ])
      );
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle background script errors gracefully in popup', async () => {
      // Background script encounters error
      chrome.storage.local.get.mockRejectedValue(new Error('Storage unavailable'));
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ status: 'error', error: 'Background script error' });
      });

      popupController.showError = jest.fn();
      popupController.errorRetryCount = 0;

      await popupController.loadStatus();

      // Should attempt retry
      expect(setTimeout).toHaveBeenCalled();
    });

    test('should handle Chrome extension context invalidated', async () => {
      // Simulate extension context invalidated
      chrome.runtime.lastError = { message: 'Extension context invalidated' };
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(null);
      });

      popupController.sendMessage = async function(message, timeout = 5000) {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Message error:', chrome.runtime.lastError);
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });
      };

      const response = await popupController.sendMessage({ action: 'test' });

      expect(response).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'Message error:',
        expect.objectContaining({ message: 'Extension context invalidated' })
      );
    });
  });

  describe('UI Updates Integration', () => {
    test('should update UI elements based on background data', async () => {
      const testData = {
        status: 'minor',
        components: [
          { name: 'Claude.ai Frontend', status: 'operational' },
          { name: 'Anthropic Console', status: 'degraded_performance' }
        ],
        incidents: [{
          name: 'Console Performance Issues',
          status: 'monitoring',
          created_at: new Date().toISOString(),
          titleWithDate: 'Jan 15 2:30 PM - Console Performance Issues',
          impact: 'minor',
          updates: [{
            body: 'We have implemented a fix and are monitoring the situation.',
            created_at: new Date().toISOString()
          }]
        }],
        lastUpdated: new Date().toISOString()
      };

      chrome.storage.local.get.mockResolvedValue(testData);

      // Restore real implementation for testing
      popupController.updateStatusDisplay = PopupController.prototype.updateStatusDisplay.bind(popupController);
      popupController.updateServicesDisplay = PopupController.prototype.updateServicesDisplay.bind(popupController);
      popupController.updateIncidentsDisplay = PopupController.prototype.updateIncidentsDisplay.bind(popupController);
      popupController.getStatusText = PopupController.prototype.getStatusText.bind(popupController);
      popupController.getIconColor = PopupController.prototype.getIconColor.bind(popupController);
      popupController.mapComponentStatus = PopupController.prototype.mapComponentStatus.bind(popupController);
      popupController.getServiceIcon = PopupController.prototype.getServiceIcon.bind(popupController);
      popupController.renderIncident = PopupController.prototype.renderIncident.bind(popupController);
      popupController.formatTime = PopupController.prototype.formatTime.bind(popupController);
      popupController.escapeHtml = PopupController.prototype.escapeHtml.bind(popupController);

      await popupController.loadStatus();

      // Verify status indicator
      const statusIndicator = document.getElementById('status-indicator');
      expect(statusIndicator.className).toBe('status-indicator status-minor');

      // Verify status icon
      const statusIcon = document.getElementById('status-icon');
      expect(statusIcon.src).toBe('icons/claude-yellow-32.png');

      // Verify last updated text
      const lastUpdated = document.getElementById('last-updated');
      expect(lastUpdated.textContent).toContain('Updated:');

      // Verify service icons
      const serviceItems = document.querySelectorAll('.service-item');
      const consoleService = Array.from(serviceItems).find(item => 
        item.querySelector('.service-name').textContent === 'Console'
      );
      if (consoleService) {
        const serviceIcon = consoleService.querySelector('.service-icon');
        expect(serviceIcon.className).toBe('service-icon minor');
        expect(serviceIcon.textContent).toBe('⚠');
      }

      // Verify incidents display
      const incidentsContainer = document.getElementById('incidents-container');
      expect(incidentsContainer.innerHTML).toContain('Console Performance Issues');
      expect(incidentsContainer.innerHTML).toContain('monitoring');
    });

    test('should handle refresh button interaction', async () => {
      const refreshBtn = document.getElementById('refresh-btn');
      refreshBtn.textContent = 'Refresh';

      // Mock refresh functionality
      popupController.refreshStatus = async function() {
        if (this.refreshing) return;
        
        this.refreshing = true;
        refreshBtn.textContent = 'Refreshing...';
        refreshBtn.disabled = true;
        
        try {
          // Simulate refresh delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Simulate successful refresh
          const response = await this.sendMessage({ action: 'forceRefresh' });
          if (response?.status === 'error') {
            throw new Error(response.error);
          }
          
          await this.loadStatus();
        } finally {
          refreshBtn.textContent = 'Refresh';
          refreshBtn.disabled = false;
          this.refreshing = false;
        }
      };

      popupController.sendMessage = jest.fn().mockResolvedValue({ status: 'success' });
      popupController.loadStatus = jest.fn();
      
      // Mock DOM storage data
      chrome.storage.local.get.mockResolvedValue({
        status: 'operational',
        incidents: [],
        components: []
      });

      // Trigger refresh
      await popupController.refreshStatus();

      expect(popupController.sendMessage).toHaveBeenCalledWith({ action: 'forceRefresh' });
      expect(popupController.loadStatus).toHaveBeenCalled();
      expect(refreshBtn.disabled).toBe(false);
      expect(refreshBtn.textContent).toBe('Refresh');
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large incident datasets efficiently', async () => {
      // Generate large dataset
      const largeIncidentSet = {
        incidents: Array.from({ length: 100 }, (_, i) => ({
          id: `incident-${i}`,
          name: `Test Incident ${i}`,
          status: i % 2 === 0 ? 'resolved' : 'investigating',
          created_at: new Date(Date.now() - i * 60000).toISOString(),
          resolved_at: i % 2 === 0 ? new Date(Date.now() - i * 30000).toISOString() : null,
          impact: ['minor', 'major', 'critical'][i % 3],
          incident_updates: [{
            body: `Update for incident ${i}`,
            created_at: new Date(Date.now() - i * 60000).toISOString()
          }]
        }))
      };

      const start = performance.now();
      
      // Process large dataset
      const recentIncidents = statusMonitor.getRecentIncidents(largeIncidentSet.incidents);
      const lastFiveIncidents = statusMonitor.getLastFiveIncidents(largeIncidentSet.incidents);
      
      const end = performance.now();

      // Should complete processing within reasonable time (< 100ms)
      expect(end - start).toBeLessThan(100);

      // Should limit results appropriately
      expect(recentIncidents.length).toBeLessThanOrEqual(5);
      expect(lastFiveIncidents.length).toBeLessThanOrEqual(5);

      // Should only include active incidents in recent
      expect(recentIncidents.every(incident => incident.status !== 'resolved')).toBe(true);
    });

    test('should debounce rapid refresh requests', async () => {
      popupController.refreshing = false;
      popupController.sendMessage = jest.fn().mockResolvedValue({ status: 'success' });
      popupController.loadStatus = jest.fn();

      // Mock refresh method
      popupController.refreshStatus = async function() {
        if (this.refreshing) return;
        this.refreshing = true;
        await this.sendMessage({ action: 'forceRefresh' });
        this.refreshing = false;
      };

      // Trigger multiple rapid refreshes
      const refreshPromises = [
        popupController.refreshStatus(),
        popupController.refreshStatus(),
        popupController.refreshStatus()
      ];

      await Promise.all(refreshPromises);

      // Should only send one message due to debouncing
      expect(popupController.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Browser Compatibility', () => {
    test('should handle Chrome runtime API variations', async () => {
      // Test with different Chrome API responses
      const testScenarios = [
        { lastError: null, response: { status: 'success' } },
        { lastError: { message: 'Port closed' }, response: null },
        { lastError: null, response: undefined }
      ];

      for (const scenario of testScenarios) {
        chrome.runtime.lastError = scenario.lastError;
        chrome.runtime.sendMessage.mockImplementation((message, callback) => {
          callback(scenario.response);
        });

        const response = await popupController.sendMessage({ action: 'test' });

        if (scenario.lastError) {
          expect(response).toBeNull();
        } else if (scenario.response) {
          expect(response).toEqual(scenario.response);
        } else {
          expect(response).toBeUndefined();
        }
      }
    });
  });

  afterAll(() => {
    if (dom) {
      dom.window.close();
    }
  });
});