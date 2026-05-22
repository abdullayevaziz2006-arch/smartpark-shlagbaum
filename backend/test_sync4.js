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
  await testVariation('No ID', `<?xml version="1.0" encoding="utf-8"?>
<SetVCLData>
    <VCLDataList>
        <singleVCLData>
            <runNum>0</runNum>
            <listType>0</listType>
            <plateNum>90A830A1</plateNum>
            <cardNo></cardNo>
        </singleVCLData>
    </VCLDataList>
</SetVCLData>`);

  await testVariation('ID = 999', `<?xml version="1.0" encoding="utf-8"?>
<SetVCLData>
    <VCLDataList>
        <singleVCLData>
            <id>999</id>
            <runNum>0</runNum>
            <listType>0</listType>
            <plateNum>90A830A2</plateNum>
            <cardNo></cardNo>
        </singleVCLData>
    </VCLDataList>
</SetVCLData>`);
}

runTests();
