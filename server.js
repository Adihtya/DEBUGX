/**
 * ==============================================================================
 * DEBUGX — SECURE HTTP DEVELOPMENT & GEMINI API SERVER
 * Serves static workspace assets and proxies Gemini AI requests securely
 * so API keys are NEVER exposed to browser clients or frontend JavaScript.
 * ==============================================================================
 */

try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional
}

const http = require('http');
const fs = require('fs');
const path = require('path');
const geminiBackend = require('./lib/geminiBackend');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    ...CORS_HEADERS
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req, maxSize = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > maxSize) {
        reject(new Error('Request payload exceeds maximum size limit (10MB).'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON request body: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const [urlPath] = req.url.split('?');

  // ============================================================================
  // SECURE SERVER-SIDE GEMINI API ROUTES
  // ============================================================================
  if (urlPath.startsWith('/api/gemini/')) {
    try {
      // 1. Health Ping
      if (urlPath === '/api/gemini/health' && req.method === 'GET') {
        const health = await geminiBackend.checkHealth();
        return sendJson(res, 200, health);
      }

      // 2. Full Multi-Stage Debugging Pipeline
      if (urlPath === '/api/gemini/analyze' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = await geminiBackend.analyzeDebuggingPipeline(body);
        return sendJson(res, 200, result);
      }

      // 3. Explain My Code
      if (urlPath === '/api/gemini/explain' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = await geminiBackend.explainCode(body);
        return sendJson(res, 200, result);
      }

      // 4. Conversational Debugging Follow-up Chat
      if (urlPath === '/api/gemini/chat' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = await geminiBackend.chatFollowUp(body);
        return sendJson(res, 200, result);
      }

      // 5. Solution Review
      if (urlPath === '/api/gemini/review' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = await geminiBackend.engineReviewSolution(
          body.originalCode || '',
          body.correctedCode || '',
          body.language || 'Python',
          body.rootCause || ''
        );
        return sendJson(res, 200, result);
      }

      return sendJson(res, 404, { error: `Route not found: ${urlPath}` });
    } catch (apiErr) {
      console.error(`[Server API Error] ${urlPath}:`, apiErr);
      const isZod = apiErr.name === 'ZodError';
      return sendJson(res, 500, {
        error: isZod ? 'Schema validation failed on AI output.' : apiErr.message,
        details: isZod ? apiErr.errors : undefined,
        status: 'error'
      });
    }
  }

  // ============================================================================
  // STATIC ASSET SERVING
  // ============================================================================
  let cleanUrl = urlPath;
  if (cleanUrl === '/') cleanUrl = '/index.html';

  let filePath = path.join(PUBLIC_DIR, cleanUrl);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found — DebugX');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  DEBUGX — AI Developer Debugging Studio`);
    console.log(`  Find the Bug. Understand the Cause. Fix with Confidence.`);
    console.log(`======================================================`);
    console.log(`  Local URL:   http://localhost:${PORT}`);
    console.log(`  Gemini API:  http://localhost:${PORT}/api/gemini/health`);
    console.log(`  Model:       ${geminiBackend.GEMINI_CONFIG.model}`);
    console.log(`  SDK:         ${geminiBackend.GEMINI_CONFIG.apiKey ? 'Official @google/genai (Configured)' : 'API Key Missing (Local Fallback Active)'}`);
    console.log(`======================================================\n`);
  });
}

module.exports = { server };
