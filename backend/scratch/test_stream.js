const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;

async function testCamera(ip, channel) {
  const client = new DigestClient('admin', 'Uranch135');
  const url = `http://${ip}/ISAPI/Streaming/channels/${channel}/picture`;
  
  console.log(`Testing connection to: ${url}`);
  try {
    const startTime = Date.now();
    const response = await client.fetch(url, {
      method: 'GET',
      timeout: 5000
    });
    
    console.log(`Response status for ${ip} on channel ${channel}: ${response.status} (${response.statusText})`);
    if (response.status === 200) {
      const buffer = await response.arrayBuffer();
      const buf = Buffer.from(buffer);
      const duration = Date.now() - startTime;
      console.log(`Successfully fetched! Size: ${buf.length} bytes (took ${duration}ms)`);
      if (buf.length < 500) {
        console.log(`Content: ${buf.toString('utf8')}`);
      }
    }
  } catch (err) {
    console.error(`Error during fetch for ${ip}:`, err.message);
  }
}

async function run() {
  await testCamera('10.70.5.8', '3');
  await testCamera('10.70.5.7', '3');
}

run();
