# Notion Problem Visualization 🧠📊

An interactive web application that connects to your Notion database and visualizes hierarchical problem structures as both interactive mind maps and impact-effort matrices for strategic decision making.

## Features

### Core Visualization
- 🔗 **Notion Integration**: Directly connects to your Notion database using the official API
- 🗺️ **Interactive Mind Map**: Visualize parent-child relationships with collapsible nodes and smooth navigation
- 📊 **Impact-Effort Matrix**: Strategic 2x2 matrix visualization for prioritizing problems based on impact and effort values
- 🎯 **Root Node Filtering**: Focus view on specific branches of your problem hierarchy

### User Experience
- 🎨 **Visual Status Indicators**: Color-coded nodes based on problem status (todo, in-progress, done, blocked)
- 🏷️ **Rich Node Information**: Display full problem descriptions, tags, and priority levels
- 🔍 **Zoom & Pan**: Navigate large visualizations with ease
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔄 **Real-time Updates**: Refresh to sync with latest Notion data
- 🔗 **Direct Links**: Click to open problems directly in Notion

### Multiple Views
- **Mind Map View**: Traditional hierarchical tree visualization
- **Matrix View**: Classic impact-effort analysis with basic positioning
- **Matrix New**: Enhanced impact-effort matrix with accurate value-based positioning and improved UX

## Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                 │
│             (localhost:5173)                │
│  ┌─────────────┬─────────────┬─────────────┐ │
│  │  Mind Map   │   Matrix    │ Matrix New  │ │
│  │    View     │    View     │    View     │ │
│  │             │             │             │ │
│  │ React Flow  │   Basic     │  Enhanced   │ │
│  │ + Custom    │   2x2       │  Impact/    │ │
│  │   Nodes     │   Grid      │  Effort     │ │
│  └─────────────┴─────────────┴─────────────┘ │
│                                             │
│  - React Router DOM + TypeScript            │
│  - Zustand + localStorage caching           │
│  - Root node filtering + status indicators  │
└────────────────┬────────────────────────────┘
                 │
                 │ HTTP/JSON
                 │
┌────────────────▼────────────────┐
│        Express Server           │
│       (localhost:3001)          │
│    - CORS Proxy + API Router    │
│    - Pagination Handler         │
│    - Impact/Effort Processing   │
└────────────────┬────────────────┘
                 │
                 │ HTTPS
                 │
┌────────────────▼────────────────┐
│          Notion API             │
│    - Database Query             │
│    - Property Extraction        │
│    - Relationship Mapping       │
└─────────────────────────────────┘
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

### Required Properties
- **Title/Name**: The problem title (required)
- **Parent Problem**: Relation to parent problem (relation property)
- **Child Problem(s)**: Relation to child problems (relation property)

### Optional Properties (for enhanced features)
- **Status**: Select/Status property with values (todo, in-progress, done, blocked)
- **Priority**: Select property with values (low, medium, high, critical)
- **Tags**: Multi-select for categorization
- **Description**: Rich text for problem details

### Matrix View Properties
- **Impact**: Number property (0-10 scale) or Select with values (low, medium, high, critical)
- **Effort**: Number property (0-10 scale)
- **Solution**: Relation to solution items (used as fallback for effort values)

### Matrix Visualization Notes
- Only problems with both Impact AND Effort values will appear in the matrix views
- The Matrix New view positions items accurately based on their actual numeric values
- Impact/Effort values of 5 or below are considered "low", above 5 are "high"
- Four quadrants: Do First (high impact, low effort), Do Next (high impact, high effort), Do Later (low impact, low effort), Avoid (low impact, high effort)

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

2. **Choose Your View**:
   - **Mind Map**: Hierarchical tree visualization with parent-child relationships
   - **Matrix**: Basic impact-effort analysis
   - **Matrix New**: Enhanced impact-effort matrix with accurate positioning

3. **Focus Your Data**:
   - Use the "Focus View" selector to choose a root node
   - This filters the visualization to show only that branch of your hierarchy
   - Available for both Mind Map and Matrix New views

4. **Navigate Visualizations**:
   - **Mind Map**: Use mouse to pan, scroll to zoom, click nodes to expand/collapse
   - **Matrix Views**: Click problems to open in Notion, see positioning based on impact/effort values
   - All views: Click problem titles to open directly in Notion

5. **Refresh Data**:
   - Click "Refresh Data" to sync with latest Notion changes
   - Data is cached locally for offline viewing

## Project Structure

```
/src
├── /api          # Notion API integration
│   ├── notion.ts         # Main API export
│   └── notionDirect.ts   # Direct API implementation with Impact/Effort support
├── /components   # React components
│   ├── CustomNode.tsx      # Mind map node component
│   ├── MindMap.tsx        # Main mind map visualization
│   ├── Matrix_new.tsx     # Enhanced impact-effort matrix
│   ├── NotionConnection.tsx # Connection UI
│   └── RootSelector.tsx   # Root node filtering component
├── /pages        # Page components
│   ├── MindMapPage.tsx    # Mind map view wrapper
│   └── MatrixPage.tsx     # Original matrix view
├── /store        # Zustand state management
│   └── notionStore.ts     # Application state with caching
├── /types        # TypeScript type definitions
│   ├── notion.ts          # Notion data structures
│   └── mindmap.ts         # Mind map specific types
├── /utils        # Layout algorithms and helpers
│   └── mindmapLayout.ts   # Enhanced layout engine with connection fixes
├── App.tsx       # Main application with routing
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

## Matrix Visualization Features

### Impact-Effort Analysis
The Matrix New view provides strategic decision-making capabilities:

- **Accurate Positioning**: Problems positioned exactly based on their impact (0-10) and effort (0-10) values
- **Quadrant Strategy**:
  - **Do First** (High Impact, Low Effort): Quick wins for maximum value
  - **Do Next** (High Impact, High Effort): Major projects requiring planning
  - **Do Later** (Low Impact, Low Effort): Fill-in tasks for extra time
  - **Avoid** (Low Impact, High Effort): Time wasters that drain resources
- **Smart Overlap Handling**: Spiral positioning algorithm prevents overlapping items
- **Status Color Coding**: Visual status indicators (todo/in-progress/done/blocked)
- **Root Filtering**: Focus on specific problem branches for targeted analysis

### Matrix Data Requirements
- Problems must have both Impact AND Effort values to appear in matrix views
- Impact can be numeric (0-10) or select values (low/medium/high/critical)
- Effort should be numeric (0-10)
- Solution relationships can provide fallback effort values

## Performance Considerations

- The app fetches all database pages on load (supports pagination)
- Large databases (1000+ items) may take a moment to load
- Data is cached locally for improved performance and offline access
- Only nodes connected to the selected root are displayed in visualizations
- React Flow efficiently handles rendering of large mind maps
- Matrix views handle hundreds of items with smooth positioning

## Technologies Used

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router DOM 7
- **Visualization**: React Flow 11 (Mind Map), Custom Canvas (Matrix)
- **State Management**: Zustand with localStorage caching
- **Styling**: Tailwind CSS 4 with responsive design
- **Backend**: Express 5 + CORS proxy server
- **API Integration**: Direct Notion API calls with pagination support

## License

MIT