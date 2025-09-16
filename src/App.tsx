import React, { useState } from 'react';
import MindMap from './components/MindMap';
import NotionConnection from './components/NotionConnection';
import { useNotionStore } from './store/notionStore';

function App() {
  const { problemTree, isLoading, isConnected, fetchProblems } = useNotionStore();
  const [showSidebar, setShowSidebar] = useState(true);

  const handleRefresh = async () => {
    if (isConnected) {
      await fetchProblems();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-96' : 'w-0 max-w-0'
        } transition-all duration-300 bg-white shadow-lg overflow-hidden`}
        style={{
          width: showSidebar ? '24rem' : '0',
          maxWidth: showSidebar ? '24rem' : '0'
        }}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Notion Mind Map
            </h1>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <NotionConnection />

          {isConnected && (
            <div className="mt-6">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </button>

              {problemTree && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Statistics</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Total Problems: {problemTree.nodes.size}</p>
                    <p>Root Problem: {problemTree.root?.title || 'None'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="absolute top-4 left-4 z-20 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading mind map...</p>
            </div>
          </div>
        ) : (
          <MindMap
            problemTree={problemTree}
            onNodeClick={(nodeId) => {
              console.log('Node clicked:', nodeId);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;