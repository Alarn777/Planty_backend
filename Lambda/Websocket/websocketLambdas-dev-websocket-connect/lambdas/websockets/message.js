const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WebSocket = require('../common/websocketMessage');

const tableName = process.env.tableName;

exports.handler = async event => {
    // console.log('event', event);

    const { connectionId: connectionID } = event.requestContext;

    const body = JSON.parse(event.body);

    try {
        const record = await Dynamo.get(connectionID, tableName);
        const { messages, domainName, stage } = record;

        messages.push(body.message);




        // const data = {
        //     ...record,
        //     messages,
        // };

        // await Dynamo.write(data, tableName);


        // const connections = await Dynamo.getAllConnectedUsers(tableName);

        // await WebSocket.send({
        //     domainName,
        //     stage,
        //     connectionID,
        //     message: 'This is a reply to your message',
        // });



        const allUsers = await Dynamo.getConnections()


        // await WebSocket.send({
        //     domainName,
        //     stage,
        //     connectionID,
        //     message: allUsers.Items.length,
        // });

        for(let i = 0;i < allUsers.Items.length;i++){

            let id =  allUsers.Items[i].ID

            console.log('sending=ID=' + id)

            console.log('domain=' + domainName)
            console.log('stage=' + stage)

            try{


            await WebSocket.send({
                domainName,
                stage,
                connectionID:id,
                message: body.message,
            });
            }
            catch (e) {
                console.log(e)
            }

            console.log('Sent one')



            //arrived from='+ connectionID + '=
        }


        return Responses._200({ message: 'got a message' });
    } catch (error) {
        return Responses._400({ message: 'message could not be received' });
    }

    return Responses._200({ message: 'got a message' });
};
