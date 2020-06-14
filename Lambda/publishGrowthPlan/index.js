console.log("function starts");

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
  region: "eu-west-capture_image",
});
var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

exports.handler = function (event, context, callback) {
  console.log("processing event: %j", event);
  let newUUID = uuidv4();

  let scanningParameters = {
    TableName: "growthPlans",
    Limit: 100, //maximum result of 100 items
  };

  let newPlan = {
    UUID: { S: newUUID },
    growthPlanGroup: { S: event.growthPlanGroup },
    phases: { L: [] },
  };

  var params = {
    TableName: scanningParameters.TableName,
    Item: newPlan,
  };

  ddb.putItem(params, function (err, data) {
    if (err) {
      console.log("Error", err);
      callback("Error", null);
    } else {
      console.log("Success", data);
      var params = {
        TableName: "growthPlans",
        KeyConditionExpression: "#yr = :yyyy",
        ExpressionAttributeNames: {
          "#yr": "UUID",
        },
        ExpressionAttributeValues: {
          ":yyyy": newUUID,
        },
      };

      console.log("in saveGrowthPlan");

      docClient.query(params, function (err, data) {
        if (err) {
          console.error(
            "Unable to query. Error:",
            JSON.stringify(err, null, 2)
          );
          callback(err, null);
        } else {
          console.log("Query succeeded.");
          data.Items.forEach(function (item) {
            var params = {
              TableName: "growthPlans",
              Key: {
                UUID: newUUID,
              },
              UpdateExpression: "set growthPlanGroup = :r, phases =:p",
              ExpressionAttributeValues: {
                ":r": event.growthPlanGroup,
                ":p": event.phases,
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
                callback(null, response);
              }
            });
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
