import type { Node, Edge } from 'reactflow';

export interface MindMapNode extends Node {
  data: {
    label: string;
    description?: string;
    status?: 'todo' | 'in-progress' | 'done' | 'blocked';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    expanded?: boolean;
    depth?: number;
    notionUrl?: string;
  };
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface MindMapConfig {
  layout: 'horizontal' | 'vertical' | 'radial';
  nodeSpacing: {
    x: number;
    y: number;
  };
  maxDepth?: number;
  showLabels: boolean;
  enableAnimation: boolean;
}