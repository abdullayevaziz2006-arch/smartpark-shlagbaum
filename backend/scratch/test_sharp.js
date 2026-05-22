const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;
const sharp = require('sharp');

async function test() {
  const ip = '10.70.5.8';
  const client = new DigestClient('admin', 'Uranch135');
  const url = `http://${ip}/ISAPI/Streaming/channels/1/picture`;
  
  console.log(`Fetching image from: ${url}`);
  try {
    const startTime = Date.now();
    const response = await client.fetch(url, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.status === 200) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fetchTime = Date.now() - startTime;
      console.log(`Fetched! Size: ${buffer.length} bytes (took ${fetchTime}ms)`);
      
      const compressStart = Date.now();
      const compressed = await sharp(buffer)
        .resize(640, 360, { fit: 'inside' })
        .jpeg({ quality: 60 })
        .toBuffer();
      const compressTime = Date.now() - compressStart;
      
      console.log(`Compressed! New Size: ${compressed.length} bytes (took ${compressTime}ms)`);
      console.log(`Compression ratio: ${((buffer.length - compressed.length) / buffer.length * 100).toFixed(1)}% saved!`);
    } else {
      console.log(`Fetch failed with status: ${response.status}`);
    }
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

test();
