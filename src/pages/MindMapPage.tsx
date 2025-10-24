import React, { useEffect } from 'react';
import MindMap from '../components/MindMap';
import { useNotionStore } from '../store/notionStore';

const MindMapPage: React.FC = () => {
  const { problemTree, switchDatabase, currentDatabase, isConnected } = useNotionStore();

  useEffect(() => {
    // Auto-switch to problems database when this page loads
    if (isConnected && currentDatabase !== 'problems') {
      switchDatabase('problems');
    }
  }, [isConnected, currentDatabase, switchDatabase]);

  return (
    <MindMap
      problemTree={problemTree}
      onNodeClick={(nodeId) => {
        console.log('Node clicked:', nodeId);
      }}
    />
  );
};

export default MindMapPage;