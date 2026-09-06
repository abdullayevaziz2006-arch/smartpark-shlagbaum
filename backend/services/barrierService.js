const { request } = require('urllib');
const xmlBuilder = require('../utils/xmlBuilder');
const { getBarrierRequests } = require('../config/cameraModels');

let DigestClient = null;

// Dynamically load digest-fetch since it is an ES module
(async () => {
  try {
    const mod = await import('digest-fetch');
    const base = mod.default || mod;
    DigestClient = base.default || base;
  } catch (err) {
    console.error('Failed to load digest-fetch module dynamically:', err);
  }
})();

const cameraClients = {};

function getCameraClient(ip, username = 'admin', password = 'Uranch135') {
  const cacheKey = `${ip}_${username}`;
  if (!cameraClients[cacheKey]) {
    if (!DigestClient) {
      throw new Error('DigestClient is not loaded yet');
    }
    cameraClients[cacheKey] = new DigestClient(username, password);
  }
  return cameraClients[cacheKey];
}

/**
 * Modelga qarab to'g'ri ISAPI endpointlarni tanlab shlagbaumni ochadi.
 * @param {string[]} ips - Kamera IP manzillari
 * @param {string} username - Login
 * @param {string} password - Parol
 * @param {string} model - Kamera modeli (masalan: 'DS-TCG205-E')
 */
async function triggerBarrierOpen(ips = ['10.70.5.7', '10.70.5.8'], username = 'admin', password = 'Uranch135', model = 'iDS-TCM203-A') {
  const creds = `${username}:${password}`;
  const variations = getBarrierRequests(model);

  console.log(`[BARRIER] Model: ${model}, IPs: ${ips.join(', ')}, Endpoints: ${variations.length}`);

  ips.forEach(ip => {
    variations.forEach(v => {
      const fullUrl = `http://${ip}${v.url}`;
      request(fullUrl, {
        method: v.method,
        digestAuth: creds,
        headers: { 'Content-Type': 'application/xml', 'X-Requested-With': 'XMLHttpRequest' },
        data: v.data,
        timeout: 3000
      }).then(res => {
        console.log(`[BARRIER SUCCESS] Model: ${model}, IP: ${ip}, URL: ${v.url}, Status: ${res.status}`);
      }).catch(() => {
        // Silently catch since not all endpoints may be supported
      });
    });
  });
}

module.exports = {
  getCameraClient,
  triggerBarrierOpen
};
