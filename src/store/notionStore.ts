import { create } from 'zustand';
import type { ProblemTree, NotionProblemPage, ProblemNode } from '../types/notion';
import notionAPI from '../api/notion';

// Helper functions for localStorage
const getCacheKey = (database: 'problems' | 'objectives') => `notion-mindmap-data-${database}`;

const saveToCache = (data: {
  rawPages: NotionProblemPage[];
  currentRootId: string | null;
  timestamp: number;
}, database: 'problems' | 'objectives') => {
  try {
    // Optimize data before storing - keep only essential fields
    const optimizedPages = data.rawPages.map(page => ({
      id: page.id,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      url: page.url,
      properties: page.properties
    }));

    const optimizedData = {
      rawPages: optimizedPages,
      currentRootId: data.currentRootId,
      timestamp: data.timestamp
    };

    const jsonString = JSON.stringify(optimizedData);
    const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);

    // Skip caching if data is too large (> 4MB to be safe)
    if (sizeInMB > 4) {
      console.warn(`Data too large to cache (${sizeInMB.toFixed(2)}MB). Skipping cache.`);
      return;
    }

    localStorage.setItem(getCacheKey(database), jsonString);
    console.log(`Cached ${optimizedPages.length} pages (${sizeInMB.toFixed(2)}MB) for ${database} database`);
  } catch (error) {
    console.warn('Failed to save data to cache:', error);
    // If quota exceeded, try to clear old cache and retry once
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        // Clear old cache data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('notion-mindmap-data-')) {
            localStorage.removeItem(key);
          }
        });
        console.log('Cleared old cache due to quota limit');
      } catch (clearError) {
        console.warn('Failed to clear cache:', clearError);
      }
    }
  }
};

const loadFromCache = (database: 'problems' | 'objectives'): {
  rawPages: NotionProblemPage[];
  currentRootId: string | null;
  timestamp: number;
} | null => {
  try {
    const cached = localStorage.getItem(getCacheKey(database));
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Failed to load data from cache:', error);
  }
  return null;
};

interface NotionStore {
  isLoading: boolean;
  error: string | null;
  problemTree: ProblemTree | null;
  rawPages: NotionProblemPage[];
  isConnected: boolean;
  allNodes: Map<string, ProblemNode>;
  allRawNodes: Map<string, ProblemNode>; // All nodes including solutions
  availableRootNodes: ProblemNode[];
  currentRootId: string | null;
  selectedNodeId: string | null;
  currentDatabase: 'problems' | 'objectives';

  connectToNotion: (apiKey: string, databaseId: string) => Promise<void>;
  switchDatabase: (database: 'problems' | 'objectives') => Promise<void>;
  fetchProblems: () => Promise<void>;
  loadCachedData: () => void;
  changeRootNode: (rootId: string) => void;
  resetRootNode: () => void;
  setSelectedNode: (nodeId: string | null) => void;
  disconnect: () => void;
  clearError: () => void;
}

