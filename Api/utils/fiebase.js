const admin = require("firebase-admin");
//var serviceAccount = require('./mangpatti-de297-firebase-adminsdk-jctvv-7f98659a45.json');
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
