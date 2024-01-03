import sys
import os
import shutil

def rename_and_copy_image(image_path):
    print("hello from script")
    # Check if the file exists
    if not os.path.exists(image_path):
        print(f"Error: Image file {image_path} not found.")
        return
    
    # Extract the filename and extension
    filename, extension = os.path.splitext(image_path)
    print(f"filename: {filename}")
    print(f"extension: {extension}")
    directory = os.path.dirname(image_path)
    print(f"directory: {directory}")

    # Create a new filename with the 'processed_' prefix
    new_filename = f"processed_{os.path.basename(filename)}{extension}"
    new_image_path = os.path.join(directory, "..", "processed", new_filename)  # Moving up one directory to create 'processed' outside 'uploads'

    # Create the 'processed' directory if it doesn't exist
    os.makedirs(os.path.join(directory, "..", "processed"), exist_ok=True)  # Create 'processed' outside 'uploads'

    try:
        # Copy and rename the image file
        shutil.copyfile(image_path, new_image_path)
        print(f"Image copied and renamed to: {new_image_path}")
    except Exception as e:
        print(f"Error copying or renaming image: {e}")

if __name__ == "__main__":
    # Check if the script is called with an argument (image path)
    if len(sys.argv) < 2:
        print("Error: Please provide the image file path as an argument.")
    else:
        image_path = sys.argv[1]
        rename_and_copy_image(image_path)
