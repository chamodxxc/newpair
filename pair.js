const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");
const { makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { upload } = require('./mega');

const router = express.Router();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();

    async function WHITESHADOW_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);

        try {
            const randomItem = ["Safari"][0];

            const sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }),
                browser: Browsers.macOS(randomItem)
            });

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {

                if (connection === 'open') {
                    console.log(`👤 ${sock.user.id} connected ✅`);

                    const rf = `./temp/${id}/creds.json`;

                    try {
                        const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        const md = "White-MD~" + string_session;

                        // Send session ID to the WhatsApp account
                        await sock.sendMessage(sock.user.id, {
                            text: `✅ Your WHITESHADOW-M Session is ready!\n\n🔐 Session ID:\n${md}\n\n⚠️ Keep it safe and do NOT share this ID with anyone.`
                        });

                    } catch (e) {
                        console.error('Error sending session:', e);
                        if (!res.headersSent) res.send({ code: "❗ Service Unavailable" });
                    }

                    await removeFile(`./temp/${id}`);
                    process.exit();
                }

                if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== 401) {
                    console.log('Reconnecting...');
                    await delay(1000);
                    WHITESHADOW_PAIR_CODE();
                }
            });

        } catch (err) {
            console.error("Service error:", err);
            await removeFile(`./temp/${id}`);
            if (!res.headersSent) res.send({ code: "❗ Service Unavailable" });
        }
    }

    return WHITESHADOW_PAIR_CODE();
});

module.exports = router;
