import { create } from 'zustand';
import type { ProblemTree, NotionProblemPage, ProblemNode } from '../types/notion';
import notionAPI from '../api/notion';

interface NotionStore {
  isLoading: boolean;
  error: string | null;
  problemTree: ProblemTree | null;
  rawPages: NotionProblemPage[];
  isConnected: boolean;
  allNodes: Map<string, ProblemNode>;
  availableRootNodes: ProblemNode[];
  currentRootId: string | null;

  connectToNotion: (apiKey: string, databaseId: string) => Promise<void>;
  fetchProblems: () => Promise<void>;
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
  availableRootNodes: [],
  currentRootId: null,

  connectToNotion: async (apiKey: string, databaseId: string) => {
    set({ isLoading: true, error: null });

    try {
      notionAPI.initialize(apiKey);
      set({ isConnected: true });

      // Automatically fetch problems after connecting
      await get().fetchProblems();
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

      set({
        rawPages: pages,
        problemTree: tree,
        allNodes: nodes,
        availableRootNodes,
        currentRootId: state.currentRootId || tree.root?.id || null,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch problems',
      });
    } finally {
      set({ isLoading: false });
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
      availableRootNodes: [],
      currentRootId: null,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));