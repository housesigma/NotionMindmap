import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Collapse,
  Divider,
  ThemeProvider,
  createTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Refresh,
  ExpandLess,
  ExpandMore,
  VisibilityOff,
  Tune,
  AccountTree,
  GridView,
  Timeline
} from '@mui/icons-material';
import Problems from './pages/Problems';
import Objectives from './pages/Objectives';
import Matrix from './pages/Matrix';
import { useNotionStore } from './store/notionStore';

function AppContent() {
  const {
    problemTree,
    isLoading,
    isConnected,
    fetchProblems,
    connectToNotion,
    availableRootNodes,
    currentRootId,
    changeRootNode,
    resetRootNode
  } = useNotionStore();
  const [panelState, setPanelState] = useState<'expanded' | 'collapsed' | 'hidden'>('expanded');
  const location = useLocation();

  // Auto-initialize connection and fetch data on component mount
  useEffect(() => {
    const initializeConnection = async () => {
      if (!isConnected) {
        const apiKey = import.meta.env.VITE_NOTION_API_KEY;
        const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID;

        if (apiKey && databaseId) {
          try {
            await connectToNotion(apiKey, databaseId);
            console.log('Auto-connected to Notion');
            // Auto-refresh data after successful connection
            await fetchProblems();
            console.log('Auto-refreshed data after connection');
          } catch (error) {
            console.error('Failed to auto-connect to Notion:', error);
          }
        } else {
          console.warn('Notion API key or database ID not found in environment variables');
        }
      }
    };

    initializeConnection();
  }, [isConnected, connectToNotion, fetchProblems]);

  // Auto-select root-user as default when data loads
  useEffect(() => {
    if (availableRootNodes.length > 0 && !currentRootId && (
      location.pathname === '/' ||
      location.pathname === '/problems' ||
      location.pathname === '/problems/tree' ||
      location.pathname === '/problems/matrix'
    )) {
      const rootUserNode = availableRootNodes.find(node =>
        node.title.toLowerCase().includes('root-user')
      );
      if (rootUserNode) {
        changeRootNode(rootUserNode.id);
      }
    }
  }, [availableRootNodes, currentRootId, changeRootNode, location.pathname]);

  const handleRefresh = async () => {
    if (isConnected) {
      await fetchProblems();
    }
  };

  const isMatrixNewPage = location.pathname === '/problems/matrix';
  const isRoadmapNewPage = location.pathname === '/objectives';

  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        height: '100vh',
        bgcolor: 'background.default',
        backgroundImage: `linear-gradient(135deg, ${theme.palette.primary[50]} 0%, ${theme.palette.background.default} 50%, ${theme.palette.primary[100]} 100%)`
      })}
    >
      {/* Control Panel - MUI Version */}
      <Card
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          width: 500,
          maxHeight: panelState === 'expanded' ? 'calc(100vh - 2rem)' : 'auto',
          height: panelState === 'collapsed' ? 'auto' : 'auto',
          minHeight: panelState === 'collapsed' ? 100 : 'auto',
          zIndex: 100,
          transition: 'all 0.3s ease',
          display: panelState === 'hidden' ? 'none' : 'block',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'primary.100',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
        }}
        elevation={0}
      >
        <CardContent sx={{ p: 1.5, pb: '6px !important' }}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 'bold',
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
              onDoubleClick={() => setPanelState('hidden')}
              title="双击隐藏面板"
            >
              Notion Mindmap
            </Typography>

            <Box display="flex" alignItems="center" gap={0.5}>
              {isConnected && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    mr: 0.5
                  }}
                  title="Connected to Notion"
                />
              )}
              {isConnected && (
                <IconButton
                  onClick={handleRefresh}
                  disabled={isLoading}
                  size="small"
                  color="primary"
                  title={isLoading ? 'Refreshing...' : 'Refresh Data'}
                  sx={{
                    bgcolor: 'primary.50',
                    '&:hover': {
                      bgcolor: 'primary.100'
                    }
                  }}
                >
                  <Refresh
                    sx={{
                      fontSize: 16,
                      animation: isLoading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }}
                  />
                </IconButton>
              )}
            </Box>
          </Box>

          <Collapse in={panelState === 'expanded'}>
            {/* Main Navigation Tabs */}
            <Box mb={1.5}>
              <Tabs
                value={location.pathname === '/objectives' ? 1 : 0}
                variant="fullWidth"
                sx={{
                  minHeight: 32,
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                    height: 2,
                    borderRadius: '2px 2px 0 0'
                  },
                  '& .MuiTab-root': {
                    minHeight: 32,
                    fontSize: '0.8rem',
                    py: 0.5,
                    '&.Mui-selected': {
                      color: 'primary.main',
                      fontWeight: 600
                    }
                  }
                }}
              >
                <Tab
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccountTree fontSize="small" />
                      Problems
                      {problemTree && (
                        <Chip
                          label={problemTree.nodes.size}
                          size="small"
                          sx={{
                            bgcolor: 'primary.100',
                            color: 'primary.800',
                            fontSize: '0.6rem',
                            height: 16,
                            minWidth: 20,
                            '& .MuiChip-label': {
                              px: 0.5
                            }
                          }}
                        />
                      )}
                    </Box>
                  }
                  component={Link}
                  to="/problems"
                />
                <Tab
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Timeline fontSize="small" />
                      Objectives
                    </Box>
                  }
                  component={Link}
                  to="/objectives"
                />
              </Tabs>
            </Box>

            {/* Sub Navigation for Problems */}
            {(location.pathname === '/' ||
              location.pathname === '/problems' ||
              location.pathname === '/problems/tree' ||
              location.pathname === '/problems/matrix') && (
              <>
                <Box mb={1}>
                  <ToggleButtonGroup
                    value={
                      location.pathname === '/' || location.pathname === '/problems' || location.pathname === '/problems/tree'
                        ? '/problems/tree'
                        : location.pathname === '/problems/matrix'
                        ? '/problems/matrix'
                        : location.pathname
                    }
                    exclusive
                    fullWidth
                    size="small"
                    sx={{
                      height: 32,
                      '& .MuiToggleButton-root': {
                        border: '1px solid',
                        borderColor: 'primary.200',
                        color: 'primary.600',
                        fontSize: '0.75rem',
                        py: 0.5,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        },
                        '&:hover': {
                          bgcolor: 'primary.50'
                        }
                      }
                    }}
                  >
                    <ToggleButton
                      value="/problems/tree"
                      component={Link}
                      to="/problems/tree"
                      sx={{ fontSize: '0.75rem', py: 0.5 }}
                    >
                      <AccountTree sx={{ fontSize: 16, mr: 0.5 }} />
                      Mind Map
                    </ToggleButton>
                    <ToggleButton
                      value="/problems/matrix"
                      component={Link}
                      to="/problems/matrix"
                      sx={{ fontSize: '0.75rem', py: 0.5 }}
                    >
                      <GridView sx={{ fontSize: 16, mr: 0.5 }} />
                      Matrix
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Root Problems Selector */}
                <Box mb={1}>
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={isLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem',
                        '& fieldset': {
                          borderColor: 'primary.200'
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.400'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  >
                    <InputLabel id="root-problem-select-label" sx={{ fontSize: '0.875rem' }}>
                      Focus View
                    </InputLabel>
                    <Select
                      labelId="root-problem-select-label"
                      id="root-problem-select"
                      value={currentRootId || ''}
                      label="Focus View"
                      disabled={isLoading}
                      onChange={(e) => {
                        const value = e.target.value;
                        changeRootNode(value);
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            zIndex: 101
                          }
                        }
                      }}
                      sx={{
                        fontSize: '0.875rem',
                        '& .MuiSelect-select': {
                          py: 1
                        }
                      }}
                    >
                      {availableRootNodes.map((node) => (
                        <MenuItem key={node.id} value={node.id} sx={{ fontSize: '0.875rem' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={node.children.length}
                              size="small"
                              sx={{
                                bgcolor: 'secondary.100',
                                color: 'secondary.800',
                                fontSize: '0.7rem',
                                height: 16,
                                minWidth: 20
                              }}
                            />
                            {node.title}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </>
            )}

          </Collapse>

          {/* Toggle Button - Always visible */}
          <Box display="flex" justifyContent="center" mt={panelState === 'expanded' ? 1 : 0.25}>
            <IconButton
              onClick={() => setPanelState(panelState === 'expanded' ? 'collapsed' : 'expanded')}
              size="small"
              title={panelState === 'expanded' ? '收起面板' : '展开面板'}
              sx={{
                width: 24,
                height: 24,
                bgcolor: panelState === 'collapsed' ? 'primary.main' : 'transparent',
                color: panelState === 'collapsed' ? 'white' : 'inherit',
                '&:hover': {
                  bgcolor: panelState === 'collapsed' ? 'primary.dark' : 'action.hover'
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 16
                }
              }}
            >
              {panelState === 'expanded' ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Toggle Control Panel Button - Only show when completely hidden */}
      {panelState === 'hidden' && (
        <IconButton
          onClick={() => setPanelState('expanded')}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 99,
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              bgcolor: 'grey.50'
            }
          }}
          title="显示控制面板"
        >
          <Tune />
        </IconButton>
      )}

      {/* Main Canvas Area */}
      <div className="absolute inset-0 w-full h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Problems />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/problems/tree" element={<Problems />} />
            <Route path="/problems/matrix" element={<Matrix />} />
            <Route path="/objectives" element={<Objectives />} />
          </Routes>
        )}
      </div>
    </Box>
  );
}

