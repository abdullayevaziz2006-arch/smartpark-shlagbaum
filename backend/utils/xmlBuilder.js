function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function buildVclAddXml(plateNum, cardNo) {
  const escPlate = escapeXml(plateNum).toUpperCase().trim();
  const escCard = escapeXml(cardNo || '').trim();
  // Doimiy ruxsat: boshlanish va tugash vaqti permanent (2099 yil)
  return `<?xml version="1.0" encoding="utf-8"?>
<SetVCLData version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
    <VCLDataList>
        <singleVCLData>
            <id>0</id>
            <runNum>0</runNum>
            <listType>0</listType>
            <plateNum>${escPlate}</plateNum>
            <cardNo>${escCard}</cardNo>
            <startTime>2000-01-01T00:00:00Z</startTime>
            <endTime>2099-12-31T23:59:59Z</endTime>
        </singleVCLData>
    </VCLDataList>
</SetVCLData>`;
}

function buildVclDeleteXml(plateNum) {
  const escPlate = escapeXml(plateNum).toUpperCase().trim();
  return `<?xml version="1.0" encoding="utf-8"?>
<VCLDelCond>
    <delVCLCond>1</delVCLCond>
    <plateNum>${escPlate}</plateNum>
</VCLDelCond>`;
}

function buildBarrierGateOpenXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<BarrierGate>
    <ctrlMode>open</ctrlMode>
</BarrierGate>`;
}

function buildBarrierGateControlOpenXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<BarrierGateControl version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
    <command>open</command>
</BarrierGateControl>`;
}

function buildBarrierControlOpenXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<BarrierControl version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
    <command>open</command>
</BarrierControl>`;
}

function buildIoportTriggerPulseXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<IOPortData version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
    <outputState>pulse</outputState>
</IOPortData>`;
}

// DS-TCG205-E modeli uchun ISAPI: /ISAPI/ITC/Entrance/barrierGateCtrl
function buildTCG205BarrierCtrlXml(gateNum = 1, action = 'on') {
  return `<?xml version="1.0" encoding="utf-8"?>
<BarrierGateCtrl version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
    <barrietGateNum>${gateNum}</barrietGateNum>
    <BarrierGateCtrlList>
        <barrietGateOper>${action}</barrietGateOper>
    </BarrierGateCtrlList>
</BarrierGateCtrl>`;
}

module.exports = {
  escapeXml,
  buildVclAddXml,
  buildVclDeleteXml,
  buildBarrierGateOpenXml,
  buildBarrierGateControlOpenXml,
  buildBarrierControlOpenXml,
  buildIoportTriggerPulseXml,
  buildTCG205BarrierCtrlXml
};
