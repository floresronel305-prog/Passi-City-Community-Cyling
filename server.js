const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'chat-db.json');

const defaultData = {
  users: [
    {
      id: 'admin',
      name: 'Admin',
      email: 'admin@passicycling.com',
      role: 'admin',
      member: 'active',
      plan: 'Club',
      phone: '',
      addr: '',
      bio: 'Community cycling admin',
      avatar: '',
      share: true
    }
  ],
  messages: []
};

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
  }
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (error) {
    return { ...defaultData, messages: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.get('/api/users', (req, res) => {
  res.json(readDb().users);
});

app.post('/api/users', (req, res) => {
  const db = readDb();
  const incoming = req.body || {};
  const email = String(incoming.email || '').trim().toLowerCase();
  const name = String(incoming.name || '').trim();

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required.' });
  }

  let user = db.users.find((item) => item.email === email);
  if (!user) {
    user = {
      id: incoming.id || `u_${crypto.randomUUID()}`,
      name,
      email,
      role: 'user',
      member: 'none',
      plan: 'Basic',
      phone: '',
      addr: '',
      bio: '',
      avatar: '',
      share: true
    };
    db.users.push(user);
  } else {
    user.name = name || user.name;
    if (incoming.role) user.role = incoming.role;
    if (incoming.member) user.member = incoming.member;
    if (incoming.plan) user.plan = incoming.plan;
    if (incoming.avatar) user.avatar = incoming.avatar;
  }

  writeDb(db);
  res.status(201).json(user);
});

app.get('/api/chat/messages', (req, res) => {
  const { userId, peerId, scope } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  const db = readDb();
  let messages = db.messages.filter((message) => {
    if (scope === 'all') {
      return message.to === 'all';
    }

    if (!peerId) {
      return message.to === 'all' || message.from === userId || message.to === userId;
    }

    return (
      (message.from === userId && message.to === peerId) ||
      (message.from === peerId && message.to === userId)
    );
  });

  messages.sort((a, b) => a.t - b.t);
  res.json(messages);
});

app.post('/api/chat/message', (req, res) => {
  const db = readDb();
  const { from, to, text } = req.body || {};

  if (!from || !text || !String(text).trim()) {
    return res.status(400).json({ error: 'Message requires a sender and text.' });
  }

  const message = {
    id: crypto.randomUUID(),
    from,
    to: to || 'all',
    text: String(text).trim(),
    t: Date.now()
  };

  db.messages.push(message);
  writeDb(db);
  res.status(201).json(message);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Passi City Community Cycling server running on http://localhost:${PORT}`);
});
