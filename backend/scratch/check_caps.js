const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;

async function checkCaps(ip, channel) {
  const client = new DigestClient('admin', 'Uranch135');
  const url = `http://${ip}/ISAPI/Streaming/channels/${channel}/capabilities`;
  
  console.log(`Checking capabilities on: ${url}`);
  try {
    const response = await client.fetch(url, {
      method: 'GET',
      timeout: 5000
    });
    
    console.log(`Status for ${ip} on channel ${channel}: ${response.status}`);
    const text = await response.text();
    console.log(text);
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

async function run() {
  await checkCaps('10.70.5.8', '1');
}

run();
