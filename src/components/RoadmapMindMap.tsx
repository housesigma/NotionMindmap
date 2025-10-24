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

const RoadmapMindMapInner: React.FC<RoadmapMindMapProps> = ({
  nodes,
  onNodeClick
}) => {
  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const { switchDatabase, allNodes: problemNodes, currentDatabase } = useNotionStore();
  const [relatedProblems, setRelatedProblems] = useState<ProblemNode[]>([]);

  // Fetch problems referenced in objectives' problemIds field
  useEffect(() => {
    const fetchProblems = async () => {
      // Collect all unique problem IDs from objectives
      const problemIds = new Set<string>();

      console.log('Checking objectives for problemIds field...');
      nodes.forEach(node => {
        console.log(`Node "${node.title}" has problemIds:`, node.problemIds);
        if (node.problemIds && node.problemIds.length > 0) {
          node.problemIds.forEach(id => problemIds.add(id));
        }
      });

      console.log(`Total unique problem IDs found: ${problemIds.size}`);

      if (problemIds.size === 0) {
        setRelatedProblems([]);
        return;
      }

      console.log(`Fetching ${problemIds.size} problems referenced in objectives...`);

      try {
        const problemPages = await notionAPI.fetchPagesByIds(Array.from(problemIds));
        const problemNodesMap = notionAPI.convertToNodes(problemPages);
        const problemNodesArray = Array.from(problemNodesMap.values()).map(node => ({
          ...node,
          isObjective: false // Mark as problems, not objectives
        }));
        setRelatedProblems(problemNodesArray);
        console.log(`Loaded ${problemNodesArray.length} related problems`);
      } catch (error) {
        console.error('Failed to fetch related problems:', error);
        setRelatedProblems([]);
      }
    };

    if (nodes.length > 0) {
      fetchProblems();
    }
  }, [nodes]);

  const { layoutNodes, layoutEdges } = useMemo(() => {
    if (!nodes.length) {
      return { layoutNodes: [], layoutEdges: [] };
    }

    // Combine objectives and related problems
    const allNodes = [...nodes, ...relatedProblems];
    const nodeMap = new Map(allNodes.map(node => [node.id, node]));
    const sortedNodes = topologicalSort(nodes); // Only sort objectives for temporal ordering

    // Position nodes based on temporal and hierarchical order
    const nodeSpacing = 600; // Increased horizontal spacing between root nodes
    const verticalSpacing = 350; // Increased vertical spacing between levels
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
              // Child node: position directly below parent
              const parentPos = finalPositions.get(node.parentId)!;
              const siblingCount = siblings.length;

              if (siblingCount === 1) {
                // Single child: position directly under parent
                x = parentPos.x;
              } else {
                // Multiple children: spread them out slightly around parent
                const childSpacing = 450; // Increased spacing between siblings
                const totalWidth = (siblingCount - 1) * childSpacing;
                const startX = parentPos.x - (totalWidth / 2);
                x = startX + (siblingIndex * childSpacing);
              }
            } else {
              // Root node: use temporal position
              x = temporalPositions.get(node.id)!.x;
            }

            const y = level * verticalSpacing;

            // Collision detection for all nodes
            let finalX = x;
            let attempts = 0;
            const maxAttempts = 30;
            const minDistance = 320; // Minimum horizontal distance between any two nodes

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
              const offset = Math.ceil(attempts / 2) * (minDistance * 0.5);
              finalX = x + (direction * offset);
              attempts++;
            }

            finalPositions.set(node.id, { x: finalX, y, level });
          });
        });
      });

    // Position related problems directly below their objectives
    // Group problems by their parent objective
    const problemsByObjective = new Map<string, string[]>();
    relatedProblems.forEach(problemNode => {
      const relatedObjective = nodes.find(obj =>
        obj.problemIds && obj.problemIds.includes(problemNode.id)
      );
      if (relatedObjective) {
        if (!problemsByObjective.has(relatedObjective.id)) {
          problemsByObjective.set(relatedObjective.id, []);
        }
        problemsByObjective.get(relatedObjective.id)!.push(problemNode.id);
      }
    });

    // Position each problem directly below its objective
    problemsByObjective.forEach((problemIds, objectiveId) => {
      if (finalPositions.has(objectiveId)) {
        const objectivePos = finalPositions.get(objectiveId)!;
        const problemSpacing = 350; // Vertical spacing between objective and problems

        problemIds.forEach((problemId, index) => {
          // Position directly below the objective
          const problemX = objectivePos.x;
          const problemY = objectivePos.y + problemSpacing + (index * 150); // Stack multiple problems vertically

          finalPositions.set(problemId, {
            x: problemX,
            y: problemY,
            level: objectivePos.level + 1 // One level below objective
          });
        });
      }
    });

    // Create React Flow nodes
    const layoutNodes: Node[] = [];

    // Debug: Log all node types to see what we're working with
    console.log('All node types:', Array.from(nodeMap.values()).map(n => ({ title: n.title, type: n.type })));

    finalPositions.forEach(({ x, y }, nodeId) => {
      const node = nodeMap.get(nodeId)!;
      const isOKR = node.type?.toLowerCase().includes('okr') ||
                    node.title.toLowerCase().includes('okr') ||
                    node.tags?.some(tag => tag.toLowerCase().includes('okr')) ||
                    false;

      const isBAU = node.type?.toLowerCase().includes('bau') ||
                    node.title.toLowerCase().includes('bau') ||
                    node.tags?.some(tag => tag.toLowerCase().includes('bau')) ||
                    false;

      // Debug logging for type detection
      console.log('Node:', node.title, '| Type:', node.type, '| isOKR:', isOKR, '| isBAU:', isBAU);

      layoutNodes.push({
        id: nodeId,
        type: 'custom',
        position: { x, y },
        zIndex: 10,
        data: {
          label: node.title,
          description: node.description,
          status: node.status,
          priority: node.priority,
          tags: node.tags,
          notionUrl: node.notionUrl,
          depth: finalPositions.get(nodeId)!.level,
          isExpanded: true,
          hasChildren: false, // Disable collapse functionality for roadmap
          isObjective: node.isObjective !== false, // Default to objective unless explicitly marked as problem
          isOKR: isOKR, // Flag for OKR nodes
          isBAU: isBAU, // Flag for BAU nodes
          period: node.period, // Period value
          onToggleCollapse: () => {} // No collapse functionality for roadmap
        },
      });
    });

    // Create React Flow edges
    const layoutEdges: Edge[] = [];

    // Parent-child relationships (vertical, dashed gray lines - bottom to top)
    nodes.forEach(node => {
      // Connect to all parent objectives if multiple parents exist
      const parentIdsToConnect = node.parentIds && node.parentIds.length > 0 ? node.parentIds : (node.parentId ? [node.parentId] : []);

      parentIdsToConnect.forEach(parentId => {
        if (finalPositions.has(parentId)) {
          layoutEdges.push({
            id: `parent-${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'straight',
            style: {
              stroke: '#6B7280',
              strokeWidth: 2,
              strokeDasharray: '5,5',
            },
            zIndex: 0,
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
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'smoothstep',
            style: {
              stroke: '#2563EB',
              strokeWidth: 3,
            },
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20,
              color: '#2563EB',
            },
            zIndex: 0,
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
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'smoothstep',
            style: {
              stroke: '#10B981',
              strokeWidth: 3,
            },
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20,
              color: '#10B981',
            },
            zIndex: 0,
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
      if (objectiveNode.problemIds && objectiveNode.problemIds.length > 0) {
        objectiveNode.problemIds.forEach(problemId => {
          // Only create edge if this problem is in our related problems
          if (finalPositions.has(problemId) && finalPositions.has(objectiveNode.id)) {
            layoutEdges.push({
              id: `objective-problem-${objectiveNode.id}-${problemId}`,
              source: objectiveNode.id,
              target: problemId,
              sourceHandle: 'bottom',
              targetHandle: 'top',
              type: 'straight',
              style: {
                stroke: '#8B5CF6',
                strokeWidth: 2,
                strokeDasharray: '8,4',
              },
              markerEnd: {
                type: 'arrowclosed',
                width: 16,
                height: 16,
                color: '#8B5CF6',
              },
              zIndex: 0,
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

    // Problem-to-objective relationship edges (purple, dashed lines - reverse direction)
    relatedProblems.forEach(problemNode => {
      if (problemNode.objectiveIds) {
        problemNode.objectiveIds.forEach(objectiveId => {
          // Only create edge if this objective is in our current view
          if (finalPositions.has(objectiveId) && finalPositions.has(problemNode.id)) {
            layoutEdges.push({
              id: `problem-objective-${problemNode.id}-${objectiveId}`,
              source: problemNode.id,
              target: objectiveId,
              sourceHandle: 'top',
              targetHandle: 'bottom',
              type: 'smoothstep',
              style: {
                stroke: '#8B5CF6',
                strokeWidth: 2,
                strokeDasharray: '8,4',
              },
              markerEnd: {
                type: 'arrowclosed',
                width: 16,
                height: 16,
                color: '#8B5CF6',
              },
              zIndex: 0,
              label: 'objective',
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
  }, [nodes, relatedProblems]);

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
        <MiniMap />
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