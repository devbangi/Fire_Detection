// Here we make a schema; schema defines the shape of the document which maps to a MongoDB collection. We then convert this schema into a Model, which we can then work with to manipulate it with our API.

const mongoose = require("mongoose"); //import mongoose

// image_file schema
const Image_fileSchema = new mongoose.Schema({
    name: {type:String, required:true}, // nume of image
    image: String, // the image url
    description: String, // the description of image
});

const Image_file = mongoose.model('Image_file', Image_fileSchema); //convert to model named Image_file
module.exports = Image_file; //export for controller use;  export it as a 'Image_file' model for controller functions to manipulate (i.e. create, read, update and delete data).
