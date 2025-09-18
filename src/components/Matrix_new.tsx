import React, { useMemo } from 'react';
import { useNotionStore } from '../store/notionStore';
import type { ProblemNode } from '../types/notion';

interface MatrixTicket extends ProblemNode {
  quadrant: 'high-impact-low-effort' | 'high-impact-high-effort' | 'low-impact-low-effort' | 'low-impact-high-effort';
  positionX: number;
  positionY: number;
}

const Matrix_new: React.FC = () => {
  const { problemTree } = useNotionStore();

  const matrixTickets = useMemo(() => {
    const tickets: MatrixTicket[] = [];

    // Only process if we have a problem tree
    if (!problemTree) return tickets;

    problemTree.nodes.forEach((node) => {
      // Only include nodes that have a parent (not root nodes) and have both impact and effort values
      if (node.parentId !== null &&
          node.impact !== undefined && node.effort !== undefined &&
          node.impact !== null && node.effort !== null) {

        // Ensure values are within 0-10 range
        const impact = Math.max(0, Math.min(10, node.impact));
        const effort = Math.max(0, Math.min(10, node.effort));

        // Determine quadrant based on 5.0 threshold (middle of 0-10 scale)
        const isHighImpact = impact > 5;
        const isHighEffort = effort > 5;

        let quadrant: MatrixTicket['quadrant'];
        if (isHighImpact && !isHighEffort) {
          quadrant = 'high-impact-low-effort';   // Top-left
        } else if (isHighImpact && isHighEffort) {
          quadrant = 'high-impact-high-effort';  // Top-right
        } else if (!isHighImpact && !isHighEffort) {
          quadrant = 'low-impact-low-effort';    // Bottom-left
        } else {
          quadrant = 'low-impact-high-effort';   // Bottom-right
        }

        tickets.push({
          ...node,
          quadrant,
          positionX: effort,
          positionY: impact,
        });
      }
    });

    return tickets;
  }, [problemTree]);

  const getTicketsByQuadrant = (quadrant: MatrixTicket['quadrant']) => {
    return matrixTickets.filter(ticket => ticket.quadrant === quadrant);
  };

  const handleTicketClick = (ticket: MatrixTicket) => {
    if (ticket.notionUrl) {
      window.open(ticket.notionUrl, '_blank');
    }
  };

  const renderQuadrantTickets = (tickets: MatrixTicket[], maxWidth: number, maxHeight: number) => {
    return tickets.map((ticket, index) => {
      // Position based on actual impact/effort values within quadrant space
      // Map the 0-10 scale to the available quadrant space
      let xPosition, yPosition;

      // Determine positioning within quadrant based on actual values
      if (ticket.quadrant === 'high-impact-low-effort') {
        // Top-left: lower effort = more left, higher impact = more top
        xPosition = ((5 - ticket.positionX) / 5) * (maxWidth - 180) + 10; // Invert effort (0=right, 5=left)
        yPosition = ((ticket.positionY - 5) / 5) * (maxHeight - 100) + 10; // Impact (5=bottom, 10=top)
        yPosition = (maxHeight - 100) - yPosition + 10; // Flip Y for web coordinates
      } else if (ticket.quadrant === 'high-impact-high-effort') {
        // Top-right: higher effort = more right, higher impact = more top
        xPosition = ((ticket.positionX - 5) / 5) * (maxWidth - 180) + 10; // Effort (5=left, 10=right)
        yPosition = ((ticket.positionY - 5) / 5) * (maxHeight - 100) + 10; // Impact (5=bottom, 10=top)
        yPosition = (maxHeight - 100) - yPosition + 10; // Flip Y for web coordinates
      } else if (ticket.quadrant === 'low-impact-low-effort') {
        // Bottom-left: lower effort = more left, lower impact = more bottom
        xPosition = ((5 - ticket.positionX) / 5) * (maxWidth - 180) + 10; // Invert effort
        yPosition = ((5 - ticket.positionY) / 5) * (maxHeight - 100) + 10; // Invert impact
      } else {
        // Bottom-right: higher effort = more right, lower impact = more bottom
        xPosition = ((ticket.positionX - 5) / 5) * (maxWidth - 180) + 10; // Effort
        yPosition = ((5 - ticket.positionY) / 5) * (maxHeight - 100) + 10; // Invert impact
      }

      // Add some offset for overlapping items
      const offsetX = (index % 3) * 15; // Slight horizontal offset
      const offsetY = Math.floor(index / 3) * 15; // Slight vertical offset

      const finalX = Math.max(10, Math.min(maxWidth - 180, xPosition + offsetX));
      const finalY = Math.max(10, Math.min(maxHeight - 80, yPosition + offsetY));

      const statusColors = {
        'todo': 'bg-gray-500',
        'in-progress': 'bg-blue-500',
        'done': 'bg-green-500',
        'blocked': 'bg-red-500'
      };

      return (
        <div
          key={ticket.id}
          className={`absolute cursor-pointer hover:z-50 ${statusColors[ticket.status || 'todo']} text-white text-sm px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-white`}
          style={{
            left: finalX,
            top: finalY,
            maxWidth: '180px',
            minWidth: '140px',
            minHeight: '60px',
            zIndex: 20 + index
          }}
          onClick={() => handleTicketClick(ticket)}
          title={`${ticket.title}\nImpact: ${ticket.impact}\nEffort: ${ticket.effort}\nStatus: ${ticket.status || 'todo'}`}
        >
          <div className="font-medium text-sm leading-tight">{ticket.title}</div>
          <div className="text-xs opacity-75 mt-1">I:{ticket.impact} E:{ticket.effort}</div>
        </div>
      );
    });
  };

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Impact-Effort Matrix</h1>
        <p className="text-gray-600 text-sm">
          Showing {matrixTickets.length} problems with both impact and effort values
        </p>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 bg-gray-300 p-2 min-h-0">
        {/* High Impact, Low Effort - DO FIRST */}
        <div className="relative bg-green-50 border-4 border-green-400 rounded-lg overflow-hidden">
          <div className="absolute top-4 left-4 bg-green-200 border-2 border-green-500 rounded-lg p-3 z-10 shadow-lg">
            <div className="font-bold text-lg text-green-800">DO FIRST</div>
            <div className="text-sm text-green-700">High Impact, Low Effort</div>
            <div className="text-xs text-green-600 mt-1">Quick Wins</div>
          </div>
          <div className="absolute inset-0 pt-2 pl-2">
            {renderQuadrantTickets(
              getTicketsByQuadrant('high-impact-low-effort'),
              400,
              300
            )}
          </div>
        </div>

        {/* High Impact, High Effort - DO NEXT */}
        <div className="relative bg-yellow-50 border-4 border-yellow-400 rounded-lg overflow-hidden">
          <div className="absolute top-4 right-4 bg-yellow-200 border-2 border-yellow-500 rounded-lg p-3 z-10 shadow-lg">
            <div className="font-bold text-lg text-yellow-800">DO NEXT</div>
            <div className="text-sm text-yellow-700">High Impact, High Effort</div>
            <div className="text-xs text-yellow-600 mt-1">Major Projects</div>
          </div>
          <div className="absolute inset-0 pt-2 pl-2">
            {renderQuadrantTickets(
              getTicketsByQuadrant('high-impact-high-effort'),
              400,
              300
            )}
          </div>
        </div>

        {/* Low Impact, Low Effort - DO LATER */}
        <div className="relative bg-blue-50 border-4 border-blue-400 rounded-lg overflow-hidden">
          <div className="absolute bottom-4 left-4 bg-blue-200 border-2 border-blue-500 rounded-lg p-3 z-10 shadow-lg">
            <div className="font-bold text-lg text-blue-800">DO LATER</div>
            <div className="text-sm text-blue-700">Low Impact, Low Effort</div>
            <div className="text-xs text-blue-600 mt-1">Fill-in Tasks</div>
          </div>
          <div className="absolute inset-0 pt-2 pl-2">
            {renderQuadrantTickets(
              getTicketsByQuadrant('low-impact-low-effort'),
              400,
              300
            )}
          </div>
        </div>

        {/* Low Impact, High Effort - AVOID */}
        <div className="relative bg-red-50 border-4 border-red-400 rounded-lg overflow-hidden">
          <div className="absolute bottom-4 right-4 bg-red-200 border-2 border-red-500 rounded-lg p-3 z-10 shadow-lg">
            <div className="font-bold text-lg text-red-800">AVOID</div>
            <div className="text-sm text-red-700">Low Impact, High Effort</div>
            <div className="text-xs text-red-600 mt-1">Time Wasters</div>
          </div>
          <div className="absolute inset-0 pt-2 pl-2">
            {renderQuadrantTickets(
              getTicketsByQuadrant('low-impact-high-effort'),
              400,
              300
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-16 right-4 bg-white border-2 border-gray-300 rounded-lg p-3 shadow-lg z-50">
        <div className="font-bold text-sm text-gray-800 mb-2">Status Colors</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Blocked</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
          Click problems to view in Notion
        </div>
      </div>

      {/* No Data Message */}
      {matrixTickets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-gray-300 rounded-xl p-8 shadow-lg max-w-md">
            <h3 className="font-bold text-gray-800 text-lg mb-3">No Matrix Data</h3>
            <p className="text-gray-600 text-sm mb-3">
              No problems found with both impact and effort values in this branch.
            </p>
            <p className="text-gray-500 text-xs">
              Add numeric impact and effort values to your Notion problems to see them positioned in the matrix.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matrix_new;