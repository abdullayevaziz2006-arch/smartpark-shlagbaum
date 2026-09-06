const { request } = require('urllib');

const IP = '10.70.5.8';
const CREDS = 'admin:Uranch135';

async function testVariation(name, method, xml) {
  console.log(`\n--- TRYING: ${name} ---`);
  try {
    const response = await request(`http://${IP}/ISAPI/ITC/Entrance/VCL`, {
      method: method,
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
  await testVariation('POST SetVCLData', 'POST', `<?xml version="1.0" encoding="utf-8"?>
<SetVCLData>
    <VCLDataList>
        <singleVCLData>
            <listType>0</listType>
            <plateNum>90A830A9</plateNum>
            <cardNo></cardNo>
        </singleVCLData>
    </VCLDataList>
</SetVCLData>`);
}

runTests();
