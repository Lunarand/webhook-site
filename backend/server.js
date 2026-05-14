import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.json());

const db = new sqlite3(path.join(__dirname, 'webhooks.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    status TEXT DEFAULT 'connected',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    success INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    pending INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  INSERT OR IGNORE INTO stats (id, success, failed, pending) VALUES (1, 0, 0, 0);
`);

let deliveryStats = { success: 0, failed: 0, pending: 0 };
let chartData = [];
let autoLoopInterval = null;
let isAutoRunning = false;
let currentMessage = '';
let rateLimitPaused = false;
let retryTimeout = null;

const broadcastToFrontend = () => {
  io.emit('stats-update', deliveryStats);
  io.emit('chart-update', chartData);
};

const addChartPoint = (count) => {
  const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  chartData.push({ time: now, msgs: count });
  if (chartData.length > 20) chartData.shift();
};

const sendToDiscord = async (webhookUrl, content) => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    if (error.message === 'RATE_LIMIT') {
      throw error;
    }
    throw new Error(error.message || 'Failed to send');
  }
};

const broadcastMessage = async (message) => {
  const activeWebhooks = db.prepare('SELECT * FROM webhooks WHERE active = 1').all();
  if (activeWebhooks.length === 0) return;
  
  deliveryStats.pending += activeWebhooks.length;
  broadcastToFrontend();
  
  let successCount = 0;
  let failCount = 0;
  
  for (const hook of activeWebhooks) {
    if (rateLimitPaused) {
      deliveryStats.pending--;
      failCount++;
      continue;
    }
    
    try {
      await sendToDiscord(hook.url, message);
      successCount++;
    } catch (error) {
      if (error.message === 'RATE_LIMIT') {
        handleRateLimit();
        deliveryStats.pending--;
        failCount++;
      } else {
        deliveryStats.pending--;
        failCount++;
      }
    }
  }
  
  deliveryStats.pending = Math.max(0, deliveryStats.pending - successCount - failCount);
  deliveryStats.success += successCount;
  deliveryStats.failed += failCount;
  
  db.prepare('UPDATE stats SET success = ?, failed = ?, pending = ? WHERE id = 1')
    .run(deliveryStats.success, deliveryStats.failed, deliveryStats.pending);
  
  addChartPoint(successCount);
  broadcastToFrontend();
};

const handleRateLimit = () => {
  if (rateLimitPaused) return;
  
  rateLimitPaused = true;
  deliveryStats.failed++;
  broadcastToFrontend();
  
  console.log('Rate limited by Discord, pausing for 5 seconds...');
  
  if (retryTimeout) clearTimeout(retryTimeout);
  retryTimeout = setTimeout(() => {
    rateLimitPaused = false;
    console.log('Rate limit cleared, resuming...');
    broadcastToFrontend();
  }, 5000);
};

const startAutoLoop = () => {
  if (isAutoRunning) return;
  
  isAutoRunning = true;
  io.emit('auto-status', { running: true });
  
  const sendLoop = async () => {
    if (!isAutoRunning || !currentMessage || rateLimitPaused) {
      return;
    }
    
    await broadcastMessage(currentMessage);
  };
  
  const speed = db.prepare('SELECT value FROM settings WHERE key = "autoSpeed"').get()?.value || 2;
  const intervalMs = Math.max(100, 1000 / speed);
  
  autoLoopInterval = setInterval(sendLoop, intervalMs);
};

const stopAutoLoop = () => {
  isAutoRunning = false;
  if (autoLoopInterval) {
    clearInterval(autoLoopInterval);
    autoLoopInterval = null;
  }
  io.emit('auto-status', { running: false });
};

app.get('/api/webhooks', (req, res) => {
  const webhooks = db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all();
  res.json(webhooks);
});

app.post('/api/webhooks', (req, res) => {
  const { name, url } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }
  
  const id = crypto.randomUUID();
  const status = 'connected';
  
  db.prepare('INSERT INTO webhooks (id, name, url, active, status) VALUES (?, ?, ?, 1, ?)')
    .run(id, name, url, status);
  
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id);
  io.emit('webhooks-update', db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all());
  res.json(webhook);
});

app.delete('/api/webhooks/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
  io.emit('webhooks-update', db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all());
  res.json({ success: true });
});

app.patch('/api/webhooks/:id/toggle', (req, res) => {
  const { id } = req.params;
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id);
  
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  
  const newActive = webhook.active ? 0 : 1;
  db.prepare('UPDATE webhooks SET active = ? WHERE id = ?').run(newActive, id);
  
  const updated = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id);
  io.emit('webhooks-update', db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all());
  res.json(updated);
});

app.post('/api/send', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  currentMessage = message;
  await broadcastMessage(message);
  res.json({ success: true, stats: deliveryStats });
});

app.post('/api/auto/start', (req, res) => {
  const { message, speed } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required for auto mode' });
  }
  
  currentMessage = message;
  
  if (speed) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES ("autoSpeed", ?)').run(speed);
    if (isAutoRunning && autoLoopInterval) {
      clearInterval(autoLoopInterval);
      const intervalMs = Math.max(100, 1000 / speed);
      autoLoopInterval = setInterval(async () => {
        if (isAutoRunning && currentMessage && !rateLimitPaused) {
          await broadcastMessage(currentMessage);
        }
      }, intervalMs);
    }
  }
  
  startAutoLoop();
  res.json({ success: true, running: true });
});

app.post('/api/auto/stop', (req, res) => {
  stopAutoLoop();
  res.json({ success: true, running: false });
});

app.get('/api/stats', (req, res) => {
  const stats = db.prepare('SELECT success, failed, pending FROM stats WHERE id = 1').get();
  deliveryStats = stats || { success: 0, failed: 0, pending: 0 };
  res.json({ stats: deliveryStats, chart: chartData });
});

app.post('/api/stats/reset', (req, res) => {
  deliveryStats = { success: 0, failed: 0, pending: 0 };
  chartData = [];
  db.prepare('UPDATE stats SET success = 0, failed = 0, pending = 0 WHERE id = 1').run();
  broadcastToFrontend();
  res.json({ success: true });
});

io.on('connection', (socket) => {
  socket.emit('stats-update', deliveryStats);
  socket.emit('chart-update', chartData);
  socket.emit('webhooks-update', db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all());
  socket.emit('auto-status', { running: isAutoRunning });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});