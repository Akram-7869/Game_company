const admin = require("firebase-admin");
var serviceAccount = require('./mangpatti-firebase.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// admin.messaging().subscribeToTopic(to_player.firebaseToken, 'all')
//     .then((response) => {
//         // See the MessagingTopicManagementResponse reference documentation
//         // for the contents of response.
//         console.log('Successfully subscribed to topic:', response);
//     })
//     .catch((error) => {
//         console.log('Error subscribing to topic:', error);
//     });

 module.exports = admin;
// Send a message to a topic
// async function sendMessageToTopic(topic, title, body) {
//     const message = {
//       topic: topic,
//       notification: {
//         title: title,
//         body: body
//       }
//     };
  
//     try {
//       const response = await admin.messaging().send(message);
//       console.log('Successfully sent message:', response);
//     } catch (error) {
//       console.error('Error sending message:', error);
//     }
//   }
  