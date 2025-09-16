import React, { useEffect } from 'react';
import { useNotionStore } from '../store/notionStore';

const NotionConnection: React.FC = () => {
  const apiKey = import.meta.env.VITE_NOTION_API_KEY || '';
  const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID || '';

  const {
    isLoading,
    error,
    isConnected,
    connectToNotion,
    disconnect,
    clearError,
  } = useNotionStore();

  // Auto-connect if credentials are available from environment
  useEffect(() => {
    if (!isConnected && apiKey && databaseId) {
      connectToNotion(apiKey, databaseId);
    }
  }, [isConnected, apiKey, databaseId, connectToNotion]);

  const handleConnect = async () => {
    if (apiKey && databaseId) {
      await connectToNotion(apiKey, databaseId);
    }
  };

  if (isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium">Connected to Notion</span>
          </div>
          <button
            onClick={disconnect}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Connect to Notion</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <strong>API Key:</strong> ntn_521...JKi99D (configured)
          </p>
          <p className="text-sm text-gray-600">
            <strong>Database ID:</strong> 268c2345-ab46-80e0-876d-ddbd9ebb5383
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={isLoading || !apiKey || !databaseId}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Connect to Notion'}
        </button>
      </div>
    </div>
  );
};

export default NotionConnection;