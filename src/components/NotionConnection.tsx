import React, { useState, useEffect } from 'react';
import { useNotionStore } from '../store/notionStore';

const NotionConnection: React.FC = () => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_NOTION_API_KEY || '');
  const [databaseId, setDatabaseId] = useState(import.meta.env.VITE_NOTION_DATABASE_ID || '');
  const [showApiKey, setShowApiKey] = useState(false);

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
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
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

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline">Notion Integrations</a></li>
          <li>Create a new integration and copy the token</li>
          <li>Share your problem database with the integration</li>
          <li>Copy the database ID from the database URL (the 32-character string)</li>
        </ol>
      </div>

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

      <form onSubmit={handleConnect} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            Notion API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="secret_..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="databaseId" className="block text-sm font-medium text-gray-700 mb-1">
            Database ID
          </label>
          <input
            type="text"
            id="databaseId"
            value={databaseId}
            onChange={(e) => setDatabaseId(e.target.value)}
            placeholder="32-character database ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !apiKey || !databaseId}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Connect to Notion'}
        </button>
      </form>
    </div>
  );
};

export default NotionConnection;