var aws = require("aws-sdk");

var ses = new aws.SES();

exports.handler = (event, context, callback) => {
  console.log(event);

  if (event.request.userAttributes.email) {
    sendEmail(
      event.request.userAttributes.email,
      "Congratulations " + event.userName + ", you have been confirmed: ",
      function (status) {
        callback(null, event);
      }
    );
  } else {
    callback(null, event);
  }
};

function sendEmail(to, body, completedCallback) {
  var eParams = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: {
          Data: body,
        },
      },
      Subject: {
        Data: "Cognito Identity Provider registration completed",
      },
    },
    Source: "<source_email>",
  };

  var email = ses.sendEmail(eParams, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log("===EMAIL SENT===");
    }
    completedCallback("Email sent");
  });
  console.log("EMAIL CODE END");
}