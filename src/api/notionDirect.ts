import type { NotionProblemPage, ProblemNode, ProblemTree } from '../types/notion';

// Direct Notion API implementation using server proxy
class NotionDirectAPI {
  private apiKey: string | null = null;
  private databaseId: string = '268c2345-ab46-80e0-876d-ddbd9ebb5383'; // Your actual Problems database ID

  initialize(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchAllProblems(): Promise<NotionProblemPage[]> {
    if (!this.apiKey) {
      throw new Error('Notion API key not provided');
    }

    let allResults: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    try {
      while (hasMore) {
        const response = await fetch(
          'http://localhost:3001/api/notion/query',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              apiKey: this.apiKey,
              databaseId: this.databaseId,
              startCursor: startCursor
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch problems: ${response.statusText}`);
        }

        const data = await response.json();
        allResults = allResults.concat(data.results);
        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      console.log(`Fetched ${allResults.length} total pages from Notion`);
      return allResults;
    } catch (error) {
      console.error('Error fetching problems from Notion:', error);
      throw error;
    }
  }

  convertToNodes(pages: NotionProblemPage[]): Map<string, ProblemNode> {
    const nodes = new Map<string, ProblemNode>();

    pages.forEach(page => {
      // Handle both 'Title' and 'Name' properties (database uses 'Title')
      const titleProperty = page.properties.Title || page.properties.title || page.properties.Name;
      const title = titleProperty?.title?.[0]?.plain_text || 'Untitled';

      // For Problems database, we look for 'Parent Problem' field specifically
      const parentRelation = page.properties['Parent Problem']?.relation || [];

      // For children, look for 'Child Problem(s)' field
      const childrenRelation = page.properties['Child Problem(s)']?.relation || [];

      // Extract ClickUp ID if available
      const clickUpId = (page.properties as any)['ID']?.rich_text?.[0]?.plain_text ||
                       page.properties['ClickUp ID']?.rich_text?.[0]?.plain_text ||
                       (page.properties as any)['ClickUp_ID']?.rich_text?.[0]?.plain_text ||
                       (page.properties as any)['clickup_id']?.rich_text?.[0]?.plain_text;

      // Extract status from the Status field
      const statusProperty = (page.properties.Status as any)?.status || page.properties.Status?.select;
      const statusName = statusProperty?.name;

      const node: ProblemNode = {
        id: page.id,
        title,
        description: page.properties.Description?.rich_text?.[0]?.plain_text,
        parentId: parentRelation[0]?.id || null,
        children: childrenRelation.map((child: any) => child.id),
        status: this.normalizeStatus(statusName),
        priority: this.normalizePriority(page.properties.Priority?.select?.name),
        tags: page.properties.Tags?.multi_select?.map(tag => tag.name) || [],
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
        notionUrl: page.url,
        clickUpId,
      };

      nodes.set(page.id, node);
    });

    // Build parent-child relationships if not explicitly defined
    this.buildRelationships(nodes);

    return nodes;
  }

  private normalizeStatus(status?: string): 'todo' | 'in-progress' | 'done' | 'blocked' | undefined {
    if (!status) return undefined;

    const normalized = status.toLowerCase();

    // Map various status formats to our standard ones
    if (normalized.includes('open') || normalized.includes('todo')) return 'todo';
    if (normalized.includes('progress') || normalized.includes('development') || normalized.includes('analysis')) return 'in-progress';
    if (normalized.includes('done') || normalized.includes('closed') || normalized.includes('released')) return 'done';
    if (normalized.includes('blocked')) return 'blocked';

    return 'todo'; // default
  }

  private normalizePriority(priority?: string): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (!priority) return undefined;

    const normalized = priority.toLowerCase();

    if (normalized.includes('low')) return 'low';
    if (normalized.includes('medium') || normalized.includes('normal')) return 'medium';
    if (normalized.includes('high')) return 'high';
    if (normalized.includes('critical') || normalized.includes('urgent')) return 'critical';

    return 'medium'; // default
  }

  private buildRelationships(nodes: Map<string, ProblemNode>) {
    // First pass: collect all parent-child relationships
    nodes.forEach(node => {
      // If a node has a parent, ensure the parent knows about this child
      if (node.parentId) {
        const parentNode = nodes.get(node.parentId);
        if (parentNode && !parentNode.children.includes(node.id)) {
          parentNode.children.push(node.id);
        }
      }

      // If a node has children, ensure each child knows about its parent
      node.children.forEach(childId => {
        const childNode = nodes.get(childId);
        if (childNode && !childNode.parentId) {
          childNode.parentId = node.id;
        }
      });
    });

    // Second pass: infer relationships from the Problems database structure
    // In the Problems database, we might have a "Parent Problem" field
    nodes.forEach((node, nodeId) => {
      // Look for other nodes that might be children based on naming or other patterns
      nodes.forEach((otherNode, otherNodeId) => {
        if (nodeId !== otherNodeId) {
          // If another node mentions this node as parent but relationship isn't set
          if (otherNode.parentId === nodeId && !node.children.includes(otherNodeId)) {
            node.children.push(otherNodeId);
          }
        }
      });
    });
  }

  buildTree(nodes: Map<string, ProblemNode>): ProblemTree {
    // The known root node ID
    const ROOT_NODE_ID = '269c2345-ab46-819c-9b6c-e2eda20aba4c';

    // Find the root node
    let rootNode = nodes.get(ROOT_NODE_ID);

    if (!rootNode) {
      // Try alternative formats (with/without dashes)
      const alternativeId = ROOT_NODE_ID.replace(/-/g, '');
      rootNode = nodes.get(alternativeId);

      if (!rootNode) {
        // If still not found, look through all nodes
        nodes.forEach((node, id) => {
          if (id.replace(/-/g, '') === alternativeId) {
            rootNode = node;
          }
        });
      }
    }

    if (!rootNode) {
      console.log(`Root node ${ROOT_NODE_ID} not found, building hierarchy from parent-child relationships`);

      // Fall back to finding nodes with parent relationships
      const nodesWithRelationships = new Map<string, ProblemNode>();
      const parentIds = new Set<string>();

      // Find all nodes that are part of a hierarchy
      nodes.forEach(node => {
        if (node.parentId) {
          parentIds.add(node.parentId);
          nodesWithRelationships.set(node.id, node);
        }
      });

      // Add parent nodes
      parentIds.forEach(parentId => {
        const parent = nodes.get(parentId);
        if (parent) {
          nodesWithRelationships.set(parentId, parent);
        }
      });

      // Find root nodes (nodes that are parents but have no parent themselves)
      const rootNodes: ProblemNode[] = [];
      nodesWithRelationships.forEach(node => {
        if (!node.parentId && (node.children.length > 0 || parentIds.has(node.id))) {
          rootNodes.push(node);
        }
      });

      console.log(`Found ${rootNodes.length} root nodes with ${nodesWithRelationships.size} total nodes in hierarchy`);

      if (rootNodes.length === 0) {
        console.log('No hierarchy found in the data');
        return {
          root: null,
          nodes: new Map(),
        };
      }

      let root: ProblemNode | null = null;

      if (rootNodes.length === 1) {
        root = rootNodes[0];
      } else {
        // Multiple roots - create a virtual root
        root = {
          id: 'virtual-root',
          title: 'Problem Hierarchy',
          description: `${rootNodes.length} root problems`,
          parentId: null,
          children: rootNodes.map(n => n.id),
          status: undefined,
          priority: undefined,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notionUrl: '',
        };
        nodesWithRelationships.set('virtual-root', root);
        rootNodes.forEach(n => {
          n.parentId = 'virtual-root';
        });
      }

      return {
        root,
        nodes: nodesWithRelationships,
      };
    }

    // Found the root node - build tree from it
    console.log(`Found root node: ${rootNode.title}`);
    rootNode.parentId = null; // Ensure it's marked as root

    const nodesInHierarchy = new Map<string, ProblemNode>();
    const visited = new Set<string>();

    // Recursive function to add a node and all its descendants
    const addNodeAndDescendants = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes.get(nodeId);
      if (!node) return;

      nodesInHierarchy.set(nodeId, node);

      // Add all children
      node.children.forEach(childId => {
        addNodeAndDescendants(childId);
      });

      // Also check for nodes that reference this node as parent
      nodes.forEach((otherNode, otherId) => {
        if (otherNode.parentId === nodeId && !visited.has(otherId)) {
          if (!node.children.includes(otherId)) {
            node.children.push(otherId);
          }
          addNodeAndDescendants(otherId);
        }
      });
    };

    // Start building from root
    addNodeAndDescendants(rootNode.id);

    console.log(`Built hierarchy with ${nodesInHierarchy.size} nodes from root`);

    return {
      root: rootNode,
      nodes: nodesInHierarchy,
    };
  }
}

export const notionDirectAPI = new NotionDirectAPI();
export default notionDirectAPI;