// YerAuksion — ISPmanager / Phusion Passenger uchun maxsus Next.js server.
// Panel "node server.js" buyrug'i bilan ishga tushiradi va PORT ni o'zi beradi.
// Shu sabab 3000 portга bog'lanmaymiz — panel bergan portда ishlaymiz (EADDRINUSE oldi olinadi).

const { createServer } = require("http");
const next = require("next");

const app = next({ dev: false });
const handle = app.getRequestHandler();

// Passenger/panel PORT ni beradi. Bo'lmasa 3000.
const port = process.env.PORT || 3000;

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`YerAuksion tayyor — port: ${port}`);
    });
  })
  .catch((err) => {
    console.error("Server ishga tushmadi:", err);
    process.exit(1);
  });
