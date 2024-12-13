const express= require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const app= express();
const port= process.env.PORT || 4000;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
const axios = require('axios');
const portPath = process.env.portPath || "/dev/ttyACM0";

let baudRate = 921600;
if(Number(process.env.baudRate)){
    baudRate = Number(process.env.baudRate);
    console.log(baudRate);
}
var portSerial = new SerialPort({
    path: portPath,
    baudRate: baudRate,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
  });
  portSerial.on("open", () => {
    console.log("Serial Port Opened Successfully!");
  })
  portSerial.on('error', (err) => {
    console.error('Serial Port Error:', err.message);

    if (err.message.includes('No such file or directory')) {
        console.error(`Port ${portPath} not found. Ensure the device is connected.`);
    } else {
        console.error('Unexpected error:', err);
    }
});
const adamIP = process.env.ADAM_IP || "192.168.1.121";
app.post('/digitaloutput/all/value', async (req, res) => {
    try {
        res.send(`<?xml version="1.0" ?>
                    <ADAM-6050 status="{status}">
                    </ADAM-6050>`);
        
        adamRequest(req);
        sendSerialData(req);
    } catch (error) {
        console.log(error.message)
    }
});

const adamRequest = async (req) => {
    try {
        const headers =  { 
            'Authorization': 'Basic cm9vdDowMDAwMDAwMA==', 
            'Content-Type': 'application/x-www-form-urlencoded'
          };
        const data = new URLSearchParams(req.body).toString();
        const url = `http://${adamIP}/digitaloutput/all/value`;
        
        axios.post(url, data, { headers }).then(function(response){
            console.log(JSON.stringify(response.data));
        }).catch(function(error){
            console.log(error.message);
        });
    } catch (error) {
        console.log("adam request error: ", error.message);
    }
}

const sendSerialData = async (req) => {
    try {
        
          const data = new URLSearchParams(req.body).toString();
          
          if(portSerial){
            portSerial.write(data, (err) => {
                if(err){
                    console.log("error on serial write",err.message);
                    return;
                }
                console.log("sent data",data)
            })
          }
    } catch (error) {
        console.log("error on sent fn", error.message);
    }
    
}

const server = app.listen(port, () => {
    console.log(`listensing on port ${port}`);
})