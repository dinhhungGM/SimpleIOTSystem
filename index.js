const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mqtt = require("mqtt");
const LED_TOPIC = "wemos_d1/led";
const DHT_TEMP_TOPIC = "wemos_d1/temp";
const DHT_HUMIDITY_TOPIC = "wemos_d1/humidity";
const cors = require("cors");
const helmet = require("helmet");
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

if (process.env.NODE_ENV !== "production") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
  require("dotenv").config();
}

async function connectAndRetry() {
  try {
    await mongoose.connect(`${process.env.MONGO_DB_URL}`, {
      useNewUrlParser: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection error. Retrying in 5 seconds.");
    setTimeout(connectAndRetry, 5000);
  }
}

//connectAndRetry();

// model
const deviceSchema = new Schema(
  {
    name: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const logSchema = new Schema(
  {
    deviceId: String,
    sensor: String,
    value: Number,
    ip: String,
    deviceName: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const device = mongoose.model("devices", deviceSchema);
const log = mongoose.model("logs", logSchema);

// routes

// control led
app.post("/api/led", async (req, res) => {
  client.publish(LED_TOPIC, req.body.value);
  res.send("OK");
});

// create device
app.post("/api/devices", async (req, res) => {
  const device = new device({
    name: req.body.name,
  });
  try {
    await device.save();
    res.status(201).json({
      message: "Device created successfully",
      data: device,
      error: null,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/api/devices", async (req, res) => {
  try {
    const devices = await device.find();
    res.status(200).json({
      message: "Devices fetched successfully",
      data: devices,
      error: null,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// logs

app.post("/api/logs", async (req, res) => {
  const newLog = new log({
    deviceId: req.body.deviceId,
    sensor: req.body.sensor,
    value: req.body.value,
    ip: req.body.ip,
    deviceName: req.body.deviceName,
  });
  console.log(req.body);
  try {


    
    // await log.save();
    res.status(201).json({
      message: "Log created successfully",
      data: newLog,
      error: null,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/api/logs", async (req, res) => {
  try {
    const logs = await log.find();
    res.status(200).json({
      message: "Logs fetched successfully",
      data: logs,
      error: null,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// mqtt broker
const client = mqtt.connect(`${process.env.MQTT_BROKER_URL}`);

client.on("connect", function () {
  client.subscribe(LED_TOPIC, {
      qos: 1,
  });
  client.subscribe(DHT_TEMP_TOPIC, {
      qos: 1,
  });
  client.subscribe(DHT_HUMIDITY_TOPIC, {
      qos: 1,
  });
});



client.on("message", function (topic, message) {
  // message is Buffer
  // console.log(`[${topic}]: ${message.toString()}`);

  if(topic == LED_TOPIC || topic == DHT_TEMP_TOPIC || topic == DHT_HUMIDITY_TOPIC){
    // console.log(`(${new Date()}) - [${topic}]: ${message.toString()}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

