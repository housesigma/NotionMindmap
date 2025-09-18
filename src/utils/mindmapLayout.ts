import type { ProblemNode, ProblemTree } from '../types/notion';
import type { MindMapNode, MindMapEdge, MindMapConfig } from '../types/mindmap';

interface LayoutPosition {
  x: number;
  y: number;
}

export class MindMapLayoutEngine {
  private config: MindMapConfig;
  private positions: Map<string, LayoutPosition> = new Map();
  private collapsedNodes: Set<string> = new Set();
  private hiddenNodes: Set<string> = new Set();

  constructor(config: MindMapConfig, collapsedNodes?: Set<string>) {
    this.config = config;
    this.collapsedNodes = collapsedNodes || new Set();
  }

  generateLayout(tree: ProblemTree): {
    nodes: MindMapNode[];
    edges: MindMapEdge[];
  } {
    if (!tree.root) {
      return { nodes: [], edges: [] };
    }

    this.positions.clear();
    this.hiddenNodes.clear();

    // Find nodes that should be hidden (children of collapsed nodes)
    this.findHiddenNodes(tree);

    if (this.config.layout === 'radial') {
      this.calculateRadialLayout(tree);
    } else {
      this.calculateHierarchicalLayout(tree);
    }

    const nodes = this.createNodes(tree);
    const edges = this.createEdges(tree);

    return { nodes, edges };
  }

  private findHiddenNodes(tree: ProblemTree) {
    const findDescendants = (nodeId: string) => {
      const node = tree.nodes.get(nodeId);
      if (!node) return;

      node.children.forEach(childId => {
        this.hiddenNodes.add(childId);
        findDescendants(childId);
      });
    };

    this.collapsedNodes.forEach(nodeId => {
      findDescendants(nodeId);
    });
  }

  private calculateHierarchicalLayout(tree: ProblemTree) {
    if (!tree.root) return;

    // Auto-collapse nodes at depth >= 5 unless manually expanded
    // this.autoCollapseDeepNodes(tree); // Disabled - show all nodes expanded by default

    const visited = new Set<string>();
    const queue: { node: ProblemNode; depth: number }[] = [
      { node: tree.root, depth: 0 }
    ];

    const depthGroups = new Map<number, ProblemNode[]>();

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;

      if (visited.has(node.id) || this.hiddenNodes.has(node.id)) continue;
      visited.add(node.id);

      if (!depthGroups.has(depth)) {
        depthGroups.set(depth, []);
      }
      depthGroups.get(depth)!.push(node);

      // Only add children if this node is not collapsed
      if (!this.collapsedNodes.has(node.id)) {
        node.children.forEach(childId => {
          const childNode = tree.nodes.get(childId);
          if (childNode && !visited.has(childId) && !this.hiddenNodes.has(childId)) {
            queue.push({ node: childNode, depth: depth + 1 });
          }
        });
      }
    }

    // Position nodes with clean spacing
    const nodeSpacingX = this.config.nodeSpacing?.x || 300;
    const nodeSpacingY = this.config.nodeSpacing?.y || 120;

