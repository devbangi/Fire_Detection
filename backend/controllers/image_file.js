const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

//import image_file model
const Image_file = require('../models/image_file');
// multer is a node.js middleware useful for uploading files
const multer = require('multer');

// Function to execute the Python script for renaming the image
const renameAndDuplicateImage = (imagePath, callback) => {
    const pythonScriptPath = path.join('scripts', 'renameFile.py'); // Adjust the path accordingly
    console.log(pythonScriptPath);
    exec(`${process.env.PYTHON_VERSION} ${pythonScriptPath} ${imagePath}`, (error, stdout, stderr) => {
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

    console.log(maskDirectory);
    const maskPattern = imageNameParts[0] + '_Murphy_p' + imageNameParts[1] + '.tif'; // Creating the mask pattern
    console.log(maskPattern);

    const maskPath = path.join(maskDirectory, maskPattern);
    console.log(maskPath);
    if (fs.existsSync(maskPath)) {
        return maskPath;
    } else {
        console.log('Corresponding mask not found');
        return null;
    }
};

const findCorrespondingMaskName = (imagePath, maskDirectory) => {
    const imageName = getImageName(imagePath);
    const imageNameParts = imageName.split('_p'); // Splitting the name based on '_p'

    if (imageNameParts.length !== 2) {
        console.log('Invalid image name format');
        return null;
    }
    console.log(maskDirectory);

    const maskPattern = imageNameParts[0] + '_Murphy_p' + imageNameParts[1] + '.tif'; // Creating the mask pattern
    console.log(maskPattern);

    const maskPath = path.join(maskDirectory, maskPattern);
    console.log(maskPath);
    if (fs.existsSync(maskPath)) {
        return maskPattern;
    } else {
        console.log('Corresponding mask not found');
        return null;
    }
};

const makeImageFromPrediction = (imagePath, callback) => {
    // now we have prediction in ./log/Murphy folder, like "det_ImageName.txt"
    // we must make this .txt file to be a .png in black and white
    const predDirectory = 'log/Murphy';
    const predMask = `det_${getImageName(imagePath)}.txt`;
    const filePredPath = path.join(predDirectory, predMask);

    const pythonScriptPath = path.join('scripts', 'transform_mask.py');

    if (fs.existsSync(filePredPath)) {
        exec(`${process.env.PYTHON_VERSION} ${pythonScriptPath} ${filePredPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script for transform_mask: ${error}`);
                return callback('Error executing Python script for transform_mask');
            }
            console.log(`Python script for transform_mask output: ${stdout}`);
            console.error(`Python script for transform_mask errors: ${stderr}`);
            callback(null, 'Image processing for transform_mask completed');
        });
    } else {
        console.error('Corresponding prediction file not found');
    }
};

const getPredictionFromModel = (imagePath, callback) => {
    const pythonScriptPath = path.join('scripts', 'inference.py'); // Adjust the path accordingly

    console.log(imagePath);
    console.log("python script path : " + pythonScriptPath);

    const maskDirectory = 'mask_patches';
    const maskPath = findCorrespondingMask(imagePath, maskDirectory);
    console.log(maskPath);
    exec(`${process.env.PYTHON_VERSION} ${pythonScriptPath} ${imagePath} ${maskPath}`, (error, stdout, stderr) => {
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
            else {
                console.log("Prediction result:", message);
                // At this point, the file should be proceesed by the Python script
                callback(null, 'Image processing for inference completed');
            }
        });
    });
};

const make3channelImageFromUploadedImage = (imagePath, callback) => {
    const pythonScriptPath = path.join('scripts', 'convert_patch_to_3channels_image.py');

    if (fs.existsSync(imagePath)) {
        exec(`${process.env.PYTHON_VERSION} ${pythonScriptPath} ${imagePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script for convert_patch_to_3channels_image: ${error}`);
                return callback('Error executing Python script for convert_patch_to_3channels_image');
            }
            console.log(`Python script for convert_patch_to_3channels_image output: ${stdout}`);
            console.error(`Python script for convert_patch_to_3channels_image errors: ${stderr}`);
            callback(null, 'Image processing for convert_patch_to_3channels_image completed');
        });
    } else {
        console.error('Image file not found');
    }
};

