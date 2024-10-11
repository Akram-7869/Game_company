const express = require('express');
const userCtrl = require('../controllers/influencers');

const User = require('../models/Influencer');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
router.route('/:id/upload').post(userCtrl.uploadeImage);
router.route('/top-list').get(userCtrl.geTopList);

router.use(protect);
 router.route('/withdraw').post(userCtrl.withDrawRequest);
 router.route('/profile').post(userCtrl.updateProfile);
 router.route('/upi').post(userCtrl.updateUpi);

 router.route('/usdt').post(userCtrl.updateUsdt);

 
 


router.route('/follow').post(userCtrl.followInfulencer);
router.route('/unfollow').post(userCtrl.unfollowInfulencer);
router.route('/list').get(userCtrl.getUserList);
router.route('/following-list').get(userCtrl.getFollowingList);



router.route('/push/online').post(userCtrl.onlineNotifcation);
router.route('/add').post(userCtrl.createUser);
router.route('/').post(userCtrl.getUsers);


router
  .route('/:id')
  .get(userCtrl.getUser)
  .put(userCtrl.updateUser)
  .delete(userCtrl.deleteUser);

module.exports = router;
