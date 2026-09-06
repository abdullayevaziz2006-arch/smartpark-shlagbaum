const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { request } = require('urllib');
const prisma = require('../config/db');
const updateEnvFile = require('../utils/envUpdater');
const { JWT_SECRET } = require('../middleware/authMiddleware');

async function checkActivation(req, res) {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    const lot = await prisma.parkingLot.findFirst();
    
    res.json({
      activated: !!(adminUser && lot),
      parkingLotName: lot ? lot.name : null
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function activate(req, res) {
  try {
    const { phone, password, centralServerUrl } = req.body;
    
    if (!phone || !password || !centralServerUrl) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldiring." });
    }

    const cloudUrl = centralServerUrl.replace(/\/$/, ""); // Remove trailing slash

    // Request activation details from central server
    const response = await request(`${cloudUrl}/api/cloud/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ phone, password }),
      dataType: 'json',
      timeout: 15000
    });

    if (response.status !== 200) {
      const errData = response.data || {};
      return res.status(response.status).json({ error: errData.error || "Bulutli serverdan faollashtirib bo'lmadi." });
    }

    const { user, organization, parkingLot } = response.data;

    // Clear local database
    await prisma.$transaction([
      prisma.user.deleteMany(),
      prisma.parkingLot.deleteMany()
    ]);

    // Create new local ParkingLot
    const newLot = await prisma.parkingLot.create({
      data: {
        id: parkingLot.id,
        name: parkingLot.name
      }
    });

    // Create new local ADMIN (using hash from cloud directly)
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        password: user.passwordHash,
        role: 'ADMIN',
        parkingLotId: newLot.id
      }
    });

    // Link ownerId to ParkingLot
    await prisma.parkingLot.update({
      where: { id: newLot.id },
      data: { ownerId: newUser.id }
    });

    // Update .env file
    updateEnvFile('CENTRAL_SERVER_URL', cloudUrl);
    updateEnvFile('PARKING_LOT_ID', newLot.id);

    process.env.CENTRAL_SERVER_URL = cloudUrl;
    process.env.PARKING_LOT_ID = newLot.id;

    // Stop local telegram bot polling if it was running
    try {
      const telegramBot = require('../telegramBot');
      if (telegramBot && typeof telegramBot.stopPolling === 'function' && telegramBot.isPolling()) {
        await telegramBot.stopPolling();
        console.log('🛑 [Telegram Bot] Lokal bot pollingi to\'xtatildi (Aktivatsiya muvaffaqiyatli).');
      }
    } catch (botErr) {
      console.error('Lokal botni to\'xtatishda xato:', botErr.message);
    }

    res.json({
      success: true,
      message: "Dastur muvaffaqiyatli faollashtirildi!"
    });
  } catch (e) {
    console.error('[Local Activate Error]:', e);
    return res.status(500).json({ error: e.message });
  }
}

async function register(req, res) {
  try {
    const { name, username, password, lotName } = req.body;
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin User and their ParkingLot in a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, username, password: hashedPassword, role: 'ADMIN' }
      });
      await tx.parkingLot.create({
        data: { name: lotName, ownerId: user.id }
      });
    });

    res.json({ success: true, message: 'Tadbirkor created successfully' });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}

async function login(req, res) {
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
      lotId = user.ownedLots[0].id;
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
    return res.status(500).json({ error: e.message });
  }
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, username: true, role: true, parkingLotId: true, ownedLots: true }
    });
    res.json(user);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  checkActivation,
  activate,
  register,
  login,
  me
};
