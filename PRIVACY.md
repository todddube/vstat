# Privacy Policy for Vibe Stats - AI Dev Tools Monitor

**Effective Date:** September 28, 2025
**Last Updated:** September 28, 2025
**Extension Version:** 1.0.5

---

## Overview

Vibe Stats - AI Dev Tools Monitor ("the Extension") is a Chrome/Edge browser extension developed by Todd Dube that monitors the real-time operational status of AI developer tools (Claude AI and GitHub Copilot). This privacy policy explains our data practices in full compliance with Chrome Web Store requirements.

**🎯 Extension Purpose**: Monitor public status APIs and display service health through AI-themed vibe indicators.

---

## 🔒 Privacy Commitment

### Zero Personal Data Collection
**We do NOT collect, access, store, or transmit any personal information whatsoever.**

This includes but is not limited to:
- ❌ Names, email addresses, or contact information
- ❌ Browsing history or website data
- ❌ Search queries or form inputs
- ❌ User credentials or authentication tokens
- ❌ Location data or device identifiers
- ❌ Usage analytics or behavioral tracking
- ❌ Cookies or cross-site tracking
- ❌ Content from websites you visit
- ❌ Information from other extensions or browser features

---

## 📊 Data We DO Collect (Local Only)

### Service Status Information
The extension accesses publicly available status information from:
- **Claude AI Status API**: `https://status.anthropic.com/api/v2/`
- **GitHub Status API**: `https://www.githubstatus.com/api/v2/`

**Data Retrieved**:
- Service operational status (operational, minor, major, critical)
- Public incident reports and updates
- Component health status
- Timestamp of last successful check

### Local Storage Only
All data is stored locally on your device using Chrome's secure storage API:
- **Status Cache**: Recent API responses to reduce network requests
- **Settings**: User preferences for refresh intervals
- **Error Logs**: Technical error messages for troubleshooting
- **Timestamps**: When status checks were performed

**Storage Guarantee**: No data ever leaves your device or is transmitted to external servers.

---

## 🔐 Chrome Web Store Permission Justifications

### Required Permissions

#### 1. Storage Permission (`storage`)
**Purpose**: Cache service status data locally for performance and offline access.
**Data Stored**: API responses, timestamps, user settings, error logs.
**Privacy Guarantee**: All data remains on your device.

#### 2. Alarms Permission (`alarms`)
**Purpose**: Schedule automated status checks every 5 minutes.
**Data Usage**: Only triggers API calls to public status endpoints.
**Privacy Guarantee**: No user activity monitoring.

#### 3. Host Permissions
**Domains**: `status.anthropic.com`, `www.githubstatus.com`
**Purpose**: Read-only access to public status APIs.
**Data Transmitted**: No user data, cookies, or personal information.
**Privacy Guarantee**: Only accesses publicly available status information.

---

## 🛡️ Security & Data Protection

### Local Storage Security
- All data stored using Chrome's secure, sandboxed storage API
- No cloud storage, external databases, or third-party services
- Automatic data cleanup when extension is uninstalled
- No cross-extension or cross-site data access

### Network Security
- All API requests use HTTPS encryption
- Only connects to official, verified status service endpoints
- No authentication tokens or personal data transmitted
- Minimal request headers (standard User-Agent only)

### Browser Security
- Runs within Chrome's security sandbox
- No access to other browser tabs, extensions, or system resources
- No ability to modify websites or inject content
- No background processes outside of scheduled status checks

---

## 🚫 What We Don't Do

### No Analytics or Tracking
- No Google Analytics, tracking pixels, or telemetry
- No crash reporting or error tracking services
- No usage statistics or performance monitoring
- No advertising networks or social media integration

### No Data Sharing
- No data transmission to our servers or third parties
- No data sales, licensing, or commercial use
- No integration with marketing or advertising platforms
- No cross-platform data synchronization

### No Personal Information
- No registration, accounts, or login required
- No email collection or communication
- No demographic or behavioral profiling
- No identification or tracking across devices

---

## 👶 Children's Privacy

This extension does not target children under 13 and does not collect personal information from users of any age. The extension is designed for software developers monitoring professional development tools.

---

## 🌍 International Compliance

### GDPR Compliance (EU)
- No personal data processing occurs
- No consent required as no personal data is collected
- No data subject rights applicable (no personal data to access/delete)
- No data controller or processor relationship established

### CCPA Compliance (California)
- No personal information collected or sold
- No consumer rights applicable (no personal information processed)
- No third-party data sharing or commercial use

