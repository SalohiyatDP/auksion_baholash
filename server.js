// YerAuksion — ISPmanager (Docker'siz) uchun Node.js kirish (startup) fayli.
// Panel "node server.js" bilan ishga tushiradi va bo'sh TCP portni PORT env orqali beradi.
// Nginx/Apache shu portga (127.0.0.1) proxy qiladi — shuning uchun 0.0.0.0 ga bog'lanamiz
// (faqat IPv6 ga bog'lanib qolmaslik uchun; aks holda 502 Bad Gateway chiqadi).

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "0.0.0.0";

// Production rejim (panelda berilmagan bo'lsa ham)
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      try {
        handle(req, res, parse(req.url, true));
      } catch (err) {
        console.error("So'rovni qayta ishlashda xatolik:", err);
        res.statusCode = 500;
        res.end("Ichki xatolik");
      }
    }).listen(port, hostname, () => {
      console.log(`> YerAuksion tayyor: http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Next.js ishga tushmadi:", err);
    process.exit(1);
  });
