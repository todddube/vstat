/**
 * Unit tests for PopupController class (popup.js)
 * Tests popup functionality including UI updates, tab switching,
 * status display, incident rendering, and user interactions
 */

// Import test fixtures
const {
  mockStatusResponses,
  mockIncidentsResponses,
  mockComponentsResponses,
  mockSummaryResponses,
  mockErrorResponses
} = require('../fixtures/api-responses');

// Mock DOM elements and methods
const mockDOM = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
  createElement: jest.fn(),
  hidden: false
};

// Mock HTML elements
const createMockElement = (id, tagName = 'div', properties = {}) => ({
  id,
  tagName,
  textContent: '',
  innerHTML: '',
  className: '',
  src: '',
  alt: '',
  title: '',
  disabled: false,
  style: {},
  ...properties,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  },
  focus: jest.fn(),
  click: jest.fn()
});

let PopupController;

describe('PopupController', () => {
  beforeAll(() => {
    // Set up global DOM
    global.document = {
      ...mockDOM,
      addEventListener: jest.fn(),
      hidden: false,
      visibilityState: 'visible'
    };
    
    global.window = {
      addEventListener: jest.fn(),
      setInterval: jest.fn(),
      clearInterval: jest.fn(),
      setTimeout: jest.fn(),
      clearTimeout: jest.fn(),
      location: { reload: jest.fn() }
    };

    // Load PopupController class
    const fs = require('fs');
    const path = require('path');
    const popupScript = fs.readFileSync(
      path.join(__dirname, '../../popup.js'), 
      'utf8'
    );
    
    // Execute the popup script in global context to extract the class
    eval(`
      // Mock global objects that might be referenced
      const chrome = global.chrome;
      const document = global.document;
      const window = global.window;
      ${popupScript}
      // Extract the class
      if (typeof PopupController !== 'undefined') {
        global._PopupController = PopupController;
      }
    `);
    PopupController = global._PopupController;
  });

  let controller;
  let mockElements;

  // Mock init method globally for all tests
  beforeAll(() => {
    if (PopupController) {
      PopupController.prototype.init = jest.fn().mockResolvedValue();
    }
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    chrome._resetMocks();

    // Create mock DOM elements
    mockElements = {
      'refresh-btn': createMockElement('refresh-btn', 'button'),
      'status-indicator': createMockElement('status-indicator'),
      'status-icon': createMockElement('status-icon', 'img'),
      'last-updated': createMockElement('last-updated'),
      'incidents-container': createMockElement('incidents-container'),
      'recent-incidents-container': createMockElement('recent-incidents-container'),
      'services-grid': createMockElement('services-grid'),
      'active-tab': createMockElement('active-tab'),
      'recent-tab': createMockElement('recent-tab')
    };

    // Mock DOM methods
    global.document.getElementById = jest.fn((id) => mockElements[id] || null);
    global.document.querySelector = jest.fn((selector) => {
      if (selector === '[data-tab="active"]') return createMockElement('active-tab-btn');
      if (selector === '[data-tab="recent"]') return createMockElement('recent-tab-btn');
      return null;
    });
    global.document.querySelectorAll = jest.fn((selector) => {
      if (selector === '.tab-button') {
        return [
          createMockElement('active-tab-btn', 'button', { getAttribute: () => 'active' }),
          createMockElement('recent-tab-btn', 'button', { getAttribute: () => 'recent' })
        ];
      }
      if (selector === '.tab-content') {
        return [mockElements['active-tab'], mockElements['recent-tab']];
      }
      if (selector === '.service-item') {
        return [
          createMockElement('service-1', 'div', { 
            querySelector: jest.fn().mockImplementation((sel) => {
              if (sel === '.service-name') return { textContent: 'claude.ai' };
              if (sel === '.service-icon') return createMockElement('icon-1');
              return null;
            })
          }),
          createMockElement('service-2', 'div', {
            querySelector: jest.fn().mockImplementation((sel) => {
              if (sel === '.service-name') return { textContent: 'Console' };
              if (sel === '.service-icon') return createMockElement('icon-2');
              return null;
            })
          })
        ];
      }
      return [];
    });

    global.setInterval = jest.fn();
    global.clearInterval = jest.fn();

    // Mock Chrome storage with default data
    chrome.storage.local.get.mockResolvedValue({
      status: 'operational',
      incidents: [],
      components: [],
      lastUpdated: new Date().toISOString()
    });

    // Mock successful message response
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      setTimeout(() => {
        callback({ status: 'success', data: {} });
      }, 0);
    });

    // Don't auto-initialize for controlled testing
    controller = null;
  });

  describe('Constructor and Initialization', () => {
    test('should initialize controller properties', () => {
      controller = new PopupController();
      
      expect(controller.refreshing).toBe(false);
      expect(controller.errorRetryCount).toBe(0);
      expect(controller.maxErrorRetries).toBe(3);
    });

    test('should call init() on construction', async () => {
      controller = new PopupController();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(PopupController.prototype.init).toHaveBeenCalled();
    });
  });

  describe('Event Listeners Setup', () => {
    beforeEach(async () => {
      controller = new PopupController();
      controller.loadStatus = jest.fn();
      controller.setupEventListeners = jest.fn().mockResolvedValue();
      await controller.setupEventListeners();
    });

    test('should set up refresh button listener', () => {
      expect(mockElements['refresh-btn'].addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
    });

    test('should set up tab button listeners', () => {
      const tabButtons = global.document.querySelectorAll('.tab-button');
      tabButtons.forEach(button => {
        expect(button.addEventListener).toHaveBeenCalledWith(
          'click',
          expect.any(Function)
        );
      });
    });

    test('should set up visibility change listener', () => {
      expect(global.document.addEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    test('should set up keyboard navigation', () => {
      expect(global.document.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('Status Loading and Display', () => {
    beforeEach(() => {
      controller = new PopupController();
      controller.updateStatusDisplay = jest.fn();
      controller.updateServicesDisplay = jest.fn();
      controller.updateIncidentsDisplay = jest.fn();
      controller.updateRecentIncidentsDisplay = jest.fn();
    });

    test('should load status from Chrome messages', async () => {
      const mockData = {
        status: 'operational',
        incidents: [],
        components: mockComponentsResponses.allOperational.components,
        lastUpdated: new Date().toISOString()
      };

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ status: 'success', data: mockData });
      });

      await controller.loadStatus();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'getStatus' });
      expect(controller.updateStatusDisplay).toHaveBeenCalledWith(
        'operational',
        mockData.lastUpdated,
        undefined
      );
      expect(controller.updateServicesDisplay).toHaveBeenCalledWith(mockData.components);
    });

    test('should fallback to storage if message fails', async () => {
      const mockData = {
        status: 'minor',
        incidents: mockIncidentsResponses.activeIncident.incidents,
        components: mockComponentsResponses.mixedStatuses.components
      };

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ status: 'error' });
      });
      chrome.storage.local.get.mockResolvedValue(mockData);

      await controller.loadStatus();

      expect(chrome.storage.local.get).toHaveBeenCalled();
      expect(controller.updateStatusDisplay).toHaveBeenCalledWith('minor', undefined, undefined);
    });

    test('should handle load status errors with retry', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ status: 'error' });
      });
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      await controller.loadStatus();
      
      // Should schedule retry
      expect(setTimeout).toHaveBeenCalled();
    });

    test('should show error after max retries exceeded', async () => {
      controller.errorRetryCount = 3;
      controller.showError = jest.fn();
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ status: 'error' });
      });
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      await controller.loadStatus();

      expect(controller.showError).toHaveBeenCalledWith('Unable to load status data');
    });
  });

  describe('Status Display Updates', () => {
    beforeEach(() => {
      controller = new PopupController();
    });

    test('should update status indicator and icon', () => {
      controller.updateStatusDisplay('operational', new Date().toISOString());

      expect(mockElements['status-indicator'].className).toBe('status-indicator status-operational');
      expect(mockElements['status-indicator'].setAttribute).toHaveBeenCalledWith(
        'aria-label',
        'Status: All Systems Operational'
      );
      expect(mockElements['status-icon'].src).toBe('icons/claude-green-32.png');
      expect(mockElements['status-icon'].alt).toBe('Claude status: All Systems Operational');
    });

    test('should update last updated time', () => {
      const testTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
      controller.updateStatusDisplay('operational', testTime);

      expect(mockElements['last-updated'].textContent).toBe('Updated: 5m ago');
    });

    test('should show error information in title when present', () => {
      const lastError = {
        message: 'Network error',
        timestamp: Date.now() - 2 * 60 * 1000 // 2 minutes ago
      };

      controller.updateStatusDisplay('unknown', new Date().toISOString(), lastError);

      expect(mockElements['last-updated'].title).toContain('Last error: Network error');
    });

    test('should handle missing DOM elements gracefully', () => {
      global.document.getElementById = jest.fn(() => null);

      expect(() => {
        controller.updateStatusDisplay('operational', new Date().toISOString());
      }).not.toThrow();
    });
  });

  describe('Services Display', () => {
    beforeEach(() => {
      controller = new PopupController();
    });

    test('should update service status indicators', () => {
      controller.updateServicesDisplay(mockComponentsResponses.allOperational.components);

      const serviceItems = global.document.querySelectorAll('.service-item');
      serviceItems.forEach(item => {
        const iconEl = item.querySelector('.service-icon');
        expect(iconEl.className).toBe('service-icon operational');
        expect(iconEl.textContent).toBe('✓');
      });
    });

    test('should map component statuses correctly', () => {
      expect(controller.mapComponentStatus('operational')).toBe('operational');
      expect(controller.mapComponentStatus('degraded_performance')).toBe('minor');
      expect(controller.mapComponentStatus('partial_outage')).toBe('major');
      expect(controller.mapComponentStatus('major_outage')).toBe('critical');
      expect(controller.mapComponentStatus('unknown_status')).toBe('unknown');
    });

    test('should get correct service icons', () => {
      expect(controller.getServiceIcon('operational')).toBe('✓');
      expect(controller.getServiceIcon('minor')).toBe('⚠');
      expect(controller.getServiceIcon('major')).toBe('⚡');
      expect(controller.getServiceIcon('critical')).toBe('✕');
      expect(controller.getServiceIcon('unknown')).toBe('?');
    });

    test('should handle unknown services gracefully', () => {
      const unknownComponents = [
        { name: 'Unknown Service', status: 'operational' }
      ];

      expect(() => {
        controller.updateServicesDisplay(unknownComponents);
      }).not.toThrow();
    });
  });

  describe('Incidents Display', () => {
    beforeEach(() => {
      controller = new PopupController();
    });

    test('should display active incidents', () => {
      controller.updateIncidentsDisplay(mockIncidentsResponses.activeIncident.incidents);

      expect(mockElements['incidents-container'].innerHTML).toContain('API Response Delays');
      expect(mockElements['incidents-container'].innerHTML).toContain('investigating');
    });

    test('should show no incidents message when empty', () => {
      controller.updateIncidentsDisplay([]);

      expect(mockElements['incidents-container'].innerHTML).toBe(
        '<div class="no-incidents">No active incidents 🎉</div>'
      );
    });

    test('should display recent incidents with duration', () => {
      const incidentsWithDuration = mockIncidentsResponses.multipleIncidents.incidents.map(incident => ({
        ...incident,
        duration: incident.resolved_at ? '2h 15m' : null
      }));

      controller.updateRecentIncidentsDisplay(incidentsWithDuration);

      expect(mockElements['recent-incidents-container'].innerHTML).toContain('Duration: 2h 15m');
    });

    test('should render incident with proper HTML escaping', () => {
      const maliciousIncident = [{
        name: '<script>alert("xss")</script>Test Incident',
        status: 'investigating',
        created_at: new Date().toISOString(),
        titleWithDate: 'Test - <script>alert("xss")</script>Test Incident',
        updates: []
      }];

      controller.updateIncidentsDisplay(maliciousIncident);

      // Should escape HTML in the output
      expect(mockElements['incidents-container'].innerHTML).toContain('&lt;script&gt;');
      expect(mockElements['incidents-container'].innerHTML).not.toContain('<script>');
    });

    test('should truncate long incident text', () => {
      const longText = 'a'.repeat(200);
      const truncated = controller.truncateText(longText, 100);

      expect(truncated.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(truncated).toContain('...');
    });

    test('should not truncate short text', () => {
      const shortText = 'Short text';
      const result = controller.truncateText(shortText, 100);

      expect(result).toBe(shortText);
    });
  });

  describe('Tab Switching', () => {
    beforeEach(() => {
      controller = new PopupController();
    });

    test('should switch to active tab', () => {
      const mockTabButtons = [
        createMockElement('active-btn', 'button'),
        createMockElement('recent-btn', 'button')
      ];
      const mockTabContents = [
        mockElements['active-tab'],
        mockElements['recent-tab']
      ];

      global.document.querySelectorAll = jest.fn((selector) => {
        if (selector === '.tab-button') return mockTabButtons;
        if (selector === '.tab-content') return mockTabContents;
        return [];
      });

      global.document.querySelector = jest.fn((selector) => {
        if (selector === '[data-tab="active"]') return mockTabButtons[0];
        return null;
      });

      controller.switchTab('active');

      mockTabButtons.forEach(btn => {
        expect(btn.classList.remove).toHaveBeenCalledWith('active');
      });
      expect(mockTabButtons[0].classList.add).toHaveBeenCalledWith('active');

      mockTabContents.forEach(content => {
        expect(content.classList.remove).toHaveBeenCalledWith('active');
      });
      expect(mockElements['active-tab'].classList.add).toHaveBeenCalledWith('active');
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      controller = new PopupController();
      controller.loadStatus = jest.fn();
    });

    test('should refresh status when not already refreshing', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ status: 'success' });
      });

      await controller.refreshStatus();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'forceRefresh' });
      expect(mockElements['refresh-btn'].textContent).toBe('Refreshing...');
      expect(mockElements['refresh-btn'].disabled).toBe(true);
      expect(controller.loadStatus).toHaveBeenCalled();
    });

    test('should not refresh if already refreshing', async () => {
      controller.refreshing = true;

      await controller.refreshStatus();

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('should handle refresh errors', async () => {
      controller.showTemporaryMessage = jest.fn();
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ status: 'error', error: 'Refresh failed' });
      });

      await controller.refreshStatus();

      expect(controller.showTemporaryMessage).toHaveBeenCalledWith(
        'Refresh failed. Please try again.',
        'error'
      );
    });

    test('should restore button state after refresh', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ status: 'success' });
      });

      const originalText = mockElements['refresh-btn'].textContent;

      await controller.refreshStatus();
      
      // Advance timers to complete the delay
      jest.advanceTimersByTime(1500);
      await testUtils.flushPromisesAndTimers();

      expect(mockElements['refresh-btn'].disabled).toBe(false);
      expect(mockElements['refresh-btn'].removeAttribute).toHaveBeenCalledWith('aria-busy');
    });
  });

  describe('Time Formatting', () => {
    beforeEach(() => {
      controller = new PopupController();
    });

    test('should format recent times correctly', () => {
      const now = new Date();
      
      expect(controller.formatTime(new Date(now - 30 * 1000))).toBe('Just now'); // 30 seconds
      expect(controller.formatTime(new Date(now - 5 * 60 * 1000))).toBe('5m ago'); // 5 minutes
      expect(controller.formatTime(new Date(now - 2 * 60 * 60 * 1000))).toBe('2h ago'); // 2 hours
      expect(controller.formatTime(new Date(now - 3 * 24 * 60 * 60 * 1000))).toBe('3d ago'); // 3 days
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      controller = new PopupController();
    });

    test('should send message with timeout', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        setTimeout(() => callback({ success: true }), 100);
      });

      const response = await controller.sendMessage({ action: 'test' }, 5000);

      expect(response).toEqual({ success: true });
    });

    test('should timeout if no response', async () => {
      chrome.runtime.sendMessage.mockImplementation(() => {
        // Never call callback to simulate timeout
      });

      const response = await controller.sendMessage({ action: 'test' }, 100);

      expect(response).toBeNull();
    });

    test('should handle Chrome runtime errors', async () => {
      chrome.runtime.lastError = { message: 'Connection error' };
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(null);
      });

      const response = await controller.sendMessage({ action: 'test' });

      expect(response).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Message error:', expect.any(Object));
    });
  });

  describe('Error States and Recovery', () => {
    beforeEach(() => {
      controller = new PopupController();
    });

    test('should show no data state', () => {
      controller.showNoData();

      expect(mockElements['last-updated'].textContent).toBe('No data available');
      expect(mockElements['incidents-container'].innerHTML).toBe(
        '<div class="loading">Click refresh to load data</div>'
      );
    });

    test('should show error state with retry option', () => {
      controller.showError('Test error message');

      expect(mockElements['last-updated'].textContent).toBe('Test error message');
      expect(mockElements['last-updated'].className).toBe('last-updated error');
      expect(mockElements['incidents-container'].innerHTML).toContain('Error loading incidents');
      expect(mockElements['incidents-container'].innerHTML).toContain('Retry');
    });

    test('should show temporary messages', () => {
      controller.showTemporaryMessage('Refresh successful', 'info');

      expect(mockElements['last-updated'].textContent).toBe('Refresh successful');
      expect(mockElements['last-updated'].className).toBe('last-updated info');

      // Message should be restored after timeout
      jest.advanceTimersByTime(3100);
      expect(setTimeout).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      controller = new PopupController();
      controller.autoRefreshInterval = setInterval(() => {}, 1000);
    });

    test('should cleanup intervals on cleanup', () => {
      controller.cleanup();

      expect(clearInterval).toHaveBeenCalledWith(controller.autoRefreshInterval);
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    beforeEach(() => {
      controller = new PopupController();
      controller.refreshStatus = jest.fn();
      controller.switchTab = jest.fn();
    });

    test('should handle Ctrl+R for refresh', () => {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true
      });
      keydownEvent.preventDefault = jest.fn();

      // Simulate keydown event
      const keydownHandler = global.document.addEventListener.mock.calls
        .find(call => call[0] === 'keydown')[1];
      
      keydownHandler(keydownEvent);

      expect(keydownEvent.preventDefault).toHaveBeenCalled();
      expect(controller.refreshStatus).toHaveBeenCalled();
    });

    test('should handle number keys for tab switching', () => {
      const keydownEvent = new KeyboardEvent('keydown', { key: '1' });

      const keydownHandler = global.document.addEventListener.mock.calls
        .find(call => call[0] === 'keydown')[1];
      
      keydownHandler(keydownEvent);

      expect(controller.switchTab).toHaveBeenCalledWith('active');
    });
  });

  describe('Auto Refresh', () => {
    beforeEach(() => {
      controller = new PopupController();
      controller.loadStatus = jest.fn();
    });

    test('should start auto refresh interval', () => {
      controller.startAutoRefresh();

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    test('should not refresh when document is hidden', () => {
      global.document.hidden = true;
      controller.refreshing = false;
      
      controller.startAutoRefresh();
      
      // Trigger the interval
      const intervalCallback = setInterval.mock.calls[0][0];
      intervalCallback();

      expect(controller.loadStatus).not.toHaveBeenCalled();
    });

    test('should not refresh when already refreshing', () => {
      global.document.hidden = false;
      controller.refreshing = true;
      
      controller.startAutoRefresh();
      
      // Trigger the interval
      const intervalCallback = setInterval.mock.calls[0][0];
      intervalCallback();

      expect(controller.loadStatus).not.toHaveBeenCalled();
    });
  });
});