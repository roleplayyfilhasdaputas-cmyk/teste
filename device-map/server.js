const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.static("public")); // serve frontend

const API_KEY = "xHYk3xkzySHkbBzcxjHJ6kAIw41BiqlP"; // coloque sua chave da API aqui
let devices = [];

if (fs.existsSync("devices.json")) {
  devices = JSON.parse(fs.readFileSync("devices.json"));
}

async function scan() {
  try {
    const response = await axios.get(
      `https://api.shodan.io/shodan/host/search?key=${API_KEY}&query=webcam`
    );

    response.data.matches.forEach(d => {
      const device = {
        ip: d.ip_str,
        port: d.port,
        country: d.location.country_name,
        lat: d.location.latitude,
        lon: d.location.longitude
      };
      if (!devices.find(x => x.ip === device.ip)) devices.push(device);
    });

    fs.writeFileSync("devices.json", JSON.stringify(devices, null, 2));
    console.log("Scan completo");
  } catch (e) {
    console.log("Erro no scan:", e.message);
  }
}

scan();
setInterval(scan, 600000); // a cada 10 minutos

app.get("/devices", (req, res) => res.json(devices));

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
