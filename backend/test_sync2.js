const { request } = require('urllib');

const IP = '10.70.5.8';
const CREDS = 'admin:Uranch135';

const variations = [
  // Variation 1: PUT list with operateType
  {
    url: `/ISAPI/Traffic/channels/1/licensePlateAuditData`,
    method: 'PUT',
    xml: `<?xml version="1.0" encoding="UTF-8"?><LicensePlateAuditDataList version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><LicensePlateAuditData><operateType>add</operateType><plateNumber>90A830AB</plateNumber><groupType>whiteList</groupType></LicensePlateAuditData></LicensePlateAuditDataList>`
  },
  // Variation 2: PUT record with operateType
  {
    url: `/ISAPI/Traffic/channels/1/licensePlateAuditData/record`,
    method: 'PUT',
    xml: `<?xml version="1.0" encoding="UTF-8"?><LicensePlateAuditData version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><operateType>add</operateType><plateNumber>90A830AB</plateNumber><groupType>whiteList</groupType></LicensePlateAuditData>`
  },
  // Variation 3: POST record with operateType
  {
    url: `/ISAPI/Traffic/channels/1/licensePlateAuditData/record`,
    method: 'POST',
    xml: `<?xml version="1.0" encoding="UTF-8"?><LicensePlateAuditData version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><operateType>add</operateType><plateNumber>90A830AB</plateNumber><groupType>whiteList</groupType></LicensePlateAuditData>`
  },
  // Variation 4: PUT record with plateNum instead of plateNumber
  {
    url: `/ISAPI/Traffic/channels/1/licensePlateAuditData/record`,
    method: 'PUT',
    xml: `<?xml version="1.0" encoding="UTF-8"?><LicensePlateAuditData version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><operateType>add</operateType><plateNum>90A830AB</plateNum><groupType>whiteList</groupType></LicensePlateAuditData>`
  }
];

async function test() {
  for (let i = 0; i < variations.length; i++) {
    const v = variations[i];
    console.log(`\n--- TRYING VARIATION ${i + 1} ---`);
    console.log(`URL: ${v.method} ${v.url}`);
    try {
      const response = await request(`http://${IP}${v.url}`, {
        method: v.method,
        digestAuth: CREDS,
        data: v.xml,
        headers: { 'Content-Type': 'application/xml' },
        timeout: 5000
      });
      console.log(`STATUS: ${response.status}`);
      console.log(`RESPONSE:\n${response.data.toString()}`);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }
  }
}

test();
