import boto3
from boto3.dynamodb.conditions import Key
import json
import decimal
from datetime import datetime, timedelta


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def lambda_handler(event, lambda_context):
    dynamodb = boto3.resource('dynamodb', region_name='eu-west-1',
                              endpoint_url="https://dynamodb.eu-west-1.amazonaws.com")

    table = dynamodb.Table('PlantersMeasurements')

    planterId = "e0221623-fb88-4fbd-b524-6f0092463c93"
    utcNow = datetime.utcnow()
    now = decimal.Decimal(utcNow.timestamp())
    dayAgo = decimal.Decimal(
        (utcNow + timedelta(hours=-(utcNow.hour))).timestamp())

    neededDay = datetime.utcnow()
    neededDayStart =  neededDay.replace(hour=00, minute=00, day=int(event["day"]), year=int(event["year"]), month=int(event["month"])).timestamp()

    neededDayEnd =  neededDay.replace(hour=23, minute=55, day=int(event["day"]), year=int(event["year"]), month=int(event["month"])).timestamp()

    print(neededDayStart)
    print(neededDayEnd)
    neededDayStart =  decimal.Decimal(neededDayStart)
    neededDayEnd = decimal.Decimal(neededDayEnd)

    response = table.query(
        # ProjectionExpression="#yr, title, info.genres, info.actors[0]",
        # ExpressionAttributeNames={ "#yr": "year" }, # Expression Attribute Names for Projection Expression only.
        KeyConditionExpression=Key('planterId').eq(
            planterId) & Key('timeStamp').between(neededDayStart, neededDayEnd)
    )

    plots = {
        "daily":{
            "soilHumidity": {'labels': [], "datasets": [{'data': []}]},
            "uvIntensity": {'labels': [], "datasets": [{'data': []}]},
            "ambientTemperatureCelsius": {'labels': [], "datasets": [{'data': []}]}
        },
        "weekly":{
            "soilHumidity": {'labels': [], "datasets": [{'data': []}]},
            "uvIntensity": {'labels': [], "datasets": [{'data': []}]},
            "ambientTemperatureCelsius": {'labels': [], "datasets": [{'data': []}]}
        }
    }

    items = response["Items"]
    h = datetime.fromtimestamp(items[0]["timeStamp"]).hour
    last = datetime.fromtimestamp(items[len(items)-1]["timeStamp"])
    hoursCount = last.hour+1

    plots["daily"]["soilHumidity"]["datasets"][0]["data"] = [None]*hoursCount
    plots["daily"]["soilHumidity"]["labels"] = [""]*hoursCount
    plots["daily"]["soilHumidity"]["labels"][0] = "0"
    plots["daily"]["soilHumidity"]["labels"][h-1] = f"{last.hour:0}"

    plots["daily"]["uvIntensity"]["datasets"][0]["data"] = [None]*hoursCount
    plots["daily"]["uvIntensity"]["labels"] = [""]*hoursCount
    plots["daily"]["uvIntensity"]["labels"][0] = "0"
    plots["daily"]["uvIntensity"]["labels"][h-1] = f"{last.hour:0}"

    plots["daily"]["ambientTemperatureCelsius"]["datasets"][0]["data"] = [None]*hoursCount
    plots["daily"]["ambientTemperatureCelsius"]["labels"] = [""]*hoursCount
    plots["daily"]["ambientTemperatureCelsius"]["labels"][0] = "0"
    plots["daily"]["ambientTemperatureCelsius"]["labels"][h-1] = f"{last.hour:0}"

    sum = [0, 0, 0]
    count = 0
    for i in items:
        date = datetime.fromtimestamp(i["timeStamp"])
        soilHumidity = i["soilHumidity"]
        uvIntensity = i["uvIntesity"]
        ambientTemperatureCelsius = i["ambientTemperatureCelsius"]

        if h != date.hour or date == last:
            if date == last:
                sum[0] = sum[0]+soilHumidity
                sum[1] = sum[1]+uvIntensity
                sum[2] = sum[2]+ambientTemperatureCelsius
                count = count+1


            plots["daily"]["soilHumidity"]["datasets"][0]["data"][h] = (
                round(sum[0]/count, 2))
            plots["daily"]["uvIntensity"]["datasets"][0]["data"][h] = (
                round(sum[1]/count, 2))
            plots["daily"]["ambientTemperatureCelsius"]["datasets"][0]["data"][h] = (
                round(sum[2]/count, 2))

            h = date.hour
            sum = [0, 0, 0]
            count = 0

        sum[0] = sum[0]+soilHumidity
        sum[1] = sum[1]+uvIntensity
        sum[2] = sum[2]+ambientTemperatureCelsius
        count = count+1

    print( plots["daily"])
    return plots["daily"]
