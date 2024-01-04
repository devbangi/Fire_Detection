import numpy as np
import cv2
import os
import sys

OUTPUT_DIR = './output'

def transform(mask_path):
    #print("hello from transform script")
    # Check if the file exists
    if not os.path.exists(mask_path):
        print(f"Error: Mask file {mask_path} not found.")
        return
    
    # Extract the name of the mask file without extension
    nameMask = os.path.splitext(os.path.basename(mask_path))[0]

    # Load text file and interpret its content
    with open(mask_path, 'r') as file:
        content = file.readlines()

    # Convert content to a NumPy array
    data = [list(map(int, line.strip().split())) for line in content]
    mask = np.array(data)

    # Scale the mask values to 0-255 to create a grayscale image
    mask *= 255

    # Save the mask as an image
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    output_name = f'image_{nameMask}.png'
    cv2.imwrite(os.path.join(OUTPUT_DIR, output_name), mask.astype(np.uint8))

if __name__ == "__main__":
    # Check if the script is called with an argument (image path)
    if len(sys.argv) < 2:
        print("Error: Please provide the mask file path as an argument.")
    else:
        mask_path = sys.argv[1]
        transform(mask_path)
