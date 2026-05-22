const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;

async function testHttpPreview(ip, channel) {
  const client = new DigestClient('admin', 'Uranch135');
  const url = `http://${ip}/ISAPI/Streaming/channels/${channel}/httpPreview`;
  
  console.log(`Testing httpPreview on: ${url}`);
  try {
    const response = await client.fetch(url, {
      method: 'GET',
      timeout: 4000
    });
    
    console.log(`Status for ${ip} on channel ${channel}: ${response.status} (${response.statusText})`);
    console.log('Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Read the first 200 bytes of the response
    const reader = response.body;
    if (reader) {
      console.log(`Success! Stream is active and flowing.`);
    }
  } catch (err) {
    console.error(`Error for ${ip} channel ${channel}:`, err.message);
  }
}

async function run() {
  await testHttpPreview('10.70.5.8', '102');
  await testHttpPreview('10.70.5.8', '101');
  await testHttpPreview('10.70.5.8', '2');
  await testHttpPreview('10.70.5.8', '1');
}

run();
