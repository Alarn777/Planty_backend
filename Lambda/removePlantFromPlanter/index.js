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
      let newPlants = [];
      for (let i = 0; i < data.Items.length; i++) {
        if (data.Items[i].UUID === event.planterUUID) {
          console.log("got into planter");

          for (let j = 0; j < data.Items[i].plants.length; j++) {
            if (data.Items[i].plants[j].UUID === event.plantUUID) {
              console.log("got into plant");
            } else {
              newPlants.push(data.Items[i].plants[j]);
            }
          }
        }
      }

      let scanningParameters = {
        TableName: event["username"] + "_Planters",
        Key: {
          UUID: event["planterUUID"],
        },
        UpdateExpression: "set plants=:a",
        ExpressionAttributeValues: {
          ":a": newPlants,
        },
        ReturnValues: "UPDATED_NEW",
      };
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
    }
  });
};
