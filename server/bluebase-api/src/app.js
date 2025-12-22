const express = require("express");
const dotenv= require("dotenv");

dotenv.config();
const app = express();

app.use(express.json());

app.get("/", (_, res) => res.send("BlueBase API running"));

app.listen(process.env.PORT || 5000, () => console.log("Server up"));
