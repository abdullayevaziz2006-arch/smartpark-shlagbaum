const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;

async function fetchChannel3(ip) {
  const client = new DigestClient('admin', 'Uranch135');
  const url = `http://${ip}/ISAPI/Streaming/channels/3`;
  
  try {
    const response = await client.fetch(url, { method: 'GET', timeout: 5000 });
    console.log(`\n=== Camera ${ip} Channel 3 XML ===`);
    const xml = await response.text();
    console.log(xml);
  } catch (err) {
    console.error(`Error for ${ip}:`, err.message);
  }
}

async function run() {
  await fetchChannel3('10.70.5.8');
  await fetchChannel3('10.70.5.7');
}

run();
