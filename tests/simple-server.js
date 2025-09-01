#!/usr/bin/env node

/**
 * Simple HTTP server for serving test files
 * Useful for testing web components that need to run over HTTP
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const TEST_DIR = __dirname;

// MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'text/plain';
}

function serveFile(req, res, filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
}

const server = http.createServer((req, res) => {
  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  let filePath = req.url === '/' ? '/test-viewer.html' : req.url;
  filePath = path.join(TEST_DIR, filePath);
  
  console.log(`Serving: ${filePath}`);
  
  // Security check - ensure we're only serving files within TEST_DIR
  if (!filePath.startsWith(TEST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  serveFile(req, res, filePath);
});

server.listen(PORT, () => {
  console.log(`🌐 Test server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${TEST_DIR}`);
  console.log(`🎯 Open http://localhost:${PORT} to view the test interface`);
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});