/**
 * Unit tests for StatusMonitor class (background.js)
 * Tests background script functionality including status checking, 
 * badge updates, storage operations, and error handling
 */

// Import test fixtures
const {
  mockStatusResponses,
  mockIncidentsResponses,
  mockComponentsResponses,
  mockSummaryResponses,
  mockErrorResponses
} = require('../fixtures/api-responses');

// Import StatusMonitor class from the actual background script
// We need to load and extract the class from the source file
const fs = require('fs');
const path = require('path');

// Load the background.js file and extract the StatusMonitor class
const backgroundSource = fs.readFileSync(path.join(__dirname, '../../background.js'), 'utf8');
// Execute in a sandbox to get the class
let StatusMonitor;
eval(`
  // Mock global objects that might be referenced
  const chrome = global.chrome;
  ${backgroundSource}
  // Extract the class
  if (typeof StatusMonitor !== 'undefined') {
    global._StatusMonitor = StatusMonitor;
  }
`);
StatusMonitor = global._StatusMonitor;

describe('StatusMonitor', () => {

  let statusMonitor;

  beforeEach(() => {
    statusMonitor = new StatusMonitor();
    chrome._resetMocks();
    global.fetch.mockClear();
  });

  describe('Constructor', () => {
    test('should initialize with correct configuration', () => {
      expect(statusMonitor.statusUrl).toBe('https://status.anthropic.com/api/v2/status.json');
      expect(statusMonitor.incidentsUrl).toBe('https://status.anthropic.com/api/v2/incidents.json');
      expect(statusMonitor.summaryUrl).toBe('https://status.anthropic.com/api/v2/summary.json');
      expect(statusMonitor.alarmName).toBe('statusCheck');
      expect(statusMonitor.intervalMinutes).toBe(5);
      expect(statusMonitor.maxRetries).toBe(3);
      expect(statusMonitor.retryDelay).toBe(2000);
    });
  });

  describe('init()', () => {
    test('should clear existing alarms and create new one', async () => {
      global.fetch.mockResolvedValueOnce(
        testUtils.createMockResponse(mockStatusResponses.operational)
      );
      global.fetch.mockResolvedValueOnce(
        testUtils.createMockResponse(mockIncidentsResponses.empty)
      );
      global.fetch.mockResolvedValueOnce(
        testUtils.createMockResponse(mockSummaryResponses.operational)
      );

      await statusMonitor.init();

      expect(chrome.alarms.clear).toHaveBeenCalledWith('statusCheck');
      expect(chrome.alarms.create).toHaveBeenCalledWith('statusCheck', {
        periodInMinutes: 5
      });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('should handle initialization errors', async () => {
      chrome.alarms.clear.mockRejectedValue(new Error('Alarm error'));

      await statusMonitor.init();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize status monitor:',
        expect.any(Error)
      );
    });
  });

  describe('fetchData()', () => {
    test('should fetch data successfully', async () => {
      const mockData = { test: 'data' };
      global.fetch.mockResolvedValue(
        testUtils.createMockResponse(mockData)
      );

      const result = await statusMonitor.fetchData('https://api.test.com');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('https://api.test.com', {
        signal: expect.any(Object),
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Claude Status Monitor Extension'
        }
      });
    });

    test('should handle HTTP errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(statusMonitor.fetchData('https://api.test.com'))
        .rejects
        .toThrow('HTTP 404: Not Found');
    });

    test('should handle network timeout', async () => {
      global.fetch.mockImplementation(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 1000);
        })
      );

      jest.advanceTimersByTime(1500); // Advance past timeout

      await expect(statusMonitor.fetchData('https://api.test.com', 1000))
        .rejects
        .toThrow('Request timeout');
    }, 10000);

    test('should handle AbortController timeout', async () => {
      // Mock AbortController to simulate timeout
      const mockAbort = jest.fn();
      global.AbortController = jest.fn(() => ({
        signal: { aborted: false },
        abort: mockAbort
      }));

      global.fetch.mockRejectedValue({ name: 'AbortError' });

      await expect(statusMonitor.fetchData('https://api.test.com', 1000))
        .rejects
        .toThrow('Request timeout');
    });
  });

  describe('checkStatus()', () => {
    test('should successfully check and update status', async () => {
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.empty))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      await statusMonitor.checkStatus();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        status: 'none',
        incidents: [],
        historicalIncidents: [],
        lastFiveIncidents: [],
        components: mockSummaryResponses.operational.components,
        lastUpdated: expect.any(String)
      });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        lastSuccessfulCheck: expect.any(Number)
      });
    });

    test('should handle partial API failures gracefully', async () => {
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockRejectedValueOnce(new Error('Incidents API failed'))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      await statusMonitor.checkStatus();

      // Should still update with available data
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'none',
          incidents: [], // Should be empty due to failure
          components: mockSummaryResponses.operational.components
        })
      );
    });

    test('should retry on failure up to maxRetries', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await statusMonitor.checkStatus();

      // Should attempt retry after first failure
      jest.advanceTimersByTime(2000);
      await testUtils.flushPromisesAndTimers();

      expect(global.fetch).toHaveBeenCalledTimes(6); // Initial 3 calls + 3 retry calls
    }, 15000);

    test('should set unknown status after max retries exceeded', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await statusMonitor.checkStatus();

      // Advance through all retry attempts
      for (let i = 1; i <= 3; i++) {
        jest.advanceTimersByTime(2000 * i);
        await testUtils.flushPromisesAndTimers();
      }

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        status: 'unknown',
        incidents: [],
        historicalIncidents: [],
        lastFiveIncidents: [],
        components: []
      });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        lastError: {
          message: 'Network error',
          timestamp: expect.any(Number)
        }
      });
    }, 15000);
  });

  describe('Badge and Icon Updates', () => {
    test('should update badge for operational status', async () => {
      await statusMonitor.updateBadgeIcon('operational', mockComponentsResponses.allOperational.components);

      expect(chrome.action.setIcon).toHaveBeenCalledWith({
        path: {
          "16": "icons/claude-green-16.png",
          "32": "icons/claude-green-32.png", 
          "48": "icons/claude-green-48.png",
          "128": "icons/claude-green-128.png"
        }
      });
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
      expect(chrome.action.setTitle).toHaveBeenCalledWith({
        title: 'Claude Status: All Systems Operational'
      });
    });

    test('should update badge for minor issues with affected count', async () => {
      await statusMonitor.updateBadgeIcon('minor', mockComponentsResponses.mixedStatuses.components);

      expect(chrome.action.setIcon).toHaveBeenCalledWith({
        path: {
          "16": "icons/claude-yellow-16.png",
          "32": "icons/claude-yellow-32.png",
          "48": "icons/claude-yellow-48.png", 
          "128": "icons/claude-yellow-128.png"
        }
      });
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '3' }); // 3 affected services
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#FFC107'
      });
    });

    test('should update badge for critical status', async () => {
      await statusMonitor.updateBadgeIcon('critical', mockComponentsResponses.allDown.components);

      expect(chrome.action.setIcon).toHaveBeenCalledWith({
        path: expect.objectContaining({
          "16": "icons/claude-red-16.png"
        })
      });
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '4' });
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#F44336'
      });
      expect(chrome.action.setTitle).toHaveBeenCalledWith({
        title: 'Claude Status: Critical Issues (4 services affected)'
      });
    });

    test('should handle badge update errors gracefully', async () => {
      chrome.action.setIcon.mockRejectedValue(new Error('Icon update failed'));

      await statusMonitor.updateBadgeIcon('operational', []);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to update badge icon:',
        expect.any(Error)
      );
    });
  });

  describe('Service Status Processing', () => {
    test('should count affected services correctly', () => {
      const count = statusMonitor.countAffectedServices(mockComponentsResponses.mixedStatuses.components);
      expect(count).toBe(3); // console (degraded), api (partial), code (major)
    });

    test('should return 0 for all operational services', () => {
      const count = statusMonitor.countAffectedServices(mockComponentsResponses.allOperational.components);
      expect(count).toBe(0);
    });

    test('should handle empty or invalid components array', () => {
      expect(statusMonitor.countAffectedServices([])).toBe(0);
      expect(statusMonitor.countAffectedServices(null)).toBe(0);
      expect(statusMonitor.countAffectedServices(undefined)).toBe(0);
    });
  });

  describe('Incident Processing', () => {
    test('should filter and format recent incidents correctly', () => {
      const incidents = statusMonitor.getRecentIncidents(
        mockIncidentsResponses.multipleIncidents.incidents
      );

      expect(incidents).toHaveLength(1); // Only non-resolved incidents
      expect(incidents[0]).toMatchObject({
        name: 'API Response Delays',
        status: 'monitoring',
        impact: 'minor'
      });
      expect(incidents[0].titleWithDate).toContain('API Response Delays');
    });

    test('should get last five incidents regardless of status', () => {
      const incidents = statusMonitor.getLastFiveIncidents(
        mockIncidentsResponses.multipleIncidents.incidents
      );

      expect(incidents).toHaveLength(2);
      expect(incidents.find(i => i.status === 'resolved')).toBeDefined();
      expect(incidents.find(i => i.status === 'monitoring')).toBeDefined();
    });

    test('should calculate incident duration correctly', () => {
      const startTime = '2024-01-01T10:00:00Z';
      const endTime = '2024-01-01T12:30:00Z';
      
      const duration = statusMonitor.calculateDuration(startTime, endTime);
      expect(duration).toBe('2h 30m');
    });

    test('should format incident title with date', () => {
      const title = statusMonitor.formatIncidentTitle(
        'Test Incident',
        '2024-01-01T10:00:00Z'
      );

      expect(title).toMatch(/\w+ \d+.* - Test Incident/);
    });
  });

  describe('Status Mapping', () => {
    test('should map status indicators to icon colors correctly', () => {
      expect(statusMonitor.getIconColor('none')).toBe('green');
      expect(statusMonitor.getIconColor('operational')).toBe('green');
      expect(statusMonitor.getIconColor('minor')).toBe('yellow');
      expect(statusMonitor.getIconColor('major')).toBe('red');
      expect(statusMonitor.getIconColor('critical')).toBe('red');
      expect(statusMonitor.getIconColor('unknown')).toBe('gray');
    });

    test('should generate correct status text', () => {
      expect(statusMonitor.getStatusText('none')).toBe('All Systems Operational');
      expect(statusMonitor.getStatusText('operational')).toBe('All Systems Operational');
      expect(statusMonitor.getStatusText('minor')).toBe('Minor Issues');
      expect(statusMonitor.getStatusText('major')).toBe('Major Issues');
      expect(statusMonitor.getStatusText('critical')).toBe('Critical Issues');
      expect(statusMonitor.getStatusText('unknown')).toBe('Status Unknown');
    });

    test('should generate correct badge colors', () => {
      expect(statusMonitor.getBadgeColor('operational')).toBe('#4CAF50');
      expect(statusMonitor.getBadgeColor('minor')).toBe('#FFC107');
      expect(statusMonitor.getBadgeColor('major')).toBe('#F44336');
      expect(statusMonitor.getBadgeColor('unknown')).toBe('#9E9E9E');
    });
  });

  describe('Data Extraction from Promise.allSettled', () => {
    test('should extract status from successful result', () => {
      const result = { status: 'fulfilled', value: mockStatusResponses.operational };
      const status = statusMonitor.extractStatusFromResult(result);
      expect(status).toBe('none');
    });

    test('should return unknown for failed status result', () => {
      const result = { status: 'rejected', reason: new Error('Failed') };
      const status = statusMonitor.extractStatusFromResult(result);
      expect(status).toBe('unknown');
    });

    test('should extract incidents from successful result', () => {
      const result = { status: 'fulfilled', value: mockIncidentsResponses.activeIncident };
      const incidents = statusMonitor.extractIncidentsFromResult(result);
      expect(incidents).toHaveLength(1);
      expect(incidents[0].name).toBe('API Response Delays');
    });

    test('should return empty array for failed incidents result', () => {
      const result = { status: 'rejected', reason: new Error('Failed') };
      const incidents = statusMonitor.extractIncidentsFromResult(result);
      expect(incidents).toEqual([]);
    });

    test('should extract components from successful result', () => {
      const result = { status: 'fulfilled', value: mockSummaryResponses.operational };
      const components = statusMonitor.extractComponentsFromResult(result);
      expect(components).toHaveLength(4);
    });

    test('should return empty array for failed components result', () => {
      const result = { status: 'rejected', reason: new Error('Failed') };
      const components = statusMonitor.extractComponentsFromResult(result);
      expect(components).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    test('should handle check failure correctly', async () => {
      const error = new Error('Check failed');
      await statusMonitor.handleCheckFailure(error);

      expect(chrome.storage.local.set).toHaveBeenNthCalledWith(1, expect.objectContaining({
        status: 'unknown',
        incidents: [],
        historicalIncidents: [],
        lastFiveIncidents: [],
        components: []
      }));

      expect(chrome.storage.local.set).toHaveBeenNthCalledWith(2, {
        lastError: {
          message: 'Check failed',
          timestamp: expect.any(Number)
        }
      });
    });

    test('should log errors with category', () => {
      const error = new Error('Test error');
      statusMonitor.handleError(error, 'test-category');

      expect(console.error).toHaveBeenCalledWith(
        '[test-category] Error:',
        error
      );
    });
  });

  describe('Storage Operations', () => {
    test('should update status in storage', async () => {
      const status = 'minor';
      const incidents = [{ name: 'Test Incident' }];
      const components = [{ name: 'Test Component' }];

      await statusMonitor.updateStatus(status, incidents, [], components, []);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        status,
        incidents,
        historicalIncidents: [],
        lastFiveIncidents: [],
        components,
        lastUpdated: expect.any(String)
      });
    });
  });
});