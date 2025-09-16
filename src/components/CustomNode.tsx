import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

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
}

const CustomNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
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

  // Simpler color scheme based on depth - all white backgrounds
  const getNodeStyle = () => {
    if (isRoot) {
      return 'bg-white text-blue-700 border-blue-600 font-bold';
    }
    if (data.depth === 1) {
      return 'bg-white text-gray-900 border-blue-200';
    }
    return 'bg-white text-gray-800 border-gray-300';
  };

  const nodeStyle = getNodeStyle();

  return (
    <div
      className={`
        rounded-lg border transition-all cursor-pointer
        ${nodeStyle}
        ${selected ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-md hover:shadow-lg'}
        ${isRoot ? 'text-base min-w-[200px]' : 'text-sm min-w-[120px]'}
        max-w-[250px] relative
      `}
      style={{
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: 'white',
        border: '1px solid #d1d5db'
      }}
    >
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

      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 bg-gray-400 border-gray-600"
          style={{ background: '#6b7280', border: '1px solid #4b5563' }}
        />
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div
            className="font-medium line-clamp-2 hover:underline cursor-pointer"
            onClick={handleTitleClick}
            title={data.notionUrl ? 'Click to open in Notion' : data.label}
            style={{ color: 'inherit' }}
          >
            {data.label}
          </div>
          {!isCollapsed && data.description && (
            <div className="text-xs opacity-70 mt-0.5 line-clamp-1">
              {data.description}
            </div>
          )}
        </div>
      </div>


      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-gray-400 border-gray-600"
        style={{ background: '#6b7280', border: '1px solid #4b5563' }}
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;