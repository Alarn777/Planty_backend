const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });

exports.handler = function (event, context, callback) {
  console.log("processing event: %j", event);
  let scanningParameters = {
    TableName: "allPlants",
    Limit: 100, //maximum result of 100 items
  };

  docClient.scan(scanningParameters, function (err, data) {
    if (err) {
      callback(err, null);
    } else {
      data.Items.map((onePlant) => {
        if (onePlant.name === event.plantName) {
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
                  console.log(one);
                  let newPlant = {
                    name: event.plantName,
                    description: onePlant.description,
                    UUID: uuidv4(),
                    // pic:picUrl,
                    growthPlanGroup: onePlant.plantGrowthPlanGroup,
                    soil: onePlant.soil,
                    plantStatus: onePlant.plantStatus,
                  };

                  let newArray = one.plants;

                  newArray.push(newPlant);

                  var params = {
                    TableName: scanningParameters.TableName,
                    Key: {
                      UUID: one.UUID,
                    },
                    UpdateExpression: "set plants = :r",
                    ExpressionAttributeValues: {
                      ":r": newArray,
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

                      callback(response, null);
                    }
                  });
                }
              });
              callback(null, data);
            }
          });
        }
      });
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