---

## 🔄 Data Retention

### Automatic Data Management
- **Status Data**: Refreshed every 5 minutes, older data automatically replaced
- **User Settings**: Persist until extension is uninstalled or manually reset
- **Error Logs**: Overwritten with each new occurrence (no persistent storage)
- **Complete Removal**: All data automatically deleted upon extension uninstallation

### No Long-term Storage
- No permanent data storage or backup systems
- No data archival or historical tracking
- No data recovery mechanisms needed (no personal data to recover)

---

## 📱 Chrome Web Store Compliance Checklist

### ✅ Privacy Requirements Met
- Clear, accurate, and up-to-date privacy policy ✅
- Publicly accessible privacy policy URL ✅
- No personal data collection clearly stated ✅
- Transparent permission usage documentation ✅
- No hidden functionality or undisclosed features ✅

### ✅ Security Requirements Met
- HTTPS-only network communications ✅
- Official API endpoints only ✅
- Sandboxed operation within Chrome security model ✅
- No external servers or third-party services ✅
- Minimal attack surface with limited permissions ✅

### ✅ Data Protection Requirements Met
- Local storage only using Chrome APIs ✅
- No cloud storage or external databases ✅
- Automatic data cleanup on uninstall ✅
- No cross-extension or cross-site data access ✅
- No authentication or user accounts required ✅

---

## 📞 Contact Information

### Extension Support
- **Developer**: Todd Dube
- **GitHub Repository**: https://github.com/todddube/vstat
- **Issue Tracker**: https://github.com/todddube/vstat/issues
- **Privacy Questions**: Open an issue on GitHub with "Privacy" label

### Official Links
- **Extension Homepage**: https://github.com/todddube/vstat
- **Source Code**: https://github.com/todddube/vstat (Open Source)
- **Documentation**: https://github.com/todddube/vstat/blob/main/README.md

---

## 📝 Policy Updates

### Change Notification
- Policy updates will be reflected in the "Last Updated" date above
- Major changes will be announced via GitHub repository releases
- Continued use of the extension constitutes acceptance of policy updates
- Users can review policy history via GitHub commit log

### Version Tracking
- This policy is versioned alongside extension releases
- Current policy version corresponds to Extension Version 1.0.5
- Historical policy versions available in GitHub repository history

---

## 🎯 Chrome Web Store Summary

**For Chrome Web Store Reviewers:**

1. **Zero Personal Data Collection**: Extension does not collect any personal user information
2. **Local Storage Only**: All data stored locally using Chrome APIs, never transmitted externally
3. **Minimal Permissions**: Only requests 3 essential permissions with clear justifications
4. **Official APIs Only**: Only accesses public status APIs from verified service providers
5. **Open Source**: Complete source code available for security review
6. **Security Focused**: HTTPS-only, sandboxed operation, no authentication required
7. **Single Purpose**: Focused solely on displaying AI developer tool status information
8. **Policy Compliant**: Meets all Chrome Web Store privacy and security requirements

**Permission Summary**:
- `storage`: Local caching only, no external transmission
- `alarms`: Background monitoring only, no user activity tracking
- `host_permissions`: Read-only access to 2 official status APIs only

**No Hidden Functionality**: Extension behavior is transparent, documented, and matches stated purpose.

---

**🛡️ This privacy policy demonstrates our commitment to user privacy and Chrome Web Store compliance.**

**📜 Last reviewed and verified for Chrome Web Store submission: September 28, 2025**

## Overview

Vibe Stats - AI Dev Tools Monitor is a Chrome/Edge browser extension that monitors the real-time operational status of AI developer tools (Claude AI and GitHub Copilot) and displays this information through cool AI-themed vibe indicators. This privacy policy explains what data we collect, how we use it, and how we protect your privacy.

## Quick Privacy Summary

**🔒 Zero Personal Data Collection**: We do not collect, store, or transmit any personal information.
**🏠 Local Storage Only**: All data is stored locally on your device.
**🔗 Official APIs Only**: We only access public status information from official service endpoints.
**🚫 No Tracking**: No analytics, advertising, or behavioral tracking whatsoever.

## Chrome Web Store Permission Justifications

### Storage Permission (`storage`)
**Justification**: Required to cache service status data locally for performance and offline access. The extension stores:
- API responses from official status services (Claude AI and GitHub Copilot)
- Timestamp of last successful update
- Cached incident information for quick display
- Extension settings and preferences

