/**
 * Test fixtures for Anthropic Status API responses
 * Contains mock data for different status scenarios
 */

const mockStatusResponses = {
  // All systems operational
  operational: {
    status: {
      indicator: 'none',
      description: 'All Systems Operational'
    }
  },

  // Minor issues
  minor: {
    status: {
      indicator: 'minor',
      description: 'Minor Service Issues'
    }
  },

  // Major issues
  major: {
    status: {
      indicator: 'major', 
      description: 'Major Service Outage'
    }
  },

  // Critical issues
  critical: {
    status: {
      indicator: 'critical',
      description: 'Critical System Failure'
    }
  }
};

const mockIncidentsResponses = {
  // No incidents
  empty: {
    incidents: []
  },

  // Active incident
  activeIncident: {
    incidents: [
      {
        id: '12345',
        name: 'API Response Delays',
        status: 'investigating',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        resolved_at: null,
        impact: 'minor',
        shortlink: 'https://status.anthropic.com/incidents/12345',
        incident_updates: [
          {
            id: 'update-1',
            status: 'investigating',
            body: 'We are investigating reports of increased response times for API requests.',
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          }
        ]
      }
    ]
  },

  // Multiple incidents with different statuses
  multipleIncidents: {
    incidents: [
      {
        id: '12345',
        name: 'API Response Delays',
        status: 'monitoring',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        resolved_at: null,
        impact: 'minor',
        shortlink: 'https://status.anthropic.com/incidents/12345',
        incident_updates: [
          {
            id: 'update-2',
            status: 'monitoring',
            body: 'We have implemented a fix and are monitoring the situation.',
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          {
            id: 'update-1',
            status: 'investigating',
            body: 'We are investigating reports of increased response times.',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          }
        ]
      },
      {
        id: '12346',
        name: 'Claude.ai Login Issues',
        status: 'resolved',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // Resolved 22 hours ago
        impact: 'major',
        shortlink: 'https://status.anthropic.com/incidents/12346',
        incident_updates: [
          {
            id: 'update-3',
            status: 'resolved',
            body: 'The login issue has been fully resolved. All systems are operational.',
            created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'update-4',
            status: 'investigating',
            body: 'We are investigating reports of users unable to log into Claude.ai.',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          }
        ]
      }
    ]
  },

  // Historical incidents (for testing last 5)
  historicalIncidents: {
    incidents: [
      {
        id: '12347',
        name: 'Recent API Maintenance',
        status: 'resolved',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        impact: 'minor',
        shortlink: 'https://status.anthropic.com/incidents/12347',
        incident_updates: [
          {
            id: 'update-5',
            status: 'resolved',
            body: 'Scheduled maintenance has been completed successfully.',
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          }
        ]
      },
      {
        id: '12348',
        name: 'Database Performance Issues',
        status: 'resolved',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(), // Resolved 1 hour after start
        impact: 'major',
        shortlink: 'https://status.anthropic.com/incidents/12348',
        incident_updates: [
          {
            id: 'update-6',
            status: 'resolved',
            body: 'Database performance has been restored to normal levels.',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
          }
        ]
      }
    ]
  }
};

const mockComponentsResponses = {
  // All services operational
  allOperational: {
    components: [
      {
        id: 'claude-frontend',
        name: 'Claude.ai Frontend',
        status: 'operational',
        description: 'The main Claude.ai website and chat interface',
        position: 1
      },
      {
        id: 'anthropic-console',
        name: 'Anthropic Console',
        status: 'operational',
        description: 'Console for managing API keys and usage',
        position: 2
      },
      {
        id: 'anthropic-api',
        name: 'Anthropic API',
        status: 'operational',
        description: 'API endpoints for Claude models',
        position: 3
      },
      {
        id: 'claude-code',
        name: 'Claude Code',
        status: 'operational',
        description: 'Claude integration for code editors',
        position: 4
      }
    ]
  },

  // Mixed service statuses
  mixedStatuses: {
    components: [
      {
        id: 'claude-frontend',
        name: 'Claude.ai Frontend',
        status: 'operational',
        description: 'The main Claude.ai website and chat interface',
        position: 1
      },
      {
        id: 'anthropic-console',
        name: 'Anthropic Console',
        status: 'degraded_performance',
        description: 'Console for managing API keys and usage',
        position: 2
      },
      {
        id: 'anthropic-api',
        name: 'Anthropic API',
        status: 'partial_outage',
        description: 'API endpoints for Claude models',
        position: 3
      },
      {
        id: 'claude-code',
        name: 'Claude Code',
        status: 'major_outage',
        description: 'Claude integration for code editors',
        position: 4
      }
    ]
  },

  // All services down
  allDown: {
    components: [
      {
        id: 'claude-frontend',
        name: 'Claude.ai Frontend',
        status: 'major_outage',
        description: 'The main Claude.ai website and chat interface',
        position: 1
      },
      {
        id: 'anthropic-console',
        name: 'Anthropic Console',
        status: 'major_outage',
        description: 'Console for managing API keys and usage',
        position: 2
      },
      {
        id: 'anthropic-api',
        name: 'Anthropic API',
        status: 'major_outage',
        description: 'API endpoints for Claude models',
        position: 3
      },
      {
        id: 'claude-code',
        name: 'Claude Code',
        status: 'major_outage',
        description: 'Claude integration for code editors',
        position: 4
      }
    ]
  }
};

const mockSummaryResponses = {
  // Operational summary
  operational: {
    status: {
      indicator: 'none',
      description: 'All Systems Operational'
    },
    components: mockComponentsResponses.allOperational.components
  },

  // Degraded summary
  degraded: {
    status: {
      indicator: 'minor',
      description: 'Partial System Outage'
    },
    components: mockComponentsResponses.mixedStatuses.components
  },

  // Major outage summary
  majorOutage: {
    status: {
      indicator: 'major',
      description: 'Major Service Outage'
    },
    components: mockComponentsResponses.allDown.components
  }
};

// Error responses for testing error handling
const mockErrorResponses = {
  networkError: new Error('Network request failed'),
  timeoutError: new Error('Request timeout'),
  serverError: {
    status: 500,
    statusText: 'Internal Server Error',
    ok: false,
    json: () => Promise.reject(new Error('Failed to parse JSON'))
  },
  rateLimitError: {
    status: 429,
    statusText: 'Too Many Requests',
    ok: false,
    json: () => Promise.resolve({ error: 'Rate limit exceeded' })
  }
};

module.exports = {
  mockStatusResponses,
  mockIncidentsResponses,
  mockComponentsResponses,
  mockSummaryResponses,
  mockErrorResponses
};