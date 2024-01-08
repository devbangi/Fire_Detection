// we create a server.js file in our project's root directory to take care of the back-end

var Minio = require("minio");
var BodyParser = require("body-parser");
const cors = require("cors")

//initializes the dotenv : help that we can use our .env file in our project
require('dotenv').config();


// Express is web framework for Node.js to allow easy and robust routing for back-end development. 
//It will be used to create our routes and handle our HTTP requests and any middleware for our API.
const express = require("express"); 
//import mongoose; Mongoose is an object data modeling (ODM) library for MongoDB. It allows us to efficiently create schemas for our MongoDB to use with ease.
const mongoose = require('mongoose');

// import the routes
const routes = require('./routes/image_file'); 

// create an Express app
const app = express(); 

// parses incoming requests with JSON payloads
app.use(cors()).use(express.json()); 

app.use(BodyParser.json({limit: "1000mb"}));

//to use the routes
app.use('/', routes); 
// Our 'uploads' folder cannot be accessed publicly and therefore the server cannot GET our image. To fix this, we have to make our uploads folder a static file.
app.use('/uploads', express.static('./uploads'));

var minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

// our listener to ask our server to listen for a request
// By default, we want to listen on port 3000. However, in cases where the port number is designated from an environment variable, the app will listen on process.env.PORT
minioClient.bucketExists(process.env.MINIO_BUCKET_NAME, async function(error) {
    let bucketExists = await minioClient.bucketExists(process.env.MINIO_BUCKET_NAME);
    if(error || !bucketExists) {
        console.log("The 'test' bucket doesn't exist!");
        console.log("Creating the 'test' bucket...");
        try {
            let makeBucketResult = await minioClient.makeBucket(process.env.MINIO_BUCKET_NAME);
        } catch (error) {
            console.log(error)
        }
    }

    bucketExists = await minioClient.bucketExists(process.env.MINIO_BUCKET_NAME);
    
    if(!bucketExists) {
        console.log("The bucket couldn't be created!");
        return;
    }
    
    const listener = app.listen(process.env.PORT || 3000, () => { 
        console.log('App is listening on port ' + listener.address().port)
    })
});

//establish connection to database : Use mongoose.connect() to establish a connection to the database
mongoose.connect(
    process.env.MONGODB_URI,
    { useUnifiedTopology: true, useNewUrlParser: true},
    (err) => {
        if (err) return console.log("Error: ", err);
        console.log("MongoDB Connection -- Ready state is:", mongoose.connection.readyState);
    }
);
