// Refined Claude Status Monitor icon generator
// Creates sophisticated icons inspired by Anthropic's design language but distinctly custom

const fs = require('fs');
const path = require('path');

/**
 * Create a sophisticated SVG icon with Anthropic-inspired design elements
 * Features: Geometric patterns, modern gradients, and clean lines
 */
const createRefinedIcon = (size, color, colorName) => {
  // Color palette inspired by modern design systems
  const colors = {
    green: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    yellow: {
      primary: '#F59E0B',
      secondary: '#D97706',
      accent: '#FDE047',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    },
    red: {
      primary: '#EF4444',
      secondary: '#DC2626',
      accent: '#FCA5A5',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
    },
    gray: {
      primary: '#6B7280',
      secondary: '#4B5563',
      accent: '#9CA3AF',
      gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
    }
  };

  const currentColor = colors[colorName] || colors.gray;
  const strokeWidth = Math.max(1.5, size / 12);
  const center = size / 2;

  const svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="grad-${colorName}-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${currentColor.primary};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${currentColor.secondary};stop-opacity:1" />
      </linearGradient>
      <linearGradient id="accent-${colorName}-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${currentColor.accent};stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:${currentColor.primary};stop-opacity:0.1" />
      </linearGradient>
      <filter id="glow-${colorName}-${size}">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Background circle with subtle gradient -->
    <circle cx="${center}" cy="${center}" r="${center - strokeWidth}" 
            fill="url(#accent-${colorName}-${size})" 
            stroke="none" opacity="0.1"/>
    
    <!-- Main geometric pattern inspired by Anthropic's aesthetic -->
    <!-- Abstract "A" shape that also suggests connection/monitoring -->
    <g transform="translate(${center}, ${center})">
      <!-- Central diamond/rhombus -->
      <path d="M 0 -${size * 0.25} L ${size * 0.18} 0 L 0 ${size * 0.25} L -${size * 0.18} 0 Z" 
            fill="url(#grad-${colorName}-${size})" 
            stroke="${currentColor.primary}" 
            stroke-width="${strokeWidth * 0.5}"
            filter="url(#glow-${colorName}-${size})"/>
      
      <!-- Angular connective elements -->
      <path d="M -${size * 0.18} 0 L -${size * 0.32} -${size * 0.15}" 
            stroke="url(#grad-${colorName}-${size})" 
            stroke-width="${strokeWidth}" 
            stroke-linecap="round" 
            fill="none"/>
      <path d="M -${size * 0.18} 0 L -${size * 0.32} ${size * 0.15}" 
            stroke="url(#grad-${colorName}-${size})" 
            stroke-width="${strokeWidth}" 
            stroke-linecap="round" 
            fill="none"/>
      
      <!-- Status indicator dot -->
      <circle cx="${size * 0.22}" cy="-${size * 0.22}" r="${strokeWidth * 1.2}" 
              fill="${currentColor.accent}" 
              stroke="${currentColor.primary}" 
              stroke-width="${strokeWidth * 0.3}"/>
    </g>
    
    <!-- Outer accent ring for visual polish -->
    <circle cx="${center}" cy="${center}" r="${center - strokeWidth * 0.5}" 
            fill="none" 
            stroke="${currentColor.primary}" 
            stroke-width="${strokeWidth * 0.3}" 
            opacity="0.4"/>
  </svg>`;

  return svgContent;
};

/**
 * Generate PNG-compatible SVG (simplified for better PNG conversion)
 */
const createPNGOptimizedIcon = (size, color, colorName) => {
  const colors = {
    green: '#10B981',
    yellow: '#F59E0B', 
    red: '#EF4444',
    gray: '#6B7280'
  };

  const currentColor = colors[colorName] || colors.gray;
  const strokeWidth = Math.max(2, size / 10);
  const center = size / 2;

  const svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <!-- Clean, PNG-friendly version -->
    <g transform="translate(${center}, ${center})">
      <!-- Main shape - abstract "A" representing Anthropic + monitoring -->
      <path d="M 0 -${size * 0.28} L ${size * 0.2} -${size * 0.05} L ${size * 0.2} ${size * 0.28} L ${size * 0.1} ${size * 0.28} L ${size * 0.1} ${size * 0.05} L -${size * 0.1} ${size * 0.05} L -${size * 0.1} ${size * 0.28} L -${size * 0.2} ${size * 0.28} L -${size * 0.2} -${size * 0.05} Z" 
            fill="${currentColor}" 
            stroke="none"/>
      
      <!-- Horizontal bar for "A" -->
      <rect x="-${size * 0.15}" y="-${size * 0.05}" 
            width="${size * 0.3}" height="${strokeWidth}" 
            fill="${currentColor}" opacity="0.9"/>
      
      <!-- Status indicator -->
      <circle cx="${size * 0.25}" cy="-${size * 0.25}" r="${strokeWidth * 1.5}" 
              fill="${currentColor}" opacity="0.8"/>
    </g>
  </svg>`;

  return svgContent;
};

console.log('Creating refined Claude Status Monitor icons...');

// Create icons directory if it doesn't exist
if (!fs.existsSync('icons')) {
  fs.mkdirSync('icons');
}

const sizes = [16, 32, 48, 128];
const colorSchemes = ['green', 'yellow', 'red', 'gray'];

// Generate refined SVG icons
sizes.forEach(size => {
  colorSchemes.forEach(colorName => {
    // Create refined SVG version
    const refinedSvg = createRefinedIcon(size, null, colorName);
    fs.writeFileSync(path.join('icons', `claude-${colorName}-${size}.svg`), refinedSvg);
    
    // Create PNG-optimized version  
    const pngSvg = createPNGOptimizedIcon(size, null, colorName);
    fs.writeFileSync(path.join('icons', `claude-${colorName}-${size}-png.svg`), pngSvg);
  });
  
  // Create base version (green)
  const baseSvg = createRefinedIcon(size, null, 'green');
  fs.writeFileSync(path.join('icons', `claude-${size}.svg`), baseSvg);
});

console.log('✅ Refined SVG icons created!');
console.log('📁 Files generated:');
console.log('   - Refined versions: claude-{color}-{size}.svg');
console.log('   - PNG-optimized: claude-{color}-{size}-png.svg');
console.log('   - Base versions: claude-{size}.svg');
console.log('');
console.log('🔄 Next: Convert SVG to PNG using online tool or ImageMagick:');
console.log('   magick claude-green-16-png.svg claude-green-16.png');