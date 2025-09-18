export interface ProblemNode {
  id: string;
  title: string;
  description?: string;
  parentId: string | null;
  children: string[];
  status?: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  notionUrl?: string;
  clickUpId?: string;
  impact?: number;
  effort?: number;
  solutionIds?: string[];
}

export interface NotionProblemPage {
  id: string;
  properties: {
    Title?: {
      title: Array<{
        plain_text: string;
      }>;
    };
    title?: {
      title: Array<{
        plain_text: string;
      }>;
    };
    Name?: {
      title: Array<{
        plain_text: string;
      }>;
    };
    Parent?: {
      relation: Array<{
        id: string;
      }>;
    };
    Children?: {
      relation: Array<{
        id: string;
      }>;
    };
    Status?: {
      select?: {
        name: string;
      };
    };
    Priority?: {
      select?: {
        name: string;
      };
    };
    Tags?: {
      multi_select: Array<{
        name: string;
      }>;
    };
    Description?: {
      rich_text: Array<{
        plain_text: string;
      }>;
    };
    'ClickUp ID'?: {
      rich_text: Array<{
        plain_text: string;
      }>;
    };
    Impact?: {
      select?: {
        name: string;
      };
      number?: number;
    };
    Effort?: {
      number?: number;
    };
    Solution?: {
      relation: Array<{
        id: string;
      }>;
    };
  };
  created_time: string;
  last_edited_time: string;
  url: string;
}

export interface ProblemTree {
  root: ProblemNode | null;
  nodes: Map<string, ProblemNode>;
}