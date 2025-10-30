import React, { useState } from 'react';
import { Box, Typography, Paper, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useNotionStore } from '../store/notionStore';

const Matrix: React.FC = () => {
  const { problemTree, isLoading, isConnected } = useNotionStore();
  const [unmappablePanelExpanded, setUnmappablePanelExpanded] = useState(true);

  // Process nodes for matrix visualization
  const { matrixNodes, unmappableNodes } = React.useMemo(() => {
    if (!problemTree) return { matrixNodes: [], unmappableNodes: [] };

    const validNodes: any[] = [];
    const invalidNodes: any[] = [];

    Array.from(problemTree.nodes.values()).forEach(node => {
      if (node.parentId !== null) {
        if (node.impact !== undefined && node.effort !== undefined &&
            node.impact !== null && node.effort !== null) {
          validNodes.push({
            ...node,
            // Ensure values are within 0-10 range
            impact: Math.max(0, Math.min(10, node.impact)),
            effort: Math.max(0, Math.min(10, node.effort))
          });
        } else {
          invalidNodes.push(node);
        }
      }
    });

    return { matrixNodes: validNodes, unmappableNodes: invalidNodes };
  }, [problemTree]);

  // Calculate position within the matrix canvas
  const getNodePosition = (impact: number, effort: number) => {
    // Convert 0-10 scale to percentage within canvas
    const x = (effort / 10) * 100; // Effort on X-axis
    const y = ((10 - impact) / 10) * 100; // Impact on Y-axis (inverted because SVG Y grows downward)
    return { x, y };
  };

  if (!isConnected) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <Typography variant="h6" color="text.secondary">
          Please connect to Notion to view the matrix
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <Typography variant="h6" color="text.secondary">
          Loading matrix data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        p: 3,
        bgcolor: 'background.default'
      }}
    >
      {/* Matrix Container */}
      <Paper
        elevation={2}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'primary.200'
        }}
      >
        {/* Matrix Canvas */}
        <Box
          sx={{
            position: 'absolute',
            top: 80,
            left: 60,
            right: 20,
            bottom: 60,
            border: '2px solid',
            borderColor: 'primary.300',
            bgcolor: 'primary.50'
          }}
        >
          {/* Quadrant Dividers */}
          {/* Vertical center line */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '1px',
              bgcolor: 'primary.400',
              transform: 'translateX(-0.5px)'
            }}
          />

          {/* Horizontal center line */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              bgcolor: 'primary.400',
              transform: 'translateY(-0.5px)'
            }}
          />

          {/* Data Points Layer */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {matrixNodes.map((node) => {
              const { x, y } = getNodePosition(node.impact, node.effort);
              const nodeId = node.uniqueId || node.id.split('-').pop() || node.id.slice(-8);

              // Determine color based on quadrant
              const isHighImpact = node.impact > 5;
              const isHighEffort = node.effort > 5;
              let color = '#6b7280'; // default gray

              if (isHighImpact && !isHighEffort) {
                color = '#10b981'; // success green - Quick Wins
              } else if (isHighImpact && isHighEffort) {
                color = '#f59e0b'; // warning amber - Major Projects
              } else if (!isHighImpact && !isHighEffort) {
                color = '#3b82f6'; // info blue - Fill-ins
              } else if (!isHighImpact && isHighEffort) {
                color = '#ef4444'; // error red - Avoid
              }

              return (
                <g key={node.id}>
                  {/* Data Point Circle */}
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="6"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      pointerEvents: 'auto',
                      cursor: 'pointer'
                    }}
                  />

                  {/* Node ID Label */}
                  <text
                    x={`${x}%`}
                    y={`${y}%`}
                    dx="10"
                    dy="4"
                    fontSize="10"
                    fontWeight="600"
                    fill={color}
                    style={{
                      pointerEvents: 'none',
                      textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                    }}
                  >
                    {nodeId}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quadrant Labels */}
          {/* Top-left: High Impact, Low Effort */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              right: '50%',
              bottom: '50%',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              pointerEvents: 'none'
            }}
          >
            <Paper
              elevation={1}
              sx={{
                px: 1.5,
                py: 0.5,
                bgcolor: 'success.50',
                border: '1px solid',
                borderColor: 'success.200'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'success.800',
                  fontSize: '0.7rem'
                }}
              >
                🟢 Quick Wins
              </Typography>
            </Paper>
          </Box>

          {/* Top-right: High Impact, High Effort */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: '50%',
              right: 8,
              bottom: '50%',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              pointerEvents: 'none'
            }}
          >
            <Paper
              elevation={1}
              sx={{
                px: 1.5,
                py: 0.5,
                bgcolor: 'warning.50',
                border: '1px solid',
                borderColor: 'warning.200'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'warning.800',
                  fontSize: '0.7rem'
                }}
              >
                🟡 Major Projects
              </Typography>
            </Paper>
          </Box>

          {/* Bottom-left: Low Impact, Low Effort */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 8,
              right: '50%',
              bottom: 8,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
              pointerEvents: 'none'
            }}
          >
            <Paper
              elevation={1}
              sx={{
                px: 1.5,
                py: 0.5,
                bgcolor: 'info.50',
                border: '1px solid',
                borderColor: 'info.200'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'info.800',
                  fontSize: '0.7rem'
                }}
              >
                🔵 Fill-ins
              </Typography>
            </Paper>
          </Box>

          {/* Bottom-right: Low Impact, High Effort */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              right: 8,
              bottom: 8,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              pointerEvents: 'none'
            }}
          >
            <Paper
              elevation={1}
              sx={{
                px: 1.5,
                py: 0.5,
                bgcolor: 'error.50',
                border: '1px solid',
                borderColor: 'error.200'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'error.800',
                  fontSize: '0.7rem'
                }}
              >
                🔴 Avoid
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Y-axis (Impact) */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 80,
            bottom: 60,
            width: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Y-axis Label */}
          <Typography
            variant="subtitle2"
            sx={{
              transform: 'rotate(-90deg)',
              fontWeight: 600,
              color: 'primary.700',
              whiteSpace: 'nowrap'
            }}
          >
            Impact (Value)
          </Typography>

          {/* Y-axis Scale */}
          <Box
            sx={{
              position: 'absolute',
              right: 8,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column-reverse',
              justifyContent: 'space-between',
              alignItems: 'flex-end'
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <Box key={value} display="flex" alignItems="center" gap={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: value === 5 ? 600 : 400,
                    color: value === 5 ? 'primary.main' : 'text.secondary'
                  }}
                >
                  {value}
                </Typography>
                <Box
                  sx={{
                    width: value % 5 === 0 ? 8 : 4,
                    height: '1px',
                    bgcolor: value === 5 ? 'primary.main' : 'grey.400'
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* X-axis (Effort) */}
        <Box
          sx={{
            position: 'absolute',
            left: 60,
            right: 20,
            bottom: 0,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* X-axis Label */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: 'primary.700'
            }}
          >
            Effort (Complexity)
          </Typography>

          {/* X-axis Scale */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <Box key={value} display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: '1px',
                    height: value % 5 === 0 ? 8 : 4,
                    bgcolor: value === 5 ? 'primary.main' : 'grey.400'
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: value === 5 ? 600 : 400,
                    color: value === 5 ? 'primary.main' : 'text.secondary'
                  }}
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Matrix Stats */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Paper
            elevation={1}
            sx={{
              px: 2,
              py: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'primary.200',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="subtitle2" color="primary.700" sx={{ fontWeight: 600 }}>
              Matrix Items: {matrixNodes.length}
            </Typography>
            {unmappableNodes.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: unmappablePanelExpanded ? 'default' : 'pointer',
                  opacity: unmappablePanelExpanded ? 0.7 : 1,
                  '&:hover': {
                    opacity: unmappablePanelExpanded ? 0.7 : 0.8
                  }
                }}
                onClick={() => !unmappablePanelExpanded && setUnmappablePanelExpanded(true)}
                title={unmappablePanelExpanded ? 'Unmappable panel is open' : 'Click to view unmappable items'}
              >
                <Typography variant="caption" color="warning.800" sx={{ fontWeight: 600 }}>
                  • Unmappable: {unmappableNodes.length}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Unmappable Entities Panel */}
        {unmappableNodes.length > 0 && unmappablePanelExpanded && (
          <Box
            sx={{
              position: 'absolute',
              top: 75,
              right: 16,
              maxWidth: 400
            }}
          >
            <Paper
              elevation={2}
              sx={{
                bgcolor: 'warning.50',
                border: '1px solid',
                borderColor: 'warning.300',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => setUnmappablePanelExpanded(false)}
              >
                <Box>
                  <Typography variant="caption" color="warning.800" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    Missing Impact or Effort values
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {unmappableNodes.length} items cannot be placed on the matrix
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ color: 'warning.800', p: 0.5 }}>
                  <ExpandLess fontSize="small" />
                </IconButton>
              </Box>

              <Box
                sx={{
                  px: 1.5,
                  pb: 1,
                  maxHeight: 200,
                  overflowY: 'auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5
                }}
              >
                {unmappableNodes.map((node) => {
                  const nodeId = node.uniqueId || node.id.split('-').pop() || node.id.slice(-8);
                  return (
                    <Box
                      key={node.id}
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: 'grey.100',
                        border: '1px solid',
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'grey.200'
                        }
                      }}
                      title={`${node.title} - Impact: ${node.impact ?? 'N/A'}, Effort: ${node.effort ?? 'N/A'}`}
                      onClick={() => {
                        if (node.notionUrl) {
                          window.open(node.notionUrl, '_blank');
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {nodeId}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Matrix;