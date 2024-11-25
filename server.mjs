import express from "express";
import fileUpload from "express-fileupload";
import propertiesReader from "properties-reader";
import path from "path";
import cors from "cors";
import morgan  from "morgan";
import fs from "fs";

app.use(morgan("short"));

const app = express();
//new way to extract parameters from requests
app.use(express.json());

app.use(cors());

app.use(fileUpload());
app.use(express.static("public"));

//initalise Property reader
let propertiesPath = path.resolve("conf/db.properties");
let properties = propertiesReader(propertiesPath);
let dbPprefix = properties.get("db.prefix");

let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

//get Mongo collection name
app.param("collectionName", function (req, res, next, collectionName) {
  req.collection = db.collection(collectionName);
  return next();
});

//getting and reading collections
app.get("/collections/:collectionName", async (req, res, next) => {
  try {
    const results = await req.collection.find({}).toArray();
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Serve static files (CSS, JS, Images) from the "BackEnd" folder.
// app.use('/static', express.static(path.join(__dirname, 'BackEnd')));

app.use(function (req, res, next) {
  console.log("Incoming request: " + req.url);
  next();
});

//save the new order Info
app.post("/collections/orderInfo", async (req, res, next) => {
  try {
    console.log("Incoming POST request to orderInfo with data:", req.body);
    const newOrder = {
      name: req.body.name,
      surname: req.body.surname,
      zip: req.body.zip,
      number: req.body.number,
      lessonsBought: req.body.lessonsBought || [],
    };
    const collection = db.collection("orderInfo");

    const result = await db.collection("orderInfo").insertOne(newOrder);
    console.log("Insert result:", result);

    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error in POST: orderInfo:", error);
    next(error);
  }
});

app.put("/", function (req, res) {
  res.send("Ok, lets change an element");
});

app.delete("/", function (req, res) {
  res.send("are you sure you want to delete a record");
});

// Middleware to serve static files from the "public/images" directory
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Middleware to handle missing images
app.get("/images/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "public/images", imageName);

  // Check if the image exists
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Image not found
      return res.status(404).json({ error: "Image not found" });
    }

    // Image exists, serve it
    res.sendFile(imagePath);
  });
});

// Fallback for other non-existing routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// app.listen(3000, () => {
//   console.log("Server listening on http://localhost:3000");
// });
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("App started on port: " + port);
});
