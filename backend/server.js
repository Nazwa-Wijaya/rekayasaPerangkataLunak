// backend/server.js — Entry point.
const app = require("./app");

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("=========================================");
    console.log(" Server API Express.js berjalan!");
    console.log(` Port    : http://localhost:${PORT}`);
    console.log(` Frontend: http://localhost:${PORT}/index.html`);
    console.log("=========================================");
  });
}

module.exports = app;
