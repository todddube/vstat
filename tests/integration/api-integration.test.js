/**
 * Integration tests for API data processing and status workflows
 * Tests end-to-end functionality including API calls, data processing,
 * storage operations, and UI updates
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

describe('API Integration Tests', () => {
  let statusMonitor;

  beforeAll(() => {
    // StatusMonitor class already loaded above
  });

  beforeEach(() => {
    statusMonitor = new StatusMonitor();
    chrome._resetMocks();
    global.fetch.mockClear();
    jest.clearAllTimers();
  });

  describe('Full Status Check Workflow', () => {
    test('should complete full operational status workflow', async () => {
      // Mock successful API responses
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.empty))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      await statusMonitor.checkStatus();

      // Verify all API calls were made
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith(
        statusMonitor.statusUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': 'Claude Status Monitor Extension'
          })
        })
      );

      // Verify storage was updated
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        status: 'none',
        incidents: [],
        historicalIncidents: [],
        lastFiveIncidents: [],
        components: mockSummaryResponses.operational.components,
        lastUpdated: expect.any(String)
      });

      // Verify badge was updated
      expect(chrome.action.setIcon).toHaveBeenCalledWith({
        path: expect.objectContaining({
          "16": "icons/claude-green-16.png"
        })
      });

      // Verify success timestamp was stored
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        lastSuccessfulCheck: expect.any(Number)
      });
    });

    test('should handle minor issues workflow correctly', async () => {
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.minor))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.activeIncident))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.degraded));

      await statusMonitor.checkStatus();

      // Verify status processing
      const storageCall = chrome.storage.local.set.mock.calls.find(call => call[0].status);
      expect(storageCall[0]).toMatchObject({
        status: 'minor',
        incidents: expect.arrayContaining([
          expect.objectContaining({
            name: 'API Response Delays',
            status: 'investigating'
          })
        ]),
        components: expect.arrayContaining([
          expect.objectContaining({
            name: 'Anthropic Console',
            status: 'degraded_performance'
          })
        ])
      });

      // Verify badge shows affected services count
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '3' });
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#FFC107'
      });
    });

    test('should handle critical status workflow', async () => {
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.critical))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.multipleIncidents))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.majorOutage));

      await statusMonitor.checkStatus();

      // Verify critical status handling
      expect(chrome.action.setIcon).toHaveBeenCalledWith({
        path: expect.objectContaining({
          "16": "icons/claude-red-16.png"
        })
      });

      expect(chrome.action.setTitle).toHaveBeenCalledWith({
        title: expect.stringContaining('Critical Issues')
      });

      // Should show affected services count
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '4' });
    });
  });

  describe('Partial API Failure Handling', () => {
    test('should handle status API success with incidents API failure', async () => {
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockRejectedValueOnce(new Error('Incidents API failed'))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      await statusMonitor.checkStatus();

      // Should still update with available data
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'none',
          incidents: [], // Empty due to API failure
          components: mockSummaryResponses.operational.components
        })
      );

      // Should still update badge
      expect(chrome.action.setIcon).toHaveBeenCalled();
    });

    test('should handle components API failure gracefully', async () => {
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.minor))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.activeIncident))
        .mockRejectedValueOnce(new Error('Components API failed'));

      await statusMonitor.checkStatus();

      // Should update with available data
      const storageCall = chrome.storage.local.set.mock.calls.find(call => call[0].status);
      expect(storageCall[0]).toMatchObject({
        status: 'minor',
        incidents: expect.any(Array),
        components: [] // Empty due to API failure
      });

      // Badge should show '?' for minor status with no components data 
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '?' });
    });

    test('should handle all API failures with retries', async () => {
      global.fetch.mockRejectedValue(new Error('All APIs failed'));

      await statusMonitor.checkStatus();

      // Should attempt retries
      for (let i = 1; i <= 3; i++) {
        jest.advanceTimersByTime(2000 * i);
        await testUtils.flushPromisesAndTimers();
      }

      // After all retries failed, should set unknown status
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        status: 'unknown',
        incidents: [],
        historicalIncidents: [],
        lastFiveIncidents: [],
        components: []
      });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        lastError: {
          message: 'All APIs failed',
          timestamp: expect.any(Number)
        }
      });
    });
  });

  describe('Incident Data Processing Integration', () => {
    test('should correctly process active and historical incidents', async () => {
      const complexIncidentsData = {
        incidents: [
          // Active incident
          {
            id: '1',
            name: 'Current API Issues',
            status: 'investigating',
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
            resolved_at: null,
            impact: 'minor',
            shortlink: 'https://status.anthropic.com/incidents/1',
            incident_updates: [
              {
                id: 'u1',
                status: 'investigating',
                body: 'We are investigating reports of API slowdowns.',
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
              }
            ]
          },
          // Recent resolved incident (within 24h)
          {
            id: '2',
            name: 'Database Maintenance',
            status: 'resolved',
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            resolved_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            impact: 'major',
            shortlink: 'https://status.anthropic.com/incidents/2',
            incident_updates: [
              {
                id: 'u2',
                status: 'resolved',
                body: 'Maintenance completed successfully.',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          // Old incident (outside 24h) - should appear in lastFive but not historical
          {
            id: '3',
            name: 'Old Issue',
            status: 'resolved',
            created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
            resolved_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
            impact: 'minor',
            shortlink: 'https://status.anthropic.com/incidents/3',
            incident_updates: []
          }
        ]
      };

      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.minor))
        .mockResolvedValueOnce(testUtils.createMockResponse(complexIncidentsData))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      await statusMonitor.checkStatus();

      const storageCall = chrome.storage.local.set.mock.calls.find(call => call[0].incidents);
      const storedData = storageCall[0];

      // Recent incidents should only include active ones
      expect(storedData.incidents).toHaveLength(1);
      expect(storedData.incidents[0].name).toBe('Current API Issues');
      expect(storedData.incidents[0].titleWithDate).toContain('Current API Issues');

      // Historical incidents should include recent incidents within 24h
      expect(storedData.historicalIncidents).toHaveLength(2);
      expect(storedData.historicalIncidents.find(i => i.name === 'Database Maintenance')).toBeTruthy();
      expect(storedData.historicalIncidents.find(i => i.name === 'Database Maintenance').duration).toBe('2h 0m');

      // Last five should include all incidents sorted by creation date
      expect(storedData.lastFiveIncidents).toHaveLength(3);
      expect(storedData.lastFiveIncidents[0].name).toBe('Current API Issues'); // Most recent
      expect(storedData.lastFiveIncidents[1].name).toBe('Database Maintenance');
      expect(storedData.lastFiveIncidents[2].name).toBe('Old Issue');
    });

    test('should handle incidents with missing data gracefully', async () => {
      const incompleteIncidentsData = {
        incidents: [
          {
            id: '1',
            name: 'Incomplete Incident',
            status: 'investigating',
            created_at: new Date().toISOString(),
            // Missing: resolved_at, impact, shortlink, incident_updates
          }
        ]
      };

      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockResolvedValueOnce(testUtils.createMockResponse(incompleteIncidentsData))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      await statusMonitor.checkStatus();

      // Should not crash and should process what data is available
      const storageCall = chrome.storage.local.set.mock.calls.find(call => call[0].incidents);
      expect(storageCall[0].incidents).toHaveLength(1);
      expect(storageCall[0].incidents[0].name).toBe('Incomplete Incident');
      expect(storageCall[0].incidents[0].updates).toEqual([]); // Empty updates array
    });
  });

  describe('Component Status Integration', () => {
    test('should correctly identify and count affected services', async () => {
      const realWorldComponents = {
        components: [
          { name: 'Claude.ai Website', status: 'operational' },
          { name: 'Anthropic Console', status: 'degraded_performance' },
          { name: 'Anthropic API', status: 'partial_outage' },
          { name: 'Claude Code Extension', status: 'major_outage' },
          { name: 'Internal Monitoring', status: 'operational' }, // Not a key service
        ]
      };

      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.major))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.empty))
        .mockResolvedValueOnce(testUtils.createMockResponse(realWorldComponents));

      await statusMonitor.checkStatus();

      // Should count 3 affected services (console, api, code) but not internal monitoring
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '3' });

      // Title should reflect affected services count
      expect(chrome.action.setTitle).toHaveBeenCalledWith({
        title: 'Claude Status: Major Issues (3 services affected)'
      });
    });

    test('should handle unknown service names correctly', async () => {
      const unknownServices = {
        components: [
          { name: 'Unknown Service A', status: 'major_outage' },
          { name: 'Claude.ai Frontend', status: 'operational' },
          { name: 'Random Component', status: 'partial_outage' }
        ]
      };

      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.empty))
        .mockResolvedValueOnce(testUtils.createMockResponse(unknownServices));

      await statusMonitor.checkStatus();

      // Should only count known services that are affected
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' }); // Only claude.ai is operational
    });
  });

  describe('Error Recovery Integration', () => {
    test('should recover from temporary network errors', async () => {
      // First attempt fails
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const checkPromise = statusMonitor.checkStatus();

      // Wait for first retry
      jest.advanceTimersByTime(2000);
      await testUtils.flushPromisesAndTimers();

      // Second attempt succeeds
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.empty))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      jest.advanceTimersByTime(100);
      await testUtils.flushPromisesAndTimers();

      await checkPromise;

      // Should have succeeded on retry
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'none'
        })
      );

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        lastSuccessfulCheck: expect.any(Number)
      });
    });

    test('should handle mixed success/failure scenarios', async () => {
      // Status API succeeds, incidents fails, summary succeeds
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockRejectedValueOnce(new Error('Incidents API timeout'))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      await statusMonitor.checkStatus();

      // Should update with partial data
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'none',
          incidents: [], // Failed to load
          components: expect.any(Array) // Successfully loaded
        })
      );

      // Should still mark as successful since some data was retrieved
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        lastSuccessfulCheck: expect.any(Number)
      });
    });
  });

  describe('Alarm Integration', () => {
    test('should initialize with alarm creation', async () => {
      // Mock successful status check
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.empty))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      await statusMonitor.init();

      expect(chrome.alarms.clear).toHaveBeenCalledWith('statusCheck');
      expect(chrome.alarms.create).toHaveBeenCalledWith('statusCheck', {
        periodInMinutes: 5
      });

      // Should perform initial status check
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('should handle alarm initialization failure', async () => {
      chrome.alarms.clear.mockRejectedValue(new Error('Alarm permission denied'));

      await statusMonitor.init();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize status monitor:',
        expect.any(Error)
      );
    });
  });

  describe('Storage Integration', () => {
    test('should handle storage quota exceeded', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'QuotaExceededError';
      
      chrome.storage.local.set.mockRejectedValue(quotaError);

      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.empty))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      await statusMonitor.checkStatus();

      // Should attempt to store data even if it fails
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should handle concurrent storage operations', async () => {
      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(mockStatusResponses.operational))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockIncidentsResponses.empty))
        .mockResolvedValueOnce(testUtils.createMockResponse(mockSummaryResponses.operational));

      // Start multiple status checks simultaneously
      const checks = [
        statusMonitor.checkStatus(),
        statusMonitor.checkStatus(),
        statusMonitor.checkStatus()
      ];

      await Promise.all(checks);

      // Storage should have been called multiple times
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('Real-world API Response Simulation', () => {
    test('should handle actual Anthropic API response format', async () => {
      // Simulate real response structure from Anthropic status page
      const realStatusResponse = {
        page: {
          id: 'test-page',
          name: 'Anthropic Status',
          url: 'https://status.anthropic.com'
        },
        status: {
          indicator: 'minor',
          description: 'Partially Degraded Service'
        }
      };

      const realIncidentsResponse = {
        page: { /* page info */ },
        incidents: [
          {
            id: 'real-incident-123',
            name: 'Elevated API Response Times',
            status: 'investigating',
            created_at: '2024-01-15T10:30:00.000Z',
            updated_at: '2024-01-15T10:45:00.000Z',
            monitoring_at: null,
            resolved_at: null,
            impact: 'minor',
            shortlink: 'https://status.anthropic.com/incidents/real-incident-123',
            started_at: '2024-01-15T10:25:00.000Z',
            page_id: 'test-page',
            incident_updates: [
              {
                id: 'update-456',
                status: 'investigating',
                body: 'We are currently investigating reports of elevated API response times. We will provide updates as we learn more.',
                incident_id: 'real-incident-123',
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z',
                display_at: '2024-01-15T10:30:00.000Z',
                affected_components: [
                  {
                    code: 'api',
                    name: 'Anthropic API',
                    old_status: 'operational',
                    new_status: 'degraded_performance'
                  }
                ]
              }
            ]
          }
        ]
      };

      const realSummaryResponse = {
        page: { /* page info */ },
        status: {
          indicator: 'minor',
          description: 'Partially Degraded Service'
        },
        components: [
          {
            id: 'claude-frontend',
            name: 'Claude.ai',
            status: 'operational',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-15T09:00:00.000Z',
            position: 1,
            description: 'The main Claude.ai website and chat interface',
            showcase: false,
            start_date: null,
            group_id: null,
            page_id: 'test-page',
            group: false,
            only_show_if_degraded: false
          },
          {
            id: 'anthropic-api',
            name: 'Anthropic API',
            status: 'degraded_performance',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-15T10:25:00.000Z',
            position: 2,
            description: 'API endpoints for Claude models',
            showcase: false,
            start_date: null,
            group_id: null,
            page_id: 'test-page',
            group: false,
            only_show_if_degraded: false
          }
        ]
      };

      global.fetch
        .mockResolvedValueOnce(testUtils.createMockResponse(realStatusResponse))
        .mockResolvedValueOnce(testUtils.createMockResponse(realIncidentsResponse))
        .mockResolvedValueOnce(testUtils.createMockResponse(realSummaryResponse));

      await statusMonitor.checkStatus();

      // Verify processing of real API structure
      const storageCall = chrome.storage.local.set.mock.calls.find(call => call[0].status);
      expect(storageCall[0]).toMatchObject({
        status: 'minor',
        incidents: expect.arrayContaining([
          expect.objectContaining({
            name: 'Elevated API Response Times',
            impact: 'minor',
            status: 'investigating'
          })
        ]),
        components: expect.arrayContaining([
          expect.objectContaining({
            name: 'Claude.ai',
            status: 'operational'
          }),
          expect.objectContaining({
            name: 'Anthropic API',
            status: 'degraded_performance'
          })
        ])
      });

      // Badge should reflect degraded service
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '1' });
      expect(chrome.action.setIcon).toHaveBeenCalledWith({
        path: expect.objectContaining({
          "16": "icons/claude-yellow-16.png"
        })
      });
    });
  });
});