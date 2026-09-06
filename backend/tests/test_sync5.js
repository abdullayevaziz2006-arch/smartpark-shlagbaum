const { request } = require('urllib');

const IP = '10.70.5.8';
const CREDS = 'admin:Uranch135';

async function test() {
  console.log(`URL: GET /ISAPI/ITC/Entrance/VCL/Search`);
  // Usually to get the list we do a PUT search or GET /ISAPI/ITC/Entrance/VCL
  // Let's try GET first
  try {
    const response = await request(`http://${IP}/ISAPI/ITC/Entrance/VCL`, {
      method: 'GET',
      digestAuth: CREDS,
      timeout: 5000
    });
    console.log(`STATUS: ${response.status}`);
    console.log(`RESPONSE:\n${response.data.toString()}`);
  } catch (e) {
    console.log(`ERROR GET: ${e.message}`);
  }
}

test();
