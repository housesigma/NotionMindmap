# Setup Guide for NotionMindmap

This guide will help you set up the NotionMindmap application from scratch.

## Quick Start (5 minutes)

### 1. Prerequisites Check
Ensure you have:
- [ ] Node.js v16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] A Notion account
- [ ] A Notion database with hierarchical data

### 2. Clone & Install
```bash
# Clone the repository
git clone <repository-url>
cd NotionMindmap

# Install dependencies
npm install
```

### 3. Notion Integration Setup

#### Step 1: Create Integration
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Configure:
   - Name: "Mindmap Viewer" (or any name)
   - Associated workspace: Select your workspace
   - Capabilities: Read content (minimum required)
4. Click "Submit"
5. **Copy the Internal Integration Token** (starts with `secret_`)

#### Step 2: Share Database with Integration
1. Open your Notion database
2. Click "..." menu → "Add connections"
3. Search for your integration name
4. Click to add it
5. The integration now has access to this database

#### Step 3: Get Database ID
1. Open your database in Notion
2. Look at the URL: `https://www.notion.so/workspace/268c2345ab4680e0876dddbd9ebb5383?v=...`
3. Copy the 32-character ID: `268c2345ab4680e0876dddbd9ebb5383`

### 4. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Add your credentials:
```env
VITE_NOTION_API_KEY=secret_YOUR_INTEGRATION_TOKEN_HERE
VITE_NOTION_DATABASE_ID=YOUR_DATABASE_ID_HERE
```

### 5. Start the Application

**You need TWO terminal windows:**

**Terminal 1 - Backend Server:**
```bash
npm run server
# Should see: Server running on port 3001
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Should see: VITE v7.x.x ready...
# ➜  Local:   http://localhost:4001/
```

### 6. Open in Browser
Navigate to http://localhost:4001

You should see:
- "Connected to Notion" indicator
- Your mindmap visualization
- Total problems count

## Database Requirements

Your Notion database MUST have these properties:

### Required Fields
| Property Name | Type | Description |
|--------------|------|-------------|
| **Title** or **Name** | Title | The main text of the problem |
| **Parent Problem** | Relation | Links to parent item |
| **Child Problem(s)** | Relation | Links to child items |

### Optional Fields
| Property Name | Type | Values |
|--------------|------|--------|
| **Status** | Select/Status | open, in-progress, done, blocked |
| **Priority** | Select | low, medium, high, critical |
| **Description** | Text | Problem details |
| **Tags** | Multi-select | Any values |

### Setting Up Relations
1. Create "Parent Problem" property:
   - Type: Relation
   - Related to: Same database (self-relation)
   - Name: "Parent Problem"

2. Create "Child Problem(s)" property:
   - This is usually auto-created as the inverse of Parent Problem
   - If not, create it as a relation to the same database

## Verification Checklist

### ✅ Backend Server
```bash
# Test server health
curl http://localhost:3001/api/health
# Should return: {"status":"ok","message":"Server is running"}
```

### ✅ Frontend
- Opens without errors
- Shows "Connected to Notion" status
- No red error messages

### ✅ Data Loading
Check browser console (F12):
- Should see: "Fetched X total pages from Notion"
- Should see: "Found root node: [your root problem]"
- Should see: "Built hierarchy with X nodes from root"

## Common Setup Issues

### Issue: CORS Error
**Symptom**: "has been blocked by CORS policy"
**Solution**: Ensure backend server is running on port 3001

### Issue: Connection Failed
**Symptom**: "Failed to connect to Notion"
**Solutions**:
1. Verify API key starts with `secret_`
2. Check integration is shared with database
3. Ensure both frontend and backend are running

### Issue: No Data Displayed
**Symptom**: Mindmap is empty
**Solutions**:
1. Check database has "Parent Problem" and "Child Problem(s)" fields
2. Ensure at least one item has no parent (root node)
3. Verify property names match exactly (case-sensitive)

### Issue: Port Already in Use
**Symptom**: "Error: listen EADDRINUSE :::3001"
**Solutions**:
```bash
# Find process using port
lsof -i :3001
# Kill the process
kill -9 [PID]
# Or use different port in server.js
```

## Advanced Configuration

### Custom Root Node
Edit `src/api/notionDirect.ts`:
```typescript
const ROOT_NODE_ID = 'your-root-node-id-here';
```

### Custom Database ID
Edit `src/api/notionDirect.ts`:
```typescript
private databaseId: string = 'your-database-id-here';
```

### Change Server Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Change 3001
```
And update `src/api/notionDirect.ts`:
```typescript
'http://localhost:3001/api/notion/query' // Update port
```

## Testing Your Setup

### Manual Test
1. Click "Refresh Data" button
2. Should see loading indicator
3. Mindmap should update with latest data

### Check Logs
**Backend logs** (Terminal 1):
- Should show incoming requests
- No error messages

**Frontend console** (Browser F12):
- Check for successful API calls
- Verify node count matches expectations

## Production Deployment

For production deployment:

1. **Environment Variables**: Set on your hosting platform
2. **Build**: Run `npm run build`
3. **Deploy**: Upload `dist/` folder and `server.js`
4. **Start**: Run server with process manager (PM2, forever, etc.)

## Need Help?

1. Check browser console for errors (F12)
2. Check terminal for server errors
3. Verify all prerequisites are met
4. Ensure database structure matches requirements
5. Try with a simple test database first

## Success Indicators

You know setup is complete when:
- ✅ Both servers are running without errors
- ✅ "Connected to Notion" appears in the UI
- ✅ Mindmap displays your data
- ✅ Nodes are interactive (hover/click work)
- ✅ Refresh button updates the data
- ✅ Statistics show correct problem count