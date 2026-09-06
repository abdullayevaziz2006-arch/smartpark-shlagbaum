const xlsx = require('xlsx');
const prisma = require('../config/db');
const socketService = require('../services/socketService');
const { syncPlateToCameras } = require('../services/syncService');

async function getCars(req, res) {
  try {
    const cars = await prisma.car.findMany();
    res.json(cars);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getSubscribers(req, res) {
  try {
    const subscribers = await prisma.car.findMany({ where: { isSubscriber: true } });
    res.json(subscribers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createSubscriber(req, res) {
  const { plateNumber, months, amount, cardNo } = req.body;
  const subscriberEnd = new Date();
  subscriberEnd.setMonth(subscriberEnd.getMonth() + parseInt(months || 1));
  
  try {
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function deleteSubscriber(req, res) {
  const carId = req.params.id;
  try {
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function syncSubscribersToDevices(req, res) {
  try {
    const subscribers = await prisma.car.findMany({ 
      where: { 
        isSubscriber: true,
        subscriberEnd: { gte: new Date() }
      } 
    });
    
    const results = [];
    for (const sub of subscribers) {
      const cameraResults = await syncPlateToCameras(sub.plateNumber, 'add', sub.cardNo);
      results.push({ plate: sub.plateNumber, results: cameraResults });
    }
    
    res.json({ success: true, results });
  } catch (err) {
    console.error('Manual sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
}

async function importSubscribers(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let importedCount = 0;

    for (const row of data) {
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
}

async function manualEntry(req, res) {
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
      if (firstLot) {
        await prisma.parkingSession.create({
          data: { carId: car.id, lotId: firstLot.id, entryTime: new Date() }
        });
      }
    }

    await prisma.log.create({ data: { type: 'ENTRY', carId: car.id, description: 'MANUAL_ENTRY' } });
    socketService.emit('car_entry', { plateNumber, time: new Date() });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to manual entry' });
  }
}

module.exports = {
  getCars,
  getSubscribers,
  createSubscriber,
  deleteSubscriber,
  syncSubscribersToDevices,
  importSubscribers,
  manualEntry
};
