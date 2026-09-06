const prisma = require('../config/db');
const barrierService = require('../services/barrierService');

async function processTerminalPayment(req, res) {
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
    // Default IPs from environment or original code
    barrierService.triggerBarrierOpen(['10.70.5.7', '10.70.5.8'], 'admin', 'Uranch135');
    
    res.json({ success: true, payment });
  } catch (err) {
    return res.status(500).json({ error: 'Terminal xatosi' });
  }
}

async function processCashPayment(req, res) {
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

    // TRIGGER BARRIER OPENING AFTER CASH PAYMENT
    console.log(`[PAYMENT] Cash payment accepted for session ${sessionId}. Triggering barrier...`);
    barrierService.triggerBarrierOpen(['10.70.5.7', '10.70.5.8'], 'admin', 'Uranch135');
    
    res.json({ success: true, payment, change });
  } catch (err) {
    return res.status(500).json({ error: 'Kassa xatosi' });
  }
}

async function processGeneralPayment(req, res) {
  const { sessionId, method, amount } = req.body;
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

    // TRIGGER BARRIER OPENING AFTER GENERAL PAYMENT
    console.log(`[PAYMENT] General payment approved for session ${sessionId}. Triggering barrier...`);
    barrierService.triggerBarrierOpen(['10.70.5.7', '10.70.5.8'], 'admin', 'Uranch135');
    
    res.json({ success: true, payment });
  } catch (err) {
    return res.status(500).json({ error: 'Payment failed' });
  }
}

module.exports = {
  processTerminalPayment,
  processCashPayment,
  processGeneralPayment
};
