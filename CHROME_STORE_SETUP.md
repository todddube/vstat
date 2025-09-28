# Chrome Web Store Privacy Policy Setup Guide

## 🚨 Fixing "Privacy policy link is broken or unavailable" Error

Your Chrome Web Store submission was rejected because it needs a **publicly accessible privacy policy URL**. Here's how to fix it:

---

## ✅ Quick Fix Steps

### Step 1: Enable GitHub Pages
1. Go to your repository: https://github.com/todddube/vstat
2. Click **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under "Source", select **"Deploy from a branch"**
5. Choose **main** branch and **/ (root)** folder
6. Click **Save**
7. Wait 2-3 minutes for deployment

### Step 2: Verify Privacy Policy URL
Your privacy policy will be available at:
```
https://todddube.github.io/vstat/PRIVACY.html
```

Test this URL in your browser to make sure it loads.

### Step 3: Update Chrome Web Store Listing
1. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Edit your extension listing
3. In the **Privacy Policy** field, enter:
   ```
   https://todddube.github.io/vstat/PRIVACY.html
   ```
4. Save and resubmit for review

---

## 🔧 Alternative Options

### Option B: Use GitHub Raw URL (Immediate)
If GitHub Pages isn't working immediately, you can use:
```
https://raw.githubusercontent.com/todddube/vstat/main/PRIVACY.html
```

### Option C: Host on Your Own Domain
If you have a website, upload `PRIVACY.html` to:
```
https://yourdomain.com/vstat-privacy.html
```

---

## 📋 Chrome Web Store Submission Checklist

### ✅ Required Information

**Privacy Policy URL:**
```
https://todddube.github.io/vstat/PRIVACY.html
```

**Extension Description:**
```
Monitor Claude AI and GitHub Copilot status with real-time updates and cool AI-themed vibe indicators. Keep your dev tools vibe in check! 🤖⚡🔥

Features:
• Real-time status monitoring for Claude AI and GitHub Copilot
• Cool AI-themed vibe indicators with modern gradient design
• Detailed incident information and service updates
• Smart notification system with badge indicators
• Lightweight and fast - updates every 5 minutes
• Privacy-focused - zero personal data collection

Perfect for developers who rely on AI development tools.
```

**Category:** Developer Tools

**Permissions Justification:**
- **Storage**: Cache status data locally for performance
- **Alarms**: Schedule automated background status checks
- **Host Access**: Read-only access to official status APIs

---

## 🛡️ Privacy Policy Highlights

Your `PRIVACY.html` file includes:

### ✅ Chrome Web Store Requirements Met
- Clear statement of zero personal data collection
- Detailed permission justifications
- Local storage only (no external transmission)
- Contact information and support links
- GDPR and CCPA compliance statements
- Children's privacy protection
- Data retention and deletion policies

### 🔒 Key Privacy Points
1. **Zero Personal Data Collection**: No personal information collected
2. **Local Storage Only**: All data stays on user's device
3. **Minimal Permissions**: Only 3 essential permissions requested
4. **Official APIs Only**: Only accesses public status endpoints
5. **Open Source**: Code available for security review

---

## 🚀 Resubmission Steps

1. **Verify Privacy Policy URL**: https://todddube.github.io/vstat/PRIVACY.html
2. **Update Chrome Web Store listing** with the privacy policy URL
3. **Resubmit for review**
4. **Response time**: Typically 1-3 business days

---

## 📞 Support

If you encounter any issues:
- **GitHub Issues**: https://github.com/todddube/vstat/issues
- **Chrome Web Store Help**: https://support.google.com/chrome_webstore/

The privacy policy is comprehensive and should resolve the Chrome Web Store rejection. The key was providing a publicly accessible URL rather than just a local file.