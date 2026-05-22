const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');
const { request } = require('urllib');
const xlsx = require('xlsx');
const sharp = require('sharp');

const uploadMemory = multer({ storage: multer.memoryStorage() });

async function syncPlateToCameras(plateNumber, action = 'add') {
  const formattedPlate = plateNumber.toUpperCase().trim();
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const devices = await prisma.device.findMany();
  
  const results = [];
  
  for (const device of devices) {
    let baseUrl = device.ipAddress;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}:${device.port}`;
    
    const creds = `${device.username || 'admin'}:${device.password || 'Uranch135'}`;
    const url = `${baseUrl}/ISAPI/ITC/Entrance/VCL`;
    
    let xml = '';
    let method = 'PUT';
    
    if (action === 'add') {
      xml = `<?xml version="1.0" encoding="utf-8"?>
<SetVCLData>
    <VCLDataList>
        <singleVCLData>
            <id>0</id>
            <runNum>0</runNum>
            <listType>0</listType>
            <plateNum>${formattedPlate}</plateNum>
            <cardNo>${formattedCardNo}</cardNo>
            <startTime>0000-00-00T00:00:00Z</startTime>
            <endTime>0000-00-00T00:00:00Z</endTime>
        </singleVCLData>
    </VCLDataList>
</SetVCLData>`;
      method = 'POST';
    } else {
      xml = `<?xml version="1.0" encoding="utf-8"?>
<VCLDelCond>
    <delVCLCond>1</delVCLCond>
    <plateNum>${formattedPlate}</plateNum>
</VCLDelCond>`;
      method = 'DELETE';
    }

    const debugFile = path.join(__dirname, 'sync_debug.log');
    fs.appendFileSync(debugFile, `\n--- SYNC ATTEMPT: ${new Date().toISOString()} ---\nIP: ${device.ipAddress}\nURL: ${url}\nMETHOD: ${method}\nXML: ${xml}\n`);

    try {
      const response = await request(url, {
        method: method,
        digestAuth: creds,
        data: xml,
        headers: { 'Content-Type': 'application/xml' },
        timeout: 5000
      });
      
      const resData = response.data ? response.data.toString() : 'NO DATA';
      fs.appendFileSync(debugFile, `RESPONSE STATUS: ${response.status}\nDATA: ${resData}\n`);

      results.push({ device: device.name, status: response.status });
    } catch (e) {
      console.error(`Sync error for ${device.ipAddress}:`, e.message);
      fs.appendFileSync(debugFile, `ERROR: ${e.message}\n`);
      results.push({ device: device.name, status: 'ERROR', error: e.message });
    }
  }
  return results;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });
const parser = new XMLParser({ ignoreAttributes: false });

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole, JWT_SECRET } = require('./authMiddleware');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, password, lotName } = req.body;
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin User and their ParkingLot in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, username, password: hashedPassword, role: 'ADMIN' }
      });
      const lot = await tx.parkingLot.create({
        data: { name: lotName, ownerId: user.id }
      });
      return { user, lot };
    });

    res.json({ success: true, message: 'Tadbirkor created successfully' });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ 
      where: { username },
      include: { ownedLots: true, parkingLot: true }
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // Determine the parking lot ID for this session
    let lotId = user.parkingLotId;
    if (user.role === 'ADMIN' && user.ownedLots.length > 0) {
      lotId = user.ownedLots[0].id; // For now, default to the first owned lot
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, parkingLotId: lotId }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        parkingLotId: lotId
      }
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, username: true, role: true, parkingLotId: true, ownedLots: true }
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- ADMIN ROUTES ---
app.get('/api/admin/cashiers', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const cashiers = await prisma.user.findMany({
      where: { role: 'CASHIER', parkingLotId: req.user.parkingLotId },
      select: { id: true, name: true, username: true, createdAt: true }
    });
    res.json(cashiers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/cashiers', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, username, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const cashier = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: 'CASHIER',
        parkingLotId: req.user.parkingLotId
      }
    });
    res.json({ success: true, cashier: { id: cashier.id, name: cashier.name, username: cashier.username } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/cashiers/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id, parkingLotId: req.user.parkingLotId } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/parking-lot', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { telegramChatId, name } = req.body;
    const lot = await prisma.parkingLot.update({
      where: { id: req.user.parkingLotId },
      data: { telegramChatId, name }
    });
    res.json({ success: true, lot });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/dashboard-stats', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    // Top-level stats for admin
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalRevenueResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        session: { lotId: req.user.parkingLotId }
      }
    });

    const activeSessions = await prisma.parkingSession.count({
      where: { status: 'ACTIVE', lotId: req.user.parkingLotId }
    });

    const cashiersCount = await prisma.user.count({
      where: { role: 'CASHIER', parkingLotId: req.user.parkingLotId }
    });

    res.json({
      totalRevenue: totalRevenueResult._sum.amount || 0,
      activeSessions,
      cashiersCount
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// --- CAMERA WEBHOOK (Hikvision ISAPI / ANPR) ---
app.post('/api/webhook/camera', upload.any(), async (req, res) => {
  try {
    const debugPath = path.join(__dirname, 'camera_debug.log');
    const logData = {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, mimetype: f.mimetype, size: f.size, path: f.path })) : []
    };
    fs.appendFileSync(debugPath, JSON.stringify(logData, null, 2) + '\n\n');

    let plateNumber = null;
    let direction = 'IN'; 
    let lotId = req.body.lotId || null;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.mimetype === 'application/xml' || file.mimetype === 'text/xml' || file.originalname.endsWith('.xml') || file.fieldname.includes('xml') || file.fieldname === 'anpr.xml') {
           const xmlData = fs.readFileSync(file.path, 'utf8');
           try {
             const parsed = parser.parse(xmlData);
             fs.appendFileSync(debugPath, 'PARSED XML: ' + JSON.stringify(parsed, null, 2) + '\n\n');
             
             if (parsed.EventNotificationAlert && parsed.EventNotificationAlert.ANPR) {
               plateNumber = parsed.EventNotificationAlert.ANPR.licensePlate;
             }
           } catch(e) {
             console.error('XML Parse Error:', e);
           }
        }
      }
    }

    // JSON/URL-encoded fallback (simulyator uchun)
    if (!plateNumber && req.body.plateNumber) {
      plateNumber = req.body.plateNumber;
    }
    if (req.body.direction) direction = req.body.direction;

    if (!plateNumber) {
      console.log('Webhook received but no plate number found.');
      return res.status(400).send('Plate number missing or unsupported format');
    }

    const car = await prisma.car.upsert({
      where: { plateNumber },
      update: {},
      create: { plateNumber }
    });

    if (car.isBlacklisted) {
      io.emit('alert', { message: `Qora ro'yxatdagi mashina: ${plateNumber}` });
      await prisma.log.create({ data: { type: 'BLACKLIST_ATTEMPT', carId: car.id, description: 'Qora ro\'yxatdagi mashina urindi' } });
      return res.status(403).json({ allowed: false, reason: 'BLACKLISTED' });
    }

    if (direction === 'IN') {
      const existingSession = await prisma.parkingSession.findFirst({
        where: { carId: car.id, status: 'ACTIVE' }
      });

      if (!existingSession) {
        // Agar lotId yuborilmasa, bazadagi birinchi ParkingLot'ni olamiz
        let targetLotId = lotId;
        if (!targetLotId) {
           const firstLot = await prisma.parkingLot.findFirst();
           if(firstLot) targetLotId = firstLot.id;
        }

        if(targetLotId) {
          await prisma.parkingSession.create({
            data: { carId: car.id, lotId: targetLotId, entryTime: new Date() }
          });
        }
      }

      await prisma.log.create({ data: { type: 'ENTRY', carId: car.id } });
      io.emit('car_entry', { plateNumber, time: new Date() });

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

      // Abonent emasmikin tekshiramiz
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
      io.emit('car_exit', { plateNumber, fee, time: exitTime, sessionId: session.id });

      if (fee === 0) {
        return res.status(200).json({ allowed: true, action: 'OPEN_BARRIER', fee: 0 });
      } else {
        return res.status(200).json({ allowed: false, action: 'WAIT_FOR_PAYMENT', fee, sessionId: session.id });
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// --- ADMIN API ---
app.get('/api/cars', async (req, res) => {
  const cars = await prisma.car.findMany();
  res.json(cars);
});

app.get('/api/sessions', async (req, res) => {
  const sessions = await prisma.parkingSession.findMany({
    include: { car: true, lot: true },
    orderBy: { entryTime: 'desc' }
  });
  res.json(sessions);
});

app.get('/api/stats', async (req, res) => {
  const activeCount = await prisma.parkingSession.count({ where: { status: 'ACTIVE' } });
  res.json({ activeCars: activeCount });
});

app.get('/api/logs', async (req, res) => {
  const logs = await prisma.log.findMany({
    include: { car: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(logs);
});

app.get('/api/devices', async (req, res) => {
  const devices = await prisma.device.findMany();
  res.json(devices);
});

app.post('/api/devices', async (req, res) => {
  const { name, ipAddress, port, type, username, password, lotId } = req.body;
  let targetLotId = lotId;
  if (!targetLotId) {
    const firstLot = await prisma.parkingLot.findFirst();
    if(firstLot) targetLotId = firstLot.id;
  }
  const newDevice = await prisma.device.create({
    data: { name, ipAddress, port: parseInt(port||80), type, username, password, lotId: targetLotId }
  });
  res.json(newDevice);
});

app.delete('/api/devices/:id', async (req, res) => {
  try {
    await prisma.device.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

app.post('/api/devices/:id/sync', async (req, res) => {
  try {
    const device = await prisma.device.findUnique({ where: { id: req.params.id } });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    if (!device.username || !device.password) return res.status(400).json({ error: 'Device credentials missing' });

    let baseUrl = device.ipAddress;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}:${device.port}`;

    const today = new Date();
    today.setHours(0,0,0,0);
    const startIso = today.toISOString().split('.')[0] + 'Z';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endIso = tomorrow.toISOString().split('.')[0] + 'Z';

    const searchUrl = `${baseUrl}/ISAPI/ContentMgmt/search`;
    
    const payloads = [
      `<?xml version="1.0" encoding="utf-8"?><CMSearchDescription><searchID>1</searchID><trackList><trackID>103</trackID></trackList><timeSpanList><timeSpan><startTime>${startIso}</startTime><endTime>${endIso}</endTime></timeSpan></timeSpanList><maxResults>50</maxResults><searchResultPosition>0</searchResultPosition></CMSearchDescription>`,
      `<?xml version="1.0" encoding="utf-8"?><CMSearchDescription><searchID>2</searchID><trackList><trackID>1</trackID></trackList><timeSpanList><timeSpan><startTime>${startIso}</startTime><endTime>${endIso}</endTime></timeSpan></timeSpanList><contentTypeList><contentType>metadata</contentType></contentTypeList><maxResults>50</maxResults><searchResultPosition>0</searchResultPosition></CMSearchDescription>`,
      `<?xml version="1.0" encoding="utf-8"?><CMSearchDescription><searchID>3</searchID><timeSpanList><timeSpan><startTime>${startIso}</startTime><endTime>${endIso}</endTime></timeSpan></timeSpanList><contentTypeList><contentType>picture</contentType></contentTypeList><maxResults>50</maxResults><searchResultPosition>0</searchResultPosition></CMSearchDescription>`,
      `<?xml version="1.0" encoding="utf-8"?><CMSearchDescription><searchID>4</searchID><timeSpanList><timeSpan><startTime>${startIso}</startTime><endTime>${endIso}</endTime></timeSpan></timeSpanList><maxResults>50</maxResults><searchResultPosition>0</searchResultPosition></CMSearchDescription>`
    ];

    let xmlRes = '';
    let foundMatches = false;
    
    for (let i = 0; i < payloads.length; i++) {
      try {
        const response = await request(searchUrl, {
          method: 'POST',
          digestAuth: `${device.username}:${device.password}`,
          data: payloads[i],
          headers: { 'Content-Type': 'application/xml' },
          timeout: 5000
        });
        
        if (response.status === 200) {
          const resStr = response.data.toString();
          xmlRes = resStr; // keep the last valid response
          
          if (resStr.includes('<numOfMatches>') && !resStr.includes('<numOfMatches>0</numOfMatches>')) {
             foundMatches = true;
             fs.writeFileSync(path.join(__dirname, 'sync_debug.log'), `SUCCESS PAYLOAD ${i}:\n${resStr}`);
             break;
          }
        }
      } catch (e) {
        console.error('Payload fail', i);
      }
    }

    if (!foundMatches) {
      fs.writeFileSync(path.join(__dirname, 'sync_debug.log'), `ALL PAYLOADS RETURNED 0 MATCHES.\nLAST RESPONSE:\n${xmlRes}`);
    }

    // G'ildirak izlash: har xil Hikvision modellariga mos tushish uchun regex orqali plate izlaymiz
    let plates = [...xmlRes.matchAll(/<licensePlate>([^<]+)<\/licensePlate>/g)].map(m => m[1]);
    if (plates.length === 0) plates = [...xmlRes.matchAll(/<plateNumber>([^<]+)<\/plateNumber>/g)].map(m => m[1]);

    let addedCount = 0;
    for (const plate of plates) {
      // Shu mashina bugun yozilganmi tekshiramiz
      const exists = await prisma.log.findFirst({
        where: { car: { plateNumber: plate }, createdAt: { gte: today } }
      });
      
      if (!exists) {
        const car = await prisma.car.upsert({
          where: { plateNumber: plate },
          update: {},
          create: { plateNumber: plate }
        });
        
        // Ensure a parking session exists so it shows up in history/reports
        const existingSession = await prisma.parkingSession.findFirst({
          where: { carId: car.id, status: 'ACTIVE' }
        });

        if (!existingSession) {
          const firstLot = await prisma.parkingLot.findFirst();
          if (firstLot) {
            await prisma.parkingSession.create({
              data: { carId: car.id, lotId: firstLot.id, entryTime: new Date() }
            });
          }
        }

        await prisma.log.create({ data: { type: 'ENTRY', carId: car.id, description: 'SYNCED' } });
        
        // Simulating entry for dashboard
        io.emit('car_entry', { plateNumber: plate, time: new Date() });
        addedCount++;
      }
    }

    res.json({ success: true, syncedCount: addedCount });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Failed to sync with device' });
  }
});

app.get('/api/devices/:id/ping', async (req, res) => {
  try {
    const device = await prisma.device.findUnique({ where: { id: req.params.id } });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    
    let url = device.ipAddress;
    if (!url.startsWith('http')) {
      url = `http://${url}:${device.port}`;
    }
    
    try {
      await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      res.json({ status: 'ONLINE' });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      res.json({ status: 'OFFLINE' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/subscribers', async (req, res) => {
  const subscribers = await prisma.car.findMany({ where: { isSubscriber: true } });
  res.json(subscribers);
});

app.post('/api/subscribers', async (req, res) => {
  const { plateNumber, months, amount, cardNo } = req.body;
  const subscriberEnd = new Date();
  subscriberEnd.setMonth(subscriberEnd.getMonth() + parseInt(months || 1));
  
  const car = await prisma.car.upsert({
    where: { plateNumber },
    update: { isSubscriber: true, subscriberEnd, cardNo: cardNo || null },
    create: { plateNumber, isSubscriber: true, subscriberEnd, cardNo: cardNo || null }
  });
  
  if (amount) {
    await prisma.log.create({
      data: { type: 'SUBSCRIPTION_PAID', carId: car.id, description: `To'landi: ${amount} UZS (${months} oy)` }
    });
  }
  
  // Sync with cameras
  try {
    await syncPlateToCameras(plateNumber, 'add', cardNo);
  } catch (e) {
    console.error('Camera sync failed:', e);
  }
  
  res.json(car);
});

app.delete('/api/subscribers/:id', async (req, res) => {
  const carId = req.params.id;
  const carData = await prisma.car.findUnique({ where: { id: carId } });
  
  const car = await prisma.car.update({
    where: { id: carId },
    data: { isSubscriber: false, subscriberEnd: null }
  });

  if (carData) {
    try {
      await syncPlateToCameras(carData.plateNumber, 'delete');
    } catch (e) {
      console.error('Camera deletion failed:', e);
    }
  }
  res.json(car);
});

app.post('/api/devices/sync-subscribers', async (req, res) => {
  try {
    const subscribers = await prisma.car.findMany({ 
      where: { 
        isSubscriber: true,
        subscriberEnd: { gte: new Date() }
      } 
    });
    
    const results = [];
    for (const sub of subscribers) {
      const res = await syncPlateToCameras(sub.plateNumber, 'add', sub.cardNo);
      results.push({ plate: sub.plateNumber, results: res });
    }
    
    res.json({ success: true, results });
  } catch (err) {
    console.error('Manual sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Import from Excel/CSV
app.post('/api/subscribers/import', uploadMemory.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let importedCount = 0;

    for (const row of data) {
      // Hikvision standard columns: "License Plate Number", "Card No."
      const plateNumber = row['License Plate Number'] || row['Davlat raqami'] || row['Plate'];
      const cardNo = row['Card No.'] || row['Card No'] || row['ID'] || row['No.'] || row['No'];

      if (!plateNumber) continue;

      const formattedPlate = String(plateNumber).trim().toUpperCase();
      const formattedCardNo = cardNo ? String(cardNo).trim() : null;
      
      const subscriberEnd = new Date();
      subscriberEnd.setFullYear(subscriberEnd.getFullYear() + 1); // Default 1 year for imported

      await prisma.car.upsert({
        where: { plateNumber: formattedPlate },
        update: { 
          isSubscriber: true, 
          cardNo: formattedCardNo 
        },
        create: { 
          plateNumber: formattedPlate, 
          isSubscriber: true, 
          subscriberEnd, 
          cardNo: formattedCardNo 
        }
      });
      importedCount++;
    }

    res.json({ success: true, importedCount });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import file: ' + err.message });
  }
});

app.get('/api/reports/revenue', async (req, res) => {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  const aggregated = {};
  for (const p of payments) {
    const date = p.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    if (!aggregated[date]) aggregated[date] = 0;
    aggregated[date] += p.amount;
  }
  
  let data = Object.keys(aggregated).map(date => ({
    date,
    revenue: aggregated[date]
  }));
  
  if (data.length === 0) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({ date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), revenue: 0 });
    }
  }
  
  res.json(data);
});

app.get('/api/reports/traffic', async (req, res) => {
  const logs = await prisma.log.findMany({
    where: { type: { in: ['ENTRY', 'EXIT'] } },
    orderBy: { createdAt: 'asc' }
  });
  
  const aggregated = {};
  for (const log of logs) {
    const date = log.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    if (!aggregated[date]) aggregated[date] = { date, entries: 0, exits: 0 };
    if (log.type === 'ENTRY') aggregated[date].entries += 1;
    if (log.type === 'EXIT') aggregated[date].exits += 1;
  }
  
  let data = Object.values(aggregated);
  
  if (data.length === 0) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({ date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), entries: 0, exits: 0 });
    }
  }
  
  res.json(data);
});

app.get('/api/reports/history', async (req, res) => {
  const sessions = await prisma.parkingSession.findMany({
    include: { car: true },
    orderBy: { entryTime: 'desc' },
    take: 100
  });
  res.json(sessions);
});

// SIMULATED TERMINAL INTEGRATION (Uzcard / Humo)
app.post('/api/payment/terminal', async (req, res) => {
  const { sessionId, amount } = req.body;
  try {
    const session = await prisma.parkingSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    // Simulate terminal hardware delay (waiting for PIN)
    console.log(`[TERMINAL] Sending ${amount} UZS request to hardware...`);
    await new Promise(resolve => setTimeout(resolve, 4000));
    console.log(`[TERMINAL] Payment approved by bank.`);

    const payment = await prisma.payment.create({
      data: { sessionId, amount: parseFloat(amount), method: 'CARD_TERMINAL', status: 'SUCCESS' }
    });
    
    await prisma.parkingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' }
    });

    // TRIGGER BARRIER OPENING AFTER PAYMENT
    console.log(`[PAYMENT] Card payment approved for session ${sessionId}. Triggering barrier...`);
    const ips = ['10.70.5.8', '10.70.5.7'];
    const creds = 'admin:Uranch135';
    const { request } = require('urllib');
    const variations = [
      { url: '/ISAPI/Traffic/channels/1/entranceAndExit/barrierGate/1/control', data: `<?xml version="1.0" encoding="UTF-8"?><BarrierGateControl version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><command>open</command></BarrierGateControl>` },
      { url: '/ISAPI/Traffic/channels/1/barrierControl', data: `<?xml version="1.0" encoding="UTF-8"?><BarrierControl version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><command>open</command></BarrierControl>` },
      { url: '/ISAPI/System/IO/outputs/1/trigger', data: `<?xml version="1.0" encoding="UTF-8"?><IOPortData version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><outputState>pulse</outputState></IOPortData>` }
    ];
    for (const ip of ips) {
      for (const v of variations) {
        try { await request(`http://${ip}${v.url}`, { method: 'PUT', digestAuth: creds, data: v.data, timeout: 1500, headers: { 'Content-Type': 'application/xml' } }); } catch (e) {}
      }
    }
    
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: 'Terminal xatosi' });
  }
});

// SIMULATED CASH DISPENSER INTEGRATION
app.post('/api/payment/cash', async (req, res) => {
  const { sessionId, fee, insertedAmount } = req.body;
  try {
    const session = await prisma.parkingSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const change = parseFloat(insertedAmount) - parseFloat(fee);
    if (change < 0) return res.status(400).json({ error: 'Mablag\' yetarli emas' });

    console.log(`[CASH_ACCEPTOR] Qabul qilindi: ${insertedAmount}, To'lov: ${fee}, Qaytim: ${change}`);
    
    if (change > 0) {
      console.log(`[DISPENSER] ${change} UZS qaytarilmoqda...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate dispense time
      console.log(`[DISPENSER] Pul qaytarildi.`);
    }

    const payment = await prisma.payment.create({
      data: { sessionId, amount: parseFloat(fee), method: 'CASH_HARDWARE', status: 'SUCCESS' }
    });
    
    await prisma.parkingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' }
    });
    
    res.json({ success: true, payment, change });
  } catch (err) {
    res.status(500).json({ error: 'Kassa xatosi' });
  }
});

app.post('/api/payment/pay', async (req, res) => {
  const { sessionId, method, amount } = req.body; // method: CASH, CARD, APP
  try {
    const session = await prisma.parkingSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const payment = await prisma.payment.create({
      data: { sessionId, amount: parseFloat(amount), method, status: 'SUCCESS' }
    });
    
    await prisma.parkingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' }
    });
    
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: 'Payment failed' });
  }
});

app.post('/api/barrier/open', async (req, res) => {
  console.log('[API] Barrier open requested');
  const ips = ['10.70.5.7', '10.70.5.8'];
  const creds = 'admin:Uranch135';
  const { request } = require('urllib');
  
  const v = { method: 'PUT', url: '/ISAPI/Parking/channels/1/barrierGate', data: `<?xml version="1.0" encoding="UTF-8"?><BarrierGate><ctrlMode>open</ctrlMode></BarrierGate>` };

  // Send requests and return success immediately for instant UI feel
  ips.forEach(ip => {
    request(`http://${ip}${v.url}`, {
      method: v.method,
      digestAuth: creds,
      headers: { 'Content-Type': 'application/xml', 'X-Requested-With': 'XMLHttpRequest' },
      data: v.data,
      timeout: 5000
    }).then(res => {
      console.log(`[BARRIER] ${ip} response: ${res.status}`);
    }).catch(e => {
      console.error(`[BARRIER] ${ip} error:`, e.message);
    });
  });

  res.json({ success: true, message: 'Shlagbaum ochildi!' });
});

app.post('/api/manual-entry', async (req, res) => {
  const { plateNumber } = req.body;
  try {
    const car = await prisma.car.upsert({
      where: { plateNumber },
      update: {},
      create: { plateNumber }
    });

    const existingSession = await prisma.parkingSession.findFirst({
      where: { carId: car.id, status: 'ACTIVE' }
    });

    if (!existingSession) {
      const firstLot = await prisma.parkingLot.findFirst();
      if(firstLot) {
        await prisma.parkingSession.create({
          data: { carId: car.id, lotId: firstLot.id, entryTime: new Date() }
        });
      }
    }

    await prisma.log.create({ data: { type: 'ENTRY', carId: car.id, description: 'MANUAL_ENTRY' } });
    io.emit('car_entry', { plateNumber, time: new Date() });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to manual entry' });
  }
});

// --- HEARTBEAT MONITORING ---
global.lastAgentHeartbeat = null;

app.post('/api/webhook/heartbeat', (req, res) => {
  global.lastAgentHeartbeat = {
    receivedAt: new Date(),
    cameras: req.body.cameras || []
  };
  res.json({ success: true });
});

// --- TELEGRAM MINI APP ENDPOINTS ---
const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;

const cameraClients = {};
function getCameraClient(ip) {
  if (!cameraClients[ip]) {
    cameraClients[ip] = new DigestClient('admin', 'Uranch135');
  }
  return cameraClients[ip];
}

app.get('/mini-app', (req, res) => {
  res.sendFile(path.join(__dirname, 'mini-app.html'));
});

app.get('/api/camera/snapshot/:ip', async (req, res) => {
  const { ip } = req.params;
  const client = getCameraClient(ip);
  const url = `http://${ip}/ISAPI/Streaming/channels/1/picture`;

  try {
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
      res.end(compressedBuffer);
    } else {
      res.status(response.status).send('Failed to get snapshot');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/camera/stream/:ip', async (req, res) => {
  const { ip } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary',
    'Cache-Control': 'no-cache',
    'Connection': 'close',
    'Pragma': 'no-cache'
  });

  const client = getCameraClient(ip);
  let isConnected = true;

  req.on('close', () => {
    isConnected = false;
  });

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
});

app.post('/api/manual-open-camera', async (req, res) => {
  const { ip } = req.body;
  const client = getCameraClient(ip);
  const url = `http://${ip}/ISAPI/Parking/channels/1/barrierGate`;
  const data = `<?xml version="1.0" encoding="UTF-8"?><BarrierGate><ctrlMode>open</ctrlMode></BarrierGate>`;

  try {
    const result = await client.fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/xml', 'X-Requested-With': 'XMLHttpRequest' },
      body: data,
      timeout: 4000
    });

    if (result.status === 200) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ error: `Failed with status ${result.status}` });
    }
  } catch (err) {
    console.error('Camera open failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// --- STATIC FILE SERVING FOR REACT FRONTEND ---
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to React index.html for any frontend SPA routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/stream') || req.path.startsWith('/mini-app')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- TELEGRAM BOT ---
require('./telegramBot');

// --- RTSP TRANSCODER & WEBSOCKET PROXIES ---
const rtspStreamServer = require('./rtsp_stream_server');
const WebSocket = require('ws');
const wssProxy = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/stream/kirish' || pathname === '/stream/chiqish') {
    rtspStreamServer.handleUpgrade(pathname, request, socket, head, wssProxy);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SmartPark Backend running on port ${PORT}`);
});
