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
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-blue-800">🎯 Focus View</h3>
        <div className="text-sm text-blue-600 font-medium">
          {availableRootNodes.length} roots
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="root-selector" className="block text-sm font-medium text-blue-700">
          Select root node to focus:
        </label>
        <select
          id="root-selector"
          value={currentRootId || ''}
          onChange={handleRootChange}
          className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
        >
          {availableRootNodes.map(node => (
            <option key={node.id} value={node.id}>
              {getNodeDisplayName(node)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 text-xs text-blue-600">
        Matrix shows only problems from this branch with impact & effort values.
      </div>
    </div>
  );
};

export default RootSelector;