import json
from json import JSONEncoder
import logging
import boto3
import botocore
import os
import time
import datetime
import tempfile
import numpy as np

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    s3_client = boto3.resource('s3')
    import cv2


    if event['configuration'] == 'ai':
        image = event['image']
        bucket = 'pictures-bucket-planty165521-planty'
        bucket = s3_client.Bucket(bucket)
        my_object = bucket.Object(image)
        tmp = tempfile.NamedTemporaryFile()

        with open(tmp.name, 'wb') as f:
            my_object.download_fileobj(f)
            print(tmp.name)
            IMG_SIZE = 256
            img_arr = cv2.imread(tmp.name)
            new_array = cv2.resize(img_arr, (IMG_SIZE, IMG_SIZE))
            new_array = new_array.reshape(-1, IMG_SIZE, IMG_SIZE, 3)

            numpyData = {"array": new_array}
            encodedNumpyData = json.dumps(numpyData, cls=NumpyArrayEncoder)

        return {
                "statusCode": 200,
                "body":encodedNumpyData,
                }


    username = event['username']
    planter = event['planter']
    stream_url = event['url']
    bucket = 'pictures-bucket-planty165521-planty'

    ts = int(datetime.datetime.now().timestamp())
    url = stream_url
    vidcap = cv2.VideoCapture(url)
    success, image = vidcap.read()

    cv2.imwrite('/tmp/my_image.jpg', image)
    if success:
        try:
            print('saving...')
            s3.upload_file('/tmp/my_image.jpg', bucket, 'public/' + username + '/' + planter + '/' + str(ts) + '_capture.jpg')
            dynamodb = boto3.client('dynamodb')
            timestamp = time.time()
            response = dynamodb.put_item(TableName= username + '_PlanterPictures', Item={'humidity':{'S':event['humidity']},'temperature':{'S':event['temperature']},'UV':{'S':event['UV']},'timestamp':{'S':str(timestamp)}, 'UUID':{'S':generate_uuid()},'image_key':{'S': username + '/' + planter + '/' + str(ts) + '_capture.jpg'}})
            print(response)
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "message": "Saved"
                    }),
                }

        except Exception:
            print("Error saving")
            return {
                "statusCode": 500,
                "body": json.dumps({
                    "message": "Not Saved"
                    }),
                }
    return {
        "statusCode": 500,
        "body": json.dumps({
            "message": "Error ca"
        }),
    }

def get_frame(username, planter,stream_url):
    ts = int(datetime.datetime.now().timestamp())
    print('got here 1')
    url = stream_url
    vidcap = cv2.VideoCapture(url)
    success, image = vidcap.read()
    cv2.imwrite('kang.jpg', image)
    print('got here 2')
    print(success)
    # count = 0
    bucket = 'pictures-bucket-planty165521-planty'

    if success:
        try:
            s3.upload_file('kang.jpg', bucket, 'public/' + username + '/' + planter + '/' + str(ts) + '_capture.jpg')
        except Exception:
            print('Error saving file')


class NumpyEncoder(json.JSONEncoder):
    """ Special json encoder for numpy types """
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
            np.int16, np.int32, np.int64, np.uint8,
            np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float_, np.float16, np.float32,
            np.float64)):
            return float(obj)
        elif isinstance(obj,(np.ndarray,)): #### This is the fix
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)


class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return JSONEncoder.default(self, obj)


import random as r


def generate_uuid():
    random_string = ''
    random_str_seq = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    uuid_format = [8, 4, 4, 4, 12]
    for n in uuid_format:
        for i in range(0, n):
            random_string += str(random_str_seq[r.randint(0, len(random_str_seq) - 1)])
        if n != 12:
            random_string += '-'
    return random_string
