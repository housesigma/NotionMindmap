import React from 'react';
import RoadmapMindMap from '../components/RoadmapMindMap';
import { useNotionStore } from '../store/notionStore';

const Roadmap: React.FC = () => {
  const { allNodes } = useNotionStore();

  // Convert Map to Array for RoadmapMindMap component
  const nodes = Array.from(allNodes.values());

  return (
    <RoadmapMindMap nodes={nodes} />
  );
};

export default Roadmap;