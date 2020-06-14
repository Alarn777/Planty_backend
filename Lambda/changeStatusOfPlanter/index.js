console.log("function starts");

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });

exports.handler = function (event, context, callback) {
  console.log("processing event: %j", event);

  let scanningParameters = {};

  if (event["planterStatus"] === "active") {
    scanningParameters = {
      TableName: event["username"] + "_Planters",
      Key: {
        UUID: event["planterUUID"],
      },
      UpdateExpression: "set planterStatus=:p,TimeActivated=:s",
      ExpressionAttributeValues: {
        ":p": event["planterStatus"],
        ":s": new Date(new Date().toUTCString())
          .getTime()
          .toString()
          .substr(0, 10),
      },
      ReturnValues: "UPDATED_NEW",
    };
  } else {
    scanningParameters = {
      TableName: event["username"] + "_Planters",
      Key: {
        UUID: event["planterUUID"],
      },
      UpdateExpression: "set planterStatus=:p",
      ExpressionAttributeValues: {
        ":p": event["planterStatus"],
      },
      ReturnValues: "UPDATED_NEW",
    };
  }

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

  //  callback("Error updating table", null, 2)
};
