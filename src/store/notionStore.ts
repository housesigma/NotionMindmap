import { create } from 'zustand';
import type { ProblemTree, NotionProblemPage, ProblemNode } from '../types/notion';
import notionAPI from '../api/notion';

// Helper functions for localStorage
const CACHE_KEY = 'notion-mindmap-data';

const saveToCache = (data: {
  rawPages: NotionProblemPage[];
  currentRootId: string | null;
  timestamp: number;
}) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save data to cache:', error);
  }
};

const loadFromCache = (): {
  rawPages: NotionProblemPage[];
  currentRootId: string | null;
  timestamp: number;
} | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
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

  connectToNotion: (apiKey: string, databaseId: string) => Promise<void>;
  fetchProblems: () => Promise<void>;
  loadCachedData: () => void;
  changeRootNode: (rootId: string) => void;
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
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch problems',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadCachedData: () => {
    const cached = loadFromCache();

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

      set({
        rawPages: cached.rawPages,
        problemTree: tree,
        allNodes: nodes,
        allRawNodes: nodes,
        availableRootNodes,
        currentRootId: cached.currentRootId,
        error: null,
      });

      console.log(`Loaded ${cached.rawPages.length} cached pages, ${nodes.size} nodes`);
    } catch (error) {
      console.error('Failed to process cached data:', error);
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

  clearError: () => {
    set({ error: null });
  },
}));