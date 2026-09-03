// YerAuksion — ISPmanager / Phusion Passenger (Docker'siz) uchun Node.js startup fayli.
//
// ISPmanager ilovani Unix-SOCKET orqali ham, TCP-PORT orqali ham ishga tushirishi mumkin.
// Passenger odatda `PORT` muhit o'zgaruvchisiga SOCKET YO'LINI beradi (masalan
// /var/www/USER/data/nodejs/21.sock). Shuning uchun bu yerda PORT raqammi yoki socket yo'limi
// ekanini aniqlab, mos ravishda tinglaymiz. Aks holda "502 Bad Gateway" chiqadi.

const { createServer } = require("http");
const { parse } = require("url");
const fs = require("fs");
const next = require("next");

const portEnv = process.env.PORT || "3000";
const isSocket = Number.isNaN(Number(portEnv)); // raqam bo'lmasa — socket yo'li
const hostname = process.env.HOST || "0.0.0.0";

// Production rejim (panelda berilmagan bo'lsa ham)
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const app = next({ dev: false });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      try {
        handle(req, res, parse(req.url, true));
      } catch (err) {
        console.error("So'rovni qayta ishlashda xatolik:", err);
        res.statusCode = 500;
        res.end("Ichki xatolik");
      }
    });

    if (isSocket) {
      // Eski socket faylini tozalaymiz (aks holda EADDRINUSE bo'lishi mumkin)
      try {
        if (fs.existsSync(portEnv)) fs.unlinkSync(portEnv);
      } catch (e) {
        console.warn("Eski socketni o'chirib bo'lmadi:", e.message);
      }
      server.listen(portEnv, () => {
        // Nginx (boshqa foydalanuvchi) socketga ulanishi uchun ruxsat
        try {
          fs.chmodSync(portEnv, 0o777);
        } catch (e) {
          console.warn("Socket ruxsatini o'zgartirib bo'lmadi:", e.message);
        }
        console.log(`> YerAuksion tayyor (socket): ${portEnv}`);
      });
    } else {
      server.listen(Number(portEnv), hostname, () => {
        console.log(`> YerAuksion tayyor: http://${hostname}:${Number(portEnv)}`);
      });
    }
  })
  .catch((err) => {
    console.error("Next.js ishga tushmadi:", err);
    process.exit(1);
  });
