// Here we make a schema; schema defines the shape of the document which maps to a MongoDB collection. We then convert this schema into a Model, which we can then work with to manipulate it with our API.

const mongoose = require("mongoose"); //import mongoose

// image_file schema
const Image_fileSchema = new mongoose.Schema({
    name: {type:String, required:true}, // name of image
    image_path: String, // the image path
    description: String, // the description of image
    img_original:
    {
        data: Buffer,
        contentType: String
    },
    img_3channels:
    {
        data: Buffer,
        contentType: String
    },
    img_3channels_path: String,
    mask_pred:
    {
        data: Buffer,
        contentType: String
    },
    mask_pred_path: String
});

const Image_file = mongoose.model('Image_file', Image_fileSchema); //convert to model named Image_file
module.exports = Image_file; //export for controller use;  export it as a 'Image_file' model for controller functions to manipulate (i.e. create, read, update and delete data).
