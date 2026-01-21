# Vibe Stats - AI Dev Tools Status Monitor

Monitor **Claude AI**, **OpenAI**, **GitHub Copilot**, and **Google Gemini** service status in real-time with AI-themed vibe indicators.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-4285F4?style=flat&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/vibe-stats-ai-dev-tools-m/kedjfbglocmffhdopahgkbgokpfdmlng)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/)
[![Version](https://img.shields.io/badge/version-1.3.1-blue)](https://github.com/todddube/vstat/releases)

## Install

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/vibe-stats-ai-dev-tools-m/kedjfbglocmffhdopahgkbgokpfdmlng)**

Or load unpacked for development - see [Development](#development) section.

## Features

- **Real-time Monitoring** - Automatic status checks every 5 minutes
- **4 AI Services** - Monitors Claude AI, OpenAI (ChatGPT), GitHub Copilot, and Google Gemini
- **Status Indicators** - Visual vibe icons show service health at a glance
- **Incident Details** - Expandable sections show recent issues (14-day history)
- **Auto-refresh** - Updates every 30 seconds when popup is open
- **Keyboard Shortcuts** - Ctrl+R to refresh, accessible navigation
- **Professional UI** - Clean light theme with color-coded service cards

### Status Icons

| Status | Color | Meaning |
|--------|-------|---------|
| Operational | 🟢 Green | All systems go |
| Minor Issues | 🟡 Yellow | Some services affected |
| Major/Critical | 🔴 Red | Significant disruption |
| Unknown | ⚪ Gray | Cannot determine status |

## Screenshots

Click the extension icon to see detailed status for all 4 AI services:

- Overall status indicator with combined health
- Claude AI (claude.ai, API, Platform, Claude Code)
- OpenAI (ChatGPT, API, DALL-E, Codex)
- GitHub (Copilot, Actions, API, Codespaces)
- Google Gemini (AI Studio, Gemini API)
- Recent incidents with timestamps and expandable details

## Development

### Prerequisites

- Chrome/Edge 88+
- Node.js 14+ (for build tools)
- Git

### Quick Start

```bash
# Clone repository
git clone https://github.com/todddube/vstat.git
cd vstat

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the vstat folder
```

### Project Structure

```
vstat/
├── manifest.json      # Extension configuration
├── background.js      # Service worker for status monitoring
├── popup.html         # Popup interface
├── popup.js           # Popup controller
├── icons/             # AI-themed vibe icons (16-128px)
├── tests/             # Test suite
└── dev/               # Development tools
```

### Commands

```bash
npm run build          # Build production zip
npm run validate       # Validate extension files
npm test               # Run tests
npm run version:check  # Check version sync
```

See [BUILD.md](BUILD.md) for detailed build and release instructions.

## API Integration

The extension monitors these status APIs:

**Claude AI (Anthropic)**
- `https://status.claude.com/api/v2/status.json`
- `https://status.claude.com/api/v2/incidents.json`

**OpenAI**
- `https://status.openai.com/api/v2/status.json`
- `https://status.openai.com/api/v2/incidents.json`

**GitHub Copilot**
- `https://www.githubstatus.com/api/v2/status.json`
- `https://www.githubstatus.com/api/v2/incidents.json`

**Google Gemini (via Google Cloud)**
- `https://status.cloud.google.com/incidents.json`

## Privacy

This extension:
- Does **not** collect any personal data
- Does **not** track browsing activity
- Only fetches public status APIs
- Stores status data locally in Chrome storage

[Full Privacy Policy](https://todddube.github.io/vstat/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `npm test`
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file.

## Links

- [Chrome Web Store](https://chromewebstore.google.com/detail/vibe-stats-ai-dev-tools-m/kedjfbglocmffhdopahgkbgokpfdmlng)
- [GitHub Releases](https://github.com/todddube/vstat/releases)
- [Privacy Policy](https://todddube.github.io/vstat/)
- [Report Issues](https://github.com/todddube/vstat/issues)

---

Made with ❤️ for the AI developer community
