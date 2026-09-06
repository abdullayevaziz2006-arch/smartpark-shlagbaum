const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { XMLParser } = require('fast-xml-parser');
const prisma = require('../config/db');
const socketService = require('../services/socketService');
const barrierService = require('../services/barrierService');

const parser = new XMLParser({ ignoreAttributes: false });

async function handleCameraWebhook(req, res) {
  try {
    const debugPath = path.join(__dirname, '..', 'camera_debug.log');
    const logData = {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, mimetype: f.mimetype, size: f.size, path: f.path })) : []
    };
    
    try {
      let stats = fs.existsSync(debugPath) ? fs.statSync(debugPath) : null;
      if (stats && stats.size > 5 * 1024 * 1024) { // > 5MB
        fs.writeFileSync(debugPath, JSON.stringify(logData, null, 2) + '\n\n');
      } else {
        fs.appendFileSync(debugPath, JSON.stringify(logData, null, 2) + '\n\n');
      }
    } catch (err) {
      console.error('Log write error:', err.message);
    }

    let plateNumber = null;
    let direction = 'IN'; 
    let lotId = req.body.lotId || null;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const isXml = file.mimetype === 'application/xml' || 
                      file.mimetype === 'text/xml' || 
                      file.originalname.endsWith('.xml') || 
                      file.fieldname.includes('xml') || 
                      file.fieldname === 'anpr.xml';
                      
        if (isXml) {
           try {
             const xmlData = fs.readFileSync(file.path, 'utf8');
             const parsed = parser.parse(xmlData);
             
             if (parsed.EventNotificationAlert && parsed.EventNotificationAlert.ANPR) {
               plateNumber = parsed.EventNotificationAlert.ANPR.licensePlate;
             }
           } catch(e) {
             console.error('XML Parse Error:', e);
           }
        }
      }
    }

    // JSON/URL-encoded fallback (for simulator)
    if (!plateNumber && req.body.plateNumber) {
      plateNumber = req.body.plateNumber;
    }
    if (req.body.direction) direction = req.body.direction;

    if (!plateNumber) {
      console.log('Webhook received but no plate number found.');
      return res.status(400).send('Plate number missing or unsupported format');
    }

    let car = await prisma.car.findFirst({ where: { plateNumber } });
    if (!car) {
      car = await prisma.car.create({ data: { plateNumber } });
    }

    if (car.isBlacklisted) {
      socketService.emit('alert', { message: `Qora ro'yxatdagi mashina: ${plateNumber}` });
      await prisma.log.create({ data: { type: 'BLACKLIST_ATTEMPT', carId: car.id, description: 'Qora ro\'yxatdagi mashina urindi' } });
      return res.status(403).json({ allowed: false, reason: 'BLACKLISTED' });
    }

    if (direction === 'IN') {
      const existingSession = await prisma.parkingSession.findFirst({
        where: { carId: car.id, status: 'ACTIVE' }
      });

      if (!existingSession) {
        let targetLotId = lotId;
        if (!targetLotId) {
           const firstLot = await prisma.parkingLot.findFirst();
           if (firstLot) targetLotId = firstLot.id;
        }

        if (targetLotId) {
          await prisma.parkingSession.create({
            data: { carId: car.id, lotId: targetLotId, entryTime: new Date() }
          });
        }
      }

      await prisma.log.create({ data: { type: 'ENTRY', carId: car.id } });
      socketService.emit('car_entry', { plateNumber, time: new Date() });

      return res.status(200).json({ allowed: true, action: 'OPEN_BARRIER' });

    } else if (direction === 'OUT') {
      const session = await prisma.parkingSession.findFirst({
        where: { carId: car.id, status: 'ACTIVE' }
      });

      if (!session) return res.status(404).json({ error: 'Active session not found' });

      const exitTime = new Date();
      const diffMs = exitTime - session.entryTime;
      const diffMins = Math.ceil(diffMs / 60000);

      const tariff = await prisma.tariff.findFirst({ where: { lotId: session.lotId } });
      let fee = 0;

      const isSubscriber = car.isSubscriber && car.subscriberEnd && car.subscriberEnd > new Date();

      if (!isSubscriber && tariff) {
        let billableMins = diffMins - tariff.freeMinutes;
        if (billableMins > 0) {
          fee = billableMins * tariff.pricePerMin;
          if (tariff.maxDaily && fee > tariff.maxDaily) fee = tariff.maxDaily;
        }
      }

      await prisma.parkingSession.update({
        where: { id: session.id },
        data: { exitTime, fee, status: fee > 0 ? 'UNPAID' : 'COMPLETED' }
      });

      await prisma.log.create({ data: { type: 'EXIT', carId: car.id } });
      
      socketService.emit('car_exit', { 
        plateNumber, 
        fee, 
        time: exitTime, 
        sessionId: session.id, 
        entryTime: session.entryTime, 
        durationMins: diffMins 
      });

      if (fee === 0) {
        return res.status(200).json({ allowed: true, action: 'OPEN_BARRIER', fee: 0 });
      } else {
        // Emit automatic popup trigger for cashiers
        socketService.emit('checkout_request', {
          sessionId: session.id,
          plateNumber,
          entryTime: session.entryTime,
          exitTime,
          durationMins: diffMins,
          freeMinutes: tariff ? tariff.freeMinutes : 0,
          overtimeMins: tariff ? Math.max(0, diffMins - tariff.freeMinutes) : diffMins,
          fee,
          session: {
            id: session.id,
            entryTime: session.entryTime,
            car: {
              id: car.id,
              plateNumber: car.plateNumber,
              isSubscriber: car.isSubscriber
            }
          }
        });

        return res.status(200).json({ allowed: false, action: 'WAIT_FOR_PAYMENT', fee, sessionId: session.id });
      }
    }
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server Error');
  }
}

