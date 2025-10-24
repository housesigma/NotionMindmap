import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { useNotionStore } from '../store/notionStore';

interface CustomNodeData {
  label: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  expanded?: boolean;
  depth?: number;
  notionUrl?: string;
  isCollapsed?: boolean;
  hasChildren?: boolean;
  onToggleCollapse?: () => void;
  isObjective?: boolean;
  isOKR?: boolean;
  isBAU?: boolean;
  period?: string;
}

const CustomNode = memo(({ data, selected, id }: NodeProps<CustomNodeData>) => {
  const { setSelectedNode } = useNotionStore();
  const isRoot = data.depth === 0;
  const hasChildren = data.hasChildren || false;
  const isCollapsed = data.isCollapsed || false;

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.notionUrl) {
      window.open(data.notionUrl, '_blank');
    }
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onToggleCollapse) {
      data.onToggleCollapse();
    }
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(id);
  };

  // Status-based color scheme matching Notion's colors
  const getNodeStyle = () => {
    const status = data.status || 'todo';
    const isProblemNode = data.isObjective === false;

    // OKR nodes get green color scheme
    if (data.isOKR) {
      const okrStyles = {
        'todo': {
          bg: 'bg-green-50',
          text: 'text-green-900',
          border: 'border-green-500',
          accent: 'bg-green-500'
        },
        'in-progress': {
          bg: 'bg-green-100',
          text: 'text-green-900',
          border: 'border-green-600',
          accent: 'bg-green-600'
        },
        'done': {
          bg: 'bg-green-200',
          text: 'text-green-900',
          border: 'border-green-700',
          accent: 'bg-green-700'
        },
        'blocked': {
          bg: 'bg-red-200',
          text: 'text-red-900',
          border: 'border-red-600',
          accent: 'bg-red-600'
        }
      };

      const style = okrStyles[status];
      const rootClass = isRoot ? 'font-bold' : '';
      return `${style.bg} ${style.text} ${style.border} ${rootClass}`;
    }

    // BAU nodes get blue color scheme
    if (data.isBAU) {
      const bauStyles = {
        'todo': {
          bg: 'bg-blue-50',
          text: 'text-blue-900',
          border: 'border-blue-500',
          accent: 'bg-blue-500'
        },
        'in-progress': {
          bg: 'bg-blue-100',
          text: 'text-blue-900',
          border: 'border-blue-600',
          accent: 'bg-blue-600'
        },
        'done': {
          bg: 'bg-blue-200',
          text: 'text-blue-900',
          border: 'border-blue-700',
          accent: 'bg-blue-700'
        },
        'blocked': {
          bg: 'bg-red-200',
          text: 'text-red-900',
          border: 'border-red-600',
          accent: 'bg-red-600'
        }
      };

      const style = bauStyles[status];
      const rootClass = isRoot ? 'font-bold' : '';
      return `${style.bg} ${style.text} ${style.border} ${rootClass}`;
    }

    // Problem nodes get a distinct orange/amber color scheme
    if (isProblemNode) {
      const problemStyles = {
        'todo': {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          border: 'border-amber-400',
          accent: 'bg-amber-400'
        },
        'in-progress': {
          bg: 'bg-orange-100',
          text: 'text-orange-900',
          border: 'border-orange-500',
          accent: 'bg-orange-500'
        },
        'done': {
          bg: 'bg-yellow-100',
          text: 'text-yellow-900',
          border: 'border-yellow-500',
          accent: 'bg-yellow-500'
        },
        'blocked': {
          bg: 'bg-red-200',
          text: 'text-red-900',
          border: 'border-red-600',
          accent: 'bg-red-600'
        }
      };

      const style = problemStyles[status];
      const rootClass = isRoot ? 'font-bold' : '';
      return `${style.bg} ${style.text} ${style.border} ${rootClass}`;
    }

    // Objective nodes use the original color scheme
    const statusStyles = {
      'todo': {
        bg: 'bg-gray-100',
        text: 'text-gray-900',
        border: 'border-gray-400',
        accent: 'bg-gray-400'
      },
      'in-progress': {
        bg: 'bg-blue-100',
        text: 'text-blue-900',
        border: 'border-blue-400',
        accent: 'bg-blue-500'
      },
      'done': {
        bg: 'bg-green-100',
        text: 'text-green-900',
        border: 'border-green-400',
        accent: 'bg-green-500'
      },
      'blocked': {
        bg: 'bg-red-100',
        text: 'text-red-900',
        border: 'border-red-400',
        accent: 'bg-red-500'
      }
    };

    const style = statusStyles[status];
    const rootClass = isRoot ? 'font-bold' : '';

    return `${style.bg} ${style.text} ${style.border} ${rootClass}`;
  };

  // Get status indicator color
  const getStatusIndicator = () => {
    const status = data.status || 'todo';
    const isProblemNode = data.isObjective === false;

    // OKR nodes get green status indicators
    if (data.isOKR) {
      const okrStatusColors = {
        'todo': 'bg-green-500',
        'in-progress': 'bg-green-600',
        'done': 'bg-green-700',
        'blocked': 'bg-red-600'
      };
      return okrStatusColors[status];
    }

    // BAU nodes get blue status indicators
    if (data.isBAU) {
      const bauStatusColors = {
        'todo': 'bg-blue-500',
        'in-progress': 'bg-blue-600',
        'done': 'bg-blue-700',
        'blocked': 'bg-red-600'
      };
      return bauStatusColors[status];
    }

    // Problem nodes get orange/amber status indicators
    if (isProblemNode) {
      const problemStatusColors = {
        'todo': 'bg-amber-400',
        'in-progress': 'bg-orange-500',
        'done': 'bg-yellow-500',
        'blocked': 'bg-red-600'
      };
      return problemStatusColors[status];
    }

    // Objective nodes use the original status indicators
    const statusColors = {
      'todo': 'bg-gray-400',
      'in-progress': 'bg-blue-500',
      'done': 'bg-green-500',
      'blocked': 'bg-red-500'
    };
    return statusColors[status];
  };

  const nodeStyle = getNodeStyle();
  const statusIndicator = getStatusIndicator();

  // Get inline background and border colors for OKR/BAU nodes
  const getInlineStyles = () => {
    const status = data.status || 'todo';
    const baseStyle = {
      paddingLeft: '24px',
      paddingRight: '24px',
      paddingTop: '16px',
      paddingBottom: '16px'
    };

    if (data.isOKR) {
      const okrColors = {
        'todo': { bg: '#f0fdf4', border: '#22c55e', color: '#14532d' },
        'in-progress': { bg: '#dcfce7', border: '#16a34a', color: '#14532d' },
        'done': { bg: '#bbf7d0', border: '#15803d', color: '#14532d' },
        'blocked': { bg: '#fecaca', border: '#dc2626', color: '#7f1d1d' }
      };
      const colors = okrColors[status];
      return { ...baseStyle, backgroundColor: colors.bg, borderColor: colors.border, color: colors.color };
    }

    if (data.isBAU) {
      const bauColors = {
        'todo': { bg: '#eff6ff', border: '#3b82f6', color: '#1e3a8a' },
        'in-progress': { bg: '#dbeafe', border: '#2563eb', color: '#1e3a8a' },
        'done': { bg: '#bfdbfe', border: '#1d4ed8', color: '#1e3a8a' },
        'blocked': { bg: '#fecaca', border: '#dc2626', color: '#7f1d1d' }
      };
      const colors = bauColors[status];
      return { ...baseStyle, backgroundColor: colors.bg, borderColor: colors.border, color: colors.color };
    }

    return baseStyle;
  };

  return (
    <div
      className={`
        rounded-lg border transition-all cursor-pointer
        ${nodeStyle}
        ${selected ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-md hover:shadow-lg'}
        ${isRoot ? 'text-lg min-w-[200px]' : 'text-base min-w-[150px]'}
        max-w-[280px] relative
      `}
      style={getInlineStyles()}
      onClick={handleNodeClick}
    >
      {/* Period label above the node on the left */}
      {data.period && (
        <div
          className="absolute text-gray-600 text-xs font-medium"
          style={{
            fontSize: '11px',
            lineHeight: '1.2',
            top: '-18px',
            left: '0px',
            zIndex: 10,
          }}
        >
          {data.period}
        </div>
      )}

      {/* OKR Badge above the node */}
      {data.isOKR && (
        <div
          className="absolute bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-sm"
          style={{
            fontSize: '10px',
            lineHeight: '1.2',
            top: '-12px',
            right: data.isBAU ? '48px' : '8px', // Move left if BAU badge is also present
            zIndex: 10,
          }}
        >
          OKR
        </div>
      )}

      {/* BAU Badge above the node */}
      {data.isBAU && (
        <div
          className="absolute bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-sm"
          style={{
            fontSize: '10px',
            lineHeight: '1.2',
            top: '-12px',
            right: '8px',
            zIndex: 10,
          }}
        >
          BAU
        </div>
      )}

      {/* Collapse/Expand Button at Connection Point */}
      {hasChildren && (
        <button
          onClick={handleToggleClick}
          className="absolute top-1/2 transform -translate-y-1/2 w-7 h-7 rounded-full bg-white border-2 border-gray-600 text-gray-600 text-sm font-bold hover:bg-gray-50 hover:border-gray-700 flex items-center justify-center transition-all shadow-md z-10"
          title={isCollapsed ? 'Expand' : 'Collapse'}
          style={{
            minWidth: '28px',
            minHeight: '28px',
            right: '-14px' // Position it right at the edge where the handle is
          }}
        >
          {isCollapsed ? '+' : '−'}
        </button>
      )}

      {/* Left handle for horizontal connections (always visible) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2 h-2 bg-gray-400 border-gray-600"
        style={{ background: '#6b7280', border: '1px solid #4b5563' }}
      />

      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${statusIndicator} flex-shrink-0`}></div>
        <div className="flex-1">
          <div
            className="font-medium hover:underline cursor-pointer"
            onClick={handleTitleClick}
            title={data.notionUrl ? 'Click to open in Notion' : data.label}
            style={{ color: 'inherit', wordWrap: 'break-word' }}
          >
            {data.label}
          </div>
          {!isCollapsed && data.description && (
            <div className="text-sm opacity-70 mt-0.5 line-clamp-3">
              {data.description}
            </div>
          )}
        </div>
      </div>


      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2 h-2 bg-gray-400 border-gray-600"
        style={{ background: '#6b7280', border: '1px solid #4b5563' }}
      />

      {/* Top handle for receiving parent-child connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-2 h-2 bg-gray-400 border-gray-600"
        style={{ background: '#6b7280', border: '1px solid #4b5563' }}
      />

      {/* Bottom handle for sending parent-child connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-2 h-2 bg-gray-400 border-gray-600"
        style={{ background: '#6b7280', border: '1px solid #4b5563' }}
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;