const AWS = require("aws-sdk");
AWS.config.region = "eu-west-1";

var dynamodb = new AWS.DynamoDB({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

exports.handler = function (event, context, callback) {
  dynamodb.listTables({}, function (err, data) {
    if (err) callback(err, null);
    // an error occurred
    else {
      callback(null, data);
    }
  });
};
