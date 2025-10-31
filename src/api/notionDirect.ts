import type { NotionProblemPage, ProblemNode, ProblemTree } from '../types/notion';

// Direct Notion API implementation using server proxy
class NotionDirectAPI {
  private apiKey: string | null = null;
  private databases = {
    problems: '268c2345-ab46-80e0-876d-ddbd9ebb5383', // Problems database ID
    objectives: '272c2345ab468057a199e6f406cc6384'     // Objective database ID
  };
  private currentDatabase: 'problems' | 'objectives' = 'problems';

  initialize(apiKey: string) {
    this.apiKey = apiKey;
  }

  setCurrentDatabase(database: 'problems' | 'objectives') {
    this.currentDatabase = database;
  }

  getCurrentDatabase() {
    return this.currentDatabase;
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
        // Use BASE_URL to automatically adapt to deployment environment
        const apiBaseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
        const apiPath = apiBaseUrl ? `${apiBaseUrl}/api/notion/query` : '/api/notion/query';

        const response = await fetch(
          apiPath,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              apiKey: this.apiKey,
              databaseId: this.databases[this.currentDatabase],
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

  async fetchPagesByIds(pageIds: string[]): Promise<NotionProblemPage[]> {
    if (!this.apiKey) {
      throw new Error('Notion API key not provided');
    }

    if (!pageIds || pageIds.length === 0) {
      return [];
    }

    try {
      const apiBaseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
      const apiPath = apiBaseUrl ? `${apiBaseUrl}/api/notion/pages` : '/api/notion/pages';

      const response = await fetch(
        apiPath,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: this.apiKey,
            pageIds: pageIds
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Fetched ${data.pages.length} pages by IDs`);
      return data.pages;
    } catch (error) {
      console.error('Error fetching pages from Notion:', error);
      throw error;
    }
  }

  convertToNodes(pages: NotionProblemPage[]): Map<string, ProblemNode> {
    const nodes = new Map<string, ProblemNode>();

    pages.forEach(page => {
      // Handle both 'Title' and 'Name' properties (database uses 'Title')
      const titleProperty = page.properties.Title || page.properties.title || page.properties.Name;
      const title = titleProperty?.title?.[0]?.plain_text || 'Untitled';

      // Handle different field names based on current database
      let parentRelation: any[] = [];
      let childrenRelation: any[] = [];

      if (this.currentDatabase === 'problems') {
        // For Problems database, we look for 'Parent Problem' field specifically
        parentRelation = page.properties['Parent Problem']?.relation || [];
        // For children, look for 'Child Problem(s)' field
        childrenRelation = page.properties['Child Problem(s)']?.relation || [];
      } else if (this.currentDatabase === 'objectives') {
        // For Objective database, we look for 'Parent Objective' field
        parentRelation = page.properties['Parent Objective']?.relation || [];
        // For children, look for 'Child' field
        childrenRelation = page.properties['Child']?.relation || [];
      }

      // Extract Before/After relationships for Objectives database
      const beforeRelation = this.currentDatabase === 'objectives' ?
        (page.properties['Before']?.relation || []) : [];
      const afterRelation = this.currentDatabase === 'objectives' ?
        (page.properties['After']?.relation || []) : [];


      // Extract ClickUp ID if available
      const clickUpId = (page.properties as any)['ID']?.rich_text?.[0]?.plain_text ||
                       page.properties['ClickUp ID']?.rich_text?.[0]?.plain_text ||
                       (page.properties as any)['ClickUp_ID']?.rich_text?.[0]?.plain_text ||
                       (page.properties as any)['clickup_id']?.rich_text?.[0]?.plain_text;

      // Extract status from the Status field
      const statusProperty = page.properties.Status;
      const statusName = (statusProperty as any)?.status?.name || (statusProperty as any)?.select?.name;





      // Extract Impact field (could be select field with text values or number field)
      const impactSelect = page.properties.Impact?.select?.name;
      const impactNumber = page.properties.Impact?.number;
      const impactValue = impactNumber !== undefined ? impactNumber : this.normalizeImpact(impactSelect);

      // Debug: Log impact value assignment
      if (impactValue && Math.random() < 0.02) {
        console.log('Processing node with impact:', {
          title: titleProperty?.title?.[0]?.plain_text || 'Untitled',
          rawImpactSelect: impactSelect,
          rawImpactNumber: impactNumber,
          processedImpact: impactValue,
          impactType: typeof impactValue
        });
      }

      // Extract Effort field (it's a number field)
      const effortValue = page.properties.Effort?.number;

      // Extract Solution relations (try both "Solution" and "Solution(s)")
      const solutionRelation = page.properties.Solution?.relation ||
                              page.properties['Solution(s)']?.relation ||
                              [];

      // Debug: Log all available relation properties for objectives
      if (this.currentDatabase === 'objectives') {
        const relationProps = Object.keys(page.properties).filter(key => {
          const prop = (page.properties as any)[key];
          return prop && prop.relation;
        });
        if (relationProps.length > 0) {
          console.log(`Objective "${title}" has these relation properties:`, relationProps);
        }
      }

      // Extract problems relationships (try "Problems", "problems", and "Problems_OpportunityTree" field names)
      const problemsRelation = page.properties.Problems?.relation ||
                               page.properties.problems?.relation ||
                               page.properties.Problems_OpportunityTree?.relation || [];

      // Debug: Log when we find problems relation
      if (problemsRelation.length > 0) {
        console.log(`Page "${title}" has ${problemsRelation.length} problems:`, problemsRelation.map((p: any) => p.id));
      }

      // Extract Objective relationships (problems referencing objectives)
      const objectiveRelation = page.properties.Objective?.relation || [];

      // Extract Type field (e.g., "OKR", "Initiative", etc.)
      const typeValue = page.properties.Type?.select?.name;

      // Extract Period field (e.g., "Q1 2025", "2025", etc.)
      const periodValue = page.properties.Period?.select?.name;

      const node: ProblemNode = {
        id: page.id,
        title,
        description: page.properties.Description?.rich_text?.[0]?.plain_text,
        parentId: parentRelation[0]?.id || null,
        parentIds: parentRelation.map((parent: any) => parent.id),
        children: childrenRelation.map((child: any) => child.id),
        status: this.normalizeStatus(statusName),
        priority: this.normalizePriority(page.properties.Priority?.select?.name),
        tags: page.properties.Tags?.multi_select?.map(tag => tag.name) || [],
        type: typeValue,
        period: periodValue,
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
        notionUrl: page.url,
        clickUpId,
        impact: impactValue,
        effort: effortValue,
        solutionIds: solutionRelation.map((solution: any) => solution.id),
        beforeIds: beforeRelation.map((before: any) => before.id),
        afterIds: afterRelation.map((after: any) => after.id),
        problemIds: problemsRelation.map((problem: any) => problem.id),
        objectiveIds: objectiveRelation.map((objective: any) => objective.id),
        isObjective: this.currentDatabase === 'objectives',
      };


      // Debug: Log node creation for items with impact
      if (impactValue && Math.random() < 0.02) {
        console.log('Created node with impact:', {
          title: node.title,
          impact: node.impact,
          effort: node.effort,
          originalImpact: impactValue,
          originalEffort: effortValue
        });
      }

      nodes.set(page.id, node);
    });

    // Build parent-child relationships if not explicitly defined
    this.buildRelationships(nodes);


    return nodes;
  }

  private normalizeStatus(status?: string): 'todo' | 'in-progress' | 'done' | 'blocked' | undefined {
    if (!status) return undefined;

    const normalized = status.toLowerCase();

    // Handle numeric prefixed formats like "10 - Closed", "5 - In Progress", etc.
    const statusText = normalized.replace(/^\d+\s*[-–]\s*/, '').trim();

    // Map various status formats to our standard ones
    if (statusText.includes('open') || statusText.includes('todo') || statusText.includes('not started')) return 'todo';
    if (statusText.includes('progress') || statusText.includes('development') || statusText.includes('analysis') || statusText.includes('working')) return 'in-progress';
    if (statusText.includes('done') || statusText.includes('closed') || statusText.includes('released') || statusText.includes('complete')) return 'done';
    if (statusText.includes('blocked') || statusText.includes('paused') || statusText.includes('stopped')) return 'blocked';

    // Also check the original normalized string in case there's no numeric prefix
    if (normalized.includes('open') || normalized.includes('todo') || normalized.includes('not started')) return 'todo';
    if (normalized.includes('progress') || normalized.includes('development') || normalized.includes('analysis') || normalized.includes('working')) return 'in-progress';
    if (normalized.includes('done') || normalized.includes('closed') || normalized.includes('released') || normalized.includes('complete')) return 'done';
    if (normalized.includes('blocked') || normalized.includes('paused') || normalized.includes('stopped')) return 'blocked';

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

  private normalizeImpact(impact?: string): number | undefined {
    if (!impact) return undefined;

    const normalized = impact.toLowerCase();

    if (normalized.includes('low')) return 2;
    if (normalized.includes('medium') || normalized.includes('normal')) return 4;
    if (normalized.includes('high')) return 6;
    if (normalized.includes('critical') || normalized.includes('urgent')) return 8;

    return 4; // default to medium
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

  buildTree(nodes: Map<string, ProblemNode>, customRootId?: string): ProblemTree {
    // Use database-specific root nodes or custom root
    let ROOT_NODE_ID: string | undefined = customRootId;

    // Only use hardcoded root for Problems database if no custom root specified
    if (!ROOT_NODE_ID && this.currentDatabase === 'problems') {
      ROOT_NODE_ID = '269c2345-ab46-819c-9b6c-e2eda20aba4c';
    }

    // Find the root node
    let rootNode: ProblemNode | undefined;

    if (ROOT_NODE_ID) {
      rootNode = nodes.get(ROOT_NODE_ID);

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
    }

    if (!rootNode) {
      const dbName = this.currentDatabase === 'problems' ? 'Problems' : 'Objectives';
      if (ROOT_NODE_ID) {
        console.log(`${dbName} root node ${ROOT_NODE_ID} not found, building hierarchy from parent-child relationships`);
      } else {
        console.log(`No specific root node for ${dbName} database, building hierarchy from parent-child relationships`);
      }

      // For Objectives database, include ALL nodes (not just hierarchical ones)
      let nodesWithRelationships = new Map<string, ProblemNode>();
      let parentIds = new Set<string>();

      if (this.currentDatabase === 'objectives') {
        // Include ALL nodes from Objectives database
        nodesWithRelationships = new Map(nodes);
        console.log(`Including ALL ${nodes.size} nodes from Objectives database for timeline view`);
      } else {
        // For Problems database, find only nodes that are part of a hierarchy
        nodes.forEach(node => {
          if (node.parentId) {
            parentIds.add(node.parentId);
            nodesWithRelationships.set(node.id, node);
          }
        });
      }

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

  getNodesFromFirstThreeLevels(nodes: Map<string, ProblemNode>): ProblemNode[] {
    // Find ALL root nodes (nodes with no parent AND have children)
    const allRootNodes: ProblemNode[] = [];

    // Find all root nodes (nodes with no parent and have children)
    const titleTracker = new Map<string, { hasParent: boolean, hasChildren: boolean, nodes: ProblemNode[] }>();

    // First pass: track all nodes by title to identify duplicates
    nodes.forEach(node => {
      if (!titleTracker.has(node.title)) {
        titleTracker.set(node.title, { hasParent: false, hasChildren: false, nodes: [] });
      }
      const tracker = titleTracker.get(node.title)!;
      tracker.nodes.push(node);
      if (node.parentId !== null) tracker.hasParent = true;
      if (node.children.length > 0) tracker.hasChildren = true;
    });

    // Second pass: only add nodes as root if they qualify AND are not duplicates with relationships
    nodes.forEach(node => {
      if (node.parentId === null && node.children.length > 0) {
        const tracker = titleTracker.get(node.title)!;

        // Skip if this title has duplicate nodes where some have parents
        // This filters out orphaned duplicates that should be in hierarchies
        if (tracker.nodes.length > 1 && tracker.hasParent && !node.children.length) {
          console.log(`⚠️  SKIPPING DUPLICATE: "${node.title}" (orphaned duplicate, main node has relationships)`);
          return;
        }

        allRootNodes.push(node);
      }
    });

    // Log duplicate detection results
    const duplicates = Array.from(titleTracker.entries()).filter(([_, tracker]) => tracker.nodes.length > 1);
    if (duplicates.length > 0) {
      console.log(`🔍 DUPLICATE DETECTION: Found ${duplicates.length} titles with multiple entries:`);
      duplicates.forEach(([title, tracker]) => {
        console.log(`  "${title}": ${tracker.nodes.length} entries, hasParent: ${tracker.hasParent}, hasChildren: ${tracker.hasChildren}`);
        tracker.nodes.forEach(node => {
          console.log(`    - ID: ${node.id}, parentId: ${node.parentId}, children: ${node.children.length}`);
        });
      });
    }

    console.log(`Found ${allRootNodes.length} root nodes:`, allRootNodes.map(n => n.title));

    // Return only the root nodes, sorted by title
    return allRootNodes.sort((a, b) => a.title.localeCompare(b.title));
  }

  private getNodeDepthFromRoot(nodes: Map<string, ProblemNode>, node: ProblemNode, rootId: string): number {
    let depth = 0;
    let current = node;

    while (current.id !== rootId && current.parentId) {
      depth++;
      const parent = nodes.get(current.parentId);
      if (!parent) break;
      current = parent;
    }

    return depth;
  }
}

export const notionDirectAPI = new NotionDirectAPI();
export default notionDirectAPI;