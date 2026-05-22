const Stream = require('node-rtsp-stream');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

process.env.PATH += path.delimiter + path.dirname(ffmpegPath);

console.log("Starting Chiqish stream test...");
try {
  const streamChiqish = new Stream({
    name: 'cam-chiqish',
    streamUrl: 'rtsp://admin:Uranch135@10.70.5.7:554/Streaming/channels/102',
    wsPort: 9995, // use a different port to avoid conflict
    ffmpegOptions: {
      '-stats': '',
      '-r': 25,
      '-s': '640x360',
      '-codec:v': 'mpeg1video',
      '-b:v': '600k',
      '-bf': '0'
    }
  });

  streamChiqish.on('data', (data) => {
    // console.log("Stream received data: " + data.length + " bytes");
  });

  setTimeout(() => {
    console.log("Shutting down stream test...");
    process.exit(0);
  }, 10000);
} catch (err) {
  console.error("Stream crash:", err.message);
}
