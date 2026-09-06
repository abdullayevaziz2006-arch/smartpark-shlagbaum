const { request } = require('urllib');

const IP = '10.70.5.8';
const CREDS = 'admin:Uranch135';

async function test() {
  console.log(`URL: GET /ISAPI/Traffic/channels/1/licensePlateAuditData`);
  try {
    const response = await request(`http://${IP}/ISAPI/Traffic/channels/1/licensePlateAuditData`, {
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
