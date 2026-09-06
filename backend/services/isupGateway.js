const net = require('net');

function formatHexDump(data, prefix = "  ") {
    const lines = [];
    for (let i = 0; i < data.length; i += 16) {
        const chunk = data.subarray(i, Math.min(i + 16, data.length));
        let hexStr = Array.from(chunk).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        hexStr = hexStr.padEnd(48, ' ');
        let asciiStr = Array.from(chunk).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
        const offset = i.toString(16).padStart(4, '0').toUpperCase();
        lines.push(`${prefix}${offset}  ${hexStr}  |${asciiStr}|`);
    }
    return lines.join('\n');
}

function startIsupListener(ports = [7660, 6060, 7600]) {
    console.log("================================================================================");
    console.log("🚀 HIKVISION ISUP 5.0 DIAGNOSTIKA GATEWAY SERVERI ISHGA TUSHMOQDA (Node.js)");
    console.log(`📅 Boshlangan vaqt: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`);
    console.log(`📡 Tinglanadigan TCP Portlar: ${ports.join(', ')}`);
    console.log("================================================================================");

    const activeConnections = new Map();

    ports.forEach(port => {
        const server = net.createServer((socket) => {
            const peerIp = socket.remoteAddress || 'unknown';
            const peerPort = socket.remotePort || 0;
            const localPort = socket.localPort || 0;
            const connId = `${peerIp}:${peerPort}`;

            const tsStart = new Date().toISOString().replace('T', ' ').substring(0, 23);
            console.log(`\n================================================================================`);
            console.log(`[${tsStart}] 🟢 YANGI ULANISH: ${connId} -> Server Local Port: ${localPort}`);
            console.log(`================================================================================`);

            activeConnections.set(connId, {
                connectedAt: new Date(),
                peerIp,
                peerPort,
                localPort,
                bytesReceived: 0,
                socket
            });

            let chunkCounter = 0;
            let timeoutTracker = setTimeout(() => {
                const tsNow = new Date().toISOString().replace('T', ' ').substring(0, 23);
                console.log(`[${tsNow}] ⏰ TIMEOUT (45s): Terminal ${connId} javob bermadi. Socket yopilmoqda.`);
                socket.destroy();
            }, 45000);

            socket.on('data', (chunk) => {
                clearTimeout(timeoutTracker);
                timeoutTracker = setTimeout(() => {
                    const tsNow = new Date().toISOString().replace('T', ' ').substring(0, 23);
                    console.log(`[${tsNow}] ⏰ TIMEOUT (45s): Terminal ${connId} javob bermadi. Socket yopilmoqda.`);
                    socket.destroy();
                }, 45000);

                chunkCounter++;
                const connData = activeConnections.get(connId);
                if (connData) {
                    connData.bytesReceived += chunk.length;
                }

                const tsNow = new Date().toISOString().replace('T', ' ').substring(0, 23);
                console.log(`\n--- [${tsNow}] 📦 PAKET #${chunkCounter} QABUL QILINDI (${chunk.length} bayt) | Manba: ${connId} ---`);
                console.log(`XOM BAYTLAR HEX DUMP (${chunk.length} bayt):`);
                console.log(formatHexDump(chunk));
                console.log(`XOM HEX STR: ${chunk.toString('hex')}`);
            });

            socket.on('error', (err) => {
                const tsNow = new Date().toISOString().replace('T', ' ').substring(0, 23);
                console.log(`[${tsNow}] ❌ SOCKET XATOLIGI (${connId}): ${err.message}`);
            });

            socket.on('close', () => {
                clearTimeout(timeoutTracker);
                const tsNow = new Date().toISOString().replace('T', ' ').substring(0, 23);
                const connData = activeConnections.get(connId);
                if (connData) {
                    console.log(`[${tsNow}] 🔴 ULANISH YOPILDI: ${connId} | Jami qabul qilingan: ${connData.bytesReceived} bayt.`);
                    activeConnections.delete(connId);
                } else {
                    console.log(`[${tsNow}] 🔴 ULANISH YOPILDI: ${connId}`);
                }
            });
        });

        server.listen(port, '0.0.0.0', () => {
            console.log(`🟢 TCP Server Port \`${port}\` bo'yicha muvaffaqiyatli tinglamoqda...`);
        });

        server.on('error', (err) => {
            console.error(`⚠️  TCP Server Port \`${port}\` ni bog'lashda xatolik: ${err.message}`);
        });
    });
}

module.exports = {
    startIsupListener
};
