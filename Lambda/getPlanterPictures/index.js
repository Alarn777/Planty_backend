const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });

exports.handler = function (event, context, callback) {
  console.log("processing event: %j", event);

  if (event.mode === "delete") {
    let params = {
      TableName: event.username + "_PlanterPictures",
      Key: {
        UUID: event.UUID,
      },
    };

    console.log("Attempting a conditional delete...");
    docClient.delete(params, function (err, data) {
      if (err) {
        console.error(
          "Unable to delete item. Error JSON:",
          JSON.stringify(err, null, 2)
        );
        callback(err, null);
      } else {
        console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
        callback(null, data);
      }
    });
  }

  let scanningParameters = {
    TableName: event.username + "_PlanterPictures",
    Limit: 1000, //maximum result of 100 items
  };

  //In dynamoDB scan looks through your entire table and fetches all data
  docClient.scan(scanningParameters, function (err, data) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
};
