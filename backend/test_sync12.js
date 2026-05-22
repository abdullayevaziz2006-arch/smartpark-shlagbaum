const { request } = require('urllib');

const IP = '10.70.5.8';
const CREDS = 'admin:Uranch135';

async function testVariation(name, method, path, xml) {
  console.log(`\n--- TRYING: ${name} ---`);
  try {
    const opts = {
      method: method,
      digestAuth: CREDS,
      headers: { 'Content-Type': 'application/xml' },
      timeout: 5000
    };
    if (xml) opts.data = xml;
    
    const response = await request(`http://${IP}${path}`, opts);
    console.log(`STATUS: ${response.status}`);
    console.log(`RESPONSE:\n${response.data.toString()}`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

async function runTests() {
  await testVariation('GET plateList', 'GET', '/ISAPI/Traffic/plateList');
  await testVariation('GET vehicleDetect/plates', 'GET', '/ISAPI/Traffic/channels/1/vehicleDetect/plates');
  await testVariation('POST ContentMgmt/search', 'POST', '/ISAPI/ContentMgmt/search', `<?xml version="1.0" encoding="utf-8"?><CMSearchDescription><searchID>C8592390-DED6-11E8-B1F7-C45006D4407A</searchID><trackID>1</trackID><timeSpanList><timeSpan><startTime>2000-01-01T00:00:00Z</startTime><endTime>2030-01-01T00:00:00Z</endTime></timeSpan></timeSpanList><maxResults>50</maxResults><searchResultPostion>0</searchResultPostion><metadataList><metadataDescriptor>//recordType.meta.std-cgi.com</metadataDescriptor></metadataList></CMSearchDescription>`);
}

runTests();
