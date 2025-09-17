import React from 'react';
import { useNotionStore } from '../store/notionStore';

const RootSelector: React.FC = () => {
  const {
    availableRootNodes,
    currentRootId,
    changeRootNode,
    isConnected,
    problemTree
  } = useNotionStore();

  if (!isConnected || !problemTree || availableRootNodes.length === 0) {
    return null;
  }

  const handleRootChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRootId = event.target.value;
    if (selectedRootId !== currentRootId) {
      changeRootNode(selectedRootId);
    }
  };

  const getNodeDisplayName = (node: typeof availableRootNodes[0]) => {
    const depth = availableRootNodes.indexOf(node) === 0 ? 0 :
                  node.parentId ?
                    (availableRootNodes.find(n => n.id === node.parentId) ? 1 : 2) : 0;
    const indent = '  '.repeat(depth);
    const statusEmoji = {
      'todo': '⚪',
      'in-progress': '🔵',
      'done': '✅',
      'blocked': '🔴'
    }[node.status || 'todo'] || '⚪';

    return `${indent}${statusEmoji} ${node.title}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Focus View</h3>
        <div className="text-sm text-gray-500">
          {availableRootNodes.length} options from first 3 levels
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="root-selector" className="block text-sm font-medium text-gray-700">
          Select root node to focus the tree:
        </label>
        <select
          id="root-selector"
          value={currentRootId || ''}
          onChange={handleRootChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {availableRootNodes.map(node => (
            <option key={node.id} value={node.id}>
              {getNodeDisplayName(node)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Changing the root will show only that node and its descendants, creating a smaller, focused view of your hierarchy.
      </div>
    </div>
  );
};

export default RootSelector;