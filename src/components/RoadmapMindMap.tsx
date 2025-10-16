import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import type { Node, Edge, Connection, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import type { ProblemNode, NotionProblemPage } from '../types/notion';
import { useNotionStore } from '../store/notionStore';
import notionAPI from '../api/notion';

interface RoadmapMindMapProps {
  nodes: ProblemNode[];
  onNodeClick?: (nodeId: string) => void;
}

const nodeTypes = {
  custom: CustomNode,
};

// Topological sort for Before/After relationships
function topologicalSort(nodes: ProblemNode[]): ProblemNode[] {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: ProblemNode[] = [];

  function visit(nodeId: string) {
    if (visiting.has(nodeId)) {
      return; // Cycle detected, skip
    }
    if (visited.has(nodeId)) {
      return;
    }

    const node = nodeMap.get(nodeId);
    if (!node) return;

    visiting.add(nodeId);

    // Visit all "before" nodes first (nodes that come before this one)
    node.afterIds?.forEach(afterId => {
      visit(afterId);
    });

    visiting.delete(nodeId);
    visited.add(nodeId);
    result.push(node);
  }

  // Start with nodes that have no "before" dependencies
  const noBeforeDeps = nodes.filter(node =>
    !nodes.some(other => other.afterIds?.includes(node.id))
  );

  noBeforeDeps.forEach(node => visit(node.id));

  // Add any remaining unvisited nodes
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      visit(node.id);
    }
  });

  return result;
}

// Calculate hierarchical level based on parent relationships
function calculateNodeLevel(node: ProblemNode, nodeMap: Map<string, ProblemNode>): number {
  if (!node.parentId) {
    return 0;
  }

  const parent = nodeMap.get(node.parentId);
  if (!parent) {
    return 0;
  }

  return calculateNodeLevel(parent, nodeMap) + 1;
}

// Helper function to load cached problems data
const loadCachedProblemsData = (): Map<string, ProblemNode> => {
  try {
    const cached = localStorage.getItem('notion-mindmap-data-problems');
    if (cached) {
      const data = JSON.parse(cached);
      const nodes = notionAPI.convertToNodes(data.rawPages);
      return nodes;
    }
  } catch (error) {
    console.warn('Failed to load cached problems data:', error);
  }
  return new Map();
};

