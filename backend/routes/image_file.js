const express = require('express'); //import express
var Multer = require("multer");
var Minio = require("minio");

// 1.Create an express router object to set up our routes
const router  = express.Router(); 

// 2.Import our image_file controller from our controllers/image_file.js file we created earlier
const image_fileController = require('../controllers/image_file'); 

// 3.Create our first routes with the controller function as the callback to handle the request
router.get('/getAllImage_file', image_fileController.getAllImage_file);
router.post('/uploadImage_file', image_fileController.uploadImg, image_fileController.uploadImage_file); // upload.none() in the route, this enables our newImage_file function to read our form data; replace upload.none() to image_fileController.uploadImg
router.delete('/deleteAllImage_file', image_fileController.deleteAllImage_file);

router.get('/image_file/:name', image_fileController.getOneImage_file);
router.get('/image_file_download', image_fileController.downloadOneImage_file);
router.post('/image_file/:name', image_fileController.uploadImg, image_fileController.newDescriptionForAnImage);
router.delete('/image_file', image_fileController.deleteOneImage_file); // sterg imaginea cu id ul dat in request la body
router.put('/image_file', image_fileController.processImage_file); // procesez imaginea cu id ul dat in request la body

// // Classic upload => The file will first be uploaded to the uploads directory, then saved to the Minio storage
// router.post("/uploadfile", Multer({dest: "./uploads/"}).single("upload"), function(request, response) {
//     console.log(request.file.path);
//     minioClient.fPutObject(process.env.MINIO_BUCKET_NAME, request.file.originalname, request.file.path, {"Content-Type": "application/octet-stream"}, function(error, etag) {
//         if(error) {
//             return console.log(error);
//         }
//         response.send(request.file);
//     });
// });


// 4. Export the route to use in our server.js
module.exports = router; // export to use in server.js
