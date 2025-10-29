const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from dist folder in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Proxy endpoint for Notion API calls
app.post('/api/notion/query', async (req, res) => {
  try {
    const { apiKey, databaseId, startCursor } = req.body;

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          page_size: 100,
          start_cursor: startCursor
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying to Notion:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch from Notion API'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// SPA fallback - serve index.html for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(3001, () => {
  console.log(`Server running on port 3001`);
});