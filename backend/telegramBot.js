const TelegramBot = require('node-telegram-bot-api');
const { PrismaClient } = require('@prisma/client');
const { request } = require('urllib');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedChatsStr = process.env.TELEGRAM_ALLOWED_CHATS || '';
const allowedChats = allowedChatsStr.split(',').map(id => id.trim()).filter(Boolean);

const centralUrl = process.env.CENTRAL_SERVER_URL || '';
const isCloudMode = centralUrl && !centralUrl.includes('localhost') && !centralUrl.includes('127.0.0.1');

if (!token) {
    console.warn('\n⚠️  [Telegram Bot] TELEGRAM_BOT_TOKEN topilmadi. .env faylini sozlang. Telegram Bot ishga tushmadi.');
    module.exports = null;
    return;
}

if (isCloudMode) {
    console.log('\n☁️  [Telegram Bot] Dastur bulutli rejimda ishlamoqda (' + centralUrl + '). Telegram Bot markaziy serverda (Render) polling qiladi. Lokal bot polling faollashtirilmadi.');
    module.exports = null;
    return;
}

const bot = new TelegramBot(token, { polling: true });
console.log('🤖 [Telegram Bot] Muvaffaqiyatli ishga tushdi ✅');

// Ruxsat tekshiruvi (async)
async function isAuthorized(msg) {
    const chatId = String(msg.chat.id);
    if (allowedChats.includes(chatId)) {
        return true;
    }
    const user = await prisma.user.findFirst({
        where: { telegramChatId: chatId }
    });
    return !!user;
}

// Asosiy klaviatura tugmalari
const keyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '📊 Statistika' }, { text: '🚗 Hozirgi mashinalar' }],
            [{ text: '🔓 Shlagbaum ochish' }, { text: '🔌 Kameralar holati' }],
            [{ text: '📹 Jonli Kamera' }]
        ],
        resize_keyboard: true
    }
};

// /start komandasi
bot.onText(/\/start/, async (msg) => {
    if (!(await isAuthorized(msg))) {
        bot.sendMessage(
            msg.chat.id, 
            `❌ Kechirasiz, sizga ushbu botdan foydalanishga ruxsat berilmagan.\n\nSizning Chat ID: \`${msg.chat.id}\`\n\nBotdan foydalanish uchun botga o'z hisobingiz orqali kiring:\n/login <telefon_yoki_email> <parol>`, 
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    bot.sendMessage(
        msg.chat.id, 
        "👋 Assalomu alaykum! SmartPark boshqaruv botiga xush kelibsiz.\nQuyidagi tugmalardan birini tanlang:", 
        keyboard
    );
});

// /login komandasi
bot.onText(/\/login\s+(\S+)\s+(\S+)/, async (msg, match) => {
    const chatId = String(msg.chat.id);
    const username = match[1];
    const password = match[2];

    try {
        const cleanPhone = username.replace(/\D/g, '').slice(-9);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { username: { contains: cleanPhone !== "" ? cleanPhone : username } }
                ]
            }
        });

        if (!user) {
            bot.sendMessage(chatId, "❌ Foydalanuvchi topilmadi. Telefon yoki parolni tekshiring.");
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch && password !== user.password) {
            bot.sendMessage(chatId, "❌ Parol noto'g'ri.");
            return;
        }

        // Chat IDni userga bog'laymiz
        await prisma.user.update({
            where: { id: user.id },
            data: { telegramChatId: chatId }
        });

        bot.sendMessage(chatId, `✅ Salom, ${user.name}! SmartPark boshqaruv botiga muvaffaqiyatli kirdingiz.`, keyboard);
    } catch (err) {
        console.error('[Telegram Bot Login Error]:', err);
        bot.sendMessage(chatId, "⚠️ Tizimga kirishda xatolik yuz berdi: " + err.message);
    }
});

// /statistika komandasi
bot.onText(/\/statistika/, async (msg) => {
    if (!(await isAuthorized(msg))) return;
    handleStatistika(msg.chat.id);
});

// /mashinalar komandasi
bot.onText(/\/mashinalar/, async (msg) => {
    if (!(await isAuthorized(msg))) return;
    handleActiveCars(msg.chat.id);
});

