import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import type { Node, Edge, Connection, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import type { MindMapConfig } from '../types/mindmap';
import type { ProblemTree } from '../types/notion';
import { createMindMapLayout, MindMapLayoutEngine } from '../utils/mindmapLayout';

interface MindMapProps {
  problemTree: ProblemTree | null;
  config?: Partial<MindMapConfig>;
  onNodeClick?: (nodeId: string) => void;
}

const nodeTypes = {
  custom: CustomNode,
};

const MindMapInner: React.FC<MindMapProps> = ({
  problemTree,
  config,
  onNodeClick
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (problemTree) {
      const layoutConfig = {
        layout: 'horizontal' as const,
        nodeSpacing: { x: 300, y: 120 },
        showLabels: true,
        enableAnimation: true,
        ...config
      };
      const layoutEngine = new MindMapLayoutEngine(
        layoutConfig,
        collapsedNodes
      );
      const { nodes: layoutNodes, edges: layoutEdges } = layoutEngine.generateLayout(problemTree);

      // Add the toggle handler to each node's data
      const nodesWithHandlers = layoutNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onToggleCollapse: () => {
            setCollapsedNodes(prev => {
              const newSet = new Set(prev);
              if (newSet.has(node.id)) {
                newSet.delete(node.id);
              } else {
                newSet.add(node.id);
              }
              return newSet;
            });
          }
        }
      }));

      setNodes(nodesWithHandlers);
      setEdges(layoutEdges);

      // Center the view after layout update
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    }
  }, [problemTree, config, collapsedNodes, setNodes, setEdges, fitView]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClickHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Single click handler for node selection
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  if (!problemTree || !problemTree.root) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500">
            Please connect to Notion and select a database
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background
          variant={'dots' as any}
          gap={12}
          size={1}
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = node.data?.status;
            const colors: Record<string, string> = {
              'done': '#10b981',
              'in-progress': '#3b82f6',
              'blocked': '#ef4444',
              'todo': '#6b7280',
            };
            return colors[status] || '#6b7280';
          }}
          pannable={true}
          zoomable={true}
          position="bottom-right"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
};

const MindMap: React.FC<MindMapProps> = (props) => {
  return (
    <ReactFlowProvider>
      <MindMapInner {...props} />
    </ReactFlowProvider>
  );
};

export default MindMap;