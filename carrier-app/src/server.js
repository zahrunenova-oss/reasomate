import express from 'express';
import cors from 'cors';
import http from 'http';
import { db, initDb } from './db.js';
import { initWebSocket, broadcast } from './ws.js';
import { generateId, now, findOrCreateThread, updateThreadActivity, getUserThreads } from './utils.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize WebSocket
initWebSocket(server);

// Health check endpoint
app.get('/ping', (req, res) => {
  res.json({ ok: true, now: now() });
});

// Register a new user
app.post('/register', async (req, res) => {
  try {
    const { handle, sigil } = req.body;
    
    if (!handle || typeof handle !== 'string' || handle.trim().length === 0) {
      return res.status(400).json({ error: 'Handle is required' });
    }
    
    // Check if handle already exists
    const existingUser = db.data.users.find(u => u.handle === handle.trim());
    if (existingUser) {
      return res.status(409).json({ error: 'Handle already exists' });
    }
    
    const user = {
      id: generateId(),
      handle: handle.trim(),
      sigil: sigil || null,
      created_at: now()
    };
    
    db.data.users.push(user);
    await db.write();
    
    // Broadcast user registration
    broadcast({
      type: 'user.registered',
      data: user
    });
    
    res.json(user);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
app.get('/users', (req, res) => {
  res.json(db.data.users);
});

// Post a new pulse
app.post('/pulse', async (req, res) => {
  try {
    const { user_id, body, tag } = req.body;
    
    if (!user_id || !body) {
      return res.status(400).json({ error: 'user_id and body are required' });
    }
    
    // Verify user exists
    const user = db.data.users.find(u => u.id === user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const pulse = {
      id: generateId(),
      user_id,
      body: body.trim(),
      tag: tag || null,
      created_at: now()
    };
    
    db.data.pulses.push(pulse);
    await db.write();
    
    // Broadcast new pulse
    broadcast({
      type: 'pulse.new',
      data: pulse
    });
    
    res.json({ ok: true, pulse });
  } catch (error) {
    console.error('Pulse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest pulses
app.get('/pulses', (req, res) => {
  const pulses = db.data.pulses
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 50);
  res.json(pulses);
});

// Get threads for a user
app.get('/threads/:user_id', (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Verify user exists
    const user = db.data.users.find(u => u.id === user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const threads = getUserThreads(db.data.threads, user_id);
    res.json(threads);
  } catch (error) {
    console.error('Threads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or get thread between two users
app.post('/thread', async (req, res) => {
  try {
    const { a_id, b_id } = req.body;
    
    if (!a_id || !b_id) {
      return res.status(400).json({ error: 'a_id and b_id are required' });
    }
    
    if (a_id === b_id) {
      return res.status(400).json({ error: 'Cannot create thread with same user' });
    }
    
    // Verify both users exist
    const userA = db.data.users.find(u => u.id === a_id);
    const userB = db.data.users.find(u => u.id === b_id);
    
    if (!userA || !userB) {
      return res.status(404).json({ error: 'One or both users not found' });
    }
    
    const thread = findOrCreateThread(db.data.threads, a_id, b_id);
    await db.write();
    
    // Broadcast new thread if it was created
    if (db.data.threads.find(t => t.id === thread.id)) {
      broadcast({
        type: 'thread.new',
        data: thread
      });
    }
    
    res.json(thread);
  } catch (error) {
    console.error('Thread error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a thread
app.get('/messages/:thread_id', (req, res) => {
  try {
    const { thread_id } = req.params;
    
    // Verify thread exists
    const thread = db.data.threads.find(t => t.id === thread_id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    const messages = db.data.messages
      .filter(m => m.thread_id === thread_id)
      .sort((a, b) => a.created_at - b.created_at);
    
    res.json(messages);
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
app.post('/message', async (req, res) => {
  try {
    const { thread_id, from_id, to_id, body } = req.body;
    
    if (!thread_id || !from_id || !to_id || !body) {
      return res.status(400).json({ error: 'thread_id, from_id, to_id, and body are required' });
    }
    
    // Verify thread exists
    const thread = db.data.threads.find(t => t.id === thread_id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Verify users exist and are part of the thread
    const fromUser = db.data.users.find(u => u.id === from_id);
    const toUser = db.data.users.find(u => u.id === to_id);
    
    if (!fromUser || !toUser) {
      return res.status(404).json({ error: 'One or both users not found' });
    }
    
    // Verify users are part of this thread
    const isValidThread = (thread.a_id === from_id && thread.b_id === to_id) ||
                         (thread.a_id === to_id && thread.b_id === from_id);
    
    if (!isValidThread) {
      return res.status(403).json({ error: 'Users not part of this thread' });
    }
    
    const message = {
      id: generateId(),
      thread_id,
      from_id,
      to_id,
      body: body.trim(),
      created_at: now()
    };
    
    db.data.messages.push(message);
    updateThreadActivity(db.data.threads, thread_id);
    await db.write();
    
    // Broadcast new message
    broadcast({
      type: 'message.new',
      data: message
    });
    
    res.json({ ok: true, message });
  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    await initDb();
    initWebSocket(server);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Petra Node listening on 0.0.0.0:${PORT}`);
      console.log(`📡 WebSocket available at ws://0.0.0.0:${PORT}/ws`);
      console.log(`🏥 Health check: http://0.0.0.0:${PORT}/ping`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();