import React, { useEffect } from 'react';
import RoadmapMindMap from '../components/RoadmapMindMap';
import { useNotionStore } from '../store/notionStore';

const Objectives: React.FC = () => {
  const { switchDatabase, currentDatabase, isConnected, allNodes } = useNotionStore();

  useEffect(() => {
    // Auto-switch to objectives database when this page loads
    if (isConnected && currentDatabase !== 'objectives') {
      switchDatabase('objectives');
    }
  }, [isConnected, currentDatabase, switchDatabase]);

  // Convert Map to Array for RoadmapMindMap component
  const nodes = Array.from(allNodes.values());

  return (
    <RoadmapMindMap nodes={nodes} />
  );
};

export default Objectives;