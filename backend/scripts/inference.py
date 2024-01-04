import os
import sys
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import jaccard_score
from sklearn.metrics import f1_score
from sklearn.metrics import confusion_matrix
from sklearn.utils import shuffle
from scipy.ndimage.measurements import label
import random
import glob

from collections import defaultdict

import tensorflow as tf

gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        print(e)


import keras
from keras import optimizers
from keras.callbacks import ModelCheckpoint
from tensorflow.python.keras import backend as K

from generator import *
from models import *
from metrics import *

import time

import csv

import glob

start = time.time()

# Schoeder, Murphy or Kumar-Roy
MASK_ALGORITHM = 'Murphy'

CUDA_DEVICE = 1

N_FILTERS = 16
N_CHANNELS = 3

IMAGE_SIZE = (256, 256)
MODEL_NAME = 'unet'

RANDOM_STATE = 42

OUTPUT_DIR = './log'

WRITE_OUTPUT = True

#WEIGHTS_FILE = 'C:/Users/angel/Desktop/licenta_ANGI/active_fire_detection_landset-8/activefire/src/train/murphy/unet_16f_2conv_762/train_output/model_{}_{}_final_weights.h5'.format(MODEL_NAME, MASK_ALGORITHM)
WEIGHTS_FILE = 'scripts/model_unet_Murphy_final_weights.h5'


TH_FIRE = 0.25 # pragul; The threshold value, is a critical parameter that affects the model's sensitivity and specificity in identifying fire regions. The optimal threshold may need to be adjusted depending on the problem and the model's performance.
def inference(image_path, mask_path):
    if not os.path.exists(os.path.join(OUTPUT_DIR, MASK_ALGORITHM)):
        os.makedirs(os.path.join(OUTPUT_DIR, MASK_ALGORITHM))

    os.environ["CUDA_VISIBLE_DEVICES"] = str(CUDA_DEVICE)

    try:
        config = tf.compat.v1.ConfigProto()
        config.gpu_options.allow_growth = True
        sess = tf.compat.v1.Session(config=config)
        K.set_session(sess)
        np.random.bit_generator = np.random._bit_generator
    except:
        pass

    # This function likely loads a pre-defined neural network model specified by MODEL_NAME. It sets the input height and width of the model's data to IMAGE_SIZE[0] and IMAGE_SIZE[1], respectively. The n_filters and n_channels parameters are used to configure the model's architecture.
    model = get_model(MODEL_NAME, input_height=IMAGE_SIZE[0], input_width=IMAGE_SIZE[1], n_filters=N_FILTERS, n_channels=N_CHANNELS)

    # This function prints a summary of the neural network model to the console. The summary typically includes information about each layer in the model, such as layer type, output shape, and the number of parameters. It's a helpful way to inspect the model's architecture and ensure that it matches your expectations.
    model.summary()

    print('Loading weghts...')
    model.load_weights(WEIGHTS_FILE)
    print('Weights Loaded')
        
    try:
        
        # img = get_img_arr(image)
        img = get_img_762bands(image_path)
        
        mask_name = os.path.splitext(os.path.basename(mask_path))[0]
        image_name = os.path.splitext(os.path.basename(image_path))[0]
        mask_path = get_mask_arr(mask_path)

        txt_mask_path = os.path.join(OUTPUT_DIR, MASK_ALGORITHM, 'grd_' + mask_name + '.txt') 
        txt_pred_path = os.path.join(OUTPUT_DIR, MASK_ALGORITHM, 'det_' + image_name + '.txt') 

        # makes predictions using the model on the input image img
        y_pred = model.predict(np.array( [img] ), batch_size=1) # using a trained machine learning model (model) to make predictions on an image (img)
                                                                # np.array([img]): This converts the image img into a NumPy array and wraps it in an additional array to ensure that the input is structured as a batch. Machine learning models often expect input data to be structured as batches, even if the batch size is 1
                                                                # batch_size=1: This argument specifies the batch size to use when making predictions. In this case, it's set to 1, meaning that a single image is processed at a time
                                                                # After executing this line of code, y_pred should contain the model's predictions based on the input image.
                                                                # y_pred is a 4D tensor with dimensions (batch_size, height, width, num_classes)
        y_true = mask_path[:,:,0] > TH_FIRE # mask[:, :, 0]: This code extracts the first channel (index 0) of a multi-channel mask
                                    # mask[:, :, 0] > TH_FIRE: This performs element-wise comparison. It checks if the pixel values in the first channel of the mask are greater than the threshold value TH_FIRE
                                    # This operation results in a binary mask where each pixel is True if the corresponding pixel in the original mask is greater than TH_FIRE, and False otherwise.
        y_pred = y_pred[0, :, :, 0] > TH_FIRE # primul 0: This indicates the first element along the batch dimension. In many cases, when working with a single image at a time (batch size of 1), you use the first element in the batch (index 0).
                                            # :, :  These colons (:) indicate that you want to include all elements along the height and width dimensions
                                            # ultimul 0 : specifies that you want to extract the values from the first channel (class) in the output.


        np.savetxt(txt_mask_path, y_true.astype(int), fmt='%i') # This is the NumPy function used to save data to a text file.
                                                                # By setting fmt='%i', you are telling np.savetxt to format the data as integers in the text file.
                                                                # if y_true is a binary mask with values 0 and 1
        np.savetxt(txt_pred_path, y_pred.astype(int), fmt='%i')
            
    except Exception as e:
        print(e)
        
        with open(os.path.join(OUTPUT_DIR, "error_log_inference.txt"), "a+") as myfile:
            myfile.write(str(e))
        

    print('Done!')

if __name__ == "__main__":
    # Check if the script is called with two arguments (image path, mask_path)
    if len(sys.argv) < 3:
        print("Error: Please provide the image file path as an argument.")
    else:
        image_path = sys.argv[1]
        mask_path = sys.argv[2]
        inference(image_path, mask_path)