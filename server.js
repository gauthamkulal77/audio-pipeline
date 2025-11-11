// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const { createClient } = require('redis');

// --- 1. Initialize Server and Redis Client ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const redisClient = createClient({
  url: process.env.REDIS_URL
});

const PORT = process.env.PORT || 8081; // Make sure this matches your .env file
const STREAM_KEY = 'audio_stream';

// --- 2. Middleware to parse JSON bodies ---
// This is needed for Step 5
app.use(express.json());

// --- 3. Express Server to Serve the Client Page ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 4. Endpoint for reading data (STEP 2) ---
app.get('/data', async (req, res) => {
    try {
        // Get the 10 most recent entries from the stream
        const data = await redisClient.xRevRange(STREAM_KEY, '+', '-', {
            COUNT: 10
        });

        const formattedData = data.map(entry => {
            return {
                id: entry.id,
                chunkPreview: entry.message.audioChunk.substring(0, 50) + '...'
            };
        });
        res.json(formattedData);
    } catch (err) {
        console.error('❌ Failed to read from Redis Stream:', err);
        res.status(500).send('Error fetching data');
    }
});

// --- 5. Endpoint for deleting data (STEP 5) ---
app.post('/delete', async (req, res) => {
    const { ids } = req.body; // Get IDs from the request body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No entry IDs provided.' });
    }

    try {
        // Delete the specific entries from the stream
        const deleteCount = await redisClient.xDel(STREAM_KEY, ids);
        console.log(`🧹 Deleted ${deleteCount} entries from stream.`);
        res.json({ message: `Successfully deleted ${deleteCount} entries.` });
    } catch (err) {
        console.error('❌ Failed to delete from Redis Stream:', err);
        res.status(500).json({ error: 'Failed to delete entries.' });
    }
});


// --- 6. WebSocket Connection Handling (For audio ingestion) ---
wss.on('connection', (ws) => {
  console.log('✅ Client connected via WebSocket');

  ws.on('message', async (message) => {
    try {
      // Safety net: auto-trim the stream just in case
      const entryId = await redisClient.xAdd(
        STREAM_KEY,
        '*', 
        { 'audioChunk': message.toString() },
        { 
          TRIM: {
            strategy: 'MAXLEN',
            strategyModifier: '~',
            threshold: 500 
          }
        }
      );
      console.log(`🔊 Audio chunk added to stream ${STREAM_KEY} with ID: ${entryId}`);
    } catch (err) {
      console.error('❌ Failed to add to Redis Stream:', err);
    }
  });

  ws.on('close', () => {
    console.log('🔴 Client disconnected');
  });
});


// --- 7. Start Everything ---
const startServer = async () => {
  try {
    console.log('Connecting to Redis...');
    await redisClient.connect(); 
    console.log('✅ Connected to Redis successfully!');

    server.listen(PORT, () => {
      console.log(`🚀 Server is running and listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Could not start the server:', err);
    process.exit(1);
  }
};

startServer();