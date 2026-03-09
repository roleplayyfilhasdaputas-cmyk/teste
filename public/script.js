const map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

function loadDevices() {
  fetch("/devices")
    .then(res => res.json())
    .then(data => {
      data.forEach(d => {
        const marker = L.circleMarker([d.lat, d.lon], { color: "red", radius: 6 }).addTo(map);
        marker.bindPopup(`
          <b>IP:</b> ${d.ip}<br>
          <b>Porta:</b> ${d.port}<br>
          <b>País:</b> ${d.country}
        `);
      });
    });
}

// carregar inicial e atualizar a cada 10 minutos
loadDevices();
setInterval(loadDevices, 600000);
