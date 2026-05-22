const { request } = require('urllib');

const IP = '10.70.5.8';
const CREDS = 'admin:Uranch135';

async function test() {
  console.log(`URL: POST /ISAPI/ITC/Entrance/VCL/Search`);
  const xml = `<?xml version="1.0" encoding="utf-8"?><VCLSearchCond><searchID>1</searchID><searchResultPosition>0</searchResultPosition><maxResults>50</maxResults><listType>0</listType></VCLSearchCond>`;
  try {
    const response = await request(`http://${IP}/ISAPI/ITC/Entrance/VCL/Search`, {
      method: 'POST',
      digestAuth: CREDS,
      data: xml,
      headers: { 'Content-Type': 'application/xml' },
      timeout: 5000
    });
    console.log(`STATUS: ${response.status}`);
    console.log(`RESPONSE:\n${response.data.toString()}`);
  } catch (e) {
    console.log(`ERROR GET: ${e.message}`);
  }
}

test();
