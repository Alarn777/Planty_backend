console.log("function starts");

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });

exports.handler = function (event, context, callback) {
  console.log("processing event: %j", event);

  let scanningParameters = {
    TableName: event["username"] + "_Planters",
    Limit: 100, //maximum result of 100 items
  };
  docClient.scan(scanningParameters, function (err, data) {
    if (err) {
      callback(err, null);
    } else {
      var params = {
        TableName: scanningParameters.TableName,
        Key: {
          UUID: event.planterUUID,
        },
        ExpressionAttributeValues: {
          ":UUID": event.planterUUID,
        },
      };

      var params = {
        TableName: "TableName",
        Key: {
          UUID: event.planterUUID,
        },
        ReturnValues: "UPDATED_NEW",
      };

      console.log("Attempting a conditional delete...");
      docClient.delete(params, function (err, data) {
        if (err) {
          console.error(
            "Unable to delete item. Error JSON:",
            JSON.stringify(err, null, 2)
          );
        } else {
          console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
        }
      });
      callback(null, data);
    }
  });
};
