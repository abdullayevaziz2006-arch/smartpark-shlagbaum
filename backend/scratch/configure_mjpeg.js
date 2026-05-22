const DigestFetch = require('digest-fetch');
const DigestClient = DigestFetch.default || DigestFetch;

async function configureMJPEG(ip, channelName) {
  const client = new DigestClient('admin', 'Uranch135');
  const url = `http://${ip}/ISAPI/Streaming/channels/3`;
  
  const mjpegXML = `<?xml version="1.0" encoding="UTF-8"?>
<StreamingChannel version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
<id>3</id>
<channelName>${channelName}</channelName>
<enabled>true</enabled>
<Transport>
<rtspPortNo>554</rtspPortNo>
<maxPacketSize>1000</maxPacketSize>
<ControlProtocolList>
<ControlProtocol>
<streamingTransport>RTSP</streamingTransport>
</ControlProtocol>
</ControlProtocolList>
<Unicast>
<enabled>true</enabled>
</Unicast>
<Multicast>
<enabled>true</enabled>
<destIPAddress>0.0.0.0</destIPAddress>
<videoDestPortNo>8600</videoDestPortNo>
</Multicast>
<Security>
<enabled>true</enabled>
<certificateType>digest/baisc</certificateType>
</Security>
</Transport>
<Video>
<enabled>true</enabled>
<videoInputChannelID>1</videoInputChannelID>
<videoCodecType>MJPEG</videoCodecType>
<videoScanType>progressive</videoScanType>
<videoResolutionWidth>704</videoResolutionWidth>
<videoResolutionHeight>576</videoResolutionHeight>
<videoQualityControlType>vbr</videoQualityControlType>
<vbrUpperCap>2048</vbrUpperCap>
<fixedQuality>60</fixedQuality>
<maxFrameRate>1500</maxFrameRate>
<snapShotImageType>JPEG</snapShotImageType>
</Video>
<Audio>
<enabled>false</enabled>
<audioInputChannelID>1</audioInputChannelID>
<audioCompressionType>G.711ulaw</audioCompressionType>
</Audio>
</StreamingChannel>`;

  console.log(`Sending PUT to configure MJPEG on ${ip}...`);
  try {
    const response = await client.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: mjpegXML,
      timeout: 5000
    });
    
    console.log(`Status for ${ip}: ${response.status} (${response.statusText})`);
    const responseText = await response.text();
    console.log(responseText);
  } catch (err) {
    console.error(`Error configuring ${ip}:`, err.message);
  }
}

async function run() {
  await configureMJPEG('10.70.5.8', 'Parkovka kirish');
  await configureMJPEG('10.70.5.7', 'Camera 01');
}

run();
