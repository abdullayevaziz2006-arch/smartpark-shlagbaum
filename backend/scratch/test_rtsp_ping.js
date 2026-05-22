const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

function testUrl(url) {
  return new Promise((resolve) => {
    const cmd = `"${ffmpegPath}" -rtsp_transport tcp -i "${url}" -t 2 -f null -`;
    console.log(`Running test for: ${url}`);
    
    const start = Date.now();
    const child = exec(cmd, (error, stdout, stderr) => {
      const duration = Date.now() - start;
      if (error) {
        console.log(`FAIL: took ${duration}ms. Error: ${error.message}`);
        if (stderr.includes('401 Unauthorized') || stderr.includes('401')) {
          console.log(`  Reason: 401 Unauthorized (Credentials incorrect!)`);
        } else if (stderr.includes('404 Not Found') || stderr.includes('404')) {
          console.log(`  Reason: 404 Channel Not Found`);
        } else if (stderr.includes('Connection refused')) {
          console.log(`  Reason: Connection refused`);
        } else {
          console.log(`  Details: ${stderr.slice(-300)}`);
        }
      } else {
        console.log(`SUCCESS: Connected and pulled stream in ${duration}ms!`);
      }
      resolve();
    });
  });
}

async function run() {
  await testUrl('rtsp://admin:Uranch135@10.70.5.7:554/Streaming/channels/102');
  await testUrl('rtsp://admin:Uranch135@10.70.5.7:554/Streaming/channels/101');
  await testUrl('rtsp://admin:Uranch135@10.70.5.7:554/Streaming/channels/1');
  await testUrl('rtsp://admin:Uranch135@10.70.5.7:554/Streaming/channels/2');
}

run();
