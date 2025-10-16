import React from 'react';
import { useNotionStore } from '../store/notionStore';

const NodeSelectionControls: React.FC = () => {
  const { selectedNodeId, setSelectedNode, allNodes } = useNotionStore();
  const selectedNode = selectedNodeId ? allNodes.get(selectedNodeId) : null;

  const handleClearSelection = () => {
    setSelectedNode(null);
  };

  if (!selectedNodeId || !selectedNode) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-2 text-sm">Node Selection</h3>
        <p className="text-xs text-gray-500">No node selected</p>
      </div>
    );
  }

  return (
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-blue-800 text-sm">Selected Node</h3>
        <button
          onClick={handleClearSelection}
          className="text-blue-600 hover:text-blue-800 text-xs"
          title="Clear selection"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <p className="font-medium text-sm text-gray-800 truncate" title={selectedNode.title}>
            {selectedNode.title}
          </p>
        </div>

        {selectedNode.status && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Status:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedNode.status === 'done' ? 'bg-green-100 text-green-800' :
              selectedNode.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
              selectedNode.status === 'blocked' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedNode.status}
            </span>
          </div>
        )}

        {selectedNode.priority && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Priority:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedNode.priority === 'critical' ? 'bg-red-100 text-red-800' :
              selectedNode.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              selectedNode.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {selectedNode.priority}
            </span>
          </div>
        )}

        {selectedNode.tags && selectedNode.tags.length > 0 && (
          <div>
            <span className="text-xs text-gray-500 block mb-1">Tags:</span>
            <div className="flex flex-wrap gap-1">
              {selectedNode.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-blue-200">
          <p className="text-xs text-gray-500">
            Click on a node in the visualization to select it
          </p>
        </div>
      </div>
    </div>
  );
};

export default NodeSelectionControls;