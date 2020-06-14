console.log("function starts");

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
  region: "eu-west-capture_image",
});

exports.handler = function (event, context, callback) {
  console.log("processing event: %j", event);

  let scanningParameters = {
    TableName: event["username"] + "_Planters",
    Limit: 100, //maximum result of 100 items
  };

  //In dynamoDB scan looks through your entire table and fetches all data
  docClient.scan(scanningParameters, function (err, data) {
    if (err) {
      callback(err, null);
    } else {
      data.Items.map((one) => {
        if (one.name === event.planterName) {
          var params = {
            TableName: scanningParameters.TableName,
            Key: {
              UUID: one.UUID,
            },
            ReturnValues: "NONE",
          };

          docClient.delete(params, (err, data) => {
            if (err) {
              console.error("Error tring to delete item:" + err);
              callback(err, null); // error
            } else if (!data.Items || data.Items.length == 0) {
              console.info(JSON.stringify(data));
              callback(null, null); // no items
            } else {
              console.info(JSON.stringify(data));
              callback(null, data.Items[0].ExposeStartTimestamp);
            }
          });
        }
      });
      callback(null, data);
    }
  });
};
