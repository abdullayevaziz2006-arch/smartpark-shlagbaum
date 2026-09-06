const prisma = require('../config/db');

async function getRevenueReport(req, res) {
  try {
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
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function getTrafficReport(req, res) {
  try {
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
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function getHistoryReport(req, res) {
  try {
    const sessions = await prisma.parkingSession.findMany({
      include: { car: true },
      orderBy: { entryTime: 'desc' },
      take: 100
    });
    res.json(sessions);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function getSessions(req, res) {
  try {
    const sessions = await prisma.parkingSession.findMany({
      include: { car: true, lot: true },
      orderBy: { entryTime: 'desc' }
    });
    res.json(sessions);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function getStats(req, res) {
  try {
    const activeCount = await prisma.parkingSession.count({ where: { status: 'ACTIVE' } });
    res.json({ activeCars: activeCount });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function getLogs(req, res) {
  try {
    const logs = await prisma.log.findMany({
      include: { car: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(logs);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  getRevenueReport,
  getTrafficReport,
  getHistoryReport,
  getSessions,
  getStats,
  getLogs
};
