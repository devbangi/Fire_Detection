import rasterio
import numpy as np
import os
import cv2
import sys

OUTPUT_DIR = './3channel_uploads'

MAX_PIXEL_VALUE = 65535 # Max. pixel value, used to normalize the image

def get_img_762bands(path):
    img = rasterio.open(path).read((7,6,2)).transpose((1, 2, 0))    
    img = np.float32(img)/MAX_PIXEL_VALUE
    
    return img

def transform_3channelImage(image_path):
    # Check if the file exists
    if not os.path.exists(image_path):
        print(f"Error: Image file {image_path} not found.")
        return
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    img = get_img_762bands(image_path)
    
    img = np.array(img * 255, dtype=np.uint8)
    #OUTPUT_IMAGE_NAME = '3channels_LC08_L1TP_152029_20200814_20200814_01_RT_p00606.png'

    # Extract the name of the image file without extension
    nameImage = os.path.splitext(os.path.basename(image_path))[0]
    output_name = f'3channels_{nameImage}.png'
    cv2.imwrite(os.path.join(OUTPUT_DIR, output_name), cv2.cvtColor(img, cv2.COLOR_RGB2BGR))


if __name__ == "__main__":
    # Check if the script is called with an argument (image path)
    if len(sys.argv) < 2:
        print("Error: Please provide the image path as an argument.")
    else:
        image_path = sys.argv[1]
        transform_3channelImage(image_path)