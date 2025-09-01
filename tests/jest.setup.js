/**
 * Jest setup file for Chrome Extension tests
 * Configures Chrome APIs mocking and test environment
 */

// Add polyfills for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Import Chrome API mocks
require('./mocks/chrome-api');

// Configure Jest environment
global.console = {
  ...console,
  // Override console methods to track calls for testing
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock AbortController
global.AbortController = class AbortController {
  constructor() {
    this.signal = { aborted: false };
    this._onabort = null;
  }
  
  abort() {
    this.signal.aborted = true;
    if (this._onabort) {
      this._onabort();
    }
  }
};

// Mock setTimeout and clearTimeout for testing timers
jest.useFakeTimers();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Reset Chrome API mocks
  if (global.chrome) {
    global.chrome.storage.local.get.mockClear();
    global.chrome.storage.local.set.mockClear();
    global.chrome.alarms.create.mockClear();
    global.chrome.alarms.clear.mockClear();
    global.chrome.action.setIcon.mockClear();
    global.chrome.action.setBadgeText.mockClear();
    global.chrome.action.setBadgeBackgroundColor.mockClear();
    global.chrome.action.setTitle.mockClear();
    global.chrome.runtime.sendMessage.mockClear();
  }
  
  // Reset fetch mock
  global.fetch.mockClear();
  global.fetch.mockReset();
});

// Cleanup after each test
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.clearAllTimers();
});

// Polyfill setImmediate for test utilities
global.setImmediate = global.setImmediate || ((callback, ...args) => setTimeout(callback, 0, ...args));

// Test utilities
global.testUtils = {
  // Helper to wait for promises to resolve
  waitForPromises: () => new Promise(resolve => setImmediate(resolve)),
  
  // Helper to create mock responses
  createMockResponse: (data, ok = true, status = 200) => ({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(data),
  }),
  
  // Helper to advance timers and flush promises
  flushPromisesAndTimers: async () => {
    jest.advanceTimersByTime(100);
    await global.testUtils.waitForPromises();
    jest.runAllTimers();
    await global.testUtils.waitForPromises();
  }
};