// Create MUI theme with #28a3b3 color system
const theme = createTheme({
  palette: {
    primary: {
      50: '#e3f4f6',
      100: '#b8e3e8',
      200: '#89d1d9',
      300: '#5abeca',
      400: '#37b1bf',
      500: '#28a3b3', // Main color
      600: '#239bb0',
      700: '#1d91aa',
      800: '#1787a4',
      900: '#0e7598',
      main: '#28a3b3',
      dark: '#1d91aa',
      light: '#5abeca',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff6b35', // Complementary orange
      light: '#ff9d70',
      dark: '#c73e02',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2dd4bf', // Teal variant
      light: '#7dd3fc',
      dark: '#0891b2',
    },
    info: {
      main: '#28a3b3',
      light: '#89d1d9',
      dark: '#1d91aa',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  // Auto-detect basename from current path to support any subpath deployment
  const getBasename = () => {
    // Try to detect from script tag src first
    const scripts = document.querySelectorAll('script[src*="index-"]');
    if (scripts.length > 0) {
      const scriptSrc = (scripts[0] as HTMLScriptElement).src;
      const url = new URL(scriptSrc);
      const pathSegments = url.pathname.split('/');
      // Remove filename and assets folder
      pathSegments.pop(); // remove filename
      if (pathSegments[pathSegments.length - 1] === 'assets') {
        pathSegments.pop(); // remove assets folder
      }
      const basePath = pathSegments.join('/');
      return basePath === '' ? '/' : basePath + '/';
    }

    // Fallback: detect from current location
    const currentPath = window.location.pathname;
    // If we're at root or have typical SPA routes, return root
    if (currentPath === '/' || currentPath.match(/^\/(problems|objectives)(\/.*)?$/)) {
      return '/';
    }

    // Try to extract base path by removing known routes
    const pathWithoutRoute = currentPath.replace(/\/(problems|objectives)(\/.*)?$/, '');
    return pathWithoutRoute === '' ? '/' : pathWithoutRoute + '/';
  };

  const basename = getBasename();

  return (
    <ThemeProvider theme={theme}>
      <Router basename={basename === '/' ? undefined : basename}>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;