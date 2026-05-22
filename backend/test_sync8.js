const { request } = require('urllib');

const IP = '10.70.5.8';
const CREDS = 'admin:Uranch135';

async function testVariation(name, xml) {
  console.log(`\n--- TRYING: ${name} ---`);
  try {
    const response = await request(`http://${IP}/ISAPI/ITC/Entrance/VCL`, {
      method: 'PUT',
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
  await testVariation('operateType inside singleVCLData', `<?xml version="1.0" encoding="utf-8"?>
<SetVCLData>
    <VCLDataList>
        <singleVCLData>
            <operateType>add</operateType>
            <listType>0</listType>
            <plateNum>90A830A6</plateNum>
        </singleVCLData>
    </VCLDataList>
</SetVCLData>`);

  await testVariation('operateType inside SetVCLData', `<?xml version="1.0" encoding="utf-8"?>
<SetVCLData>
    <operateType>add</operateType>
    <VCLDataList>
        <singleVCLData>
            <listType>0</listType>
            <plateNum>90A830A7</plateNum>
        </singleVCLData>
    </VCLDataList>
</SetVCLData>`);
}

runTests();
