import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function debugDatasetGraph(datasetId = "11") {
  const session = driver.session();
  
  try {
    // 1. First check if nodes exist for this dataset
    console.log(`\nChecking nodes for dataset ${datasetId}...`);
    const nodesQuery = `
      MATCH (n:DataItem)
      WHERE n.dataSetId = $datasetId
      RETURN n.name as name, n.label as label
      LIMIT 5
    `;
    
    const nodesResult = await session.run(nodesQuery, { datasetId });
    console.log('Sample nodes found:', nodesResult.records.map(r => ({
      name: r.get('name'),
      label: r.get('label')
    })));
    
    // 2. Check relationships for these nodes
    console.log('\nChecking relationships...');
    const relationshipsQuery = `
      MATCH (source:DataItem)-[r]->(target:DataItem)
      WHERE source.dataSetId = $datasetId OR target.dataSetId = $datasetId
      RETURN 
        source.name as sourceName,
        target.name as targetName,
        type(r) as relType,
        properties(r) as props
      LIMIT 5
    `;
    
    const relsResult = await session.run(relationshipsQuery, { datasetId });
    console.log('Sample relationships found:', relsResult.records.map(r => ({
      source: r.get('sourceName'),
      target: r.get('targetName'),
      type: r.get('relType'),
      properties: r.get('props')
    })));

    // 3. Test the exact visualization query
    console.log('\nTesting visualization query...');
    const vizQuery = `
      MATCH (n:DataItem)
      WHERE n.dataSetId = $datasetId
      OPTIONAL MATCH (n)-[r]-(m)
      WHERE m.dataSetId = $datasetId
      RETURN DISTINCT 
        collect(DISTINCT {
          id: n.name,
          label: n.name,
          type: labels(n)[0]
        }) as nodes,
        collect(DISTINCT {
          source: startNode(r).name,
          target: endNode(r).name,
          type: type(r)
        }) as links
    `;
    
    const vizResult = await session.run(vizQuery, { datasetId });
    const graphData = vizResult.records[0];
    console.log('Visualization data:', {
      nodes: graphData.get('nodes').length,
      relationships: graphData.get('links').length
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

debugDatasetGraph().catch(console.error);
