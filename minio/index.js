var Express = require("express");
var Multer = require("multer");
var Minio = require("minio");
var BodyParser = require("body-parser");

require('dotenv').config();

var app = Express();

app.use(BodyParser.json({limit: "1000mb"}));

var minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

// Stream upload => The file will not touch our Node.js filesystem. They go straight into the Bucket.
app.post("/upload", Multer({storage: Multer.memoryStorage()}).single("upload"), function(request, response) {
    minioClient.putObject(process.env.MINIO_BUCKET_NAME, request.file.originalname, request.file.buffer, function(error, etag) {
        if(error) {
            return console.log(error);
        }
        response.send(request.file);
    });
});

// Classic upload => The file will first be uploaded to the uploads directory, then saved to the Minio storage
app.post("/uploadfile", Multer({dest: "./uploads/"}).single("upload"), function(request, response) {
    console.log(request.file.path);
    minioClient.fPutObject(process.env.MINIO_BUCKET_NAME, request.file.originalname, request.file.path, {"Content-Type": "application/octet-stream"}, function(error, etag) {
        if(error) {
            return console.log(error);
        }
        response.send(request.file);
    });
});

// Download endpoint => The file is downloaded as a stream and piped directly to the client.
app.get("/download", function(request, response) {
    minioClient.getObject(process.env.MINIO_BUCKET_NAME, request.query.filename, function(error, stream) {
        if(error) {
            return response.status(500).send(error);
        }
        //response.setHeader('Content-disposition', `attachment; filename=${request.query.filename}`);
        stream.pipe(response);
    });
});

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
    
    var server = app.listen(3000, function() {
        console.log("Listening on port %s...", server.address().port);
    });
});