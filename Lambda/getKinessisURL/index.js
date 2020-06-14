const AWS = require("aws-sdk");

AWS.config.region = "eu-west-1";

const kinesisvideo = new AWS.KinesisVideo({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

function getStreamingSessionURL(streamName) {
  if (!streamName) streamName = "Planty";
  return new Promise((resolve, reject) => {
    let getEndpointParams = {
      APIName: "GET_HLS_STREAMING_SESSION_URL",
      StreamName: streamName,
    };

    kinesisvideo.getDataEndpoint(getEndpointParams, (err, data) => {
      if (err) {
        console.log(err, err.stack);
        reject(`Failed to get KVS data endpoint: ${err.errorMessage}`);
      } else {
        const kinesisvideoarchivedmedia = new AWS.KinesisVideoArchivedMedia({
          accessKeyId: process.env.ACCESS_KEY_ID,
          secretAccessKey: process.env.SECRET_ACCESS_KEY,
          endpoint: data.DataEndpoint,
        });

        const getStreamingSessionURLParams = {
          Expires: 300,
          PlaybackMode: "LIVE",
          StreamName: process.env.STREAM_NAME,
        };

        kinesisvideoarchivedmedia.getHLSStreamingSessionURL(
          getStreamingSessionURLParams,
          function (err, data) {
            if (err) {
              console.log(err, err.stack);
              reject(
                `Failed to get KVAM HLS streaming session url: ${err.errorMessage}`
              );
            } else {
              console.log(
                `get hls streaming session url response: ${JSON.stringify(
                  data
                )}`
              );
              resolve(data);
            }
          }
        );
      }
    });
  });
}

exports.handler = async (event, context, callback) => {
  await getStreamingSessionURL(event["streamName"])
    .then((result) => callback(null, result))
    .catch((err) => callback(err));
};
