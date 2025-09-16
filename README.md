# Notion Mind Map Visualization 🧠

An interactive web application that connects to your Notion database and visualizes hierarchical problem structures as an interactive mind map.

## Features

- 🔗 **Notion Integration**: Directly connects to your Notion database using the official API
- 🗺️ **Interactive Mind Map**: Visualize parent-child relationships in multiple layouts (horizontal, vertical, radial)
- 🎨 **Visual Status Indicators**: Color-coded nodes based on problem status (todo, in-progress, done, blocked)
- 🏷️ **Rich Node Information**: Display descriptions, tags, and priority levels
- 🔍 **Zoom & Pan**: Navigate large mind maps with ease
- 🔄 **Real-time Updates**: Refresh to sync with latest Notion data
- 🔗 **Direct Links**: Click to open problems directly in Notion

## Architecture

```
┌─────────────────────────┐
│   React Frontend        │
│   (localhost:5173)      │
│   - React Flow          │
│   - Zustand             │
│   - TypeScript          │
└───────────┬─────────────┘
            │
            │ HTTP/JSON
            │
┌───────────▼─────────────┐
│   Express Server        │
│   (localhost:3001)      │
│   - CORS Proxy          │
│   - API Router          │
└───────────┬─────────────┘
            │
            │ HTTPS
            │
┌───────────▼─────────────┐
│   Notion API            │
│   - Database Query      │
│   - Pagination Support  │
└─────────────────────────┘
```

## Prerequisites

- Node.js 16+ and npm
- A Notion account with a database containing your problem hierarchy
- Notion API integration token

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd NotionMindmap
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Notion credentials to `.env`:
```
VITE_NOTION_API_KEY=your_notion_integration_token
VITE_NOTION_DATABASE_ID=your_database_id
```

## Setting Up Notion Integration

1. **Create a Notion Integration**:
   - Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Give it a name (e.g., "Mind Map Viewer")
   - Select the workspace
   - Copy the "Internal Integration Token"

2. **Share Your Database**:
   - Open your problem database in Notion
   - Click "Share" in the top right
   - Invite your integration by name
   - Ensure it has read access

3. **Get Database ID**:
   - Open your database in Notion
   - Copy the URL
   - Extract the 32-character string between the last `/` and `?`
   - Example: `notion.so/workspace/[DATABASE_ID]?v=...`

## Database Structure

Your Notion database should have these properties:

- **Title/Name**: The problem title (required)
- **Parent Problem**: Relation to parent problem (relation property)
- **Child Problem(s)**: Relation to child problems (relation property)
- **Status**: Select/Status property with values (todo, in-progress, done, blocked)
- **Priority**: Select property with values (low, medium, high, critical)
- **Tags**: Multi-select for categorization
- **Description**: Rich text for problem details

## Running the Application

### Development Mode

**You need to run both the frontend and backend servers:**

**Terminal 1 - Start the backend server:**
```bash
npm run server
```

**Terminal 2 - Start the frontend:**
```bash
npm run dev
```

The application will open at [http://localhost:5173](http://localhost:5173)

### Production Build
```bash
npm run build
npm run preview
```

## Usage

1. **Connect to Notion**:
   - The app will auto-connect if credentials are in `.env`
   - Or enter your API key and database ID manually
   - Click "Connect to Notion"

2. **Navigate the Mind Map**:
   - Use mouse to pan around
   - Scroll to zoom in/out
   - Click nodes to see details
   - Click links to open in Notion

3. **Change Layout**:
   - Select from Horizontal, Vertical, or Radial layouts
   - Each layout optimizes for different tree structures

4. **Refresh Data**:
   - Click "Refresh Data" to sync with latest Notion changes

## Project Structure

```
/src
├── /api          # Notion API integration
│   ├── notion.ts         # Main API export
│   └── notionDirect.ts   # Direct API implementation
├── /components   # React components
│   ├── CustomNode.tsx      # Mind map node component
│   ├── MindMap.tsx        # Main visualization component
│   └── NotionConnection.tsx # Connection UI
├── /store        # Zustand state management
│   └── notionStore.ts     # Application state
├── /types        # TypeScript type definitions
├── /utils        # Layout algorithms and helpers
├── App.tsx       # Main application component
└── main.tsx      # Application entry point
server.js         # Express proxy server
```

## Key Implementation Details

### Server Proxy (Required)
The application uses an Express server as a proxy to handle Notion API calls. This is necessary because:
- Notion API doesn't support CORS for browser requests
- Keeps your API key secure on the server side
- Handles pagination for large databases

### Data Flow
1. Frontend requests data through the proxy server
2. Server makes authenticated calls to Notion API
3. Server handles pagination (fetches all pages)
4. Frontend receives complete dataset
5. Data is processed into hierarchical structure
6. React Flow renders the mindmap

## Customization

### Node Colors
Edit `CustomNode.tsx` to customize status colors:
```typescript
const statusColors = {
  'todo': 'bg-gray-100',
  'in-progress': 'bg-blue-100',
  'done': 'bg-green-100',
  'blocked': 'bg-red-100',
};
```

### Layout Spacing
Adjust in `mindmapLayout.ts`:
```typescript
nodeSpacing: { x: 250, y: 100 }
```

### Root Node Configuration
The root node ID is configured in `notionDirect.ts`:
```typescript
const ROOT_NODE_ID = '269c2345-ab46-819c-9b6c-e2eda20aba4c';
```

## Troubleshooting

### Common Issues

1. **"Failed to connect to Notion"**
   - Verify your API key is correct
   - Ensure the integration is shared with your database
   - Check that both servers are running (frontend and backend)

2. **"No data showing"**
   - Ensure the backend server is running on port 3001
   - Check browser console for CORS errors
   - Verify database properties match expected names

3. **"No root node found"**
   - Ensure you have at least one problem with no parent
   - Check the ROOT_NODE_ID configuration
   - Verify Parent Problem relations are set correctly

4. **Port conflicts**
   - Frontend runs on port 5173
   - Backend runs on port 3001
   - Change ports in `vite.config.ts` and `server.js` if needed

## Performance Considerations

- The app fetches all database pages on load (supports pagination)
- Large databases (1000+ items) may take a moment to load
- Only nodes connected to the root are displayed in the mindmap
- React Flow efficiently handles rendering of large graphs

## Technologies Used

- **Frontend**: React 19 + TypeScript + Vite
- **Visualization**: React Flow 11
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4
- **Backend**: Express 5 + CORS
- **API Integration**: Direct Notion API calls

## License

MIT