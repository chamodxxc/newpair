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
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            const items = ["Safari"];
            const randomItem = items[Math.floor(Math.random() * items.length)];

            const sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false, // QR-less / session reuse
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
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

                        // Send session ID message to the logged-in WhatsApp account
                        const codeMsg = await sock.sendMessage(sock.user.id, {
                            text: `✅ Your WHITESHADOW-M Session is ready!\n\n🔐 Session ID:\n${md}\n\n⚠️ Keep it safe and do NOT share this ID with anyone.`
                        });

                        const desc = `*WHITESHADOW-M* 👋🏻\n\nStay Updated:\nhttps://whatsapp.com/channel/0029Vak4dFAHQbSBzyxlGG13`;
                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: "WHITESHADOW",
                                    thumbnailUrl: "https://files.catbox.moe/8g467d.jpg",
                                    sourceUrl: "https://whatsapp.com/channel/0029Vak4dFAHQbSBzyxlGG13",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: codeMsg });

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
