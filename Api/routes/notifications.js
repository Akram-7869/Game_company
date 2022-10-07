const express = require('express');
const {

    createNotification,
    getNotification,
    getNotifications,
    updateNotification,
    deleteNotification,
    getPlayerNotifications,
    //readNotification,
    getPlayerList, addPlayerList, removePlayerList, notifiyAll

} = require('../controllers/notifications');


const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

//router.use(protect);

router.route('/player/all/:id').post(notifiyAll);
router.route('/player/:nid/:id').post(addPlayerList).delete(removePlayerList);
router.route('/player/:id').get(getPlayerList);

//player api
router.route('/player').get(protect, getPlayerNotifications);


router.route('/add').post(createNotification);
router.route('/filter/:type').post(getNotifications);

router.route('/').post(getNotifications);

router
    .route('/:id')
    .get(getNotification)
    .post(updateNotification)
    .delete(deleteNotification);

module.exports = router;
