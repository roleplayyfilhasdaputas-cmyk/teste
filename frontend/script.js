const map = L.map('map').setView([20,0],2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);

fetch("http://localhost:3000/devices")
.then(res=>res.json())
.then(devices=>{

devices.forEach(d=>{

const marker = L.circleMarker(
[d.lat,d.lon],
{
color:"red",
radius:5
}
).addTo(map);

marker.bindPopup(`
IP: ${d.ip}<br>
Porta: ${d.port}<br>
País: ${d.country}
`);

});

});
