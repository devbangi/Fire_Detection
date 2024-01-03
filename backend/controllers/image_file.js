const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

//import image_file model
const Image_file = require('../models/image_file');
// multer is a node.js middleware useful for uploading files
const multer = require('multer');

// Function to execute the Python script for renaming the image
const renameAndDuplicateImage = (imagePath, callback) => {
    const pythonScriptPath = path.join(__dirname, '../scripts', 'renameFile.py'); // Adjust the path accordingly
    console.log(pythonScriptPath);
    exec(`python ${pythonScriptPath} ${imagePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return callback('Error executing Python script');
        }
        console.log(`Python script output: ${stdout}`);
        console.error(`Python script errors: ${stderr}`);

        // At this point, the file should be renamed by the Python script
        callback(null, 'Image processing completed');
    });
};

const getImageName = (imagePath) => {
    const imageNameWithExt = path.basename(imagePath);
    const imageName = imageNameWithExt.split('.')[0]; // Extracting image name without extension
    return imageName;
};

const findCorrespondingMask = (imagePath, maskDirectory) => {
    const imageName = getImageName(imagePath);
    const imageNameParts = imageName.split('_p'); // Splitting the name based on '_p'

    if (imageNameParts.length !== 2) {
        console.log('Invalid image name format');
        return null;
    }
    //console.log(imageName);
    //console.log(imageNameParts);
    const maskPattern = imageNameParts[0] + '_Murphy_p' + imageNameParts[1] + '.tif'; // Creating the mask pattern
    //console.log(maskPattern);

    const maskPath = path.join(maskDirectory, maskPattern);

    if (fs.existsSync(maskPath)) {
        return maskPath;
    } else {
        console.log('Corresponding mask not found');
        return null;
    }
};

const makeImageFromPrediction = (imagePath, callback) => {
    // now we have prediction in ./log/Murphy folder, like "det_ImageName.txt"
    // we must make this .txt file to be a .png in black and white
    const predDirectory = 'C:/Users/angel/Desktop/anul4/SEM1/Retele3_Proiect-A/Bureaca_Angela-Emilia/File_Upload_App/log/Murphy';
    const predMask = `det_${getImageName(imagePath)}.txt`;
    const filePredPath = path.join(predDirectory, predMask);
    const pythonScriptPath = path.join(__dirname, '../scripts', 'transform_mask.py');

    if (fs.existsSync(filePredPath)) {
        exec(`python ${pythonScriptPath} ${filePredPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script for transform_mask: ${error}`);
                return callback('Error executing Python script for transform_mask');
            }
            console.log(`Python script for transform_mask output: ${stdout}`);
            console.error(`Python script for transform_mask errors: ${stderr}`);

            // At this point, the file should be processed by the Python script
            callback(null, 'Image processing for transform_mask completed');
        });
    } else {
        console.error('Corresponding prediction file not found');
        // Handle case when prediction file is not found
    }
};

const getPredictionFromModel = (imagePath, callback) => {
    const pythonScriptPath = path.join(__dirname, '../scripts', 'inference.py'); // Adjust the path accordingly
    console.log(imagePath);

    const maskDirectory = 'C:/Users/angel/Desktop/anul4/SEM1/Retele3_Proiect-A/Bureaca_Angela-Emilia/File_Upload_App/mask_patches';
    const maskPath = findCorrespondingMask(imagePath, maskDirectory);
    console.log(maskPath);
    exec(`python ${pythonScriptPath} ${imagePath} ${maskPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script for inference: ${error}`);
            return callback('Error executing Python script for inference');
        }
        console.log(`Python script for inference output: ${stdout}`);
        console.error(`Python script for inference errors: ${stderr}`);
        // now we have prediction in ./log/Murphy folder, like "det_ImageName.txt"
        // we must make this .txt file to be a .png in black and white
        makeImageFromPrediction(imagePath, (error, message) => {
            if (error) {
                return res.json({ message: error });
            }
        });
        // // At this point, the file should be proceesed by the Python script
        // callback(null, 'Image processing for inference completed');
    });
};

//POST '/image_file' ; the newImage_file function to handle the POST '/image_file' request
const newImage_file = (req, res) => { // the request object or 'req' represents the HTTP request and has properties for the request query string, parameters, body, HTTP headers, and so on.
    //check if the tea name already exists in db
    Image_file.findOne({ name: req.body.name }, (err, data) => {
        //if image_file not in db, add it
        if (!data) {
            //create a new image_file object using the Image_file model and req.body
            const newImage_file = new Image_file({
                name: req.body.name,
                image: req.file.path, // req.file.path instead of req.body.image because we want image to be our image file's path, not a string from req.body.image
                description: req.body.description,
            })

            // save this object to database
            newImage_file.save((err, data) => {
                if (err) return res.json({ Error: err });

                // Execute the proccesing function for get prediction
                getPredictionFromModel(data.image, (error, message) => {
                    if (error) {
                        return res.json({ message: error });
                    }

                    // Image processing completed, proceed with returning data or other operations
                    return res.json(data);
                });
            });
        } else {
            if (err) return res.json(`Something went wrong, please try again. ${err}`);
            return res.json({ message: "Image_file already exists" });
        }
    })
};



//GET '/image_file'
const getAllImage_file = (req, res) => {
    Image_file.find({}, (err, data) => {
        if (err) {
            return res.json({ Error: err });
        }
        return res.json(data);
    })
};

//DELETE '/image_file'
const deleteAllImage_file = (req, res) => {
    Image_file.deleteMany({}, err => {
        if (err) {
            return res.json({ message: "Complete delete failed" });
        }
        return res.json({ message: "Complete delete successful" });
    })
};

//GET '/image_file/:name'
const getOneImage_file = (req, res) => {
    let name = req.params.name; //get the image_file name

    //find the specific image_file with that name
    Image_file.findOne({ name: name }, (err, data) => {
        if (err || !data) {
            return res.json({ message: "Image_file doesn't exist." });
        }
        else return res.json(data); //return the image_file object if found
    });
};

//POST '/image_file/:name'
const newDescriptionForAnImage = (req, res) => {
    let name = req.params.name; //get the image_file to add the description in
    let newDescription = req.body.description; //get the description

    //find the image_file object
    Image_file.findOne({ name: name }, (err, data) => {
        if (err || !data || !newDescription) {
            return res.json({ message: "Image_file doesn't exist or description is missing." });
        } else {
            // Update the description of the image_file object
            data.description = newDescription;

            // Save changes to the database
            data.save((err, updatedData) => {
                if (err) {
                    return res.json({ message: "Description failed to add.", error: err });
                }
                //console.log(updatedData);
                return res.json(updatedData);
            });
        }
    });
};

//DELETE '/image_file/:name'
const deleteOneImage_file = (req, res) => {
    let name = req.params.name; // get the name of image_file to delete

    Image_file.deleteOne({ name: name }, (err, data) => {
        //if there's nothing to delete return a message
        if (data.deletedCount == 0) return res.json({ message: "Image_file doesn't exist." });
        //else if there's an error, return the err message
        else if (err) return res.json(`Something went wrong, please try again. ${err}`);
        //else, return the success message
        else return res.json({ message: "Image_file deleted." });
    });
};

// We use multer.diskStorage() to create a storage where our uploaded images will be stored
const storage = multer.diskStorage({
    // destination: the path where the images will be stored. We shall set it as './uploads'.
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    //filename: determines the name that would be saved in storage. We can just keep it as its original name.
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

// initialize multer with multer() and pass storage in its storage property. Next, we have a .single() method which ensures that multer will accept only one file and store it as req.file.
const uploadImg = multer({ storage: storage }).single('image');


// export controller functions so we can import it to our routes/image_file.js
module.exports = {
    getAllImage_file,
    newImage_file,
    deleteAllImage_file,
    getOneImage_file,
    newDescriptionForAnImage,
    deleteOneImage_file,
    uploadImg,  // we just have to export uploadImg to use in our routes/image_file.js and include it as middleware
};