async function handleHeartbeat(req, res) {
  global.lastAgentHeartbeat = {
    receivedAt: new Date(),
    cameras: req.body.cameras || []
  };
  res.json({ success: true });
}

async function getCameraSnapshot(req, res) {
  const { ip } = req.params;
  const url = `http://${ip}/ISAPI/Streaming/channels/1/picture`;

  try {
    const device = await prisma.device.findFirst({ where: { ipAddress: ip } });
    const username = device ? (device.username || 'admin') : 'admin';
    const password = device ? (device.password || 'Q135246q') : 'Q135246q';

    const client = barrierService.getCameraClient(ip, username, password);
    const response = await client.fetch(url, {
      method: 'GET',
      timeout: 3000
    });

    if (response.status === 200) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const compressedBuffer = await sharp(buffer)
        .resize(640, 360, { fit: 'inside' })
        .jpeg({ quality: 60 })
        .toBuffer();

      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressedBuffer.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private'
      });
      return res.end(compressedBuffer);
    } else {
      return res.status(response.status).send('Failed to get snapshot');
    }
  } catch (err) {
    return res.status(500).send(err.message);
  }
}

async function getCameraMjpegStream(req, res) {
  const { ip } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary',
    'Cache-Control': 'no-cache',
    'Connection': 'close',
    'Pragma': 'no-cache'
  });

  let isConnected = true;
  req.on('close', () => {
    isConnected = false;
  });

  try {
    const device = await prisma.device.findFirst({ where: { ipAddress: ip } });
    const username = device ? (device.username || 'admin') : 'admin';
    const password = device ? (device.password || 'Q135246q') : 'Q135246q';

    const client = barrierService.getCameraClient(ip, username, password);
    while (isConnected) {
      try {
        const url = `http://${ip}/ISAPI/Streaming/channels/1/picture`;
        const response = await client.fetch(url, {
          method: 'GET',
          timeout: 2000
        });

        if (response.status === 200 && isConnected) {
          const buffer = await response.arrayBuffer();
          res.write('--myboundary\r\n');
          res.write('Content-Type: image/jpeg\r\n');
          res.write(`Content-Length: ${buffer.byteLength}\r\n\r\n`);
          res.write(Buffer.from(buffer));
          res.write('\r\n');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  } catch (err) {
    return res.status(500).end(err.message);
  }
}

async function manualOpenCamera(req, res) {
  const { ip } = req.body;
  try {
    // Qurilmani DBdan topib modelini aniqlaymiz
    const device = await prisma.device.findFirst({ where: { ipAddress: ip } });
    const model = device ? device.model : 'iDS-TCM203-A';
    const username = device ? (device.username || 'admin') : 'admin';
    const password = device ? (device.password || 'Uranch135') : 'Uranch135';

    await barrierService.triggerBarrierOpen([ip], username, password, model);
    return res.json({ success: true, model });
  } catch (err) {
    console.error('Camera open failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function triggerBarrierManual(req, res) {
  console.log('[API] Barrier open requested');
  try {
    // Barcha qurilmalarni DBdan olib, har birini o'z modeli bilan ochamiz
    const devices = await prisma.device.findMany();
    if (devices.length === 0) {
      // Fallback: DB da qurilma yo'q bo'lsa default sozlamalar
      barrierService.triggerBarrierOpen(['10.70.5.7', '10.70.5.8'], 'admin', 'Uranch135', 'iDS-TCM203-A');
    } else {
      // Modellar bo'yicha guruhlash
      const groups = {};
      devices.forEach(d => {
        const model = d.model || 'iDS-TCM203-A';
        if (!groups[model]) groups[model] = { ips: [], username: d.username || 'admin', password: d.password || 'Uranch135' };
        groups[model].ips.push(d.ipAddress);
      });
      for (const [model, cfg] of Object.entries(groups)) {
        barrierService.triggerBarrierOpen(cfg.ips, cfg.username, cfg.password, model);
      }
    }
    return res.json({ success: true, message: 'Shlagbaum ochildi!' });
  } catch (err) {
    console.error('[BARRIER] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  handleCameraWebhook,
  handleHeartbeat,
  getCameraSnapshot,
  getCameraMjpegStream,
  manualOpenCamera,
  triggerBarrierManual
};
