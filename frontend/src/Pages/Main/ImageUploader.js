import React, { useState } from 'react';
import axios from 'axios';
import './ImageUploader.css';

const ImageUploader = () => {
    const [image, setImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [imageId, setImageId] = useState('');

    const handleImageChange = (event) => {
        console.log(event.target.files);
        const uploadedImage = event.target.files[0];
        setImage(uploadedImage);
        console.log(image);
    };

    const handleUpload = async () => {
        console.log(image);
        const formData = new FormData();
        formData.append('image', image);

        try {
            const response = await axios.post('http://localhost:3000/uploadImage_file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.id) {
                setImageId(response.data.id);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    const handleProcess = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/image_file/${imageId}`);

            if (response.data && response.data.processedImage) {
                // Assuming the processed image URL is returned from the API
                setProcessedImage(response.data.processedImage);
            }
        } catch (error) {
            console.error('Error processing image:', error);
        }
    };

    return (
        <div className="image-uploader-container">
            <h2>Image Uploader</h2>
            <input type="file" onChange={handleImageChange} />
            
            <button onClick={handleUpload}>Upload Image</button>

            {processedImage && (
                <div>
                    <h3>Processed Image</h3>
                    <img src={processedImage} alt="Processed" />
                </div>
            )}

            {imageId && (
                <button onClick={handleProcess}>Process Image</button>
            )}
        </div>
    );
};

export default ImageUploader;
