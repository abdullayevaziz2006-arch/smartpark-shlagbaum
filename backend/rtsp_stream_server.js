const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const WebSocket = require('ws');

const CAMERA_CONFIGS = {
  kirish: {
    url: 'rtsp://admin:Uranch135@10.70.5.8:554/Streaming/channels/102',
    clients: new Set(),
    process: null
  },
  chiqish: {
    url: 'rtsp://admin:Uranch135@10.70.5.7:554/Streaming/channels/102',
    clients: new Set(),
    process: null
  }
};

function startFFmpeg(name) {
  const config = CAMERA_CONFIGS[name];
  if (config.process) return;

  console.log(`[Stream ${name}] Spawning FFmpeg to pull from camera...`);
  
  const args = [
    '-rtsp_transport', 'tcp',
    '-i', config.url,
    '-f', 'mpegts',
    '-codec:v', 'mpeg1video',
    '-b:v', '800k',
    '-r', '25',
    '-s', '640x360',
    '-bf', '0',
    'pipe:1'
  ];

  const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'ignore'] });
  config.process = proc;

  proc.stdout.on('data', (chunk) => {
    config.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(chunk);
      }
    });
  });

  proc.on('exit', (code) => {
    console.log(`[Stream ${name}] FFmpeg exited with code ${code}`);
    config.process = null;
    
    // Auto-restart if we still have active clients watching!
    if (config.clients.size > 0) {
      console.log(`[Stream ${name}] Active viewers still present, restarting stream in 2s...`);
      setTimeout(() => startFFmpeg(name), 2000);
    }
  });

  proc.on('error', (err) => {
    console.error(`[Stream ${name}] FFmpeg process error:`, err.message);
  });
}

function stopFFmpeg(name) {
  const config = CAMERA_CONFIGS[name];
  if (!config.process) return;

  console.log(`[Stream ${name}] No active viewers, stopping FFmpeg to conserve resources...`);
  try {
    config.process.kill('SIGKILL');
  } catch (e) {}
  config.process = null;
}

function handleUpgrade(pathname, request, socket, head, wss) {
  const name = pathname === '/stream/kirish' ? 'kirish' : 'chiqish';
  const config = CAMERA_CONFIGS[name];

  wss.handleUpgrade(request, socket, head, (ws) => {
    config.clients.add(ws);
    console.log(`[Stream ${name}] New viewer connected. Active viewers: ${config.clients.size}`);

    // Lazy-load the FFmpeg stream when the first viewer joins!
    if (config.clients.size === 1) {
      startFFmpeg(name);
    }

    ws.on('close', () => {
      config.clients.delete(ws);
      console.log(`[Stream ${name}] Viewer disconnected. Active viewers: ${config.clients.size}`);
      
      // Stop the stream if the last viewer leaves!
      if (config.clients.size === 0) {
        stopFFmpeg(name);
      }
    });

    ws.on('error', (err) => {
      config.clients.delete(ws);
    });
  });
}

module.exports = {
  handleUpgrade
};
