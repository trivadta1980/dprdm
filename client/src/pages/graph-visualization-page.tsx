
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spinner, Alert, AlertIcon, Box, Heading, Text, Select, Badge, Flex, Button, Tooltip } from "@chakra-ui/react";
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';

export default function GraphVisualizationPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [filterType, setFilterType] = useState('all');
  
  const graphRef = useRef(null);
  
  // Fetch graph data from API
  const fetchGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/graph/visualization');
      setGraphData(response.data);
    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(err.response?.data?.error || 'Failed to fetch graph data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGraphData();
  }, []);
  
  // Filter nodes based on selected type
  const filteredData = useCallback(() => {
    if (filterType === 'all') return graphData;
    
    const filteredNodes = graphData.nodes.filter(node => node.label === filterType);
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    const filteredLinks = graphData.links.filter(
      link => nodeIds.has(link.source.id || link.source) && nodeIds.has(link.target.id || link.target)
    );
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, filterType]);
  
  // Handle node click to show details
  const handleNodeClick = useCallback(node => {
    setSelectedNodeId(node.id);
    setSelectedNodeInfo({
      id: node.id,
      label: node.label,
      properties: node.properties
    });
    
    // Also focus on the node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);
  
  // Center view on graph
  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(1000, 50);
    }
    setSelectedNodeId(null);
    setSelectedNodeInfo(null);
  }, []);
  
  // Node label configuration
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.label || 'Unknown';
    const fontSize = node.val ? 16 / globalScale : 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.fillStyle = node.color || 'rgba(0, 0, 0, 0.7)';
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val || 5, 0, 2 * Math.PI, false);
    ctx.fill();
    
    // Draw highlighted ring for selected node
    if (node.id === selectedNodeId) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, (node.val || 5) + 2, 0, 2 * Math.PI, false);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FF5733';
      ctx.stroke();
    }
    
    // Only show labels if we're zoomed in enough
    if (globalScale >= 0.8) {
      const nameProperty = node.properties?.name || node.id.substring(0, 8);
      const textWidth = ctx.measureText(nameProperty).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.5);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(
        node.x - bckgDimensions[0] / 2,
        node.y + node.val + 2,
        bckgDimensions[0],
        bckgDimensions[1]
      );
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(
        nameProperty,
        node.x,
        node.y + node.val + 2 + bckgDimensions[1] / 2
      );
    }
  }, [selectedNodeId]);
  
  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading graph data...</Text>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
        <Text mt={4}>
          Make sure Neo4j is configured correctly and the database is accessible.
        </Text>
      </Box>
    );
  }
  
  // Get unique node types for filter dropdown
  const nodeTypes = [...new Set(graphData.nodes.map(node => node.label))];
  
  return (
    <Box p={6}>
      <Heading as="h1" size="xl" mb={4}>
        Graph Visualization
      </Heading>
      
      <Flex mb={4} alignItems="center" flexWrap="wrap">
        <Box mr={4} mb={2}>
          <Text fontWeight="bold" mb={1}>Filter by Type:</Text>
          <Select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            width="200px"
          >
            <option value="all">All Types</option>
            {nodeTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </Box>
        
        <Box flex="1" mb={2}>
          <Text fontWeight="bold" mb={1}>Legend:</Text>
          <Flex flexWrap="wrap">
            <Badge colorScheme="blue" mr={2} mb={1}>DataSet</Badge>
            <Badge colorScheme="green" mr={2} mb={1}>DataItem</Badge>
            <Badge colorScheme="yellow" mr={2} mb={1}>RelationshipType</Badge>
            <Badge colorScheme="red" mr={2} mb={1}>CrosswalkMapping</Badge>
          </Flex>
        </Box>
        
        <Button 
          onClick={handleResetView} 
          colorScheme="teal" 
          mb={2}
        >
          Reset View
        </Button>
        
        <Button 
          onClick={fetchGraphData} 
          colorScheme="blue" 
          ml={2} 
          mb={2}
        >
          Refresh Data
        </Button>
      </Flex>
      
      <Flex>
        <Box 
          width="70%" 
          height="700px" 
          border="1px solid #e2e8f0" 
          borderRadius="md" 
          overflow="hidden"
        >
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData()}
            nodeCanvasObject={nodeCanvasObject}
            nodeLabel={node => `${node.label}: ${node.properties?.name || node.id}`}
            linkLabel={link => link.type}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.25}
            cooldownTicks={100}
            onNodeClick={handleNodeClick}
            onEngineStop={() => graphRef.current && graphRef.current.zoomToFit(400)}
          />
        </Box>
        
        <Box width="30%" pl={4}>
          {selectedNodeInfo ? (
            <Box p={4} borderWidth="1px" borderRadius="lg">
              <Heading size="md" mb={2}>
                {selectedNodeInfo.label} Details
              </Heading>
              
              <Text fontWeight="bold" mt={2}>ID: {selectedNodeInfo.id}</Text>
              
              {selectedNodeInfo.properties && (
                <Box mt={3}>
                  <Text fontWeight="bold" mb={2}>Properties:</Text>
                  {Object.entries(selectedNodeInfo.properties).map(([key, value]) => (
                    <Text key={key} fontSize="sm">
                      <strong>{key}:</strong> {String(value)}
                    </Text>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
              <Text>Click on a node to see details</Text>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
