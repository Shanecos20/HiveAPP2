// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const https = require('https');
const cors = require('cors');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Read API key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('FATAL ERROR: OPENROUTER_API_KEY is not defined in .env');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/', (req, res) => {
  res.send('HiveApp Proxy Server is running!');
});

// OpenRouter Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const postData = JSON.stringify({
    model: 'deepseek/deepseek-chat-v3-0324:free',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.7,
  });

  const options = {
    hostname: 'openrouter.ai',
    port: 443,
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`,
      'HTTP-Referer': 'https://hiveapp.example.com',
      'X-Title': 'HiveApp AI',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const apiReq = https.request(options, apiRes => {
    let responseBody = '';
    apiRes.on('data', chunk => responseBody += chunk);
    apiRes.on('end', () => {
      try {
        const data = JSON.parse(responseBody);
        if (apiRes.statusCode >= 200 && apiRes.statusCode < 300 && data.choices?.length) {
          return res.json(data.choices[0].message);
        }
        return res.status(apiRes.statusCode).json({ error: data });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse OpenRouter response', raw: responseBody });
      }
    });
  });

  apiReq.on('error', err => {
    res.status(500).json({ error: 'Failed to connect to OpenRouter', details: err.message });
  });

  apiReq.write(postData);
  apiReq.end();
});

// Mount routes
const userRoutes    = require('./routes/users');
const hiveRoutes    = require('./routes/hives');
const settingsRoutes= require('./routes/settings');
const devicesRoutes = require('./routes/devices');

app.use('/api/users',    userRoutes);
app.use('/api/hives',    hiveRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/devices',  devicesRoutes);

// Connect to MongoDB and sync Hive indexes
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Drop any old global-unique index on `id` and build the new per-user index
    const Hive = require('./models/Hive');
    await Hive.syncIndexes();
    console.log('✅ Hive indexes synced');

    // Start server after indexes are in place
    app.listen(PORT, () => {
      console.log(`🚀 HiveApp Proxy Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB', err);
    process.exit(1);
  });
