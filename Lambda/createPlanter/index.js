console.log("function starts");
const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });
var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

exports.handler = function (event, context, callback) {
  let scanningParameters = {
    TableName: event.username + "_Planters",
    Limit: 100, //maximum result of 100 items
  };

  let newUUID = uuidv4();
  let date = new Date();
  let timestamp = date.getTime();
  timestamp = Math.floor(parseFloat(timestamp / 1000));

  let newPlanter = {
    UUID: { S: newUUID },
    name: { S: event.planterName },
    description: { S: event.planterDescription },
    climate: { S: event.planterClimate },
    plants: { L: [] },
    video: {
      M: {
        streamName: { S: "Generated here" },
      },
    },
    activeGrowthPlan: { M: {} },
    initialGrowthPlan: { M: {} },
    isActive: { BOOL: true },
    sickPlantDetected: { BOOL: false },
    askedToSend: { S: "none" },
    sendDetails: { M: {} },
    planterStatus: { S: "pending" },
    CurrentMeasurment: { M: {} },
    PlanterMeasurements: { L: [] },
    plots: { M: {} },
    TimeActivated: { S: timestamp.toString() },
  };
  var params = {
    TableName: scanningParameters.TableName,
    Item: newPlanter,
  };

  ddb.putItem(params, function (err, data) {
    if (err) {
      console.log("Error", err);
      callback(err, null);
    } else {
      console.log("Success", data);
      var params = {
        TableName: event.username + "_Planters",
        KeyConditionExpression: "#yr = :yyyy",
        ExpressionAttributeNames: {
          "#yr": "UUID",
        },
        ExpressionAttributeValues: {
          ":yyyy": newUUID,
        },
      };
      docClient.query(params, function (err, data) {
        if (err) {
          console.error(
            "Unable to query. Error:",
            JSON.stringify(err, null, 2)
          );
        } else {
          data.Items.forEach(function (item) {
            var params = {
              TableName: event.username + "_Planters",
              Key: {
                UUID: newUUID,
              },
              UpdateExpression:
                "set initialGrowthPlan = :r, activeGrowthPlan =:p",
              ExpressionAttributeValues: {
                ":r": event.growthPlan,
                ":p": event.growthPlan,
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
              } else {
                console.log(
                  "UpdateItem succeeded:",
                  JSON.stringify(data, null, 2)
                );
                const response = {
                  statusCode: 200,
                  body: JSON.stringify("sucsess"),
                };
              }
            });
          });
        }
      });
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