//POST '/image_file' ; the newImage_file function to handle the POST '/image_file' request
const uploadImage_file = (req, res) => { // the request object or 'req' represents the HTTP request and has properties for the request query string, parameters, body, HTTP headers, and so on.
    //check if the image_file name already exists in db
    Image_file.findOne({ name: req.body.name }, (err, data) => {
        //if image_file not in db, add it
        if (!data) {
            //create a new image_file object using the Image_file model and req.body
            const newImage_file = new Image_file({
                name: req.body.name,
                image_path: req.file.path, // req.file.path instead of req.body.image because we want image to be our image file's path, not a string from req.body.image
                description: req.body.description,
                img_original: {
                    data: fs.readFileSync(path.join('uploads', req.file.filename)),
                    contentType: 'image/tif'
                },
                img_3channels: {
                    data: null,
                    contentType: null
                },
                img_3channels_path: null,
                mask_pred: {
                    data: null,
                    contentType: null
                },
                mask_pred_path: null
            })

            // save this object to database
            newImage_file.save((err, data) => {
                if (err) return res.json({ Error: err });

                make3channelImageFromUploadedImage(data.image_path, (error, message) => {
                    if (error) {
                        return res.json({ message: error });
                    }
                    else {
                        const uploads_3channel_name = `3channels_${getImageName(data.image_path)}.png`;

                        //update and save the image_file object which corespond with id from parameters request 
                        const new3channelsData = fs.readFileSync(path.join('3channel_uploads', uploads_3channel_name));

                        // Update mask_pred field
                        data.img_3channels.data = new3channelsData;
                        data.img_3channels.contentType = 'image/png';
                        data.img_3channels_path = path.join('3channel_uploads', uploads_3channel_name);

                        // Save the updated Image_file object
                        data.save((saveErr, savedImageFile) => {
                            if (saveErr) {
                                console.log("Failed to update img_3channels field.");
                                return res.json({ message: "Failed to update img_3channels field." });
                            }
                            console.log("img_3channels updated successfully");
                            return res.json({ message: "img_3channels updated successfully", updatedImageFile: savedImageFile });
                        });
                    }
                });
            });
        } else {
            if (err) return res.json(`Something went wrong, please try again. ${err}`);
            return res.json({ message: "Image_file already exists" });
        }
    })
};

const processImage_file = (req, res) => { // the request object or 'req' represents the HTTP request and has properties for the request query string, parameters, body, HTTP headers, and so on.
    //check if the image_file name already exists in db
    console.log(req.body.id);
    Image_file.findOne({ _id: req.body.id }, (err, data) => {
        //if image_file not in db
        if (!data) {
            if (err) return res.json(`Something went wrong, please try again. ${err}`);
            return res.json({ message: "Image_file doesn't exist in bd." });
        } else {
            // Execute the proccesing function for get prediction
            getPredictionFromModel(data.image_path, (error, message) => {
                if (error) {
                    return res.json({ message: error });
                }
                else {
                    const maskDirectory = 'mask_patches';
                    const output_name = `image_det_${((findCorrespondingMaskName(data.image_path, maskDirectory)).split('.')[0]).replace('_Murphy', '')}.png`;

                    //update and save the image_file object which corespond with id from parameters request 
                    // Read the mask_pred data
                    const newMaskData = fs.readFileSync(path.join('output', output_name));

                    // Update mask_pred field
                    data.mask_pred.data = newMaskData;
                    data.mask_pred.contentType = 'image/png';
                    data.mask_pred_path = path.join('output', output_name);

                    // Save the updated Image_file object
                    data.save((saveErr, savedImageFile) => {
                        if (saveErr) {
                            console.log("Failed to update mask_pred field.");
                            return res.json({ message: "Failed to update mask_pred field." });
                        }
                        console.log("Mask_pred updated successfully");
                        return res.json({ message: "Mask_pred updated successfully", updatedImageFile: savedImageFile });
                    });
                }
            });
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
    // Remove all documents from the database
    Image_file.deleteMany({}, err => {
        if (err) {
            return res.json({ message: "Complete delete failed" });
        }

        // Function to delete files from a directory
        const deleteFilesInDirectory = (directoryPath, callback) => {
            fs.readdir(directoryPath, (err, files) => {
                if (err) {
                    return callback(`Failed to read directory ${directoryPath}`);
                }

                // Iterate through each file and remove it
                files.forEach(file => {
                    const filePath = path.join(directoryPath, file);
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error(`Failed to delete ${filePath}`);
                        }
                    });
                });

                return callback(null, `Complete delete in ${directoryPath}`);
            });
        };

        // List of directories to delete contents from
        const directoriesToDelete = [
            path.join('uploads'),
            path.join('3channel_uploads'),
            path.join('log/Murphy'),
            path.join('output')
            // Add more directories here if needed
        ];

        // Delete contents of each directory
        directoriesToDelete.forEach(directory => {
            deleteFilesInDirectory(directory, (err, message) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(message);
                }
            });
        });

        return res.json({ message: "Complete delete successful" });
    });
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

