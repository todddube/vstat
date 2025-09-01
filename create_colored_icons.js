// Enhanced colored icons generator using the refined Anthropic-inspired design
const fs = require('fs');
const path = require('path');

/**
 * Create a browser-optimized PNG-ready SVG
 * Uses the refined design from create_icons.js
 */
const createBrowserIcon = (size, colorName) => {
  const colors = {
    green: '#10B981',    // Operational - modern emerald
    yellow: '#F59E0B',   // Minor issues - vibrant amber  
    red: '#EF4444',      // Major issues - clear red
    gray: '#6B7280'      // Unknown/maintenance - neutral gray
  };

  const currentColor = colors[colorName] || colors.gray;
  const strokeWidth = Math.max(2, size / 10);
  const center = size / 2;

  // Simplified design optimized for browser extension icons
  const svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <defs>
      <style>
        .main-shape { fill: ${currentColor}; }
        .accent { fill: ${currentColor}; opacity: 0.8; }
        .indicator { fill: ${currentColor}; opacity: 0.9; }
      </style>
    </defs>
    
    <!-- Background circle for better visibility -->
    <circle cx="${center}" cy="${center}" r="${center - 1}" 
            fill="white" stroke="none" opacity="0.1"/>
    
    <g transform="translate(${center}, ${center})">
      <!-- Main geometric "A" shape inspired by Anthropic -->
      <path class="main-shape" d="M 0 -${size * 0.32} L ${size * 0.22} -${size * 0.08} L ${size * 0.22} ${size * 0.32} L ${size * 0.11} ${size * 0.32} L ${size * 0.11} ${size * 0.08} L -${size * 0.11} ${size * 0.08} L -${size * 0.11} ${size * 0.32} L -${size * 0.22} ${size * 0.32} L -${size * 0.22} -${size * 0.08} Z"/>
      
      <!-- Cross-bar for "A" -->
      <rect class="accent" x="-${size * 0.16}" y="-${size * 0.06}" 
            width="${size * 0.32}" height="${Math.max(2, strokeWidth * 0.8)}" rx="1"/>
      
      <!-- Status indicator dot -->
      <circle class="indicator" cx="${size * 0.28}" cy="-${size * 0.28}" r="${Math.max(1.5, strokeWidth * 0.8)}"/>
      
      <!-- Subtle connection lines for "monitoring" concept -->
      <path class="accent" d="M -${size * 0.22} -${size * 0.04} L -${size * 0.35} -${size * 0.18}" 
            stroke="${currentColor}" stroke-width="${Math.max(1, strokeWidth * 0.4)}" 
            stroke-linecap="round" fill="none" opacity="0.6"/>
      <path class="accent" d="M -${size * 0.22} ${size * 0.04} L -${size * 0.35} ${size * 0.18}" 
            stroke="${currentColor}" stroke-width="${Math.max(1, strokeWidth * 0.4)}" 
            stroke-linecap="round" fill="none" opacity="0.6"/>
    </g>
  </svg>`;

  return svgContent;
};

console.log('🎨 Creating refined colored icons for Claude Status Monitor...');

// Ensure icons directory exists
if (!fs.existsSync('icons')) {
  fs.mkdirSync('icons');
}

const sizes = [16, 32, 48, 128];
const colorSchemes = ['green', 'yellow', 'red', 'gray'];

// Generate all colored variations
sizes.forEach(size => {
  colorSchemes.forEach(colorName => {
    const svgContent = createBrowserIcon(size, colorName);
    fs.writeFileSync(path.join('icons', `claude-${colorName}-${size}.svg`), svgContent);
  });
  
  // Create base version (defaults to green for operational state)
  const baseSvg = createBrowserIcon(size, 'green');
  fs.writeFileSync(path.join('icons', `claude-${size}.svg`), baseSvg);
});

console.log('✅ Enhanced colored icons created!');
console.log('📁 Generated files:');
console.log('   🟢 Green (operational): claude-green-{16,32,48,128}.svg');
console.log('   🟡 Yellow (minor issues): claude-yellow-{16,32,48,128}.svg');  
console.log('   🔴 Red (major issues): claude-red-{16,32,48,128}.svg');
console.log('   ⚪ Gray (unknown): claude-gray-{16,32,48,128}.svg');
console.log('   📄 Base versions: claude-{16,32,48,128}.svg');
console.log('');
console.log('🎯 Features:');
console.log('   • Abstract "A" shape inspired by Anthropic design language');
console.log('   • Status indicator dot for monitoring visualization');
console.log('   • Connection lines suggesting network/API monitoring');
console.log('   • Optimized for browser extension icon display');
console.log('   • Clean, modern color scheme');
console.log('');
console.log('🔄 PNG Conversion (optional):');
console.log('   Online: Upload SVG files to convertio.co or similar');
console.log('   CLI: Use ImageMagick or similar tool to convert SVG to PNG');