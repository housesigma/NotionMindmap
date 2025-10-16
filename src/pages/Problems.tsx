import React from 'react';
import MindMap from '../components/MindMap';
import { useNotionStore } from '../store/notionStore';

const Problems: React.FC = () => {
  const { problemTree } = useNotionStore();

  return (
    <MindMap
      problemTree={problemTree}
      onNodeClick={(nodeId) => {
        console.log('Node clicked:', nodeId);
      }}
    />
  );
};

export default Problems;