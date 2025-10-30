import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import NotionConnection from './components/NotionConnection';
import RootSelector from './components/RootSelector';
import MindMapPage from './pages/MindMapPage';
import RoadmapNewPage from './pages/RoadmapNewPage';
import Matrix_new from './components/Matrix_new';
import { useNotionStore } from './store/notionStore';

function AppContent() {
  const { problemTree, isLoading, isConnected, fetchProblems } = useNotionStore();
  const [showSidebar, setShowSidebar] = useState(true);
  const location = useLocation();

  const handleRefresh = async () => {
    if (isConnected) {
      await fetchProblems();
    }
  };

  const isMatrixNewPage = location.pathname === '/matrix-new';
  const isRoadmapNewPage = location.pathname === '/roadmap-new';

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
              Notion Visualization
            </h1>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <div className="mb-4">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <Link
                to="/"
                className={`flex-1 py-1.5 px-1 rounded-md text-xs font-medium text-center transition-colors ${
                  !isMatrixNewPage && !isRoadmapNewPage
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mind Map
              </Link>
              <Link
                to="/matrix-new"
                className={`flex-1 py-1.5 px-1 rounded-md text-xs font-medium text-center transition-colors ${
                  isMatrixNewPage
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Impact vs Effort
              </Link>
              <Link
                to="/roadmap-new"
                className={`flex-1 py-1.5 px-1 rounded-md text-xs font-medium text-center transition-colors ${
                  isRoadmapNewPage
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Roadmap
              </Link>
            </div>
          </div>

          <NotionConnection />

          <div className="mt-4">
            <RootSelector />
          </div>


          {isConnected && (
            <div className="mt-4">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </button>

              {problemTree && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2 text-sm">Stats</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Problems: {problemTree.nodes.size}</p>
                    {isMatrixNewPage && (
                      <p>Matrix Items: {Array.from(problemTree.nodes.values()).filter(node => node.impact !== undefined && node.effort !== undefined).length}</p>
                    )}
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
      <div className="flex-1 relative h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<MindMapPage />} />
            <Route path="/matrix-new" element={<Matrix_new />} />
            <Route path="/roadmap-new" element={<RoadmapNewPage />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Fetch and log version information on app startup
    const logVersionInfo = async () => {
      try {
        // Use relative path to work with any base path deployment
        const response = await fetch('./api/health');
        const data = await response.json();
        console.log(`🚀 NotionMindmap Frontend v${data.version} loaded`);
        console.log(`📊 Server status: ${data.status}`);
        console.log(`🕐 Server timestamp: ${data.timestamp}`);
        console.log(`🔧 Built with React ${React.version}`);
      } catch (error) {
        console.log('🚀 NotionMindmap Frontend loaded (version check failed)');
        console.log('⚠️ Could not connect to backend server');
      }
    };

    logVersionInfo();
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;