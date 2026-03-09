const express = require("express")
const axios = require("axios")
const cors = require("cors")
const fs = require("fs")

const app = express()

app.use(cors())

const SHODAN_KEY = "xHYk3xkzySHkbBzcxjHJ6kAIw41BiqlP"

app.get("/devices", async (req,res)=>{

try{

const response = await axios.get(
`https://api.shodan.io/shodan/host/search?key=${SHODAN_KEY}&query=webcam`
)

const devices = response.data.matches.map(d=>({
ip:d.ip_str,
port:d.port,
country:d.location.country_name,
lat:d.location.latitude,
lon:d.location.longitude
}))

fs.writeFileSync("database.json",JSON.stringify(devices,null,2))

res.json(devices)

}catch(e){

res.status(500).send("erro")

}

})

app.listen(3000,()=>{
console.log("Servidor rodando")
})