    // Position nodes with clean spacing - keep it simple!
    depthGroups.forEach((nodes, depth) => {
      // Sort nodes by their parent's Y position to keep children near parents
      const sortedNodes = [...nodes].sort((a, b) => {
        if (a.parentId && b.parentId) {
          const parentAPosY = this.positions.get(a.parentId)?.y || 0;
          const parentBPosY = this.positions.get(b.parentId)?.y || 0;
          return parentAPosY - parentBPosY;
        }
        return 0;
      });

      const nodeCount = sortedNodes.length;
      const spacing = nodeSpacingY * 1.5;
      const totalHeight = nodeCount * spacing;
      const startY = -totalHeight / 2 + spacing / 2;

      sortedNodes.forEach((node, index) => {
        const x = this.config.layout === 'horizontal'
          ? depth * nodeSpacingX * 2.2
          : 0;

        const y = this.config.layout === 'horizontal'
          ? startY + index * spacing
          : depth * nodeSpacingY * 2;

        this.positions.set(node.id, { x, y });
      });
    });
  }

  private autoCollapseDeepNodes(tree: ProblemTree) {
    if (!tree.root) return;

    const MAX_DEPTH = 4; // Show levels 0-4, collapse 5+
    const visited = new Set<string>();
    const queue: { node: ProblemNode; depth: number }[] = [
      { node: tree.root, depth: 0 }
    ];

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;

      if (visited.has(node.id)) continue;
      visited.add(node.id);

      // Auto-collapse nodes at depth >= 5 (unless already manually expanded)
      if (depth > MAX_DEPTH && node.children.length > 0) {
        this.collapsedNodes.add(node.id);
      }

      // Continue traversing to find all deep nodes
      node.children.forEach(childId => {
        const childNode = tree.nodes.get(childId);
        if (childNode && !visited.has(childId)) {
          queue.push({ node: childNode, depth: depth + 1 });
        }
      });
    }
  }

  private calculateRadialLayout(tree: ProblemTree) {
    if (!tree.root) return;

    const visited = new Set<string>();
    const queue: { node: ProblemNode; depth: number; angle: number; angleRange: number }[] = [
      { node: tree.root, depth: 0, angle: 0, angleRange: 2 * Math.PI }
    ];

    this.positions.set(tree.root.id, { x: 0, y: 0 });

    while (queue.length > 0) {
      const { node, depth, angle, angleRange } = queue.shift()!;

      if (visited.has(node.id)) continue;
      visited.add(node.id);

      const radius = depth * 200;

      if (depth > 0) {
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        this.positions.set(node.id, { x, y });
      }

      const childCount = node.children.length;
      if (childCount > 0) {
        const childAngleRange = angleRange / childCount;
        const startAngle = angle - angleRange / 2;

        node.children.forEach((childId, index) => {
          const childNode = tree.nodes.get(childId);
          if (childNode && !visited.has(childId)) {
            const childAngle = startAngle + childAngleRange * (index + 0.5);
            queue.push({
              node: childNode,
              depth: depth + 1,
              angle: childAngle,
              angleRange: childAngleRange
            });
          }
        });
      }
    }
  }

  private createNodes(tree: ProblemTree): MindMapNode[] {
    const nodes: MindMapNode[] = [];
    const visited = new Set<string>();

    tree.nodes.forEach((node, id) => {
      if (visited.has(id) || this.hiddenNodes.has(id)) return;
      visited.add(id);

      const position = this.positions.get(id) || { x: 0, y: 0 };
      const isCollapsed = this.collapsedNodes.has(id);
      const hasChildren = node.children.length > 0;

      const mindMapNode: MindMapNode = {
        id,
        type: 'custom',
        position,
        data: {
          label: node.title,
          description: node.description,
          status: node.status,
          priority: node.priority,
          tags: node.tags,
          expanded: !isCollapsed,
          depth: this.getNodeDepth(tree, node),
          notionUrl: node.notionUrl,
          hasChildren: hasChildren,
          isCollapsed: isCollapsed,
        },
      };

      nodes.push(mindMapNode);
    });

    return nodes;
  }

  private createEdges(tree: ProblemTree): MindMapEdge[] {
    const edges: MindMapEdge[] = [];
    const visited = new Set<string>();

    tree.nodes.forEach(node => {
      // Only create edges from visible nodes
      if (this.hiddenNodes.has(node.id)) return;

      node.children.forEach(childId => {
        // Only create edges to visible nodes
        if (this.hiddenNodes.has(childId)) return;

        const edgeId = `${node.id}-${childId}`;
        if (!visited.has(edgeId)) {
          visited.add(edgeId);

          edges.push({
            id: edgeId,
            source: node.id,
            target: childId,
            type: 'straight',
            animated: false,
            style: {
              stroke: this.getEdgeColor(node, tree.nodes.get(childId)),
              strokeWidth: 2,
              strokeDasharray: '5,5',
            },
          });
        }
      });
    });

    return edges;
  }

  private getNodeDepth(tree: ProblemTree, node: ProblemNode): number {
    let depth = 0;
    let current = node;

    while (current.parentId) {
      depth++;
      const parent = tree.nodes.get(current.parentId);
      if (!parent) break;
      current = parent;
    }

    return depth;
  }

  private getEdgeColor(parent: ProblemNode, child?: ProblemNode): string {
    if (!child) return '#888';

    const statusColors: Record<string, string> = {
      'done': '#10b981',
      'in-progress': '#3b82f6',
      'blocked': '#ef4444',
      'todo': '#6b7280',
    };

    return statusColors[child.status || 'todo'] || '#888';
  }
}

export const createMindMapLayout = (
  tree: ProblemTree,
  config?: Partial<MindMapConfig>
) => {
  const defaultConfig: MindMapConfig = {
    layout: 'horizontal',
    nodeSpacing: { x: 300, y: 120 },
    showLabels: true,
    enableAnimation: true,
    ...config,
  };

  const layoutEngine = new MindMapLayoutEngine(defaultConfig);
  return layoutEngine.generateLayout(tree);
};