from keras.preprocessing.image import ImageDataGenerator
from keras.models import Sequential
from keras.layers import Conv2D, MaxPooling2D
from keras.layers import Activation, Dropout, Flatten, Dense
from keras import backend as K
import matplotlib.pyplot as plt
import cv2
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os
from tensorflow.keras.layers import Dense, Dropout, Activation, Flatten, Conv2D, MaxPooling2D
from tensorflow.keras.models import model_from_json

img_width, img_height = 256, 256
# train_data_dir = '/Users/michaelrokitko/Downloads/PlantVillage/train'
train_data_dir = './Data/train'
# validation_data_dir = '/Users/michaelrokitko/Downloads/PlantVillage/validate'
validation_data_dir = './Data/validate'
# nb_train_samples = 17801      #big data
# nb_validation_samples = 2003

# nb_train_samples = 3354         #small data
nb_train_samples = 4192
nb_validation_samples = 2003

epochs = 50
batch_size = 32


def train_model(model_name):
    if K.image_data_format() == 'channels_first':
        input_shape = (3, img_width, img_height)
    else:
        input_shape = (img_width, img_height, 3)

    model = Sequential()
    model.add(Conv2D(32, (3, 3), input_shape=input_shape))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))

    model.add(Conv2D(32, (3, 3)))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))

    model.add(Conv2D(64, (3, 3)))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))

    model.add(Flatten())
    model.add(Dense(64))
    model.add(Activation('relu'))
    model.add(Dropout(0.5))
    model.add(Dense(1))
    model.add(Activation('sigmoid'))


    model.summary(line_length=None, positions=None, print_fn=None)

    model.compile(loss='binary_crossentropy',
                  optimizer='rmsprop',
                  metrics=['accuracy'])

    # this is the augmentation configuration we will use for training
    train_datagen = ImageDataGenerator(
        rescale=1. / 255,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True)

    # this is the augmentation configuration we will use for testing:
    # only rescaling
    test_datagen = ImageDataGenerator(rescale=1. / 255)

    train_generator = train_datagen.flow_from_directory(
        train_data_dir,
        target_size=(img_width, img_height),
        batch_size=batch_size,
        class_mode='binary')

    validation_generator = test_datagen.flow_from_directory(
        validation_data_dir,
        target_size=(img_width, img_height),
        batch_size=batch_size,
        class_mode='binary')

    cp_callback = tf.keras.callbacks.ModelCheckpoint(filepath='training_new',
                                                     save_weights_only=True,
                                                     verbose=1)


    history = model.fit_generator(
        train_generator,
        steps_per_epoch=nb_train_samples // batch_size,
        epochs=epochs,
        validation_data=validation_generator,
        validation_steps=nb_validation_samples // batch_size,
        callbacks=[cp_callback]
    )


    plt.plot(history.history['accuracy'], label='accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.ylim([0.5, 1])
    plt.legend(loc='lower right')
    plt.savefig(model_name + '_progress.png')
    plt.show()

    score = model.evaluate_generator(validation_generator, 400)

    print('Score: ' + str(score))

    # serialize model to JSON
    model_json = model.to_json()
    with open(model_name + ".json", "w") as json_file:
        json_file.write(model_json)
    # serialize weights to HDF5
    model.save_weights(model_name + ".h5")
    print("Saved model to disk")


def create_model():
    if K.image_data_format() == 'channels_first':
        input_shape = (3, img_width, img_height)
    else:
        input_shape = (img_width, img_height, 3)
    model = Sequential()
    model.add(Conv2D(32, (3, 3), input_shape=input_shape))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))

    model.add(Conv2D(32, (3, 3)))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))

    model.add(Conv2D(64, (3, 3)))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))

    model.add(Flatten())
    model.add(Dense(64))
    model.add(Activation('relu'))
    model.add(Dropout(0.5))
    model.add(Dense(1))
    model.add(Activation('sigmoid'))

    model.compile(loss='binary_crossentropy',
                  optimizer='rmsprop',
                  metrics=['accuracy'])
    return model


def load_model(checkpoints_dir):
    model = create_model()

    model.summary()
    ck_test = ImageDataGenerator(
        rescale=1 / 255,
    ).flow_from_directory(
        validation_data_dir,
        target_size=(256, 256),
        classes=['sick', 'healthy'],
        batch_size=32,
    )

    STEP_SIZE_TEST = ck_test.n // ck_test.batch_size
    loss, acc = model.evaluate_generator(ck_test, STEP_SIZE_TEST, verbose=2)
    print("Untrained model, accuracy: {:5.2f}%".format(100 * acc))

    checkpoint_path = checkpoints_dir
    model.load_weights(checkpoint_path).expect_partial()
    # Re-evaluate the model
    loss, acc = model.evaluate_generator(ck_test, STEP_SIZE_TEST, verbose=2)
    print("Restored model, accuracy: {:5.2f}%".format(100 * acc))

    return model


def load_from_files(name):
    json_file = open(name + '.json', 'r')
    loaded_model_json = json_file.read()
    json_file.close()
    loaded_model = model_from_json(loaded_model_json)
    # load weights into new model
    loaded_model.load_weights(name + ".h5")
    print("Loaded model from disk")

    return loaded_model


def predict(folder, model_name, checkpoints_dir=None):
    model = load_from_files(model_name)
    for img in os.listdir('/Users/michaelrokitko/Documents/Projects/image-prossessing/' + folder):
        if img.endswith('.DS_Store') or img == '.DS_Store':
            continue

        IMG_SIZE = 256

        img_arr = cv2.imread(folder + '/' + img)
        new_array = cv2.resize(img_arr, (IMG_SIZE, IMG_SIZE))
        new_array = new_array.reshape(-1, IMG_SIZE, IMG_SIZE, 3)
        rounded_predictions = model.predict_classes(new_array, batch_size=1, verbose=0)

        for i in rounded_predictions:
            print(img)
            if i == 0:
                print('sick')
            else:
                print('healthy')

        print("-------------------------------")


# train_model('test_model')
# load_model("training_big_data/cp.ckpt")
predict('my-img', "new_model")
