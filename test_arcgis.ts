process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testArcGIS() {
  const url = 'https://geomininter.mininter.gob.pe/arcgis/rest/services/pnp/policia_nacional_peru/MapServer/0/query?where=1%3D1&outFields=*&f=pjson&resultRecordCount=5';
  console.log('Fetching from ArcGIS REST API (ignoring SSL verification)...');
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }
    const data = await res.json() as any;
    console.log('Success! Fields found in layer:');
    console.log(data.fields.map((f: any) => `${f.name} (${f.type})`));
    console.log('\nSample feature attributes:');
    console.log(JSON.stringify(data.features[0]?.attributes, null, 2));
  } catch (error) {
    console.error('Error fetching from ArcGIS:', error);
  }
}

testArcGIS();
