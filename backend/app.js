// backend/app.js — Perakitan Express (tanpa listen).
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.static(path.join(__dirname, "../frontend")));

app.use(require("./routes/prodi"));
app.use(require("./routes/categories"));
app.use(require("./routes/reports"));
app.use(require("./routes/found"));
app.use(require("./routes/matches"));
app.use(require("./routes/returns"));
app.use(require("./routes/auth"));
app.use(require("./routes/users"));
app.use(require("./routes/deletes"));
app.use(require("./routes/messages"));
app.use(require("./routes/uploads"));

module.exports = app;
