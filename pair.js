const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    if (!num) return res.send({ code: "❌ Number query missing" });

    async function WHITESHADOW_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            const sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
                browser: Browsers.macOS("Safari")
            });

            sock.ev.on('creds.update', saveCreds);

            // --- CUSTOM PAIRING CODE ---
            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const customPairCode = "MRCHAMOD"; // 8-char code

                try {
                    // Baileys v5+ correct usage
                    const pairing = await sock.requestPairingCode(num, { code: customPairCode });
                    console.log('🔑 Custom Pairing Code:', pairing);

                    if (!res.headersSent) res.send({ code: pairing });
                } catch (err) {
                    console.log("❌ Error requesting pairing code:", err);
                    if (!res.headersSent) res.send({ code: "❗ Could not generate pairing code" });
                }
            }

            sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
                if (connection === "open") {
                    await delay(2000);
                    const credsPath = `./temp/${id}/creds.json`;

                    try {
                        const mega_url = await upload(fs.createReadStream(credsPath), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        const md = "White-MD~" + string_session;

                        const codeMsg = await sock.sendMessage(sock.user.id, { text: md });

                        const desc = `*Hey there, WHITESHADOW-M User!* 👋🏻

Thanks for using WHITESHADOW-MD — your session has been successfully created!

🔐 Session ID: Sent above
⚠️ Keep it safe! Do NOT share this ID with anyone.

——————

✅ Stay Updated:
Join our official WhatsApp Channel:
https://whatsapp.com/channel/0029Vak4dFAHQbSBzyxlGG13

💻 Source Code:
Fork & explore the project on GitHub:
https://github.com/cnw-db/WHITESHADOW-MD

——————

> © Powered by WHITESHADOW
Stay WITH US. ✌🏻`;

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
                        console.log("❌ Error sending session:", e);
                        if (!res.headersSent) res.send({ code: "❗ Service Unavailable" });
                    }

                    await sock.ws.close();
                    await removeFile('./temp/' + id);
                    console.log(`👤 ${sock.user.id} Connected ✅ Restarting process...`);
                    process.exit();
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    console.log("🔄 Reconnecting due to error...");
                    await delay(1000);
                    WHITESHADOW_PAIR_CODE();
                }
            });

        } catch (err) {
            console.log("❌ Service error:", err);
            removeFile('./temp/' + id);
            if (!res.headersSent) res.send({ code: "❗ Service Unavailable" });
        }
    }

    return WHITESHADOW_PAIR_CODE();
});

module.exports = router;
