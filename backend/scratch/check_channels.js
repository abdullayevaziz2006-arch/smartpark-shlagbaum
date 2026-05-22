const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;

async function checkCamera(ip) {
  const client = new DigestClient('admin', 'Uranch135');
  const url = `http://${ip}/ISAPI/Streaming/channels`;
  
  console.log(`Checking channels on: ${url}`);
  try {
    const response = await client.fetch(url, {
      method: 'GET',
      timeout: 5000
    });
    
    console.log(`Status for ${ip}: ${response.status}`);
    const text = await response.text();
    console.log(text);
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

async function run() {
  await checkCamera('10.70.5.8');
  await checkCamera('10.70.5.7');
}

run();