export const useNotionStore = create<NotionStore>((set, get) => ({
  isLoading: false,
  error: null,
  problemTree: null,
  rawPages: [],
  isConnected: false,
  allNodes: new Map(),
  allRawNodes: new Map(),
  availableRootNodes: [],
  currentRootId: null,
  selectedNodeId: null,
  currentDatabase: 'problems' as 'problems' | 'objectives',

  connectToNotion: async (apiKey: string, databaseId: string) => {
    set({ isLoading: true, error: null });

    try {
      notionAPI.initialize(apiKey);
      set({ isConnected: true });

      // Load cached data instead of automatically fetching
      get().loadCachedData();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to connect to Notion',
        isConnected: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  switchDatabase: async (database: 'problems' | 'objectives') => {
    const state = get();
    if (!state.isConnected) {
      set({ error: 'Not connected to Notion. Please connect first.' });
      return;
    }

    set({ isLoading: true, error: null, currentDatabase: database });

    try {
      // Switch the API to use the new database
      notionAPI.setCurrentDatabase(database);

      // Fetch data from the new database
      const pages = await notionAPI.fetchAllProblems();
      const nodes = notionAPI.convertToNodes(pages);
      const tree = notionAPI.buildTree(nodes);
      const availableRootNodes = notionAPI.getNodesFromFirstThreeLevels(nodes);

      set({
        rawPages: pages,
        problemTree: tree,
        allNodes: nodes,
        allRawNodes: nodes,
        availableRootNodes,
        currentRootId: tree.root?.id || null,
        error: null,
      });

      // Save to cache after successful switch
      saveToCache({
        rawPages: pages,
        currentRootId: tree.root?.id || null,
        timestamp: Date.now(),
      }, database);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to switch database',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProblems: async () => {
    const state = get();
    if (!state.isConnected) {
      set({ error: 'Not connected to Notion. Please connect first.' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const pages = await notionAPI.fetchAllProblems();
      const nodes = notionAPI.convertToNodes(pages);
      const tree = notionAPI.buildTree(nodes, state.currentRootId || undefined);
      const availableRootNodes = notionAPI.getNodesFromFirstThreeLevels(nodes);

      const newRootId = state.currentRootId || tree.root?.id || null;

      set({
        rawPages: pages,
        problemTree: tree,
        allNodes: nodes,
        allRawNodes: nodes, // Store all nodes including solutions
        availableRootNodes,
        currentRootId: newRootId,
        error: null,
      });

      // Save to cache after successful fetch
      saveToCache({
        rawPages: pages,
        currentRootId: newRootId,
        timestamp: Date.now(),
      }, state.currentDatabase);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch problems',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadCachedData: () => {
    const state = get();
    const cached = loadFromCache(state.currentDatabase);

    if (!cached) {
      console.log('No cached data found');
      set({
        error: 'No cached data available. Please refresh to fetch from Notion.',
        rawPages: [],
        problemTree: null,
        allNodes: new Map(),
        allRawNodes: new Map(),
        availableRootNodes: [],
      });
      return;
    }

    console.log(`Loading cached data from ${new Date(cached.timestamp).toLocaleString()}`);

    try {
      const nodes = notionAPI.convertToNodes(cached.rawPages);
      const tree = notionAPI.buildTree(nodes, cached.currentRootId || undefined);
      const availableRootNodes = notionAPI.getNodesFromFirstThreeLevels(nodes);

      // Debug logging for canvas rendering issues
      console.log('🔍 Debug: Processing cached data:', {
        rawPagesCount: cached.rawPages.length,
        nodesCount: nodes.size,
        treeRoot: tree.root ? tree.root.id : 'null',
        treeNodes: tree.nodes.size,
        availableRoots: availableRootNodes.length
      });

      set({
        rawPages: cached.rawPages,
        problemTree: tree,
        allNodes: nodes,
        allRawNodes: nodes,
        availableRootNodes,
        currentRootId: cached.currentRootId,
        error: null,
      });

      console.log(`✅ Loaded ${cached.rawPages.length} cached pages, ${nodes.size} nodes`);
      console.log('🎯 ProblemTree set:', tree.root ? `Root: ${tree.root.title}` : 'No root found');
    } catch (error) {
      console.error('❌ Failed to process cached data:', error);
      set({
        error: 'Failed to load cached data. Please refresh to fetch from Notion.',
        rawPages: [],
        problemTree: null,
        allNodes: new Map(),
        allRawNodes: new Map(),
        availableRootNodes: [],
      });
    }
  },

  changeRootNode: (rootId: string) => {
    const state = get();
    if (!state.allNodes.size) {
      set({ error: 'No data loaded. Please fetch problems first.' });
      return;
    }

    try {
      const tree = notionAPI.buildTree(state.allNodes, rootId);
      set({
        problemTree: tree,
        currentRootId: rootId,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to change root node',
      });
    }
  },

  resetRootNode: () => {
    const state = get();
    if (!state.allNodes.size) {
      set({ error: 'No data loaded. Please fetch problems first.' });
      return;
    }

    try {
      // Reset to the original root (no custom root ID)
      const tree = notionAPI.buildTree(state.allNodes);
      const originalRootId = tree.root?.id || null;

      set({
        problemTree: tree,
        currentRootId: originalRootId,
        error: null,
      });

      // Update cache with reset root
      if (state.rawPages.length > 0) {
        saveToCache({
          rawPages: state.rawPages,
          currentRootId: originalRootId,
          timestamp: Date.now(),
        }, state.currentDatabase);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset root node',
      });
    }
  },

  disconnect: () => {
    set({
      isConnected: false,
      problemTree: null,
      rawPages: [],
      allNodes: new Map(),
      allRawNodes: new Map(),
      availableRootNodes: [],
      currentRootId: null,
      error: null,
    });
  },

  setSelectedNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  clearError: () => {
    set({ error: null });
  },
}));