const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
  region: "eu-west-capture_image",
});

exports.handler = function (event, context, callback) {
  let scanningParameters = {
    TableName: event["username"] + "_Planters",
    Limit: 100, //maximum result of 100 items
  };

  //In dynamoDB scan looks through your entire table and fetches all data
  docClient.scan(scanningParameters, function (err, data) {
    if (err) {
      callback(err, null);
    } else {
      // let newItems = []

      // console.log(data.Items)
      data.Items.map((one) => {
        if (one.name === event.planterName) {
          let data = event["data"].split(";");

          //T:23.8046875;UV:5;SH:0.03"
          let newMeasurement = {
            ambientTemperatureCelsius: data[0].split(":")[1],
            planterUUID: one.UUID,
            soilHumidity: data[2].split(":")[1],
            timeStamp: event["timeStamp"],
            uvIntesity: data[1].split(":")[1],
          };

          let newArray = one.PlanterMeasurements;

          if (newArray.length === 100) {
            newArray.shift();
            newArray.push(newMeasurement);
          } else {
            newArray.push(newMeasurement);
          }
          //   newArray.push(event['data']);

          var params = {
            TableName: scanningParameters.TableName,
            Key: {
              UUID: one.UUID,
            },
            UpdateExpression: "set PlanterMeasurements = :r",
            ExpressionAttributeValues: {
              ":r": newArray,
            },
            ReturnValues: "UPDATED_NEW",
          };

          console.log("Updating the item...");
          docClient.update(params, function (err, data) {
            if (err) {
              console.error(
                "Unable to update item. Error JSON:",
                JSON.stringify(err, null, 2)
              );
              callback(err, null);
            } else {
              console.log(
                "UpdateItem succeeded:",
                JSON.stringify(data, null, 2)
              );
              const response = {
                statusCode: 200,
                body: JSON.stringify("sucsess"),
              };

              callback(response, null);
            }
          });
        }
      });
      callback(null, data);
    }
  });
};

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
