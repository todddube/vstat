const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

function createAIVibeIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const center = size / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Create radial gradient background
    const bgGradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    bgGradient.addColorStop(0, '#4f46e5');
    bgGradient.addColorStop(0.5, '#7c3aed');
    bgGradient.addColorStop(1, '#db2777');
    
    // Draw background circle
    ctx.beginPath();
    ctx.arc(center, center, center - 1, 0, 2 * Math.PI);
    ctx.fillStyle = bgGradient;
    ctx.fill();
    
    // Add outer ring
    ctx.beginPath();
    ctx.arc(center, center, center - 1, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = Math.max(0.5, size * 0.02);
    ctx.stroke();
    
    // Neural network nodes
    const nodeSize = Math.max(1, size * 0.06);
    const spread = size * 0.2;
    
    const nodes = [
        { x: center - spread, y: center - spread * 0.5 },
        { x: center + spread, y: center - spread * 0.5 },
        { x: center, y: center + spread * 0.8 },
        { x: center - spread * 0.6, y: center + spread * 0.2 },
        { x: center + spread * 0.6, y: center + spread * 0.2 }
    ];
    
    // Draw connections
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = Math.max(0.5, size * 0.02);
    ctx.lineCap = 'round';
    
    const connections = [
        [0, 1], [0, 3], [1, 4], [2, 3], [2, 4], [3, 4]
    ];
    
    connections.forEach(([from, to]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[from].x, nodes[from].y);
        ctx.lineTo(nodes[to].x, nodes[to].y);
        ctx.stroke();
    });
    
    // Draw nodes
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fill();
        
        if (nodeSize > 1) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
        }
    });
    
    // Code brackets for larger icons
    if (size >= 24) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = Math.max(1, size * 0.03);
        ctx.lineCap = 'round';
        
        const bracketSize = size * 0.1;
        const bracketOffset = size * 0.32;
        
        // Left bracket
        ctx.beginPath();
        ctx.moveTo(center - bracketOffset, center - bracketSize);
        ctx.lineTo(center - bracketOffset - bracketSize * 0.4, center);
        ctx.lineTo(center - bracketOffset, center + bracketSize);
        ctx.stroke();
        
        // Right bracket
        ctx.beginPath();
        ctx.moveTo(center + bracketOffset, center - bracketSize);
        ctx.lineTo(center + bracketOffset + bracketSize * 0.4, center);
        ctx.lineTo(center + bracketOffset, center + bracketSize);
        ctx.stroke();
    }
    
    // Lightning bolt for larger icons
    if (size >= 32) {
        const lightningScale = size * 0.06;
        const lightningX = center + size * 0.12;
        const lightningY = center - size * 0.2;
        
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = Math.max(0.5, size * 0.01);
        
        ctx.beginPath();
        ctx.moveTo(lightningX, lightningY);
        ctx.lineTo(lightningX - lightningScale, lightningY + lightningScale * 1.5);
        ctx.lineTo(lightningX + lightningScale * 0.3, lightningY + lightningScale * 1.2);
        ctx.lineTo(lightningX - lightningScale * 0.5, lightningY + lightningScale * 2.2);
        ctx.lineTo(lightningX + lightningScale * 0.7, lightningY + lightningScale * 0.9);
        ctx.lineTo(lightningX - lightningScale * 0.2, lightningY + lightningScale * 1.1);
        ctx.closePath();
        ctx.fill();
        if (size >= 48) ctx.stroke();
    }
    
    return canvas;
}

// Check if canvas package is available
try {
    require.resolve('canvas');
    console.log('Canvas package found. Generating icons...');
    
    const sizes = [16, 32, 48, 128];
    const iconsDir = path.join(__dirname, 'icons');
    
    // Create icons directory if it doesn't exist
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir);
    }
    
    sizes.forEach(size => {
        const canvas = createAIVibeIcon(size);
        const buffer = canvas.toBuffer('image/png');
        const filename = path.join(iconsDir, `ai-vibe-${size}.png`);
        fs.writeFileSync(filename, buffer);
        console.log(`Generated: ${filename}`);
    });
    
    console.log('All AI vibe icons generated successfully!');
    
} catch (error) {
    console.log('Canvas package not available. Using HTML generator instead.');
    console.log('Please use the generate-ai-icons.html file in your browser to create the icons.');
    console.log('Then manually save them to the icons/ folder with these names:');
    console.log('- ai-vibe-16.png');
    console.log('- ai-vibe-32.png'); 
    console.log('- ai-vibe-48.png');
    console.log('- ai-vibe-128.png');
}