const RoadmapMindMapInner: React.FC<RoadmapMindMapProps> = ({
  nodes,
  onNodeClick
}) => {
  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const { switchDatabase, allNodes: problemNodes, currentDatabase } = useNotionStore();

  // Load problems data from cache for cross-database relationships
  const cachedProblemsNodes = useMemo(() => loadCachedProblemsData(), []);

  const { layoutNodes, layoutEdges } = useMemo(() => {
    if (!nodes.length) {
      return { layoutNodes: [], layoutEdges: [] };
    }

    // Collect all related problem IDs from objectives
    const relatedProblemIds = new Set<string>();
    nodes.forEach(node => {
      if (node.problemIds) {
        node.problemIds.forEach(problemId => relatedProblemIds.add(problemId));
      }
    });

    // Get related problem nodes from the cached problems database
    const relatedProblems: ProblemNode[] = [];
    if (relatedProblemIds.size > 0) {
      relatedProblemIds.forEach(problemId => {
        const problemNode = cachedProblemsNodes.get(problemId);
        if (problemNode) {
          // Mark as non-objective (problem node) and add to collection
          relatedProblems.push({
            ...problemNode,
            isObjective: false
          });
        }
      });
    }

    // Combine objectives and related problems
    const allNodes = [...nodes, ...relatedProblems];
    const nodeMap = new Map(allNodes.map(node => [node.id, node]));
    const sortedNodes = topologicalSort(nodes); // Only sort objectives, not problems

    // Position nodes based on temporal and hierarchical order
    const nodeSpacing = 350;
    const verticalSpacing = 200;
    const temporalPositions = new Map<string, { x: number; level: number }>();

    // First pass: Calculate temporal positions
    sortedNodes.forEach((node, index) => {
      const x = index * nodeSpacing;
      const level = calculateNodeLevel(node, nodeMap);
      temporalPositions.set(node.id, { x, level });
    });

    // Second pass: Adjust child nodes to be under their parents
    const finalPositions = new Map<string, { x: number; y: number; level: number }>();
    const nodesByLevel = new Map<number, ProblemNode[]>();

    sortedNodes.forEach(node => {
      const level = calculateNodeLevel(node, nodeMap);
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    });

    // Position nodes level by level
    Array.from(nodesByLevel.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([level, levelNodes]) => {
        // Group nodes by parent for proper child spacing
        const nodesByParent = new Map<string | null, ProblemNode[]>();
        levelNodes.forEach(node => {
          const parentKey = node.parentId || 'root';
          if (!nodesByParent.has(parentKey)) {
            nodesByParent.set(parentKey, []);
          }
          nodesByParent.get(parentKey)!.push(node);
        });

        // Position each group
        nodesByParent.forEach((siblings, parentKey) => {
          siblings.forEach((node, siblingIndex) => {
            let x: number;

            if (node.parentId && finalPositions.has(node.parentId)) {
              // Child node: spread siblings around parent position
              const parentPos = finalPositions.get(node.parentId)!;
              const siblingCount = siblings.length;

              if (siblingCount === 1) {
                // Single child: position directly under parent
                x = parentPos.x;
              } else {
                // Multiple children: spread them out
                const childSpacing = 350; // Increased spacing between siblings
                const totalWidth = (siblingCount - 1) * childSpacing;
                const startX = parentPos.x - (totalWidth / 2);
                x = startX + (siblingIndex * childSpacing);
              }
            } else {
              // Root node: use temporal position
              x = temporalPositions.get(node.id)!.x;
            }

            const y = level * verticalSpacing;

            // Collision detection and adjustment
            let finalX = x;
            let attempts = 0;
            const maxAttempts = 20;
            const minDistance = 280; // Minimum distance between any two nodes

            while (attempts < maxAttempts) {
              let collision = false;

              // Check for collisions with existing nodes at this level
              for (const [existingId, existingPos] of finalPositions.entries()) {
                if (existingPos.level === level && Math.abs(existingPos.x - finalX) < minDistance) {
                  collision = true;
                  break;
                }
              }

              if (!collision) {
                break;
              }

              // Adjust position - alternate between left and right
              const direction = attempts % 2 === 0 ? 1 : -1;
              const offset = Math.ceil(attempts / 2) * minDistance;
              finalX = x + (direction * offset);
              attempts++;
            }

            finalPositions.set(node.id, { x: finalX, y, level });
          });
        });
      });

    // Position related problems near their objectives
    relatedProblems.forEach((problemNode, problemIndex) => {
      // Find the objective that references this problem
      const relatedObjective = nodes.find(obj =>
        obj.problemIds && obj.problemIds.includes(problemNode.id)
      );

      if (relatedObjective && finalPositions.has(relatedObjective.id)) {
        const objectivePos = finalPositions.get(relatedObjective.id)!;
        // Position problems to the right of their related objectives
        const problemX = objectivePos.x + 500; // Offset to the right
        const problemY = objectivePos.y + (problemIndex * 100); // Stack if multiple problems per objective

        finalPositions.set(problemNode.id, {
          x: problemX,
          y: problemY,
          level: objectivePos.level // Same level as objective
        });
      }
    });

    // Create React Flow nodes
    const layoutNodes: Node[] = [];
    finalPositions.forEach(({ x, y }, nodeId) => {
      const node = nodeMap.get(nodeId)!;
      layoutNodes.push({
        id: nodeId,
        type: 'custom',
        position: { x, y },
        data: {
          label: node.title,
          node: node,
          isExpanded: true,
          hasChildren: node.children.length > 0,
          isObjective: node.isObjective !== false, // Default to objective unless explicitly marked as problem
          onToggleCollapse: () => {} // No collapse functionality for roadmap
        },
      });
    });

    // Create React Flow edges
    const layoutEdges: Edge[] = [];

    // Parent-child relationships (vertical, dashed gray lines - bottom to top)
    nodes.forEach(node => {
      if (node.parentId && finalPositions.has(node.parentId)) {
        layoutEdges.push({
          id: `parent-${node.parentId}-${node.id}`,
          source: node.parentId,
          target: node.id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'straight',
          style: {
            stroke: '#6B7280',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          label: 'parent-child',
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
          labelBgStyle: {
            fill: '#F3F4F6',
            fillOpacity: 0.8,
          },
          labelStyle: {
            fontSize: '10px',
            fill: '#6B7280',
          },
        });
      }
    });

    // Before/After relationships (horizontal, solid colored lines)
    nodes.forEach(node => {
      // "After" relationships - this node comes after these nodes (blue arrows)
      node.afterIds?.forEach(afterId => {
        if (finalPositions.has(afterId)) {
          layoutEdges.push({
            id: `after-${afterId}-${node.id}`,
            source: afterId,
            target: node.id,
            type: 'smoothstep',
            style: {
              stroke: '#2563EB',
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#2563EB',
            },
            label: 'after',
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
            labelBgStyle: {
              fill: '#EBF8FF',
              fillOpacity: 0.9,
            },
            labelStyle: {
              fontSize: '10px',
              fill: '#2563EB',
              fontWeight: 'bold',
            },
          });
        }
      });

      // "Before" relationships - this node comes before these nodes (green arrows)
      node.beforeIds?.forEach(beforeId => {
        if (finalPositions.has(beforeId)) {
          layoutEdges.push({
            id: `before-${node.id}-${beforeId}`,
            source: node.id,
            target: beforeId,
            type: 'smoothstep',
            style: {
              stroke: '#10B981',
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#10B981',
            },
            label: 'before',
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
            labelBgStyle: {
              fill: '#F0FDF4',
              fillOpacity: 0.9,
            },
            labelStyle: {
              fontSize: '10px',
              fill: '#10B981',
              fontWeight: 'bold',
            },
          });
        }
      });
    });

    // Objective-to-problem relationship edges (purple, dashed lines)
    nodes.forEach(objectiveNode => {
      if (objectiveNode.problemIds) {
        objectiveNode.problemIds.forEach(problemId => {
          if (finalPositions.has(problemId)) {
            layoutEdges.push({
              id: `objective-problem-${objectiveNode.id}-${problemId}`,
              source: objectiveNode.id,
              target: problemId,
              sourceHandle: 'bottom',
              targetHandle: 'top',
              type: 'smoothstep',
              style: {
                stroke: '#8B5CF6',
                strokeWidth: 2,
                strokeDasharray: '8,4',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 16,
                height: 16,
                color: '#8B5CF6',
              },
              label: 'problems',
              labelBgPadding: [8, 4],
              labelBgBorderRadius: 4,
              labelBgStyle: {
                fill: '#F3E8FF',
                fillOpacity: 0.9,
              },
              labelStyle: {
                fontSize: '10px',
                fill: '#8B5CF6',
                fontWeight: 'bold',
              },
            });
          }
        });
      }
    });

    return { layoutNodes, layoutEdges };
  }, [nodes, cachedProblemsNodes]);

  useEffect(() => {
    if (layoutNodes.length > 0) {
      setNodes(layoutNodes);
      setEdges(layoutEdges);

      // Center the view after layout update
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    }
  }, [layoutNodes, layoutEdges, setNodes, setEdges, fitView]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClickHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  if (!nodes.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Roadmap Data</h3>
          <p className="text-gray-500">Connect to your Objectives database to view the roadmap.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
      >
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
        <Background variant={'dots' as BackgroundVariant} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

const RoadmapMindMap: React.FC<RoadmapMindMapProps> = (props) => {
  return (
    <ReactFlowProvider>
      <RoadmapMindMapInner {...props} />
    </ReactFlowProvider>
  );
};

export default RoadmapMindMap;