// we create a server.js file in our project's root directory to take care of the back-end

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

//to use the routes
app.use('/', routes); 
// Our 'uploads' folder cannot be accessed publicly and therefore the server cannot GET our image. To fix this, we have to make our uploads folder a static file.
app.use('/uploads', express.static('./uploads'));

// our listener to ask our server to listen for a request
// By default, we want to listen on port 3000. However, in cases where the port number is designated from an environment variable, the app will listen on process.env.PORT
const listener = app.listen(process.env.PORT || 3000, () => { 
    console.log('App is listening on port ' + listener.address().port)
})

//establish connection to database : Use mongoose.connect() to establish a connection to the database
mongoose.connect(
    process.env.MONGODB_URI,
    { useUnifiedTopology: true, useNewUrlParser: true},
    (err) => {
        if (err) return console.log("Error: ", err);
        console.log("MongoDB Connection -- Ready state is:", mongoose.connection.readyState);
    }
);