//GET '/image_file/:id'
const downloadOneImage_file = (req, res) => {
    const id = req.body.id;
    console.log(id);
    Image_file.findOne({ _id: id }, (err, data) => {
        if (!data) {
            if (err) return res.json(`Something went wrong, please try again. ${err}`);
            return res.json({ message: "Image_file doesn't exist in the database." });
        } else {
            // here make to download image
            // Create a folder with the image name if it doesn't exist
            const folderPath = path.join('images_downloaded', getImageName(data.image_path));
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }

            // Function to save image to the folder
            const saveImage = (imageName, imageData) => {
                const imagePath = path.join(folderPath, imageName);
                fs.writeFileSync(imagePath, imageData, 'binary');
            };

            // Save all images to the folder
            saveImage('img_original.tif', data.img_original.data);
            saveImage('img_3channels.png', data.img_3channels.data);
            saveImage('mask_pred.png', data.mask_pred.data);

            res.status(200).json({ message: "Images downloaded successfully." });
        }
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
    const id = req.body.id;

    Image_file.findOne({ _id: id }, (err, data) => {
        if (!data) {
            if (err) return res.json(`Something went wrong, please try again. ${err}`);
            return res.json({ message: "Image_file doesn't exist in the database." });
        } else {
            // Function to delete a file
            const deleteFile = (filePath) => {
                console.log(filePath);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`Failed to delete ${filePath}`);
                    }
                });
            };

            // Delete files from various folders
            const imagePathsToDelete = [
                data.image_path,
                data.img_3channels_path,
                data.mask_pred_path
            ];

            imagePathsToDelete.forEach((filePath) => {
                if (filePath)
                    deleteFile(filePath);
            });

            // Delete corresponding text files from log/Murphy folder
            const logMurphyDir = path.join('log/Murphy');
            const imageName = getImageName(data.image_path);

            // Split the name by "_RT"
            let parts = imageName.split('_RT');

            if (parts.length === 2) {
                // Reconstruct the name by inserting "_Murphy" after "_RT"
                let modifiedName = parts[0] + '_RT_Murphy' + parts[1];
                //console.log(modifiedName); // LC08_L1TP_152029_20200814_20200814_01_RT_Murphy_p00570
                deleteFile(path.join(logMurphyDir, `grd_${modifiedName}.txt`));
            } else {
                console.log('Invalid image name format');
            }

            deleteFile(path.join(logMurphyDir, `det_${imageName}.txt`));

            // Delete the document from the database
            Image_file.deleteOne({ _id: id }, (err, result) => {
                if (err) {
                    return res.json(`Failed to delete from the database: ${err}`);
                }
                return res.json({ message: "Image_file and associated files deleted." });
            });
        }
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
const uploadImg = multer({ storage: storage }).single('image_path');


// export controller functions so we can import it to our routes/image_file.js
module.exports = {
    getAllImage_file,
    uploadImage_file,
    deleteAllImage_file,
    getOneImage_file,
    newDescriptionForAnImage,
    deleteOneImage_file,
    uploadImg,  // we just have to export uploadImg to use in our routes/image_file.js and include it as middleware
    processImage_file,
    downloadOneImage_file,
};
