# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NotionMindmap - A React + TypeScript application that visualizes Notion database hierarchies as interactive mind maps using React Flow. Uses an Express proxy server to handle Notion API calls.

## Common Commands

```bash
# IMPORTANT: Need to run BOTH servers
npm run server     # Terminal 1: Start Express backend server on port 3001 (REQUIRED)
npm run dev        # Terminal 2: Start Vite dev server on port 5173
npm run build      # TypeScript check + Vite production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Visualization**: React Flow 11 for mind map rendering
- **State Management**: Zustand for global state
- **Styling**: Tailwind CSS 4
- **Backend**: Express 5 server with CORS (REQUIRED for API proxy)
- **API Integration**: Direct Notion API calls via proxy

### Core Structure
- **Backend Server** (`server.js`): Express proxy for Notion API (handles CORS and pagination)
- **API Layer** (`src/api/notionDirect.ts`): Makes requests to backend proxy
- **State Store** (`src/store/notionStore.ts`): Zustand store managing app state
- **Layout Engine** (`src/utils/mindmapLayout.ts`): Layout algorithms (hierarchical, horizontal, vertical, radial)
- **Components**:
  - `MindMap.tsx`: Main visualization container with React Flow
  - `CustomNode.tsx`: Node component with status colors and Notion links
  - `NotionConnection.tsx`: UI for API credentials and data refresh

### Testing
- Use playwright extension MCP when trying to perform testing via UI
- NEVER use mock data, always use real Notion data from the API call
- If API call failed, fix the API call instead of using any mock data, no exceptions

### Data Flow
1. User provides Notion API key via UI or `.env`
2. Frontend sends request to Express proxy server (port 3001)
3. Server makes authenticated calls to Notion API with pagination
4. Server returns complete dataset to frontend
5. Data transforms into hierarchical tree structure based on Parent Problem/Child Problem(s) relations
6. Layout algorithm positions nodes
7. React Flow renders interactive mind map

### Environment Variables
- `VITE_NOTION_API_KEY`: Notion integration token
- `VITE_NOTION_DATABASE_ID`: Target database ID (hardcoded: 268c2345-ab46-80e0-876d-ddbd9ebb5383)

### Required Notion Database Properties
- **Title** or **Name**: Primary identifier
- **Parent Problem**: Relation to parent item
- **Child Problem(s)**: Relation to child items
- **Status**: Select/Status field (open/in-progress/done/blocked)
- **Priority**: Select field (low/medium/high/critical)
- **Tags**: Multi-select
- **Description**: Rich text

### Important Implementation Details
- **Root Node ID**: Hardcoded as `269c2345-ab46-819c-9b6c-e2eda20aba4c` in `notionDirect.ts`
- **Database ID**: Hardcoded as `268c2345-ab46-80e0-876d-ddbd9ebb5383` in `notionDirect.ts`
- **Pagination**: Server fetches ALL pages (handles 1000+ items)
- **CORS**: Proxy server required - Notion API doesn't support browser CORS
- **Port Configuration**: Frontend on 5173, Backend on 3001
- **Property Mapping**: Uses exact field names from Notion (case-sensitive)