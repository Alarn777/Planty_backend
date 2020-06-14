console.log("function starts");

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });

exports.handler = function (event, context, callback) {
  console.log("processing event: %j", event);

  let scanningParameters = {
    TableName: "allPlants",
    Limit: 100, //maximum result of 100 items
  };

  //In dynamoDB scan looks through your entire table and fetches all data
  docClient.scan(scanningParameters, function (err, data) {
    if (err) {
      callback(err, null);
    } else {
      let newItems = [];
      data.Items.map((one) => {
        let another = {
          id: one.id,
          name: one.name,
          description: one.description,
          UUID: one.UUID,
          growthPlanGroup: one.growthPlanGroup,
          soil: one.soil,
        };
        console.log(another);
        newItems.push(another);
      });
      data.Items = newItems;
      callback(null, data);
    }
  });
};
