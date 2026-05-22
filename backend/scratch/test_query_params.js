const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;

async function test(width, height) {
  const ip = '10.70.5.8';
  const client = new DigestClient('admin', 'Uranch135');
  const url = `http://${ip}/ISAPI/Streaming/channels/1/picture?videoResolutionWidth=${width}&videoResolutionHeight=${height}`;
  
  console.log(`Testing: ${url}`);
  try {
    const startTime = Date.now();
    const response = await client.fetch(url, {
      method: 'GET',
      timeout: 5000
    });
    
    console.log(`Response status: ${response.status}`);
    if (response.status === 200) {
      const buffer = await response.arrayBuffer();
      const buf = Buffer.from(buffer);
      const duration = Date.now() - startTime;
      console.log(`Fetched size: ${buf.length} bytes (took ${duration}ms)`);
    }
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

async function run() {
  await test(640, 360);
  await test(320, 240);
}

run();
