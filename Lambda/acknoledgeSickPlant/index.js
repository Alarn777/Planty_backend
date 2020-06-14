console.log("function starts");

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });

exports.handler = function (event, context, callback) {
  console.log("processing event: %j", event);

  let scanningParameters = {};

  scanningParameters = {
    TableName: event["username"] + "_Planters",
    Key: {
      UUID: event["UUID"],
    },
    UpdateExpression: "set sickPlantDetected=:p",
    ExpressionAttributeValues: {
      ":p": event["sickPlantDetected"],
    },
    ReturnValues: "UPDATED_NEW",
  };

  console.log("Updating the item...");
  docClient.update(scanningParameters, function (err, data) {
    if (err) {
      console.error(
        "Unable to update item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
      callback(err, null, 2);
    } else {
      console.log("UpdateItem succeeded:", JSON.stringify(null, data, 2));
      callback(null, data, 2);
    }
  });
};
