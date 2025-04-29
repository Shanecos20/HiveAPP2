require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); // add mongoose require
// const axios = require('axios'); // Remove axios dependency for this test
const https = require('https'); // Use Node's built-in HTTPS module
const cors = require('cors');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Read API key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
console.log('Reading API key from .env file');

// Basic security check: Ensure API key is provided
if (!OPENROUTER_API_KEY) {
    console.error('FATAL ERROR: OPENROUTER_API_KEY is not defined in the .env file.');
    process.exit(1); // Exit if API key is missing
}

// Log key info for debugging (don't log the entire key in production!)
console.log('API KEY PREFIX:', OPENROUTER_API_KEY.substring(0, 15) + '...');
console.log('API KEY LENGTH:', OPENROUTER_API_KEY.length);

// Try to log the first API key character code points to check for invisible characters
console.log('First 5 char codes of API key:', 
  [...OPENROUTER_API_KEY.substring(0, 5)].map(c => c.charCodeAt(0))
);

// Middleware
app.use(cors()); // Allow requests from your React Native app (configure more strictly for production)
app.use(express.json()); // Parse JSON request bodies

// Debug: Log API key presence (not the actual key)
console.log(`API key loaded: ${OPENROUTER_API_KEY ? 'YES' : 'NO'}`);
console.log(`API key length: ${OPENROUTER_API_KEY ? OPENROUTER_API_KEY.length : 0}`);

// Connect to MongoDB with improved options
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Ensure all indexes are created after connection
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Error listing collections:', err);
      return;
    }
    
    console.log('MongoDB collections:', collections.map(c => c.name).join(', '));
    
    // Explicitly create indexes on Hive model
    const Hive = require('./models/Hive');
    Hive.createIndexes()
      .then(() => console.log('Hive indexes created successfully'))
      .catch(err => console.error('Error creating Hive indexes:', err));
  });
})
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Health Check Endpoint
app.get('/', (req, res) => {
    res.send('HiveApp Proxy Server is running!');
});

// OpenRouter Chat Endpoint using Node's https module
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body; // Expecting the prompt in the request body

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        console.log('Received request for OpenRouter AI (using https module)...');
        console.log('Using API key starting with:', OPENROUTER_API_KEY.substring(0, 15) + '...');
        
        const postData = JSON.stringify({
            model: 'deepseek/deepseek-chat-v3-0324:free',
            messages: [
                { role: 'user', content: prompt }
            ],
            max_tokens: 1500,
            temperature: 0.7,
        });

        const options = {
            hostname: 'openrouter.ai',
            port: 443,
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`, // Trim just in case
                'HTTP-Referer': 'https://hiveapp.example.com', 
                'X-Title': 'HiveApp AI',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData) // Required for https module
            }
        };

        console.log('Sending request with headers:', JSON.stringify({
             Authorization: `Bearer ${OPENROUTER_API_KEY.substring(0, 10)}...`,
             'HTTP-Referer': options.headers['HTTP-Referer'],
             'X-Title': options.headers['X-Title'],
             'Content-Type': options.headers['Content-Type'],
             'Content-Length': options.headers['Content-Length']
         }, null, 2));

        const apiReq = https.request(options, (apiRes) => {
            let responseBody = '';
            console.log(`OpenRouter Response Status Code: ${apiRes.statusCode}`);

            apiRes.on('data', (chunk) => {
                responseBody += chunk;
            });

            apiRes.on('end', () => {
                console.log('Received full response from OpenRouter.');
                try {
                    if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
                        const responseData = JSON.parse(responseBody);
                        if (responseData && responseData.choices && responseData.choices.length > 0) {
                            res.json(responseData.choices[0].message);
                        } else {
                            console.error('Unexpected response format from OpenRouter:', responseData);
                            res.status(500).json({ error: 'Unexpected response format from OpenRouter' });
                        }
                    } else {
                         console.error(`OpenRouter Error (${apiRes.statusCode}):`, responseBody);
                         res.status(apiRes.statusCode).json({
                            error: 'Failed to get response from OpenRouter',
                            details: JSON.parse(responseBody || '{}') // Try to parse error details
                        });
                    }
                } catch (parseError) {
                    console.error('Error parsing OpenRouter response:', parseError);
                    console.error('Raw OpenRouter response body:', responseBody);
                    res.status(500).json({ error: 'Failed to parse response from OpenRouter', rawResponse: responseBody });
                }
            });
        });

        apiReq.on('error', (error) => {
            console.error('Error making request to OpenRouter API:', error);
            res.status(500).json({
                error: 'Failed to connect to OpenRouter API',
                details: error.message
            });
        });

        // Write data to request body
        apiReq.write(postData);
        apiReq.end();

    } catch (error) {
        // Catch any synchronous errors setting up the request
        console.error('Synchronous error setting up OpenRouter request:', error);
        res.status(500).json({
            error: 'Internal server error before sending request',
            details: error.message
        });
    }
});

// Mount database API routes
const userRoutes = require('./routes/users');
const hiveRoutes = require('./routes/hives');
const settingsRoutes = require('./routes/settings');
const devicesRoutes = require('./routes/devices');

app.use('/api/users', userRoutes);
app.use('/api/hives', hiveRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/devices', devicesRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`HiveApp Proxy Server listening on port ${PORT}`);
    console.log('Make sure OPENROUTER_API_KEY is set in your .env file.');
}); 