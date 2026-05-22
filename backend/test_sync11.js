const { request } = require('urllib');

const IP = '10.70.5.8';
const CREDS = 'admin:Uranch135';

async function testVariation(name, xml) {
  console.log(`\n--- TRYING: ${name} ---`);
  try {
    const response = await request(`http://${IP}/ISAPI/ITC/Entrance/VCL`, {
      method: 'POST',
      digestAuth: CREDS,
      data: xml,
      headers: { 'Content-Type': 'application/xml' },
      timeout: 5000
    });
    console.log(`STATUS: ${response.status}`);
    console.log(`RESPONSE:\n${response.data.toString()}`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

async function runTests() {
  await testVariation('POST VCLSearchCond', `<?xml version="1.0" encoding="utf-8"?>
<VCLSearchCond>
    <searchID>1</searchID>
    <searchResultPosition>0</searchResultPosition>
    <maxResults>50</maxResults>
    <listType>0</listType>
</VCLSearchCond>`);
}

runTests();
