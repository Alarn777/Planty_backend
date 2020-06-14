console.log("function starts");
const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
  region: "eu-west-capture_image",
});

exports.handler = function (event, context, callback) {
  console.log("processing event: %j", event);

  let scanningParameters = {};

  if (event.action === "sent") {
    scanningParameters = {
      TableName: event["username"] + "_Planters",
      Key: {
        UUID: event["UUID"],
      },
      UpdateExpression: "set askedToSend=:p,planterStatus=:a",
      ExpressionAttributeValues: {
        ":p": event.action,
        ":a": "shipped",
      },
      ReturnValues: "UPDATED_NEW",
    };
  } else {
    let details = {
      name: event.userFullName,
      username: event.username,
      phoneNumber: event.phoneNumber,
      address: event.address,
      instructions: event.instructions,
    };

    scanningParameters = {
      TableName: event["username"] + "_Planters",
      Key: {
        UUID: event["UUID"],
      },
      UpdateExpression: "set askedToSend=:p,sendDetails=:q",
      ExpressionAttributeValues: {
        ":p": event.action,
        ":q": details,
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
};
