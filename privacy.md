# Privacy Policy for Vibe Stats - AI Dev Tools Monitor

**Effective Date:** January 14, 2025  
**Last Updated:** January 14, 2025

## Overview

Vibe Stats - AI Dev Tools Monitor is a browser extension that monitors the operational status of developer tools (Claude AI and GitHub services) and displays this information to users. This privacy policy explains what data we collect, how we use it, and how we protect your privacy.

## Chrome Web Store Permission Justifications

### Storage Permission
**Justification**: Required to store service status data locally in the user's browser for offline viewing and performance optimization. The extension caches API responses from status services (Claude AI and GitHub) to reduce network requests and provide faster status updates. All data is stored locally using Chrome's storage API and never transmitted to external servers.

### Alarms Permission  
**Justification**: Essential for scheduling automated status checks every 5 minutes to monitor service health in the background. The extension uses Chrome's alarms API to perform periodic checks of Claude AI and GitHub status APIs, ensuring users receive timely notifications about service disruptions without manual intervention.

### Host Permissions (status.anthropic.com and githubstatus.com)
**Justification**: Required to fetch publicly available service status information from official status pages. The extension makes read-only API calls to retrieve operational status, incident reports, and maintenance notifications for Claude AI (status.anthropic.com) and GitHub services (githubstatus.com). These are the only external domains accessed, and no user data is transmitted to these services.

## What Data We Collect

### Service Status Data
- **External API Responses**: Publicly available status information from official status APIs
- **Status Information**: Service operational status, incident reports, component health
- **Timestamps**: When status checks were performed and last updates occurred

### Local Storage Data
- **Extension Preferences**: User settings for refresh intervals and display options
- **Cached Status Data**: Recent status information stored locally to reduce API calls
- **Error Logs**: Technical error messages for troubleshooting (stored locally only)

### No Personal Data Collection
We do **NOT** collect, store, or transmit:
- Personal identifying information
- Browsing history or website data
- User credentials or authentication tokens
- Location data or device identifiers
- Usage analytics or behavioral tracking
- Any data from websites you visit

## How We Use Data

### Status Monitoring Only
- Display real-time service status for development tools
- Show incident reports and maintenance notifications
- Update extension badge and icon to reflect service health
- Cache status data locally for improved performance

### No Data Sharing
- All data processing occurs locally in your browser
- No data transmission to our servers or third parties
- No analytics, tracking, or advertising functionality

## Data Storage and Security

### Local Storage Only
- All data stored locally using Chrome's secure storage API
- No cloud storage or external databases
- Data automatically deleted when extension is uninstalled
- No cross-device synchronization

### Secure Communications
- All API requests use HTTPS encryption
- Only connects to official status service endpoints
- No authentication tokens or personal data transmitted
- Minimal request headers (standard User-Agent only)

## Third-Party Services

### Official Status APIs Only
The extension accesses two official status services:
- **Anthropic Status API**: For Claude AI service information
- **GitHub Status API**: For GitHub services information

These are read-only requests to publicly available endpoints. No personal information is sent.

### No Third-Party Analytics
- No Google Analytics or tracking services
- No crash reporting or telemetry
- No advertising networks or social media integration

## Your Privacy Rights

### Data Control
- **Inspect Data**: View stored data via browser developer tools
- **Delete Data**: Uninstall extension to remove all local data
- **No Account Required**: Extension works without registration or login

### Transparent Operations
- All code is available for review
- Open source development practices
- Clear permission usage documented

## Chrome Web Store Compliance

This extension meets Chrome Web Store privacy requirements:
- **Minimal Permissions**: Only requests permissions essential for functionality
- **No Data Collection**: Does not collect user personal information
- **Transparent Practices**: Clear documentation of all data usage
- **Secure Implementation**: HTTPS-only communications with minimal attack surface
- **No Unauthorized Access**: Only accesses explicitly permitted domains

## Children's Privacy

This extension is designed for software developers and does not target children. No personal information is collected from users of any age.

## Data Retention

- **Status Data**: Refreshed every 5 minutes, older data automatically replaced
- **Settings**: Persist until extension is uninstalled or reset
- **Error Logs**: Overwritten with each new occurrence
- **Complete Removal**: All data deleted upon extension uninstallation

## Changes to This Policy

Policy updates will be reflected in the "Last Updated" date. Continued use constitutes acceptance of changes.

## Contact Information

For questions about this privacy policy:
- **GitHub Repository**: https://github.com/todddube/vstat
- **Issue Tracker**: https://github.com/todddube/vstat/issues
- **Developer**: Todd Dube

---

**Key Privacy Points for Chrome Web Store Review**:
1. **No Personal Data**: Extension does not collect any personal information
2. **Local Storage Only**: All data stored locally, never transmitted externally  
3. **Minimal Permissions**: Only requests permissions essential for core functionality
4. **Official APIs Only**: Accesses only official service status endpoints
5. **Open Source**: Code available for security review and transparency