const { request } = require('urllib');

const IP = '10.70.5.8';
const CREDS = 'admin:Uranch135';

const xml = `<?xml version="1.0" encoding="utf-8"?>
<SetVCLData>
    <VCLDataList>
        <singleVCLData>
            <id>0</id>
            <runNum>0</runNum>
            <listType>0</listType>
            <plateNum>90A830AB</plateNum>
            <cardNo></cardNo>
            <startTime>0000-00-00T00:00:00Z</startTime>
            <endTime>0000-00-00T00:00:00Z</endTime>
        </singleVCLData>
    </VCLDataList>
</SetVCLData>`;

async function test() {
  console.log(`URL: PUT /ISAPI/ITC/Entrance/VCL`);
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

test();
