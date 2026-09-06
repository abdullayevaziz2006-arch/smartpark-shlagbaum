const { Server } = require('socket.io');
const { exec } = require('child_process');

let io = null;
let exitTimeout = null;
let hasClientConnected = false;

function init(server) {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    hasClientConnected = true;
    console.log('Client connected:', socket.id);
    checkAutoExit();

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Check auto exit after a short delay to accommodate client refreshes
      setTimeout(checkAutoExit, 1000);
    });
  });

  return io;
}

function getIo() {
  return io;
}

function emit(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

function checkAutoExit() {
  if (!io) return;
  const count = io.engine.clientsCount;
  console.log(`[AutoExit] Active Socket.io clients: ${count}`);
  
  if (count > 0) {
    if (exitTimeout) {
      console.log('[AutoExit] Active connection detected. Cancelling auto-exit timer.');
      clearTimeout(exitTimeout);
      exitTimeout = null;
    }
  } else if (hasClientConnected) {
    if (!exitTimeout) {
      console.log('[AutoExit] No active clients. Auto-exit is disabled for local testing.');
      // Keeping server alive so user can browse localhost:3001 freely
    }
  }
}

module.exports = {
  init,
  getIo,
  emit
};
