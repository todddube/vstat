/**
 * Chrome Extension API Mocks
 * Provides mock implementations of Chrome extension APIs for testing
 */

const mockStorage = {
  local: {
    data: {},
    get: jest.fn((keys) => {
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockStorage.local.data[keys] });
      }
      if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          result[key] = mockStorage.local.data[key];
        });
        return Promise.resolve(result);
      }
      if (keys === null || keys === undefined) {
        return Promise.resolve({ ...mockStorage.local.data });
      }
      return Promise.resolve({});
    }),
    set: jest.fn((items) => {
      Object.assign(mockStorage.local.data, items);
      return Promise.resolve();
    }),
    remove: jest.fn((keys) => {
      if (typeof keys === 'string') {
        delete mockStorage.local.data[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach(key => delete mockStorage.local.data[key]);
      }
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      mockStorage.local.data = {};
      return Promise.resolve();
    }),
    // Helper method to reset storage state for tests
    _reset: () => {
      mockStorage.local.data = {};
    }
  }
};

const mockAlarms = {
  _alarms: {},
  create: jest.fn((name, alarmInfo) => {
    mockAlarms._alarms[name] = {
      name,
      ...alarmInfo,
      scheduledTime: Date.now() + (alarmInfo.delayInMinutes || 0) * 60000,
    };
    return Promise.resolve();
  }),
  clear: jest.fn((name) => {
    if (name) {
      delete mockAlarms._alarms[name];
    } else {
      mockAlarms._alarms = {};
    }
    return Promise.resolve();
  }),
  get: jest.fn((name) => {
    return Promise.resolve(name ? mockAlarms._alarms[name] : null);
  }),
  getAll: jest.fn(() => {
    return Promise.resolve(Object.values(mockAlarms._alarms));
  }),
  onAlarm: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
  },
  // Helper to trigger alarm for testing
  _triggerAlarm: (name) => {
    const listeners = mockAlarms.onAlarm.addListener.mock.calls.map(call => call[0]);
    listeners.forEach(listener => {
      listener({ name });
    });
  }
};

const mockAction = {
  setIcon: jest.fn(() => Promise.resolve()),
  setBadgeText: jest.fn(() => Promise.resolve()),
  setBadgeBackgroundColor: jest.fn(() => Promise.resolve()),
  setTitle: jest.fn(() => Promise.resolve()),
  setPopup: jest.fn(() => Promise.resolve()),
  getTitle: jest.fn(() => Promise.resolve('Claude Status Monitor')),
  getBadgeText: jest.fn(() => Promise.resolve('')),
  getBadgeBackgroundColor: jest.fn(() => Promise.resolve('#000000')),
  onClicked: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
  }
};

const mockRuntime = {
  lastError: null,
  sendMessage: jest.fn((message, callback) => {
    // Simulate async response
    setTimeout(() => {
      const response = { status: 'success', data: {} };
      if (callback) callback(response);
    }, 0);
  }),
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
  },
  onInstalled: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
  },
  onStartup: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(),
  },
  id: 'test-extension-id',
  getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
  // Helper to simulate message sending
  _sendMessage: (message, sender, sendResponse) => {
    const listeners = mockRuntime.onMessage.addListener.mock.calls.map(call => call[0]);
    listeners.forEach(listener => {
      listener(message, sender, sendResponse);
    });
  },
  // Helper to trigger installed event
  _triggerInstalled: (details) => {
    const listeners = mockRuntime.onInstalled.addListener.mock.calls.map(call => call[0]);
    listeners.forEach(listener => {
      listener(details);
    });
  },
  // Helper to trigger startup event
  _triggerStartup: () => {
    const listeners = mockRuntime.onStartup.addListener.mock.calls.map(call => call[0]);
    listeners.forEach(listener => {
      listener();
    });
  }
};

const mockTabs = {
  query: jest.fn(() => Promise.resolve([])),
  get: jest.fn(() => Promise.resolve({})),
  create: jest.fn(() => Promise.resolve({})),
  update: jest.fn(() => Promise.resolve({})),
  remove: jest.fn(() => Promise.resolve()),
};

// Create the global chrome object
global.chrome = {
  storage: mockStorage,
  alarms: mockAlarms,
  action: mockAction,
  runtime: mockRuntime,
  tabs: mockTabs,
  // Test helpers
  _resetMocks: () => {
    mockStorage.local._reset();
    mockAlarms._alarms = {};
    mockRuntime.lastError = null;
  }
};

module.exports = {
  mockStorage,
  mockAlarms,
  mockAction,
  mockRuntime,
  mockTabs,
};