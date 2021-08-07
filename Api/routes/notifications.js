const express = require('express');
const {

    createNotification,
    getNotification,
    getNotifications,
    updateNotification,
    deleteNotification,
    getPlayerNotifications,
    readNotification

} = require('../controllers/notifications');


const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
router.use(protect);
router.route('/player').get(getPlayerNotifications).post(readNotification);
router.route('/add').post(createNotification);
router.route('/').post(getNotifications);

router
    .route('/:id')
    .get(getNotification)
    .post( updateNotification)
    .delete( deleteNotification);

module.exports = router;
