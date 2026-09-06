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
  await testVariation('With CardNo 9999', `<?xml version="1.0" encoding="utf-8"?>
<SetVCLData>
    <VCLDataList>
        <singleVCLData>
            <id>0</id>
            <runNum>0</runNum>
            <listType>0</listType>
            <plateNum>90A830A3</plateNum>
            <cardNo>9999</cardNo>
            <startTime>2024-01-01T00:00:00Z</startTime>
            <endTime>2030-01-01T00:00:00Z</endTime>
        </singleVCLData>
    </VCLDataList>
</SetVCLData>`);
}

runTests();
