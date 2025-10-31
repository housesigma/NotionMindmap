const express = require('express');
const cors = require('cors');
const path = require('path');
const { version } = require('./package.json');
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from dist folder in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Create API router with all endpoints
const apiRouter = express.Router();

// Proxy endpoint for Notion API calls
apiRouter.post('/notion/query', async (req, res) => {
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

// Endpoint to fetch specific pages by their IDs
apiRouter.post('/notion/pages', async (req, res) => {
  try {
    const { apiKey, pageIds } = req.body;

    if (!Array.isArray(pageIds) || pageIds.length === 0) {
      return res.status(400).json({ error: 'pageIds must be a non-empty array' });
    }

    // Fetch all pages in parallel
    const pagePromises = pageIds.map(pageId =>
      fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        }
      }).then(response => {
        if (!response.ok) {
          console.warn(`Failed to fetch page ${pageId}: ${response.statusText}`);
          return null;
        }
        return response.json();
      })
    );

    const pages = await Promise.all(pagePromises);

    // Filter out any null results (failed fetches)
    const validPages = pages.filter(page => page !== null);

    res.json({ pages: validPages });
  } catch (error) {
    console.error('Error fetching pages from Notion:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch pages from Notion API'
    });
  }
});

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    version: version,
    timestamp: new Date().toISOString()
  });
});

// Mount API router on both original and prefixed paths
app.use('/api', apiRouter);
app.use('/DongLiu/notion-mindmap-v2/api', apiRouter);

// SPA fallback - serve index.html for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get(/^\/(?!api\/|DongLiu\/notion-mindmap-v2\/api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 NotionMindmap Server v${version} running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});