const express = require('express');
const cors = require('cors'); // ✅ 1. import cors
const bodyParser = require("body-parser");

const app = express();
__path = process.cwd();

const PORT = process.env.PORT || 8000;

let server = require('./qr'),
    code = require('./pair');

require('events').EventEmitter.defaultMaxListeners = 500;

// ✅ 2. enable cors globally
app.use(cors());

app.use('/server', server);
app.use('/code', code);

app.use('/pair', async (req, res, next) => {
  res.sendFile(__path + '/pair.html');
});

app.use('/qr', async (req, res, next) => {
  res.sendFile(__path + '/qr.html');
});

app.use('/', async (req, res, next) => {
  res.sendFile(__path + '/main.html');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`
✅ WHITESHADOW-MD SERVER IS RUNNING
🌐 http://localhost:${PORT}
`);
});

module.exports = app;
