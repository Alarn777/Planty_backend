console.log("function starts");
const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });
AWS.config.loadFromPath("./config.json");
var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

exports.handler = function (event, context, callback) {
  let scanningParameters = {
    TableName: "allPlants",
    Limit: 100, //maximum result of 100 items
  };
  checkTable(event.username + "_Plants");
  docClient.scan(scanningParameters, function (err, data) {
    if (err) {
      callback(err, null);
    } else {
      let newItems = [];

      // console.log(data)
      data.Items.map((one) => {
        let picUrl =
          "http://s3-eu-west-1.amazonaws.com/plant-pictures-planty/" +
          one.name +
          "_img.jpg";
        picUrl = picUrl.toLowerCase();
        let another = {
          id: one.id,
          name: one.name,
          description: one.description,
          pic: picUrl,
        };
        newItems.push(another);
      });
      data.Items = newItems;

      for (var i = 0; i < newItems.length; i++) {
        if (newItems[i].name === event.plantName)
          adItemToTable(event.username + "_Plants", newItems[i]);
      }

      callback(null, data);
    }
  });
};

let createTable = (TableName) => {
  var tableParams = {
    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "id",
        KeyType: "HASH",
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    TableName: TableName,
    StreamSpecification: {
      StreamEnabled: false,
    },
  };

  ddb.createTable(tableParams, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
};

let checkTable = function checkTable(tableName, callback) {
  let status = "false";
  console.log("Check table: " + tableName);
  var params = {
    TableName: tableName /* required */,
  };
  ddb.describeTable(params, function (err, data) {
    if (err) {
      status = "false";
    } else {
      status = "true";
    }
    if (status === "false") {
      console.log("Create Table");
      createTable(tableName);
    }
  });
};

let adItemToTable = (table, item) => {
  var params = {
    TableName: table,
    Item: {
      id: { S: item.id + "_" + table + ID() },
      name: { S: item.name },
      description: { S: item.description },
    },
  };
  ddb.putItem(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
};

var ID = function () {
  return "_" + Math.random().toString(36).substr(2, 9);
};
