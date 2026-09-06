const fs = require('fs');
const path = require('path');
const { request } = require('urllib');
const prisma = require('../config/db');
const xmlBuilder = require('../utils/xmlBuilder');

/**
 * Avtomobil raqamini barcha ulangan kameralar oq ro'yxatiga (Allowlist) qo'shish yoki o'chirish.
 * DS-TCG205-E / DS-TCG406 modellari uchun rasmiy JSON ISAPI ishlatiladi.
 * iDS-TCM203-A uchun VCL XML ISAPI ishlatiladi.
 */
async function syncPlateToCameras(plateNumber, action = 'add', cardNo = null) {
  const formattedPlate = plateNumber.toUpperCase().trim();
  const formattedCardNo = cardNo ? String(cardNo).trim() : '';
  const devices = await prisma.device.findMany();

  const results = [];
  const debugFile = path.join(__dirname, '..', 'sync_debug.log');

  for (const device of devices) {
    let baseUrl = device.ipAddress;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}:${device.port}`;

    const creds = `${device.username || 'admin'}:${device.password || 'Q135246q'}`;
    const model = device.model || 'iDS-TCM203-A';

    let url = '';
    let method = 'PUT';
    let bodyData = '';
    let contentType = 'application/xml';

    if (model === 'DS-TCG205-E' || model === 'DS-TCG406') {
      // DS-TCG205-E / DS-TCG406: Rasmiy JSON ISAPI
      contentType = 'application/json';
      if (action === 'add') {
        url = `${baseUrl}/ISAPI/Traffic/channels/1/licensePlateAuditData/record?format=json`;
        method = 'PUT';
        bodyData = JSON.stringify({
          LicensePlateInfoList: [
            {
              id: '1',
              plateColor: 'other',
              plateType: 'other',
              listType: 'allowList',
              LicensePlate: formattedPlate,
              cardNo: formattedCardNo,
              plateDescription: 'VIP SmartPark',
              cardID: formattedCardNo,
              name: 'VIP',
              certificateType: 'ID',
              virtualParkingNum: '0',
              operationType: 'add',
              operation: 'new'
            }
          ]
        });
      } else {
        url = `${baseUrl}/ISAPI/Traffic/channels/1/DelLicensePlateAuditData?format=json`;
        method = 'PUT';
        bodyData = JSON.stringify({
          deleteAllEnabled: false,
          licensePlate: [formattedPlate]
        });
      }
    } else {
      // iDS-TCM203-A: Standart VCL XML ISAPI
      url = `${baseUrl}/ISAPI/ITC/Entrance/VCL`;
      contentType = 'application/xml';
      if (action === 'add') {
        url = `${baseUrl}/ISAPI/ITC/Entrance/VCL`;
        method = 'PUT';
        bodyData = xmlBuilder.buildVclAddXml(formattedPlate, formattedCardNo);
      } else {
        method = 'DELETE';
        bodyData = xmlBuilder.buildVclDeleteXml(formattedPlate);
      }
    }

    try {
      fs.appendFileSync(debugFile,
        `\n--- SYNC ATTEMPT: ${new Date().toISOString()} ---\n` +
        `IP: ${device.ipAddress} | Model: ${model} | Action: ${action}\n` +
        `URL: ${url}\nMETHOD: ${method} | CONTENT-TYPE: ${contentType}\n` +
        `PAYLOAD: ${bodyData}\n`
      );
    } catch (fsErr) {}

    try {
      let response = await request(url, {
        method: method,
        digestAuth: creds,
        data: bodyData,
        headers: {
          'Content-Type': contentType,
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 5000
      });

      // Agar qo'shishda 400 kelsa (allaqachon mavjud bo'lsa), 'modify' sifatida qayta urinib ko'ramiz
      if (action === 'add' && response.status === 400 && (model === 'DS-TCG205-E' || model === 'DS-TCG406')) {
        const modifyPayload = JSON.stringify({
          LicensePlateInfoList: [
            {
              id: '1',
              plateColor: 'other',
              plateType: 'other',
              listType: 'allowList',
              LicensePlate: formattedPlate,
              cardNo: formattedCardNo,
              plateDescription: 'VIP SmartPark',
              cardID: formattedCardNo,
              name: 'VIP',
              certificateType: 'ID',
              virtualParkingNum: '0',
              operationType: 'modify',
              operation: 'modify'
            }
          ]
        });
        response = await request(url, {
          method: 'PUT',
          digestAuth: creds,
          data: modifyPayload,
          headers: {
            'Content-Type': contentType,
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 5000
        });
      }

      const resData = response.data ? response.data.toString() : 'NO DATA';
      try {
        fs.appendFileSync(debugFile, `RESPONSE STATUS: ${response.status}\nDATA: ${resData}\n`);
      } catch (fsErr) {}

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ [SYNC SUCCESS] ${device.ipAddress} (${model}) → ${formattedPlate} (${action})`);
        results.push({ device: device.name, ip: device.ipAddress, status: response.status, success: true });
      } else {
        console.warn(`⚠️ [SYNC FAILED] ${device.ipAddress} (${model}) → Status: ${response.status}`);
        results.push({ device: device.name, ip: device.ipAddress, status: response.status, success: false, data: resData });
      }
    } catch (e) {
      console.error(`❌ [SYNC ERROR] ${device.ipAddress}:`, e.message);
      try { fs.appendFileSync(debugFile, `ERROR: ${e.message}\n`); } catch (fsErr) {}
      results.push({ device: device.name, ip: device.ipAddress, status: 'ERROR', error: e.message });
    }
  }

  return results;
}

module.exports = { syncPlateToCameras };
