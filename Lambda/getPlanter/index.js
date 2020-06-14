console.log("function starts");

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });

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
        if (one.UUID === event.UUID) {
          callback(null, one);
        }
      });
    }
  });
};
