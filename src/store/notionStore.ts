import { create } from 'zustand';
import type { ProblemTree, NotionProblemPage } from '../types/notion';
import notionAPI from '../api/notion';

interface NotionStore {
  isLoading: boolean;
  error: string | null;
  problemTree: ProblemTree | null;
  rawPages: NotionProblemPage[];
  isConnected: boolean;

  connectToNotion: (apiKey: string, databaseId: string) => Promise<void>;
  fetchProblems: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

export const useNotionStore = create<NotionStore>((set, get) => ({
  isLoading: false,
  error: null,
  problemTree: null,
  rawPages: [],
  isConnected: false,

  connectToNotion: async (apiKey: string, databaseId: string) => {
    set({ isLoading: true, error: null });

    try {
      notionAPI.initialize(apiKey, databaseId);
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
      const tree = notionAPI.buildTree(nodes);

      set({
        rawPages: pages,
        problemTree: tree,
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

  disconnect: () => {
    set({
      isConnected: false,
      problemTree: null,
      rawPages: [],
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));