// /open komandasi
bot.onText(/\/open/, async (msg) => {
    if (!(await isAuthorized(msg))) return;
    handleOpenBarrier(msg.chat.id);
});

// Matnli xabarlarni kuzatish (klaviatura tugmalari uchun)
bot.on('message', async (msg) => {
    // Agar komandalar bo'lsa (/) bu yerda ishlov berilmasin
    if (msg.text && msg.text.startsWith('/')) return;
    
    if (!(await isAuthorized(msg))) {
        bot.sendMessage(
            msg.chat.id, 
            `❌ Kechirasiz, botdan foydalanish uchun tizimga kiring:\n/login <telefon_yoki_email> <parol>`, 
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    const text = msg.text;
    if (text === '📊 Statistika') {
        handleStatistika(msg.chat.id);
    } else if (text === '🚗 Hozirgi mashinalar') {
        handleActiveCars(msg.chat.id);
    } else if (text === '🔓 Shlagbaum ochish') {
        handleOpenBarrier(msg.chat.id);
    } else if (text === '🔌 Kameralar holati') {
        handleHeartbeatStatus(msg.chat.id);
    } else if (text === '📹 Jonli Kamera') {
        handleLiveCamera(msg.chat.id);
    }
});

// --- FUNKSIYALAR ---

async function handleStatistika(chatId) {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Bugungi muvaffaqiyatli to'lovlar
        const payments = await prisma.payment.aggregate({
            where: {
                createdAt: { gte: startOfToday },
                status: 'SUCCESS'
            },
            _sum: { amount: true }
        });
        const revenue = payments._sum.amount || 0;

        // Bugun kirgan jami mashinalar (kirish sessiyalari)
        const entryCount = await prisma.parkingSession.count({
            where: {
                entryTime: { gte: startOfToday }
            }
        });

        // Ayni vaqtdagi faol mashinalar (ACTIVE sessiyalar)
        const activeCount = await prisma.parkingSession.count({
            where: { status: 'ACTIVE' }
        });

        const replyText = `📊 *Bugungi parkovka statistikasi:*\n\n` +
            `💵 *Jami tushum:* \`${revenue.toLocaleString('uz-UZ')} UZS\`\n` +
            `🚗 *Bugun kirgan mashinalar:* \`${entryCount} ta\`\n` +
            `🅿️ *Hozirda parkovkada:* \`${activeCount} ta\` mashina bor.`;

        bot.sendMessage(chatId, replyText, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('[Telegram Bot] Statistika olishda xato:', err);
        bot.sendMessage(chatId, "⚠️ Statistika ma'lumotlarini hisoblashda xatolik yuz berdi.");
    }
}

async function handleActiveCars(chatId) {
    try {
        const sessions = await prisma.parkingSession.findMany({
            where: { status: 'ACTIVE' },
            include: { car: true },
            orderBy: { entryTime: 'asc' }
        });

        if (sessions.length === 0) {
            bot.sendMessage(chatId, "🚗 *Hozirgi vaqtda parkovkada hech qanday mashina yo'q.*", { parse_mode: 'Markdown' });
            return;
        }

        let replyText = `🚗 *Hozirda parkovkadagi mashinalar ro'yxati (${sessions.length} ta):*\n\n`;
        sessions.forEach((session, i) => {
            const dateObj = new Date(session.entryTime);
            const dateStr = dateObj.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            replyText += `${i + 1}. *${session.car.plateNumber}* (Kirgan vaqti: \`${dateStr} ${timeStr}\`)\n`;
        });

        bot.sendMessage(chatId, replyText, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('[Telegram Bot] Hozirgi mashinalarni olishda xato:', err);
        bot.sendMessage(chatId, "⚠️ Mashinalar ro'yxatini yuklashda xatolik yuz berdi.");
    }
}

async function handleOpenBarrier(chatId) {
    try {
        bot.sendMessage(chatId, "⏳ Shlagbaumni ochish so'rovi yuborilmoqda...");
        
        const ips = ['10.70.5.7', '10.70.5.8'];
        const creds = 'admin:Uranch135';
        const v = { 
            method: 'PUT', 
            url: '/ISAPI/Parking/channels/1/barrierGate', 
            data: `<?xml version="1.0" encoding="UTF-8"?><BarrierGate><ctrlMode>open</ctrlMode></BarrierGate>` 
        };

        let successCount = 0;
        let failCount = 0;

        const promises = ips.map(async (ip) => {
            try {
                const res = await request(`http://${ip}${v.url}`, {
                    method: v.method,
                    digestAuth: creds,
                    headers: { 'Content-Type': 'application/xml', 'X-Requested-With': 'XMLHttpRequest' },
                    data: v.data,
                    timeout: 4000
                });
                if (res.status === 200) {
                    successCount++;
                    console.log(`[Telegram Bot] Barrier opened successfully for IP: ${ip}`);
                } else {
                    failCount++;
                    console.warn(`[Telegram Bot] Barrier open failed for IP: ${ip}, status: ${res.status}`);
                }
            } catch (e) {
                console.error(`[Telegram Bot] Barrier open error for IP ${ip}:`, e.message);
                failCount++;
            }
        });

        await Promise.all(promises);

        if (successCount > 0) {
            bot.sendMessage(chatId, `✅ *Shlagbaum muvaffaqiyatli ochildi!* (${successCount} ta kamera buyruqni qabul qildi)`, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, "❌ *Shlagbaumni ochib bo'lmadi.* Kameralar bilan aloqani yoki IP manzillarni tekshiring.");
        }
    } catch (err) {
        console.error('[Telegram Bot] Shlagbaum ochishda xato:', err);
        bot.sendMessage(chatId, "⚠️ Shlagbaumni ochish jarayonida kutilmagan xatolik yuz berdi.");
    }
}

async function handleHeartbeatStatus(chatId) {
    try {
        const hb = global.lastAgentHeartbeat;
        if (!hb) {
            bot.sendMessage(
                chatId, 
                "❌ *Lokal Agent offline.*\n\nServer ishga tushgandan beri ishxonadagi lokal agentdan hech qanday signal qabul qilinmadi.", 
                { parse_mode: 'Markdown' }
            );
            return;
        }

        const now = new Date();
        const diffMs = now - new Date(hb.receivedAt);
        const diffSecs = Math.floor(diffMs / 1000);

        if (diffSecs > 60) {
            const lastSeenStr = new Date(hb.receivedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            bot.sendMessage(
                chatId, 
                `⚠️ *Lokal Agent offline bo'lishi mumkin.*\n\nOxirgi ulanish: \`${lastSeenStr}\` (${diffSecs} soniya oldin).`, 
                { parse_mode: 'Markdown' }
            );
            return;
        }

        let replyText = `🔌 *Lokal Agent va Kameralar Holati:*\n\n` +
            `🖥️ *Lokal Agent:* 🟢 ONLINE (Oxirgi signal: \`${diffSecs}s\` oldin)\n\n` +
            `📷 *Kameralar ulanishi:*`;

        if (hb.cameras && hb.cameras.length > 0) {
            hb.cameras.forEach((cam, i) => {
                replyText += `\n${i + 1}. *${cam.name}* (${cam.ip}): 🟢 ONLINE`;
            });
        } else {
            replyText += `\n⚠️ Hech qanday faol kamera topilmadi.`;
        }

        bot.sendMessage(chatId, replyText, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('[Telegram Bot] Heartbeat status olishda xato:', err);
        bot.sendMessage(chatId, "⚠️ Ulanish holatini tekshirishda xatolik yuz berdi.");
    }
}

async function handleLiveCamera(chatId) {
    try {
        bot.sendMessage(
            chatId, 
            "📹 Jonli kamerani tomosha qilish va shlagbaumni boshqarish uchun pastdagi tugmani bosing:", 
            {
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: "📹 Jonli Kamera & Boshqaruv",
                            web_app: { url: `https://coffee-own-gibraltar-employer.trycloudflare.com/mini-app` }
                        }]
                    ]
                }
            }
        );
    } catch (err) {
        console.error('[Telegram Bot] Live camera yuborishda xato:', err);
        bot.sendMessage(chatId, "⚠️ Jonli kamerani yuklashda xatolik yuz berdi.");
    }
}

module.exports = bot;