**Privacy Guarantee**: All data remains on your device. Nothing is transmitted to external servers or our infrastructure.

### Alarms Permission (`alarms`)
**Justification**: Essential for automated background monitoring every 5 minutes. The extension uses Chrome's alarms API to:
- Schedule periodic status checks without user intervention
- Ensure timely detection of service disruptions
- Update status indicators and badges automatically
- Maintain current information even when browser is idle

**Privacy Guarantee**: Only triggers status API calls - no user activity monitoring.

### Host Permissions (`status.anthropic.com`, `www.githubstatus.com`)
**Justification**: Required to fetch publicly available status information from official service status pages:
- **Claude AI Status**: `https://status.anthropic.com/api/v2/` endpoints
- **GitHub Status**: `https://www.githubstatus.com/api/v2/` endpoints

**Privacy Guarantee**: Read-only access to public APIs. No user data, cookies, or personal information transmitted.

## What Data We Collect and Store

### ✅ Data We DO Collect (Stored Locally Only)

#### Service Status Information
- **API Responses**: Public status data from Claude AI and GitHub Copilot status pages
- **Operational Status**: Current service health (operational, minor issues, major issues)
- **Incident Reports**: Public incident information and updates
- **Component Status**: Individual service component health status
- **Timestamps**: When status checks were performed and data was last updated

#### Extension Operation Data
- **Settings**: User preferences for refresh intervals and display options
- **Cache Data**: Recent status information to reduce API calls and improve performance
- **Error Information**: Technical error messages for troubleshooting (never transmitted)

### ❌ Data We NEVER Collect

We do **NOT** collect, access, store, or transmit:
- **Personal Information**: Names, emails, phone numbers, addresses
- **Browsing Data**: Websites visited, search history, bookmarks
- **Authentication Data**: Passwords, tokens, login credentials
- **Device Information**: Hardware specs, device IDs, location data
- **User Behavior**: Click patterns, usage analytics, interaction tracking
- **Content Data**: Information from websites, forms, or user inputs
- **Network Activity**: Other extension data, browser tabs, or browsing sessions

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

This extension fully complies with Chrome Web Store privacy and security requirements:

### ✅ Privacy Requirements Met
- **Minimal Permissions**: Only requests the three permissions essential for core functionality
- **No Personal Data Collection**: Extension does not collect any user personal information
- **Clear Privacy Policy**: Comprehensive documentation of all data practices
- **Transparent Operations**: Open source code available for security review
- **No Hidden Functionality**: All features clearly documented and visible to users

### ✅ Security Requirements Met
- **HTTPS Only**: All network requests use encrypted HTTPS connections
- **Official APIs Only**: Only connects to official, verified status service endpoints
- **No External Servers**: Extension does not connect to our servers or third-party services
- **Sandboxed Operation**: Runs within Chrome's security sandbox
- **Minimal Attack Surface**: Limited permissions and network access reduce security risks

### ✅ Data Protection Requirements Met
- **Local Storage Only**: All data stored using Chrome's secure local storage APIs
- **No Cloud Storage**: No external databases, servers, or cloud storage services
- **Automatic Data Cleanup**: All data automatically removed when extension is uninstalled
- **No Cross-Extension Access**: Cannot access data from other extensions or browser features
- **No Authentication Required**: Works without user accounts, logins, or registrations

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

## Chrome Web Store Review Summary

**🔑 Key Privacy Points for Store Review**:

1. **🚫 Zero Personal Data Collection**: Extension does not collect, access, or store any personal user information
2. **🏠 Local Storage Only**: All data stored locally using Chrome APIs, never transmitted to external servers
3. **🔒 Minimal Permissions**: Only requests 3 essential permissions (storage, alarms, host access)
4. **🌐 Official APIs Only**: Only accesses public status APIs from official service providers
5. **📖 Open Source Transparency**: Complete code available for security review and verification
6. **🛡️ Security Focused**: HTTPS-only, sandboxed operation, no authentication required
7. **🎯 Single Purpose**: Focused solely on displaying AI developer tool status information
8. **✅ Chrome Policy Compliant**: Meets all Chrome Web Store privacy and security requirements

**📋 Permission Audit**:
- `storage`: Local caching only, no external transmission
- `alarms`: Background monitoring only, no user activity tracking
- `host_permissions`: Read-only access to 2 official status APIs only

**🔍 No Hidden Functionality**: Extension behavior is transparent, documented, and matches its stated purpose.