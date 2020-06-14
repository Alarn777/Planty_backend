console.log("function starts");
const AWS = require("aws-sdk");
let ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

exports.handler = function (event, context, callback) {
  var params = {
    TableName: event.username + "_PlanterPictures" /* required */,
  };

  ddb.describeTable(params, function (err, data) {
    if (err) {
      var tableParams = {
        AttributeDefinitions: [
          {
            AttributeName: "UUID",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "UUID",
            KeyType: "HASH",
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
        TableName: params.TableName,
        StreamSpecification: {
          StreamEnabled: false,
        },
      };
      ddb.createTable(tableParams, function (err, data) {
        if (err) {
          console.log("Error createTable", err);
          callback(err, null);
        } else {
          console.log("Success Pictures");
          callback(null, "Success createTable Pictures");
        }
      });
    } else {
      console.log("Pictures Table Already Exists", "Table Already Exists");
      callback(null, "Pictures Table Already Exists", "Table Already Exists");
    }
  });
};
