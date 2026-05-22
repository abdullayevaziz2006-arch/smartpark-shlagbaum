const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;

async function run() {
  const client = new DigestClient('admin', 'Uranch135');
  const url = 'http://10.70.5.8/ISAPI/Streaming/channels/1/picture';
  
  console.log(`Fetching 5 snapshots sequentially...`);
  for (let i = 1; i <= 5; i++) {
    const start = Date.now();
    try {
      const response = await client.fetch(url, { method: 'GET', timeout: 5000 });
      if (response.status === 200) {
        const buffer = await response.arrayBuffer();
        const duration = Date.now() - start;
        console.log(`Snapshot #${i}: ${buffer.byteLength} bytes, took ${duration}ms`);
      } else {
        console.log(`Snapshot #${i} failed: ${response.status}`);
      }
    } catch (err) {
      console.error(`Snapshot #${i} error: ${err.message}`);
    }
  }
}

run();
