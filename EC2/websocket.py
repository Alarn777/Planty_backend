import asyncio
import websockets
import boto3
import json
from io import BytesIO
import json
import boto3
import cv2
import tempfile
import h5py
import simplejson
from tensorflow.keras.models import model_from_json

s3 = boto3.resource('s3')
CATEGORIES = ['sick', 'healthy']
retryCounter = 0


def loadModel(img):
    # load json and create model
    json_file = open('new_model.json', 'r')
    loaded_model_json = json_file.read()
    loaded_model = model_from_json(loaded_model_json)
    bucket = 'planty-lambda-functions'
    key = 'ímage-processing/new_model.json'
    loaded_model.load_weights("new_model.h5")
    print("Loaded model from disk")
    model_weights = 'image-processing/new_model.h5'
    loaded_model.compile(loss='binary_crossentropy', optimizer='rmsprop', metrics=['accuracy'])
    # predict on pic
    IMG_SIZE = 256
    img_arr = cv2.imread(img)
    new_array = cv2.resize(img_arr, (IMG_SIZE, IMG_SIZE))
    new_array = new_array.reshape(-1, IMG_SIZE, IMG_SIZE, 3)

    predicitions = loaded_model.predict(new_array, batch_size=None, verbose=0, steps=None, callbacks=None,
                                        max_queue_size=10, workers=1,
                                        use_multiprocessing=True)

    print(predicitions)
    print(CATEGORIES[int(predicitions[0][0])])
    #    return float(predicitions[0][0])

    return CATEGORIES[int(predicitions[0][0])]


def checkPicture(data):
    print("Checking...")

    bucket = 'pictures-bucket-planty165521-planty'
    bucket = s3.Bucket(bucket)
    my_object = bucket.Object('public/' + data)
    tmp = None
    try:
        tmp = tempfile.NamedTemporaryFile()
    except:
        print('Error testing the file')
        return 'Error'
    
    res = []
    try:
    	with open(tmp.name, 'wb') as f:
                my_object.download_fileobj(f)
                res = loadModel(tmp.name)
                
                return data + ';' + res
    except:
        print('Error testing the file')
        return 'Error'

def on_message(message):
    command = message.split(";")
    print(command)
    if command[0] == "FROM_EC2":
        return "Ignore",""

    elif command[2] == "CHECK_IMAGE":
        res = checkPicture(command[3])
        return str(res),""
    
    elif command[2] == "CHECK_IMAGE_RAND":
        res = checkPicture(command[3])
        return str(res),"RAND"

    else:
        print("Unknown Command: {0}".format(command))
        return "FAILED" , ""


async def websocket_handler():
    global retryCounter
    uri = "wss://0xl08k0h22.execute-api.eu-west-1.amazonaws.com/dev"
    async with websockets.connect(uri) as websocket:
        print("Connected to Websocket\n")
        retryCounter = 0
        while True:
            message = await websocket.recv()
            semicolonCount = sum(map(lambda x: 1 if ';' in x else 0, message))
            if semicolonCount != 2 and semicolonCount != 5:
                print(message)
                print("Bad Command")
                answer = '{{\"action":"message","message":"FROM_EC2;EC2;BAD_COMMAND"}}'
                await websocket.send(answer)
                continue
            result,mode = on_message(message)
            if result == "Ignore":
                print('Ignore')
                continue

            if result == 'FAILED':
                print('FAILED')
                continue
            
            answer = f'{{\"action":"message","message":"FROM_EC2;EC2;IMAGE_STATUS;{result}"}}'
            if mode == "RAND":
                answer = f'{{\"action":"message","message":"FROM_EC2;EC2;IMAGE_STATUS_RAND;{result}"}}'
        
            await websocket.send(answer)
            print(f'>>> {result}')


if __name__ == "__main__":
    while True:
        try:
            asyncio.get_event_loop().run_until_complete(websocket_handler())
        except websockets.exceptions.ConnectionClosedOK:
            print("Connection closed by server.\n Reconnecting.\n")
        except:
            raise
        finally:
            pass

if __name__ == "__main__":

    while True and retryCounter < 20:
        try:
            asyncio.get_event_loop().run_until_complete(websocket_handler())
        except websockets.exceptions.ConnectionClosedOK:
            print("Connection closed by server.Reconnecting. Retry:" + retryCounter)
            retryCounter = retryCounter+1

        except websockets.exceptions.ConnectionClosedError:
            print("Connection closed by server error. Reconnecting. Retry:" + retryCounter)
            time.sleep(15)
            retryCounter = retryCounter+1
        except:
            pass
            raise
        